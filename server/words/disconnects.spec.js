var expect = require('expect.js');
var io = require('socket.io-client');
var _ = require('underscore');
var tu = require('../util/test');
var models = require('./models');
var debug = require('debug')('gather:words');
var diff = require('deep-diff').diff;

var server = require('../index').server;
var words = require('../words');
var dealer = require('./dealer');
var stateResolver = require('./stateResolver');

// keep inter round delay short during tests
words.INTER_ROUND_DELAY = 1000;

describe.only('The words module can handle disconnects and reconnects', function() {

  var clients, players, party, gameStates = [];

  function expectSameStateAfterReconnect(num) {
    var gameStateBeforeDisconnect = gameStates[num];
    clients[num].disconnect();
    return clients[num ? num - 1 : num + 1].oncep('playerLeft', function() {
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
    _.forEach(gameStates, function(gs) { expect(stateResolver(gs)).to.be('game'); });
    expectSameStateAfterReconnect(1)
    .then(function() {
      done();
    })
    .fail(done);
  });

  it("you can rejoin before the prompt reader finishes", function(done) {
    clients[0].emitp('startGame', {}, tu.expectNoError);
    tu.allRecieve(clients, 'gameStarted')
    .then(function() {
      expect(stateResolver(gameStates[0])).to.be('game.words.score');
      expect(stateResolver(gameStates[1])).to.be('game.words.score');
      expect(stateResolver(gameStates[2])).to.be('game.words.score');
      return tu.allRecieve(clients, 'roundStarted');
    })
    .then(function() {
      expect(stateResolver(gameStates[0])).to.be('game.words.readPrompt');
      expect(stateResolver(gameStates[1])).to.be('game.words.waitingForPromptReader');
      expect(stateResolver(gameStates[2])).to.be('game.words.waitingForPromptReader');
      return expectSameStateAfterReconnect(1);
    })
    .then(function() {
      clients[0].emitp('doneReadingPrompt', {}, tu.expectNoError);
      return tu.allRecieve(clients, 'readingPromptDone');
    })
    .then(function() {
      expect(stateResolver(gameStates[0])).to.be('game.words.choosing');
      expect(stateResolver(gameStates[1])).to.be('game.words.choosing');
      expect(stateResolver(gameStates[2])).to.be('game.words.choosing');
      return expectSameStateAfterReconnect(0);
    })
    .then(function() {
      return tu.makeChoice(clients[0], gameStates[0])
      .then(function() {
        expect(stateResolver(gameStates[0])).to.be('game.words.waitingForChoices');
        expect(stateResolver(gameStates[1])).to.be('game.words.choosing');
        expect(stateResolver(gameStates[2])).to.be('game.words.choosing');
        return expectSameStateAfterReconnect(0);
      });
    })
    .then(function() {
      tu.makeChoice(clients[1], gameStates[1]);
      tu.makeChoice(clients[2], gameStates[2]);
      return tu.allRecieve(clients, 'choosingDone');
    })
    .then(function() {
      expect(stateResolver(gameStates[0])).to.be('game.words.readChoices');
      expect(stateResolver(gameStates[1])).to.be('game.words.waitingForChoicesReader');
      expect(stateResolver(gameStates[2])).to.be('game.words.waitingForChoicesReader');
      return expectSameStateAfterReconnect(0);
    })
    .then(function() {
      return expectSameStateAfterReconnect(1);
    })
    .then(function() {
      return expectSameStateAfterReconnect(2);
    })
    .then(function() {
      clients[0].emitp('doneReadingChoices', {}, tu.expectNoError);
      return tu.allRecieve(clients, 'readingChoicesDone');
    })
    .then(function() {
      expect(stateResolver(gameStates[0])).to.be('game.words.voting');
      expect(stateResolver(gameStates[1])).to.be('game.words.voting');
      expect(stateResolver(gameStates[2])).to.be('game.words.voting');
      return tu.castVote(clients[2], gameStates[2]);
    })
    .then(function() {
      expect(stateResolver(gameStates[0])).to.be('game.words.voting');
      expect(stateResolver(gameStates[1])).to.be('game.words.voting');
      expect(stateResolver(gameStates[2])).to.be('game.words.waitingForVotes');
      return expectSameStateAfterReconnect(2);
    })
    .then(function() {
      return Q.all([
        tu.castVote(clients[0], gameStates[0]),
        tu.castVote(clients[1], gameStates[1]),
        tu.allRecieve(clients, 'votingDone')
      ]);
    })
    .then(function() {
      expect(stateResolver(gameStates[0])).to.be('game.words.score');
      expect(stateResolver(gameStates[1])).to.be('game.words.score');
      expect(stateResolver(gameStates[2])).to.be('game.words.score');
      return expectSameStateAfterReconnect(1);
    })
    .then(function() {
      done();
    })
    .fail(done);
  });

});
