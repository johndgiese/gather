var expect = require('../expect');

var _ = require('underscore');
var tu = require('../util/test');
var playRoundWith = require('../util/playRound');
var words = require('../words');
var Game = require('../join/models').Game;

// keep inter round delay short during tests
words.INTER_ROUND_DELAY = 200;

describe.only('The words module can handle players leaving and coming', function() {

  var clients, players, party, gameStates = [];
  beforeEach(function() {
    return tu.setupAndJoinGame(3, 'words')
    .then(function(data) {
      clients = data.clients;
      players = data.players;
      party = data.party;
      gameStates = data.gameStates;
    });
  });

  it('should be possible for non-creating players to leave before the game starts', function() {
    return Q.all([
      clients[0].oncep('playerLeft'),
      clients[2].emitp('leaveGame', {})
    ])
    .then(function() {
      expect(gameStates[0].players.length).to.equal(2);
      expect(gameStates[1].players.length).to.equal(2);
      return tu.expectSameStateAfterReconnect(clients, gameStates, players, party, 0);
    });
  });

  it('should cancel the game if the creator leaves', function() {
    return Q.all([
      clients[1].oncep('playerLeft'),
      clients[2].oncep('playerLeft'),
      clients[0].emitp('leaveGame', {})
    ])
    .then(function() {
      return tu.expectSameStateAfterReconnect(clients, gameStates, players, party, 2)
      .should.be.rejectedWith(Error);
    })
    .then(function() {
      return Game.getByParty(party).should.be.rejectedWith(Error);
    });
  });


});
