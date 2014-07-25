var models = require('./models');
var dealer = require('./dealer');
var Q = require('Q');
var debug = require('debug')('gather:words');
var logger = require('../logger');

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
  // Note this is duplicated in the join code below because I saw no way to
  // share the socket reference easily
  models.Round.newByGame(game.id)
  .then(function(round) {
    setTimeout(function() {
      round.forApi()
      .then(function(roundData) {
        socket.emit('roundStarted', {round: roundData});
        socket.broadcast.to(party).emit('roundStarted', {round: roundData});
      });
    }, INTER_ROUND_DELAY);
  })
  .fail(function(reason) {
    logger.error(reason);
  });

  return Q.when({});
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
  socket.on('voteForChoice', voteForChoice);

  return Q.all([
    dealer.dealResponses(playerGameId, game.id),
    models.Round.forApiByParty(party),
  ])
  .then(function(data) {
    return {
      hand: data[0],
      rounds: data[1]
    };
  });

  function doneReadingPrompt(data, acknowledge) {
    Q.fcall(function() {
      return Q.all([
        requireReader(playerGameId),
      ]);
      // TODO: ensure that the provided roundId is correct
    })
    .then(function() {
      return models.Round.queryLatestByParty(party)
      .then(function(round) {
        return round.markDoneReadingPrompt();
      })
      .then(function(round) {
        socket.broadcast.to(party).emit('readingPromptDone', {roundId: round.id});
        acknowledge({});
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
        socket.broadcast.to(party).emit('cardChoosen', {
          player: playerGameId,
          card: card
        });

        return dealer.dealResponse(game.id, playerGameId)
        .then(function(card) {
          acknowledge(models.Card.forApi(card.id));
        });
      });
    })
    .fail(function(error) {
      logger.error(error);
      acknowledge({_error: "Unable to signal reading is over"});
    });
  }

  function doneReadingChoices(data, acknowledge) {
    Q.fcall(function() {
      return Q.all([
        requireReader(playerGameId),
      ]);
    })
    .then(function() {
      return models.Round.queryLatestByParty(party)
      .then(function(round) {
        return round.markDoneReadingChoices();
      });
    })
    .then(function(round) {
      socket.broadcast.to(party).emit('readingChoicesDone', data.roundId);
      acknowledge({});
    })
    .fail(function(error) {
      logger.error(error);
      acknowledge({_error: "Unable to signal reading choices is over"});
    });
  }

  function voteForChoice(data, acknowledge) {
    Q.fcall(function() {
      return requireValidVote(data.card, playerGameId, gameId);
    })
    .then(function() {
      return new models.Vote({
        voter: playerGameId,
        card: data.card,
      })
      .save();
    })
    .then(function(vote) {
      socket.broadcast.to(party).emit('voteCast', {player: playerGameId});
      // TODO: if last vote, then broadcast `roundOver` and setup timer for `roundStart`
      acknowledge({});
    })
    .fail(function(error) {
      logger.error(error);
      acknowledge({_error: "Unable to register vote"});
    });
  }

  function setupRoundStart() {
    // COPY from above
  }

};

function requireCardInHand(playerGameId, cardId) {
  return models.Card.queryOneId(cardId)
  .then(function(card) {
    if (card.owner !== playerGameId) {
      throw "The played card is not in your hand!";
    }
  });
}

function requireNotPlayedThisRound(playerGameId, gameId) {
  var sql = 'SELECT cId FROM tbCard JOIN tbRound ON tbCard.rId=tbRound.rId WHERE ' +
    'tbRound.rId=(SELECT rId FROM tbRound WHERE gId=? ORDER BY rCreatedOn DESC LIMIT 1) ' +
    'AND tbCard.pgId=?';
  var inserts = [gameId, playerGameId];
  return models.Card.raw(sql, inserts)
  .then(function(data) {
    if (data.length !== 0) {
      throw "You have already played this round!";
    }
  });
}

function requireReader(playerGameId, gameId) {
  return models.Round.queryLatestById(gameId)
  .then(function(round) {
    if (round.reader !== playerGameId) {
      throw "This endpoint requires the rounds reader";
    }
  });
}

function requireValidVote(cardId, playerGameId, gameId) {
  return Q.all([
    models.Card.queryOneById(cardId),
    models.Round.queryLatestById(gameId)
  ])
  .then(function(data) {
    var card = data[0];
    var round = data[1];
    if (card.round !== round.id) {
      throw "You are voting for a card that is not in the current round!";
    }
    else if (card.owner === playerGameId) {
      throw "You can not vote for your own card!";
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
var INTER_ROUND_DELAY = exports.INTER_ROUND_DELAY = 500;
