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



  describe.only('facilitates playing the game', function() {

    var party, gameStates = [];
    beforeEach(function(done) {
      tu.setupGame(clients[0], 'words')
      .then(function(party_) {
        party = party_;
        return tu.allJoinGame(clients, party);
      })
      .then(function(gameStates_) {
        gameStates = gameStates_;
        done();
      })
      .fail(done);
    });

    it('everything progresses', function(done) {
      Q.when({})
      .then(function() {
        tu.msg(3, "After the `gameStarted` there is a delay, and then a " +
                    "`roundStarted` is emmitted");

        var testRound = Q.defer();

        clients[1].oncep('gameStarted', function() {
          console.log("here");
          clients[0].oncep('roundStarted', function(data) {
            console.log("here");
            var round = data.round;

            expect(round.number).to.be(1);
            expect(round.reader).to.be(gameStates[0].players[0].id);
            expect(round.prompt).to.be.a('string');
            testRound.resolve();
          });
        });

        clients[0].emit('startGame', {}, tu.expectNoError);

        return testRound.promise;
      })


      .then(function() {
        tu.msg(3, "Then the reader must submit `readingPromptDone`");
        var testRound = Q.defer();
        var roundId = gameStates[0].custom.rounds[0].id;

        clients[1].oncep('readingPromptDone', function(data) {
          expect(data.roundId).to.equal(roundId);
          testRound.resolve();
        })
        .fail(done);

        var doneTestingRoundUpdate = models.Round.queryOneId(roundId)
        .then(function(round) {
          expect(round.doneReadingPrompt).to.be(null);
        })
        .then(function() {
          return clients[0].emitp('doneReadingPrompt', {}, function (data) {
            tu.expectNoError(data);
            return Q.when({});
          });
        })
        .then(function() {
          return models.Round.queryOneId(roundId)
          .then(function(round) {
            expect(round.doneReadingPrompt).not.to.be(null);
          });
        });

        return Q.all([testRound.promise, doneTestingRoundUpdate]);
      })


      .then(function() {
        tu.msg(3, "Then each player makes a choice");
        var testRound = Q.defer();

        clients[0].oncep('cardChoosen', function(data) {
          expect(data.player).to.equal(gameStates[0].players[2].id);
          testRound.resolve();
        });

        var card = gameStates[2].custom.hand[0];
        clients[2].emitp('chooseCard', {
          card: card.id,
          round: gameStates[2].custom.rounds[0].id
        }, tu.expectNoError);

        return testRound.promise;
      })


      .then(function() {
        tu.msg(3, "Making a second choice results in an error");
        var testRound = Q.defer();

        var card = gameStates[2].custom.hand[0];
        clients[2].emit('chooseCard', {
          card: card.id,
          round: gameStates[2].custom.rounds[0].id
        }, function(data) {
          tu.expectError(data);
          testRound.resolve();
        });
        return testRound.promise;
      })


      .then(function() {
        tu.msg(3, "Playing a card that is not in your hand results in an error");
        var testRound = Q.defer();

        var highestIdCard = _.max(gameStates[1].custom.hand, function(c) {
          return c.id;
        });

        // submit bad card
        clients[1].emitp('chooseCard', {
          card: highestIdCard.id + 1,
          round: gameStates[2].custom.rounds[0].id
        }, function(data) {
          tu.expectError(data);
        })
        .then(function() {
          // actually submit card now
          return clients[1].emitp('chooseCard', {
            card: highestIdCard.id,
            round: gameStates[2].custom.rounds[0].id
          }, function(data) {
            tu.expectNoError(data);
            testRound.resolve();
          });
        });
        return testRound.promise;
      })


      .then(function() {
        tu.msg(3, "Not all players need to choose before progressing, this is to avoid stalling from logouts");
        var testRound = Q.defer();
        var roundId = gameStates[0].custom.rounds[0].id;

        clients[1].oncep('readingChoicesDone', function() {
          testRound.resolve();
        });

        var doneTestingRoundUpdate = models.Round.queryOneId(roundId)
        .then(function(round) {
          expect(round.doneReadingChoices).to.be(null);
        })
        .then(function() {
          return clients[0].emitp('doneReadingChoices', {}, function (data) {
            tu.expectNoError(data);
            return Q.when({});
          });
        })
        .then(function() {
          return models.Round.queryOneId(roundId)
          .then(function(round) {
            expect(round.doneReadingChoices).not.to.be(null);
          });
        });

        return Q.all([testRound.promise, doneTestingRoundUpdate]);
      })


      .then(function() {
        tu.msg(3, "Then each player makes a vote");
        var testRound = Q.defer();

        clients[0].oncep('voteMade', function(data) {
          expect(data.player).to.equal(gameStates[0].players[2].id);
          testRound.resolve();
        });

        var card = gameStates[2].custom.hand[0];
        clients[2].emitp('makeVote', {
          card: card.id,
          round: gameStates[2].custom.rounds[0].id
        }, tu.expectNoError);

        return testRound.promise;
      })

      .then(function() { done(); })
      .fail(done);

    });

  });


});



