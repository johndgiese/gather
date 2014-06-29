var expect = require('expect.js');
var io = require('socket.io-client');
var config = require('../config');

var server = require('../index').server;

describe('The join socket API', function() {

  var options = {
    transports: ['websocket'],
    'force new connection': true,
  };
  var client;

  beforeEach(function(done) {
    client = io.connect("http://localhost:" + config.PORT, options);
    client.once('connect', function() {
      done();
    });
  });

  describe('provides a way to create players', function() {
    it('returns a player object on succsess', function(done) {
      client.emit('createPlayer', 'test player', function(data) {
        expect(data.id).not.to.be(undefined);
        done();
      });
    });
    it('returns an error if an invalid data is passed into it', function(done) {
      client.emit('createPlayer', 3, function(data) {
        expect(data._error).not.to.be(undefined);
        done();
      });
    });
    it('returns an error if the name is too long', function(done) {
      var longName = new Array(101 + 1).join('a');
      client.emit('createPlayer', longName, function(data) {
        expect(data._error).not.to.be(undefined);
        done();
      });
    });
  });

  describe('provides a way of creating games', function() {

    it('requires the id of the player to be set in the socket', function(done) {
      client.emit('createPlayer', 'david', function(player) {
        expect(player.id).to.be.a('number');
        client.emit('createGame', player.id, function(playerGameId) {
          expect(playerGameId).to.be.a('number');
        });
      });
    });

    it('throws an error if given an invalid playerid', function(done) {
      var invalidPlayerId = 100;
      client.emit('createGame', invalidPlayerId, function(data) {
        expect(data._error).not.to.be(undefined);
        done();
      });
    });

  });

});

