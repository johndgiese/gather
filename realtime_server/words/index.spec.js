var expect = require('../expect');

var io = require('socket.io-client');
var _ = require('underscore');
var tu = require('../util/test');
var models = require('./models');
var debug = require('debug')('gather:words');

var server = require('../index').server;
var words = require('../words');
var dealer = require('./dealer');

words.turnOnTestingMode();

describe('The words socket API', function() {

  describe('exposes some standard API call to the join module:', function() {

    var clients, players, party;
    beforeEach(function() {
      clients = tu.setupClients(3);
      return tu.setupPlayers(clients).then(function(players_) {
        players = players_;
      });
    });

    it('the `create` method doesn\'t do anything at the moment', function() {
      expect(true).to.equal(true);  // don't see a good way to test
    });

    it('the `join` module returns custom state when joining a game', function() {
      return tu.setupGame(clients[0], 'words')
      .then(function(party) {
        return tu.joinGame(clients[0], party);
      })
      .then(function(gameState) {
        expect(gameState.game.id).to.be.a('number');
        expect(gameState.players.length).to.equal(1);
        expect(gameState.custom.rounds).to.be.an('array');
        expect(gameState.custom.choices.length).to.equal(0);
        expect(gameState.custom.votes.length).to.equal(0);
        expect(gameState.custom.hand).to.be.an('array');
        expect(gameState.custom.hand.length).to.equal(dealer.CARDS_IN_HAND);

        var score = gameState.custom.score;
        var points = _.reduce(score, function(sum, s) { return sum + s.score; }, 0);
        expect(score).to.be.an('array');
        expect(points).to.equal(0);
      });
    });
  });

  describe('provides an API to play through a game', function() {

    var clients, players, party, gameStates = [];

    it('after setting up the game', function() {
      clients = tu.setupClients(3);
      return tu.setupPlayers(clients).then(function(players_) {
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
        });
      });
    });

    it("`gameStarted` is emmitted, there is a delay, and then a `roundStarted` is emmitted", function() {

      expect(gameStates[0].game.startedOn).to.equal(null);
      var client1Prom = clients[1].oncep('gameStarted')
      .then(function() {
        return clients[0].oncep('roundStarted')
        .then(function(data) {
          var round = data.round;

          expect(round.number).to.equal(1);
          expect(round.reader).to.equal(gameStates[0].players[0].id);
          expect(round.prompt).to.be.a('string');
        });
      });

      return clients[0].emitp('startGame', {})
      .then(function() {
        return client1Prom;
      })
      .then(function() {
        expect(gameStates[0].game.startedOn).not.to.equal(null);
      });
    });


    it("the reader must submit `readingPromptDone`", function() {
      var roundId = gameStates[0].custom.rounds[0].id;

      var client1prom = clients[1].oncep('readingPromptDone');

      var doneTestingRoundUpdate = models.Round.queryOneId(roundId)
      .then(function(round) {
        expect(round.doneReadingPrompt).to.equal(null);
      })
      .then(function() {
        return clients[0].emitp('doneReadingPrompt', {});
      })
      .then(function() {
        return models.Round.queryOneId(roundId)
        .then(function(round) {
          expect(round.doneReadingPrompt).not.to.equal(null);
        });
      });

      return Q.all([client1prom, doneTestingRoundUpdate]);
    });


    it("each player chooses a card", function() {
      var cardChoosenProm = clients[0].oncep('cardChoosen')
      .then(function(data) {
        expect(data.player).to.equal(gameStates[0].players[2].id);
      });

      var card = gameStates[2].custom.hand[0];
      return clients[2].emitp('chooseCard', {
        card: card.id,
        round: gameStates[2].custom.rounds[0].id
      })
      .then(function(newCard) {
        expect(newCard.id).to.be.a('number');
        expect(newCard.text).to.be.a('string');
      })
      .then(function() {
        return cardChoosenProm;
      });
    });

    it("making a second choice results in an error", function() {
      var card = gameStates[2].custom.hand[0];
      return clients[2].emitp('chooseCard', {
        card: card.id,
        round: gameStates[2].custom.rounds[0].id
      })
      .should.be.rejectedWith(Error);
    });


    it("playing a card that is not in your hand results in an error", function() {
      var highestIdCard = _.max(gameStates[1].custom.hand, function(c) {
        return c.id;
      });

      // submit bad card
      return clients[1].emitp('chooseCard', {
        card: highestIdCard.id + 1,
        round: gameStates[2].custom.rounds[0].id
      })
      .should.be.rejectedWith(Error)
      .then(function() {
        // actually submit card now
        return clients[1].emitp('chooseCard', {
          card: highestIdCard.id,
          round: gameStates[2].custom.rounds[0].id
        });
      });
    });


    it("all active players need to choose, then the server emits `choosingDone`", function() {
      var card = gameStates[0].custom.hand[0];

      var doneChoosingProm = tu.allRecieve(clients, 'choosingDone');

      var currentRound = _.last(gameStates[0].custom.rounds);
      expect(currentRound.doneChoosing).to.equal(null);
      return clients[0].emitp('chooseCard', {
        card: card.id,
        round: gameStates[0].custom.rounds[0].id
      })
      .then(function() {
        return doneChoosingProm;
      })
      .then(function() {
        expect(currentRound.doneChoosing).not.to.equal(null);
      });
    });

    it("then the prompter must read through the choices", function() {
      var roundId = gameStates[0].custom.rounds[0].id;

      var client1prom = clients[1].oncep('readingChoicesDone');

      var doneTestingRoundUpdate = models.Round.queryOneId(roundId)
      .then(function(round) {
        expect(round.doneReadingChoices).to.equal(null);
      })
      .then(function() {
        return clients[0].emitp('doneReadingChoices', {});
      })
      .then(function() {
        return models.Round.queryOneId(roundId)
        .then(function(round) {
          expect(round.doneReadingChoices).not.to.equal(null);
        });
      });

      return Q.all([client1prom, doneTestingRoundUpdate]);
    });


    it("then players can cast votes", function() {
      var voteCastProm = clients[0].oncep('voteCast')
      .then(function(data) {
        expect(data.player).to.equal(gameStates[0].players[2].id);
      });

      return tu.castVote(clients[2], gameStates[2])
      .then(function() {
        return voteCastProm;
      });
    });


    it.skip("voting for your own card results in an error", function() {
      // TODO: add this
    });


    it.skip("voting multiple times per round results in an error", function() {
      // TODO: add this
    });


    it("after everyone has voted, all players should have lists of the votes", function() {
      var votingDonePromise = Q.all(_.map(clients, function(c) {
        return c.oncep('votingDone')
        .then(function(data) {
          var points = _.reduce(data.dscore, function(sum, s) { return sum + s.score; }, 0);
          expect(points).to.equal(players.length);
          return Q.when(data);
        });
      }));

      return tu.castVote(clients[0], gameStates[0])
      .then(function() {
        return Q.when({}).delay(5);  // wait for events to propagate
      })
      .then(function(response) {
        expect(gameStates[0].custom.votes.length).to.equal(2);
        expect(gameStates[1].custom.votes.length).to.equal(2);
        expect(gameStates[2].custom.votes.length).to.equal(2);
        return tu.castVote(clients[1], gameStates[1]);
      })
      .then(function() {
        return votingDonePromise;
      })
      .then(function(data) {
        var at = data[0].at;
        var currentRound = _.last(gameStates[0].custom.rounds);
        expect(currentRound.doneVoting).to.equal(at);
      });
    });


    it("then the server setups a new round", function() {
      return Q.all(_.map(clients, function(c) {
        return c.oncep('roundStarted')
        .then(function(round) {
          return Q.when(null);
        });
      }))
      .then(function() {
        _.forEach(gameStates, function(gs) {
          expect(gs.custom.choices.length).to.equal(0);
          expect(gs.custom.votes.length).to.equal(0);
          expect(gs.custom.rounds.length).to.equal(2);
          expect(gs.custom.rounds[1].reader).to.equal(gs.players[1].id);
        });
      });
    });
  });

});
