var expect = require('../expect');

var io = require('socket.io-client');
var _ = require('underscore');
var tu = require('../util/test');
var playRoundWith = require('../util/playRound');
var models = require('./models');
var debug = require('debug')('gather:tests');

var server = require('../index').server;
var words = require('../words');
var dealer = require('./dealer');
var stateResolver = require('./stateResolver');

words.turnOnTestingMode();

describe('The words module can handle disconnects and reconnects', function() {

  var clients, players, sessions, party, gameStates = [];
  it('after setting up the game', function() {
    return tu.setupAndJoinGame(3, 'words')
    .then(function(data) {
      clients = data.clients;
      players = data.players;
      sessions = data.sessions;
      party = data.party;
      gameStates = data.gameStates;
    });
  });

  var disconnectHooks = {
    beforeReadingPrompt: function(clients, gameStates, sessions, readerIndex) {
      tu.expectStates(gameStates, 'waitingForPromptReader', readerIndex, 'readPrompt');
      return tu.expectSameStateAfterReconnect(clients, gameStates, sessions, players, party);
    },
    beforeChoosing: function(clients, gameStates, sessions, readerIndex) {
      tu.expectStates(gameStates, 'choosing');
      return tu.expectSameStateAfterReconnect(clients, gameStates, sessions, players, party);
    },
    beforeChoice: function(clients, gameStates, sessions, readerIndex, index) {
      tu.expectState(gameStates[index], 'choosing');
      if (index === (readerIndex + 1) % clients.length) {
        return tu.expectSameStateAfterReconnect(clients, gameStates, sessions, players, party);
      } else {
        return Q.when();
      }
    },
    afterChoice: function(clients, gameStates, sessions, readerIndex, index) {
      var isLastPerson = index === clients.length - 1;

      if (!isLastPerson) {
        tu.expectState(gameStates[index], 'waitingForChoices');
      }
      if (index === (readerIndex + 1) % clients.length) {
        return tu.expectSameStateAfterReconnect(clients, gameStates, sessions, players, party);
      } else {
        return Q.when();
      }
    },
    beforeReadingChoices: function(clients, gameStates, sessions, readerIndex) {
      tu.expectStates(gameStates, 'waitingForChoicesReader', readerIndex, 'readChoices');
      return tu.expectSameStateAfterReconnect(clients, gameStates, sessions, players, party);
    },
    beforeVote: function(clients, gameStates, sessions, readerIndex, index) {
      tu.expectState(gameStates[index], 'voting');
      if (index === (readerIndex + 1) % clients.length) {
        return tu.expectSameStateAfterReconnect(clients, gameStates, sessions, players, party);
      } else {
        return Q.when();
      }
    },
    afterVote: function(clients, gameStates, sessions, readerIndex, index) {
      var isLastPerson = index === clients.length - 1;

      if (!isLastPerson) {
        tu.expectState(gameStates[index], 'waitingForVotes');
      }
      if (index === (readerIndex + 1) % clients.length && !isLastPerson) {
        return tu.expectSameStateAfterReconnect(clients, gameStates, sessions, players, party);
      } else {
        return Q.when();
      }
    },
  };

  it("should be possible for players to join/rejoin before the game starts", function() {
    _.each(gameStates, function(gs) { expect(gs.players.length).to.equal(3); });
    _.each(gameStates, function(gs) { expect(stateResolver(gs)).to.equal('app.game'); });
    return tu.expectSameStateAfterReconnect(clients, gameStates, sessions, players, party, 1);
  });

  it("you can join/rejoin through out a round", function() {
    return tu.startGame(clients)
    .then(playRoundWith(clients, gameStates, sessions, disconnectHooks));
  });

  it("you can join/rejoin through out several rounds", function() {
    this.timeout(5000);

    var playRound = playRoundWith(clients, gameStates, sessions, disconnectHooks);

    return playRound()
    .then(function() {
      return tu.cardsInGame(gameStates[0].game.id);
    })
    .then(function(result) {
      expect(result.count).to.equal(3*dealer.CARDS_IN_HAND + 3*2);
      return playRound();
    })
    .then(playRound);
  });

});
