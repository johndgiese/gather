var expect = require('expect.js');
var io = require('socket.io-client');
var _ = require('underscore');
var tu = require('../util/test');
var playRoundWith = require('../util/playRound');
var models = require('./models');
var debug = require('debug')('gather:tests');
var diff = require('deep-diff').diff;

var server = require('../index').server;
var words = require('../words');
var dealer = require('./dealer');
var stateResolver = require('./stateResolver');

// keep inter round delay short during tests
words.INTER_ROUND_DELAY = 200;

describe('The words module can handle disconnects and reconnects', function() {

  var clients, players, party, gameStates = [];

  var disconnectIndicies = [];  // keep track in case we need to reproduce
  function expectSameStateAfterReconnect(num) {
    if (num === undefined) {
      num = _.random(gameStates.length - 1);
    }
    disconnectIndicies.push(num);

    var gameStateBeforeDisconnect = gameStates[num];
    
    clients[num].disconnect();
    return clients[num ? num - 1 : num + 1].oncep('playerDisconnected', function() {
      return tu.rejoinGame(players[num].id, party);
    })
    .then(function(data) {
      clients[num] = data[0];
      var gameStateAfterReconnect = data[1];


      // sort players and cards to keep them in the same order for comparisons
      gameStateAfterReconnect.players = _.sortBy(gameStateAfterReconnect.players, 'id');
      gameStateBeforeDisconnect.players = _.sortBy(gameStateBeforeDisconnect.players, 'id');

      gameStateAfterReconnect.custom.hand = _.sortBy(gameStateAfterReconnect.custom.hand, 'id');
      gameStateBeforeDisconnect.custom.hand = _.sortBy(gameStateBeforeDisconnect.custom.hand, 'id');

      gameStateAfterReconnect.custom.votes = _.sortBy(gameStateAfterReconnect.custom.votes, 'player');
      gameStateBeforeDisconnect.custom.votes = _.sortBy(gameStateBeforeDisconnect.custom.votes, 'player');

      gameStateAfterReconnect.custom.choices = _.sortBy(gameStateAfterReconnect.custom.choices, 'player');
      gameStateBeforeDisconnect.custom.choices = _.sortBy(gameStateBeforeDisconnect.custom.choices, 'player');

      var gsDiff = diff(gameStateBeforeDisconnect, gameStateAfterReconnect);
      if (gsDiff !== undefined) {
        console.log(gsDiff);
        console.log(gameStateBeforeDisconnect.custom);
        console.log(gameStateAfterReconnect.custom);
      }
      expect(_.isEqual(gameStateAfterReconnect, gameStateBeforeDisconnect)).to.be(true);

      gameStates[num] = gameStateAfterReconnect;
      return Q.when({});
    });
  }

  beforeEach(function() {
    disconnectIndicies = [];
  });

  afterEach(function() {
    debug("disconnect indices: %j", disconnectIndicies);
  });

  var disconnectHooks = {
    beforeReadingPrompt: function(clients, gameStates, readerIndex) {
      tu.expectStates(gameStates, 'waitingForPromptReader', readerIndex, 'readPrompt');
      return expectSameStateAfterReconnect();
    },
    beforeChoosing: function(clients, gameStates, readerIndex) {
      tu.expectStates(gameStates, 'choosing');
      return expectSameStateAfterReconnect();
    },
    beforeChoice: function(clients, gameStates, readerIndex, index) {
      tu.expectState(gameStates[index], 'choosing');
      if (index === (readerIndex + 1) % clients.length) {
        return expectSameStateAfterReconnect();
      } else {
        return Q.when();
      }
    },
    afterChoice: function(clients, gameStates, readerIndex, index) {
      var isLastPerson = index === clients.length - 1;

      if (!isLastPerson) {
        tu.expectState(gameStates[index], 'waitingForChoices');
      }
      if (index === (readerIndex + 1) % clients.length) {
        return expectSameStateAfterReconnect();
      } else {
        return Q.when();
      }
    },
    beforeReadingChoices: function(clients, gameStates, readerIndex) {
      tu.expectStates(gameStates, 'waitingForChoicesReader', readerIndex, 'readChoices');
      return expectSameStateAfterReconnect();
    },
    beforeVote: function(clients, gameStates, readerIndex, index) {
      tu.expectState(gameStates[index], 'voting');
      if (index === (readerIndex + 1) % clients.length) {
        return expectSameStateAfterReconnect();
      } else {
        return Q.when();
      }
    },
    afterVote: function(clients, gameStates, readerIndex, index) {
      var isLastPerson = index === clients.length - 1;

      if (!isLastPerson) {
        tu.expectState(gameStates[index], 'waitingForVotes');
      }
      if (index === (readerIndex + 1) % clients.length && !isLastPerson) {
        return expectSameStateAfterReconnect();
      } else {
        return Q.when();
      }
    },
  };


  it('after setting up the game', function(done) {
    clients = tu.setupClients(3);
    tu.setupPlayers(clients).then(function(players_) {
      players = players_;
    })
    .then(function() {
      return tu.setupGame(clients[0], 'words');
    })
    .then(function(party_) {
      party = party_;

      // make players join in order, so we know how clients map to player
      // roles during a round; i.e. clients[0] is the first reader
      return tu.joinGame(clients[0], party)
      .then(function(gs) {
        gameStates.push(gs);
        return tu.joinGame(clients[1], party);
      })
      .then(function(gs) {
        gameStates.push(gs);
        return tu.joinGame(clients[2], party);
      })
      .then(function(gs) {
        gameStates.push(gs);
        done();
      });
    })
    .fail(done);
  });

  it("should be possible for players to join/rejoin before the game starts", function(done) {
    _.forEach(gameStates, function(gs) { expect(gs.players.length).to.be(3); });
    _.forEach(gameStates, function(gs) { expect(stateResolver(gs)).to.be('app.game'); });
    expectSameStateAfterReconnect(1)
    .then(function() {
      done();
    })
    .fail(done);
  });

  it("you can join/rejoin through out a round", function(done) {
    Q.all([
      clients[0].emitp('startGame', {}, tu.expectNoError),
      tu.allRecieve(clients, 'gameStarted'),
      playRoundWith(clients, gameStates, disconnectHooks)()
    ])
    .then(function() {
      done();
    })
    .fail(done);
  });

  it("you can join/rejoin through out several rounds", function(done) {
    this.timeout(5000);

    var playRound = playRoundWith(clients, gameStates, disconnectHooks);

    playRound()
    .then(function() {
      return tu.cardsInGame(gameStates[0].game.id);
    })
    .then(function(result) {
      expect(result.count).to.be(3*dealer.CARDS_IN_HAND + 3*2);
      return playRound();
    })
    .then(playRound)
    .then(playRound)
    .then(function() {
      done();
    })
    .fail(done);
  });

});
