var models = require('./models');
var dealer = require('./dealer');
var Q = require('Q');
var debug = require('debug')('gather:words');

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
      socket.emit('roundStarted', {round: round});
      socket.broadcast.to(game.party).emit('roundStarted', {round: round});
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
exports.join = function(socket, player, game, playerGameId) {

  socket.on('gameStarted', setupRoundStart);
  socket.on('doneReadingPrompt', doneReadingPrompt);
  socket.on('chooseCard', chooseCard);
  socket.on('doneReadingChoices', doneReadingChoices);
  socket.on('voteForChoice', voteForChoice);

  return Q.all([
    dealer.dealResponses(playerGameId, game.id),
    models.Round.queryByParty(game.party),
  ])
  .then(function(data) {
    return {
      hand: data[0],
      rounds: data[1]
    };
  });

  // TODO: record when this happens (prob on the round row)
  function doneReadingPrompt(data, acknowledge) {
    Q.fcall(function() {
      // TODO: ensure the current person is the reader 
      // TODO: ensure now is an appropriate time for this event
      // TODO: ensure that the provided roundId is correct
    })
    .then(function() {
      // TODO: record that the game is closed until next round
      socket.broadcast.to(party).emit('readingPromptDone', data.roundId);
      acknowledge({});
    })
    .fail(function(error) {
      logger.error(error);
      acknowledge({_error: "Unable to signal reading prompt is over"});
    });
  }

  function chooseCard(data, acknowledge) {
    Q.fcall(function() {
      // TODO: ensure the current person hasn't choosen already this round
      // TODO: ensure the card choosen is in their hand
    })
    .then(function() {
      socket.broadcast.to(party).emit('cardChoosen', {
        // TODO: add data here
      });

      var newCard = dealCard(data.playerGameId);
      acknowledge(newCard.serialize());
    })
    .fail(function(error) {
      logger.error(error);
      acknowledge({_error: "Unable to signal reading is over"});
    });
  }

  // TODO: record when this happens (prob on the round row)
  function doneReadingChoices(data, acknowledge) {
    Q.fcall(function() {
      // TODO: ensure the current person is the reader 
      // TODO: ensure now is an appropriate time for this event
      // TODO: ensure that the provided roundId is correct
    })
    .then(function() {
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
      // TODO: check that vote id is correct for the round
      // TODO: check that vote is not for their own card
    })
    .then(function() {
      // TODO: save vote to DB
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


exports.leave = function(socket) {
    // TODO: remove all event listeners associated with this game, as a single
    // socket can only be playin a single game at once
};

/**
 * @constant {number} - delay between finishing a round, and starting the next
 * round, in milliseconds
 */
var INTER_ROUND_DELAY = exports.INTER_ROUND_DELAY = 500;

