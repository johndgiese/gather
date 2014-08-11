var expect = require('expect.js');
var io = require('socket.io-client');
var _ = require('underscore');
var tu = require('../util/test');
var models = require('./models');
var debug = require('debug')('gather:words');

var server = require('../index').server;
var words = require('../words');
var dealer = require('./dealer');
var stateResolver = require('./stateResolver');

// keep inter round delay short during tests
words.INTER_ROUND_DELAY = 50;

describe('The words module can handle disconnects and reconnects', function() {

  var clients, players, party, gameStates = [];

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
    var gameStateBeforeDisconnect = gameStates[1];
    clients[1].disconnect();
    clients[2].oncep('playerLeft', function() {
      expect(gameStates[2].players.length).to.be(2);
      return tu.rejoinGame(players[1].id, party);
    })
    .then(function(data) {
      clients[1] = data[0];
      var gameStateAfterReconnect = data[1];
      expect(_.isEqual(gameStateAfterReconnect, gameStateBeforeDisconnect)).to.be(true);
      done();
    })
    .fail(done);
  });

  /*
  it("`gameStarted` is emmitted, there is a delay, and then a `roundStarted` is emmitted", function(done) {
    var client1Prom = clients[1].oncep('gameStarted', function() {
      return clients[0].oncep('roundStarted', function(data) {
        var round = data.round;

        expect(round.number).to.be(1);
        expect(round.reader).to.be(gameStates[0].players[0].id);
        expect(round.prompt).to.be.a('string');
      });
    });

    clients[0].emitp('startGame', {}, tu.expectNoError)
    .then(function() {
      return client1Prom;
    })
    .then(function() {
      done();
    })
    .fail(done);
  });


  it("the reader must submit `readingPromptDone`", function(done) {
    var roundId = gameStates[0].custom.rounds[0].id;

    var client1prom = clients[1].oncep('readingPromptDone', function(data) {
      expect(data.roundId).to.equal(roundId);
    });

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

    Q.all([client1prom, doneTestingRoundUpdate])
    .then(function() {
      done();
    })
    .fail(done);
  });


  it("each player chooses a card", function(done) {
    var cardChoosenProm = clients[0].oncep('cardChoosen', function(data) {
      expect(data.player).to.equal(gameStates[0].players[2].id);
    });

    var card = gameStates[2].custom.hand[0];
    clients[2].emitp('chooseCard', {
      card: card.id,
      round: gameStates[2].custom.rounds[0].id
    }, function(newCard) {
      expect(newCard.id).to.be.a('number');
      expect(newCard.text).to.be.a('string');
      tu.expectNoError(newCard);
    })
    .then(function() {
      return cardChoosenProm;
    })
    .then(function() {
      done();
    })
    .fail(done);
  });


  it("making a second choice results in an error", function(done) {
    var card = gameStates[2].custom.hand[0];
    clients[2].emitp('chooseCard', {
      card: card.id,
      round: gameStates[2].custom.rounds[0].id
    }, function(data) {
      tu.expectError(data);
      done();
    })
    .fail(done);
  });


  it("playing a card that is not in your hand results in an error", function(done) {
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
        done();
      });
    })
    .fail(done);
  });


  it("all active players need to choose, then the server emits `choosingDone`", function(done) {
    var card = gameStates[0].custom.hand[0];

    var doneChoosingProm = tu.allRecieve(clients, 'choosingDone');

    clients[0].emitp('chooseCard', {
      card: card.id,
      round: gameStates[0].custom.rounds[0].id
    }, function(data) {
      tu.expectNoError(data);
    })
    .then(function() {
      return doneChoosingProm;
    })
    .then(function() {
      done();
    })
    .fail(done);
  });

  it("then the prompter must read through the choices", function(done) {
    var roundId = gameStates[0].custom.rounds[0].id;

    var client1prom = clients[1].oncep('readingChoicesDone', function() {});

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

    Q.all([client1prom, doneTestingRoundUpdate])
    .then(function() {
      done();
    })
    .fail(done);
  });


  it("then players can cast votes", function(done) {
    var voteCastProm = clients[0].oncep('voteCast', function(data) {
      expect(data.player).to.equal(gameStates[0].players[2].id);
      done();
    });

    tu.castVote(clients[2], gameStates[2])
    .then(tu.expectNoError)
    .then(function() {
      return voteCastProm;
    })
    .fail(done);
  });


  it.skip("voting for your own card results in an error", function(done) {
    // TODO: add this
    done();
  });


  it.skip("voting multiple times per round results in an error", function(done) {
    // TODO: add this
    done();
  });


  it("after everyone has voted, all players should have lists of the votes", function(done) {
    var votingDonePromise = Q.all(_.map(clients, function(c) {
      return c.oncep('votingDone', function(scores) {
        expect(scores.length).to.be(players.length);
        expect(scores[0].id).not.to.be(undefined);
        expect(scores[0].score).not.to.be(undefined);
        var points = _.reduce(scores, function(sum, s) { return sum + s.score; }, 0);
        expect(points).to.be(players.length);
        return Q.when(null);
      });
    }));

    tu.castVote(clients[0], gameStates[0]);

    tu.castVote(clients[1], gameStates[1])
    .then(function() {
      return Q.when({}).delay(5);  // wait for events to propagate
    })
    .then(function(response) {
      expect(gameStates[0].custom.votes.length).to.be(3);
      expect(gameStates[1].custom.votes.length).to.be(3);
      expect(gameStates[2].custom.votes.length).to.be(3);
    })
    .then(function() {
      return votingDonePromise;
    })
    .then(function() {
      done();
    })
    .fail(done);
  });


  it("then the server setups a new round", function(done) {
    Q.all(_.map(clients, function(c) {
      return c.oncep('roundStarted', function(round) {
        return Q.when(null);
      });
    }))
    .then(function() {
      _.forEach(gameStates, function(gs) {
        expect(gs.custom.choices.length).to.be(0);
        expect(gs.custom.votes.length).to.be(0);
        expect(gs.custom.rounds.length).to.be(2);
        expect(gs.custom.rounds[1].reader).to.be(gs.players[1].id);
      });
    })
    .then(function() {
      done();
    })
    .fail(done);
  });
 */

});

