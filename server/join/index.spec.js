var expect = require('expect.js');
var io = require('socket.io-client');
var config = require('../config');
var _ = require('underscore');
var Q = require('Q');

var server = require('../index').server;

describe('The join socket API', function() {

  var options = {
    transports: ['websocket'],
    'force new connection': true,
  };
  var client;

  beforeEach(function(done) {
    client = setupClient("http://localhost:" + config.PORT, options);
    client.once('connect', done);
  });

  describe('provides a way to create players', function() {
    it('returns a player object on succsess', function(done) {
      client.emitp('createPlayer', 'test player', function(data) {
        expect(data.id).not.to.be(undefined);
        done();
      }).fail(done);
    });
    it('returns an error if an invalid data is passed into it', function(done) {
      client.emitp('createPlayer', 3, function(data) {
        expectError(data);
        done();
      }).fail(done);
    });
    it('returns an error if the name is too long', function(done) {
      var longName = new Array(101 + 1).join('a');
      client.emitp('createPlayer', longName, function(data) {
        expectError(data);
        done();
      }).fail(done);
    });
    it('returns an error if already attached to a player', function(done) {
      client.emitp('createPlayer', 'david', function(data) {
        expectNoError(data);
        client.emit('createPlayer', 'david', function(data) {
          expectError(data);
          done();
        });
      }).fail(done);
    });
  });

  describe('provides a way of creating games', function() {
    var player;
    beforeEach(function(done) {
      client.emit('createPlayer', 'david', function(player_) {
        player = player_;
        done();
      });
    });

    it('returns the playerGameId and game object', function(done) {
      client.emitp('createGame', player.id, function(data) {
        expect(data.playerGameId).to.be.a('number');
        expect(data.game.id).to.be.a('number');
        expect(_.isString(data.game.hash)).to.be(true);
        done();
      }).fail(done);
    });
    it('requires that the player owns the game', function(done) {
      // TODO
      done();
    });
    it('throws an error if the player is already in a game', function(done) {
      client.emitp('createGame', player.id, function(data) {
        expectNoError(data);
        client.emit('createGame', player.id, function(data) {
          expectError(data);
          done();
        });
      }).fail(done);
    });
    it('throws an error if there is no `createPlayer` call first', function(done) {
      var invalidPlayerId = 100;
      client.emitp('createGame', invalidPlayerId, function(data) {
        expectError(data);
        done();
      }).fail(done);
    });
    it('throws an error if given a playerid that doesn\'t match', function(done) {
      client.emitp('createGame', player.id + 1, function(data) {
        expectError(data);
        done();
      }).fail(done);
    });
  });

  describe('provides a way to join games', function() {

    var client2;
    beforeEach(function(done) {
      client2 = io.connect("http://localhost:" + config.PORT, options);
      client2.once('connect', function() {

      });
    });


  });

});

function expectError(data) {
  expect(data._error).not.to.be(undefined);
}

function expectNoError(data) {
  expect(data._error).to.be(undefined);
}

function setupClient(url, options) {
  var client = io.connect(url, options);
  client.emitp = emitPromise;
  return client;
}

function emitPromise(topic, data, ack) {
  var deferred = Q.defer();
  this.emit(topic, data, function(data) {
    try {
      var result = ack(data);
      deferred.resolve(result);
    } catch (e) {
      deferred.reject(e);
    }
  });
  return deferred.promise;
}

