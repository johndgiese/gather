var expect = require('expect.js');
var io = require('socket.io-client');
var config = require('../config');
var _ = require('underscore');
var tu = require('../util/test');
var models = require('./models');

var server = require('../index').server;

var SOCKET_URL = "http://localhost:" + config.PORT;

describe('The join socket API', function() {

  var SOCKET_OPTIONS = {
    transports: ['websocket'],
    'force new connection': true,
  };
  var client;

  beforeEach(function(done) {
    client = tu.setupClient(SOCKET_URL, SOCKET_OPTIONS);
    client.once('connect', done);
  });

  describe('provides a way to create players', function() {
    it('returns a player object on succsess', function(done) {
      client.emitp('createPlayer', {name: 'test player'}, function(data) {
        expect(data.id).not.to.be(undefined);
        done();
      }).fail(done);
    });
    it('returns an error if an invalid data is passed into it', function(done) {
      client.emitp('createPlayer', 3, function(data) {
        tu.expectError(data);
        done();
      }).fail(done);
    });
    it('returns an error if the name is too long', function(done) {
      var longName = new Array(101 + 1).join('a');
      client.emitp('createPlayer', {name: longName}, function(data) {
        tu.expectError(data);
        done();
      }).fail(done);
    });
    it('returns an error if already attached to a player', function(done) {
      client.emitp('createPlayer', {name: 'david'}, function(data) {
        tu.expectNoError(data);
        client.emit('createPlayer', {name: 'david'}, function(data) {
          tu.expectError(data);
          done();
        });
      }).fail(done);
    });
  });

  describe('provides a way of creating games', function() {
    var player;
    beforeEach(function(done) {
      client.emit('createPlayer', {name: 'david'}, function(player_) {
        player = player_;
        done();
      });
    });

    it('returns the party party', function(done) {
      client.emitp('createGame', {type: 'words'}, function(data) {
        expect(_.isString(data.party)).to.be(true);
        done();
      }).fail(done);
    });
    it.skip('requires that the player owns the game', function(done) {
      done();
    });
    it('throws an error if there is no `createPlayer` call first', function(done) {
      var client = tu.setupClient(SOCKET_URL, SOCKET_OPTIONS);
      client.emitp('createGame', {type: 'words'}, function(data) {
        tu.expectError(data);
        done();
      }).fail(done);
    });
  });

  describe('provides a way to join and leave existing games', function() {

    var clients, players, party;
    beforeEach(function(done) {
      clients = tu.setupClients(3, SOCKET_URL, SOCKET_OPTIONS);
      tu.setupPlayers(clients)
      .then(function(players_) {
        players = players_;
        clients[0].emitp('createGame', {type: 'words'}, function(data) {
          party = data.party;
        })
        .then(function() {
          clients[0].emitp('joinGame', {party: party}, function(data) {
            done();
          });
        });
      });
    });

    it('it broadcasts the event to other players in the party', function(done) {
      var joinEventBroadcastTo1 = false;
      var client0promise = clients[0].oncep('playerJoined', function(player) {
        joinEventBroadcastTo1 = true;
        expect(player.id).to.be.eql(players[1].id);
        return true;
      });

      clients[2].once('playerJoined', function(player) {
        done(new Error("player 2 shouldn't receive a request"));
      });

      clients[1].emitp('joinGame', {party: party}, function(data) {
        console.log(data);
        expect(data.game.id).to.be.a('number');
        expect(_.isString(data.game.party)).to.be(true);
      })
      .then(function() {
        return client0promise;
      })
      .then(function() {
        done();
      })
      .fail(done);
    });

    it('throws an error if given an invalid party', function(done) {
      clients[1].emitp('joinGame', {party: 'AAAAAA'}, function(data) {
        tu.expectError(data);
        done();
      }).fail(done);
    });

    it('should record the state as players come and go', function(done) {
      tu.activePlayers(party)
      .then(function(activePlayers) {
        expect(activePlayers).to.be(1);
      })
      .then(function() {
        return tu.joinGame(clients[1], party);
      })
      .then(function() {
        return tu.activePlayers(party);
      })
      .then(function(activePlayers) {
        expect(activePlayers).to.be(2);
      })
      .then(function() {
        return tu.joinGame(clients[2], party);
      })
      .then(function() {
        return tu.activePlayers(party);
      })
      .then(function(activePlayers) {
        expect(activePlayers).to.be(3);
      })
      .then(function() {
        var promise = clients[0].oncep('playerLeft', function(leavingPlayer) {
          expect(leavingPlayer.id).to.be(players[1].id);
        }).fail(done);
        clients[1].disconnect();
        return promise;
      })
      .then(function() {
        return tu.activePlayers(party);
      })
      .then(function(activePlayers) {
        expect(activePlayers).to.be(2);
      })
      .then(function() {
        var promise = clients[2].oncep('playerLeft', function(leavingPlayer) {
          expect(leavingPlayer.id).to.be(players[0].id);
        }).fail(done);
        clients[0].emit('leaveParty');
        return promise;
      })
      .then(function() {
        return tu.activePlayers(party);
      })
      .then(function(activePlayers) {
        expect(activePlayers).to.be(1);
        done();
      })
      .fail(done);
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


