var expect = require('expect.js');
var io = require('socket.io-client');
var _ = require('underscore');
var tu = require('../util/test');
var models = require('./models');
var debug = require('debug')('gather:words');

var server = require('../index').server;
var words = require('../words');
var dealer = require('./dealer');

describe('The words socket API', function() {

  var clients, players, party;
  beforeEach(function(done) {
    clients = tu.setupClients(3);
    tu.setupPlayers(clients).then(function(players_) {
      players = players_;
      done();
    });
  });

  describe('exposes some standard API call to the join module:', function() {
    it('the `create` method doesn\'t do anything at the moment', function() {
      expect(true).to.be(true);  // don't see a good way to test
    });

    it('the `join` module returns custom state when joining a game', function(done) {
      tu.setupGame(clients[0], 'words')
      .then(function(party) {
        return tu.joinGame(clients[0], party);
      })
      .then(function(gameState) {
        tu.expectNoError(gameState);
        expect(gameState.game.id).to.be.a('number');
        expect(gameState.players.length).to.be(1);
        expect(gameState.custom.rounds).to.be.an('array');
        expect(gameState.custom.hand).to.be.an('array');
        expect(gameState.custom.hand.length).to.be(dealer.CARDS_IN_HAND);
        done();
      })
      .fail(done);
    });
  });



  describe('after starting a game', function() {

    var party;
    beforeEach(function(done) {
      tu.setupGame(clients[0], 'words')
      .then(function(party_) {
        party = party_;
        return tu.allJoinGame(clients, party);
      })
      .then(function() {
        done();
      })
      .fail(done);
    });

    it('`gameStarted` is emitted, there is a delay, then a `roundStarted` is emitted', function(done) {
      clients[1].oncep('gameStarted', function() {
        clients[0].oncep('roundStarted', function() {
          done();
        });
      });
      clients[0].emit('startGame', {}, function() {});
    });
  });

});



