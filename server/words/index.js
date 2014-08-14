var models = require('./models');
var Q = require('q');
var debug = require('debug')('gather:words');
var logger = require('../logger');
var transaction = require('../transaction');

var dealer = require('./dealer');
var scorer = require('./scorer');

/**
 * Run any initial setup code for a game.
 * @arg {join.models.Game}
 * @returns {Promise} - a promise indicating when the setup is complete.
 */
exports.create = function(game) {
  return Q.when({});  // no required setup for the game
};

/**
 * Run any initial setup code after starting the game.
 * @returns {Promise} - a promise indicating when the setup is complete.
 */
exports.startGame = function(socket, player, game) {
  return setupRoundStart(socket, player, game);
};

/**
 * Setup listeners for the game.
 * @returns {Promise<Object>} - promise for any custom game state
 */
exports.join = function(socket, player, party, game, playerGameId) {

  socket.on('gameStarted', setupRoundStart);
  socket.on('doneReadingPrompt', doneReadingPrompt);
  socket.on('chooseCard', chooseCard);
  socket.on('doneReadingChoices', doneReadingChoices);
  socket.on('castVote', castVote);

  return Q.all([
    dealer.dealResponses(playerGameId, game.id),
    models.Round.forApiByGame(game.id),
    scorer.currentScore(game.id),
    models.Vote.alreadyVotedByGame(game.id),
    models.Card.queryLatestByGame(game.id),
  ])
  .then(function(data) {
    var gs = {
      hand: data[0],
      rounds: data[1],
      score: data[2],
      votes: data[3],
      choices: data[4],
    };

    debug(gs);
    return gs;
  });

  function doneReadingPrompt(data, acknowledge) {
    Q.fcall(function() {
      return Q.all([
        requireReader(playerGameId, game.id),
      ]);
      // TODO: ensure that the provided roundId is correct
    })
    .then(function() {
      return models.Round.markDoneReadingPrompt(game.id)
      .then(function(doneAt) {
        acknowledge({});
        socket.emit('readingPromptDone', {at: doneAt});
        socket.broadcast.to(party).emit('readingPromptDone', {at: doneAt});
      });
    })
    .fail(function(error) {
      logger.error(error);
      acknowledge({_error: "Unable to signal reading prompt is over"});
    });
  }

  function chooseCard(data, acknowledge) {
    Q.fcall(function() {
      return Q.all([
        requireCardInHand(playerGameId, data.card),
        requireNotPlayedThisRound(playerGameId, game.id)
      ]);
    })
    .then(function() {
      return models.Card.play(data.card, data.round)
      .then(function() {
        return models.Card.forApi(data.card);
      })
      .then(function(card) {
        var sendData = {
          player: playerGameId,
          card: card
        };

        socket.emit('cardChoosen', sendData);
        socket.broadcast.to(party).emit('cardChoosen', sendData);

        return models.Round.numPlayersNeedingToChoose(data.round, game.id);
      })
      .then(function(result) {
        if (result.playersLeft === 0) {
          return models.Round.markDoneChoosing(game.id)
          .then(function(doneAt) {
            socket.emit('choosingDone', {at: doneAt});
            socket.broadcast.to(party).emit('choosingDone', {at: doneAt});
            return dealer.dealResponse(game.id, playerGameId);
          });
        } else {
          return dealer.dealResponse(game.id, playerGameId);
        }
      })
      .then(function(card) {
        acknowledge(card);
      });
    })
    .fail(function(error) {
      logger.error(error);
      acknowledge({_error: "Unable to send back response card"});
    });
  }

  function doneReadingChoices(data, acknowledge) {
    Q.fcall(function() {
      return Q.all([
        requireReader(playerGameId, game.id),
        // TODO: ensure in proper stage of the game
      ]);
    })
    .then(function() {
      return models.Round.markDoneReadingChoices(game.id);
    })
    .then(function(doneAt) {
      socket.emit('readingChoicesDone', {at: doneAt});
      socket.broadcast.to(party).emit('readingChoicesDone', {at: doneAt});
      acknowledge({});
    })
    .fail(function(error) {
      logger.error(error);
      acknowledge({_error: "Unable to signal reading choices is over"});
    });
  }

  function castVote(data, acknowledge) {
    Q.fcall(function() {
      return requireValidVote(data.card, playerGameId, game.id);
    })
    // transactions ensure `setupRoundStart` is called only once
    .then(transaction.inOrderByGroup(party, function() {
      return new models.Vote({
        voter: playerGameId,
        card: data.card,
      })
      .save()
      .then(function(vote) {
        var sendData = {player: playerGameId};
        socket.emit('voteCast', sendData);
        socket.broadcast.to(party).emit('voteCast', sendData);
        return models.Round.numPlayersNeedingToVote(data.round, game.id);
      })
      .then(function(result) {
        if (result.playersLeft === 0) {
          return Q.all([
            scorer.scoreDifferential(game.id),
            models.Round.markDoneVoting(game.id)
          ])
          .then(function(data) {
            var sendData = {
              dscore: data[0],
              at: data[1]
            };
            socket.emit('votingDone', sendData);
            socket.broadcast.to(party).emit('votingDone', sendData);
            setupRoundStart(socket, player, game);
          })
          .then(function() {
            acknowledge({});
          });
        } else {
          acknowledge({});
        }
      });
    }))
    .fail(function(error) {
      logger.error(error);
      acknowledge({_error: "Unable to register vote"});
    });
  }
};


function setupRoundStart(socket, player, game) {
  setTimeout(function() {
    models.Round.newByGame(game.id)
    .then(function(round) {
      return round.forApi()
      .then(function(roundData) {
        socket.emit('roundStarted', {round: roundData});
        socket.broadcast.to(game.party).emit('roundStarted', {round: roundData});
      });
    })
    .fail(function(reason) {
      logger.error(reason);
    });
  }, exports.INTER_ROUND_DELAY);

  return Q.when({});
}


function requireCardInHand(playerGameId, cardId) {
  return models.Card.queryOneId(cardId)
  .then(function(card) {
    if (card.owner !== playerGameId || card.round !== null) {
      throw new Error("The played card is not in your hand!");
    }
  });
}

function requireNotPlayedThisRound(playerGameId, gameId) {
  var sql = 'SELECT Count(cId) AS cardsPlayedThisRound FROM tbCard WHERE ' +
    'rId=(SELECT rId FROM tbRound WHERE gId=? ORDER BY rCreatedOn DESC LIMIT 1) ' +
    'AND tbCard.pgId=?';
  var inserts = [gameId, playerGameId];
  return models.Card.rawOne(sql, inserts)
  .then(function(data) {
    if (data.cardsPlayedThisRound !== 0) {
      throw new Error("You have already played " + data.cardsPlayedThisRound + " cards this round!");
    }
  });
}

function requireReader(playerGameId, gameId) {
  return models.Round.queryLatestByGame(gameId)
  .then(function(round) {
    if (round.reader !== playerGameId) {
      throw new Error("This endpoint requires the rounds reader");
    }
  });
}

function requireValidVote(cardId, playerGameId, gameId) {
  return Q.all([
    models.Card.queryOneId(cardId),
    models.Round.queryLatestByGame(gameId)
  ])
  .then(function(data) {
    var card = data[0];
    var round = data[1];
    if (card.round !== round.id) {
      throw new Error("You are voting for a card that is not in the current round!");
    }
    else if (card.owner === playerGameId) {
      throw new Error("You can not vote for your own card! (pgId=" + playerGameId + ", owner=" + card.owner + ")");
    }
  });
}

exports.leave = function(socket) {
  // TODO: remove all event listeners associated with this game, as a single
  // socket can only be playin a single game at once

  // TODO: if leaving player is the reader, promote another player
  // TODO: if leaving player is the last voter, then send the `doneVoting` event
};

/**
 * @constant {number} - delay between finishing a round, and starting the next
 * round, in milliseconds
 */
exports.INTER_ROUND_DELAY = 7000;

