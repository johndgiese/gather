var expect = require('expect.js');
var io = require('socket.io-client');
var _ = require('underscore');
var Q = require('q');
var models = require('../join/models');
var config = require('../config');

var debug = require('debug')('gather:test');

var SOCKET_URL = "http://localhost:" + config.PORT;
var SOCKET_OPTIONS = {
  transports: ['websocket'],
  'force new connection': true,
};


var delay = exports.delay = function(ms) {
  var deferred = Q.defer();
  setTimeout(function() {
    deferred.resolve();
  }, ms);
  return deferred.promise;
};


exports.expectError = function(data) {
  if (data._error === undefined) {
    expect().fail('Expected an error in the response!');
  } else {
    expect(true).to.be(true);
  }
};

exports.expectNoError = function(data) {
  if (data._error !== undefined) {
    expect().fail('Expected no error, recieved: ' + data._error);
  } else {
    expect(true).to.be(true);
  }
};

exports.setupClients = function(num) {
  var clients = [];
  for(var i = 0; i < num; i++) {
    clients[i] = setupClient();
  }
  return clients;
};

exports.setupClient = setupClient = function() {
  var client = io.connect(SOCKET_URL, SOCKET_OPTIONS);
  client.emitp = emitPromise;
  client.oncep = oncePromise;
  return client;
};

function emitPromise(event, data, ack) {
  var deferred = Q.defer();
  this.emit(event, data, function(data) {
    try {
      deferred.resolve(ack(data));
    } catch (e) {
      deferred.reject(e);
    }
  });
  return deferred.promise;
}

function oncePromise(event, callback) {
  var deferred = Q.defer();
  this.once(event, function(data) {
    try {
      deferred.resolve(callback(data));
    } catch (e) {
      deferred.reject(e);
    }
  });
  return deferred.promise;
}

exports.setupPlayers = function(clients) {
  var count = 0;
  var players = _.map(clients, function(client) {
    var name = 'player' + String(count++);
    return client.emitp('createPlayer', {name: name}, function(player) {
      return player;
    });
  });
  return Q.all(players);
};


/**
 * Rejoin a game.
 * @arg {number} - playerId
 * @arg {string} - party
 * @returns - a promise for an array, whose first element is the connection,
 * and the second element is the gameState.
 */
exports.rejoinGame = function(playerId, party) {
  var client = setupClient();
  return client.emitp('login', {id: playerId}, function(player) {
    return joinGame(client, party)
    .then(function(gameState) {
      return [client, gameState];
    });
  });
};


// joing game setup game state listeners
// IMPORTANT: this code has a near identical copy in public/words/controllers/WordsCtrl.js
// UPDATES DONE HERE SHOULD LIKLEY BE UPDATED IN BOTH PLACES
// TODO: modularize and include in front end
var joinGame = exports.joinGame = function(client, party) {
  return client.emitp('joinGame', {party: party}, function(gameState) {
    if (gameState._error !== undefined) {
      throw new Error(gameState._error);
    }

    client.on('gameStarted', function(data) {
      gameState.game.startedOn = data.startedOn;
    });

    // TODO: figure out error handling on this stuff
    client.on('playerLeft', function(player) {
      var playerInListAlready = _.findWhere(gameState.players, {id: player.id}) !== undefined;
      if (!playerInListAlready) {
        throw new Error("Inconsistent State: removing player that doesn't exist");
      } else {
        gameState.players = _.reject(gameState.players, function(p) {
          return p.id === player.id;
        });
      }
    });

    client.on('playerJoined', function(player) {
      var playerInListAlready = _.findWhere(gameState.players, {id: player.id}) !== undefined;
      if (playerInListAlready) {
        throw new Error("Inconsistent State: adding player that already exists");
      } else {
        gameState.players.push(player);
      }
    });

    if (gameState.game.type === 'words') {

      client.on('roundStarted', function(data) {
        gameState.custom.rounds.push(data.round);
      });

      client.on('readingPromptDone', function(data) {
        _.last(gameState.custom.rounds).doneReadingPrompt = data.at;
      });

      client.on('cardChoosen', function(data) {
        gameState.custom.choices.push(data);
      });

      client.on('choosingDone', function(data) {
        _.last(gameState.custom.rounds).doneChoosing = data.at;
      });

      client.on('readingChoicesDone', function(data) {
        _.last(gameState.custom.rounds).doneReadingChoices = data.at;
      });

      client.on('voteCast', function(data) {
        gameState.custom.votes.push(data);
      });

      client.on('votingDone', function(data) {
        gameState.custom.choices = [];
        gameState.custom.votes = [];

        _.last(gameState.custom.rounds).doneVoting = data.at;

        // add in points made this round
        _.forEach(data.dscore, function(player) {
          var currentScore = _.findWhere(gameState.custom.score, {id: player.id});
          currentScore.score += player.score;
        });
      });

      client.on('playerJoined', function(player) {
        var match = _.findWhere(gameState.custom.score, {id: player.id});
        if (match === undefined) {
          gameState.custom.score.push({name: player.name, id: player.id, score: 0});
        }
      });
    }

    // IMPORTANT: see note above

    return gameState;
  });
};

exports.activePlayers = function(party) {
  return models.Game.getByParty(party)
  .then(function(game) {
    return game.activePlayers();
  });
};

exports.cardsInGame = function(gameId) {
  return db.rawOne('SELECT COUNT(*) AS count FROM tbCard WHERE pgId IN ' + 
                   '(SELECT pgId FROM tbPlayerGame WHERE gId=?)', gameId);
};

exports.setupGame = function(client, type) {
  return client.emitp('createGame', {type: type}, function(data) {
    return data.party;
  });
};

exports.allJoinGame = function(clients, party) {
  var joined = _.map(clients, function(client) {
    return joinGame(client, party);
  });
  return Q.all(joined);
};

exports.makeChoice = function(client, gameState) {
  var index = _.random(gameState.custom.hand.length - 1);
  var card = gameState.custom.hand[index];
  return client.emitp('chooseCard', {
    card: card.id,
    round: _.last(gameState.custom.rounds).id
  }, function(newCard) {
    gameState.custom.hand[index] = newCard;
  });
};

exports.castVote = function(client, gameState) {
  var validChoices = _.filter(gameState.custom.choices, function(c) {
    return c.player !== gameState.you;
  });
  return client.emitp('castVote', {
    card: validChoices[0].card.id,
    round: _.last(gameState.custom.rounds).id
  }, function(data) {
    return Q.when(data);
  });
};

exports.allRecieve = function(clients, event, ms) { 
  return Q.all(_.map(clients, function(c) {
    return c.oncep(event, function() { return Q.when({}); });
  }))
  .then(function(result) {
    if (ms === undefined) {
      return Q.when(result);
    } else {
      return delay(ms).then(function() { return Q.when(result); });
    }
  });
};

exports.anyRecieve = function(clients, event) { 
  var deferred = Q.defer();
  _.each(clients, function(c) {
    return c.oncep(event, function() { deferred.resolve(); });
  });
  return deferred.promise;
};

