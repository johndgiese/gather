var expect = require('../expect');

var io = require('socket.io-client');
var config = require('../config');
var _ = require('underscore');
var tu = require('../util/test');
var models = require('./models');

var server = require('../index').server;

describe('The join socket API', function() {

  var client;

  beforeEach(function() {
    client = tu.setupClient();
    return client.oncep('connect');
  });

  describe('provides a way to create players', function() {
    it('returns a player object on success', function() {
      return client.emitp('createPlayer', {name: 'test player'})
      .then(function(data) {
        expect(data.id).not.to.equal(undefined);
      });
    });
    it('returns an error if an invalid data is passed into it', function() {
      return client.emitp('createPlayer', 3).should.be.rejectedWith(Error);
    });
    it('returns an error if the name is too long', function() {
      var longName = new Array(101 + 1).join('a');
      return client.emitp('createPlayer', {name: longName}).should.be.rejectedWith(Error);
    });
    it('returns an error if already attached to a player', function() {
      return client.emitp('createPlayer', {name: 'david'})
      .then(function(data) {
        return client.emitp('createPlayer', {name: 'david'}).should.be.rejectedWith(Error);
      });
    });
  });

  describe('provides a way to log back in as a player', function() {
    var player;
    it('if you create a player', function() {
      return client.emitp('createPlayer', {name: 'test player'})
      .then(function(player_) {
        player = player_;
      });
    });
    it('you can then log back in with a different connection', function() {
      return client.emitp('login', {id: player.id})
      .then(function(player_) {
        expect(player_).to.eql(player_);
      });
    });
    it('if you login with an invalid id you get an error', function() {
      return client.emitp('login', {id: 40000000}).should.be.rejectedWith(Error);
    });

  });

  describe('provides a way of creating games', function() {
    var player;
    beforeEach(function() {
      return client.emitp('createPlayer', {name: 'david'})
      .then(function(player_) {
        player = player_;
      });
    });

    it('returns the party promise', function() {
      return client.emitp('createGame', {type: 'dummy'})
      .then(function(data) {
        expect(_.isString(data.party)).to.equal(true);
      });
    });
    it.skip('requires that the player owns the game', function() {
    });
    it('throws an error if there is no `createPlayer` call first', function() {
      var client = tu.setupClient();
      client.emitp('createGame', {type: 'dummy'}).should.be.rejectedWith(Error);
    });
  });

  describe('provides a way to join and leave existing games', function() {

    var clients, players, party;
    beforeEach(function() {
      clients = tu.setupClients(3);
      return tu.setupPlayers(clients)
      .then(function(players_) {
        players = players_;
        return clients[0].emitp('createGame', {type: 'dummy'})
        .then(function(data) {
          party = data.party;
          return clients[0].emitp('joinGame', {party: party});
        });
      });
    });

    it('it broadcasts the event to other players in the party', function() {
      var gameState;

      var client0promise = clients[0].oncep('playerJoined');

      return clients[1].emitp('joinGame', {party: party})
      .then(function(gameState_) {
        gameState = gameState_;
        expect(gameState.game.id).to.be.a('number');
        expect(_.isString(gameState.game.party)).to.equal(true);
        return client0promise;
      })
      .then(function(broadcastPlayer) {
        var playerInGameState = gameState.players[1];
        expect(broadcastPlayer).to.eql(playerInGameState);
      });
    });

    it('throws an error if given an invalid party', function() {
      return clients[1].emitp('joinGame', {party: 'AAAAAA'}).should.be.rejectedWith(Error);
    });

    it('should record the state as players come and go', function() {
      var gameState;
      return tu.activePlayers(party)
      .then(function(activePlayers) {
        expect(activePlayers).to.equal(1);
        return tu.joinGame(clients[1], party);
      })
      .then(function() {
        return tu.activePlayers(party);
      })
      .then(function(activePlayers) {
        expect(activePlayers).to.equal(2);
        return tu.joinGame(clients[2], party);
      })
      .then(function(gameState_) {
        gameState = gameState_;
        return tu.activePlayers(party);
      })
      .then(function(activePlayers) {
        expect(activePlayers).to.equal(3);
        var promise = clients[0].oncep('playerLeft')
        .then(function(leavingPlayer) {
          expect(leavingPlayer).to.eql(gameState.players[1]);
        });
        clients[1].emitp('leaveGame', {});
        return promise;
      })
      .then(function() {
        return tu.activePlayers(party);
      })
      .then(function(activePlayers) {
        expect(activePlayers).to.equal(2);
        var playerAboutToLeave = gameState.players[0];
        var promise = clients[2].oncep('playerLeft')
        .then(function(leavingPlayer) {
          expect(leavingPlayer).to.eql(playerAboutToLeave);
        });
        clients[0].emitp('leaveGame', {});
        return promise;
      })
      .then(function() {
        return tu.activePlayers(party);
      })
      .then(function(activePlayers) {
        expect(activePlayers).to.equal(1);
      });
    });
  });

  describe('should never change state if there is an error', function() {
    it('that means the database shouldn\'t be altered', function() {});
    it('and neither should the connection-level state (e.g. `game`, `player`, or `gamePlayerId`', function() {});
    // but I don't know how to tests these things
    // except to look for them
    // and they currently aren't true at all, although some types of errors are very unlikley
    // TODO: make sure these items are true
  });

});


