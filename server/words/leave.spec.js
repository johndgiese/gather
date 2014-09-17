var expect = require('../expect');

var _ = require('underscore');
var tu = require('../util/test');
var playRoundWith = require('../util/playRound');
var words = require('../words');
var Game = require('../join/models').Game;
var Round = require('../words/models').Round;

// keep inter round delay short during tests
words.INTER_ROUND_DELAY = 200;

describe('The words module can handle players leaving and coming', function() {

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

  it('should promote a new reader if the reader leaves', function() {
    return tu.startGame(clients)
    .then(playRoundWith(clients, gameStates))  // so that client 1
    .then(function() {

      var checkPromotedPromise = clients[2].oncep('playerLeft')
      .then(function(data) {
        expect(data.custom.newReader).to.equal(gameStates[2].you);
        return Round.queryLatestByGame(gameStates[0].game.id)
        .then(function(round) {
          expect(data.custom.newReader).to.equal(round.reader);
        });
      });

      return Q.all([
        clients[0].oncep('playerLeft'),
        checkPromotedPromise,
        clients[1].emitp('leaveGame', {}),
      ]);
    });
  });

  it('should trigger a `choosingDone` if the last player to choose leaves', function() {
    var lastChooserLeaveHooks = {
      beforeChoice: function(clients, gameStates, readerIndex, index) {
        if (index === gameStates.length - 1) {
          return clients[index].emitp('leaveGame', {})
          .then(function() {
            clients[index] = false;
            return Q.reject();
          });
        } else {
          return Q.when();
        }
      }
    };

    return tu.startGame(clients)
    .then(playRoundWith(clients, gameStates, lastChooserLeaveHooks));
  });


  it('should trigger a `votingDone` if the last player to vote leaves', function() {
    var lastVoterLeaveHooks = {
      beforeVote: function(clients, gameStates, readerIndex, index) {
        if (index === gameStates.length - 1) {
          return clients[index].emitp('leaveGame', {})
          .then(function() {
            clients[index] = false;
            return Q.reject();
          });
        } else {
          return Q.when();
        }
      }
    };

    return tu.startGame(clients)
    .then(playRoundWith(clients, gameStates, lastVoterLeaveHooks));
  });


  it('should be possible to leave and rejoin', function() {
    var leaveRejoinHooks = {
      beforChoice: function(clients, gameStates, readerIndex, index) {
        if (index === gameStates.length - 2) {
          return tu.leaveGame(clients,index)
          .then(function() { return Q.reject(); });
        } else {
          return Q.when();
        }
      },
      beforeVote: function(clients, gameStates, readerIndex, index) {
        if (index === gameStates.length - 2) {
          return tu.rejoinGame(clients, gameStates, index, players[index].id, party);
        } else {
          return Q.when();
        }
      }
    };

    return tu.startGame(clients)
    .then(playRoundWith(clients, gameStates, leaveRejoinHooks))
    .then(playRoundWith(clients, gameStates, {}))
    .then(playRoundWith(clients, gameStates, {}))
    .then(playRoundWith(clients, gameStates, {}));
  });


});
