var expect = require('../expect');

var io = require('socket.io-client');
var _ = require('underscore');
var Q = require('q');
var models = require('../join/models');
var config = require('../config');
var diff = require('deep-diff').diff;
var deepcopy = require('deepcopy');

var stateResolver = require('../words/stateResolver');

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


exports.expectStates = function(gameStates, state, others, otherState) {
  if (others === undefined) {
    others = [];
  } else if (_.isNumber(others)) {
    others = [others];
  }

  _.forEach(gameStates, function(gs, index) {
    if (_.contains(others, index)) {
      exports.expectState(gs, otherState);
    } else {
      exports.expectState(gs, state);
    }
  });
};

exports.expectState = function(gameState, state) {
  expect(stateResolver(gameState)).to.equal('app.game.words.' + state);
};

/**
 * Compare two game states to ensure they are functionally the same.
 * @returns {boolean}
 */
var compareGameStates = exports.compareGameStates = function(gameStateOne, gameStateTwo) {
  gameStateOne.players = _.sortBy(gameStateOne.players, 'id');
  gameStateTwo.players = _.sortBy(gameStateTwo.players, 'id');

  gameStateOne.custom.hand = _.sortBy(gameStateOne.custom.hand, 'id');
  gameStateTwo.custom.hand = _.sortBy(gameStateTwo.custom.hand, 'id');

  gameStateOne.custom.votes = _.sortBy(gameStateOne.custom.votes, 'player');
  gameStateTwo.custom.votes = _.sortBy(gameStateTwo.custom.votes, 'player');

  gameStateOne.custom.choices = _.sortBy(gameStateOne.custom.choices, 'player');
  gameStateTwo.custom.choices = _.sortBy(gameStateTwo.custom.choices, 'player');

  var gsDiff = diff(gameStateTwo, gameStateOne);
  if (gsDiff !== undefined) {
    debug(gsDiff);
    debug(gameStateTwo.custom);
    debug(gameStateOne.custom);
  }

  return _.isEqual(gameStateOne, gameStateTwo);
};

exports.expectSameStateAfterReconnect = function(clients, gameStates, players, party, num) {
  if (num === undefined) {
    num = _.random(gameStates.length - 1);
  }

  var gameStateBeforeDisconnect = deepcopy(gameStates[num]);
  return rejoinGame(clients, gameStates, num, players[num].id, party)
  .then(function() {
    var gameStateAfterReconnect = deepcopy(gameStates[num]);
    expect(compareGameStates(gameStateBeforeDisconnect, gameStateAfterReconnect)).to.equal(true);
  });
};


var setupClients = exports.setupClients = function(num) {
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
  this.emit(event, data, function(response) {
    if (response._error === undefined) {
      deferred.resolve(response);
    } else {
      deferred.reject(new Error(response._error));
    }
  });
  return deferred.promise;
}

function oncePromise(event) {
  var deferred = Q.defer();
  this.once(event, function(response) {
    if (response === undefined || response._error === undefined) {
      deferred.resolve(response);
    } else {
      deferred.reject(new Error(response._error));
    }
  });
  return deferred.promise;
}

var setupPlayers = exports.setupPlayers = function(clients) {
  var count = 0;
  var players = _.map(clients, function(client) {
    var name = 'player' + String(count++);
    return client.emitp('createPlayer', {name: name})
    .then(function(player) {
      return player;
    });
  });
  return Q.all(players);
};


/**
 * Rejoin a game.
 * @arg - Array of clients
 * @arg - index of the player in the array
 * @arg {number} - playerId
 * @arg {string} - party
 * @returns - a promise for when the player has reconnected
 */
var rejoinGame = exports.rejoinGame = function(clients, gameStates, index, playerId, party) {
  var promise = clients[index ? index - 1 : index + 1]
  .oncep('playerDisconnected')
  .then(function() {
    var client = clients[index] = setupClient();
    return client.emitp('login', {id: playerId})
    .then(function(player) {
      return joinGame(client, party)
      .then(function(gameState) {
        gameStates[index] = gameState;
      });
    });
  });

  clients[index].disconnect();
  return promise;
};


// joing game setup game state listeners
// IMPORTANT: this code has a near identical copy in public/words/controllers/WordsCtrl.js
// UPDATES DONE HERE SHOULD LIKLEY BE UPDATED IN BOTH PLACES
// TODO: modularize and include in front end
var joinGame = exports.joinGame = function(client, party) {
  return client.emitp('joinGame', {party: party})
  .then(function(gameState) {

    client.on('gameStarted', function(data) {
      gameState.game.startedOn = data.startedOn;
    });

    // TODO: figure out error handling on this stuff
    client.on('playerLeft', function(data) {
      var playerInListAlready = _.findWhere(gameState.players, {id: data.player.id}) !== undefined;
      if (!playerInListAlready) {
        throw new Error("Inconsistent State: removing player that doesn't exist");
      } else {
        for (var i = 0; i < gameState.players.length; i++) {
          if (data.player.id === gameState.players[i].id) {
            gameState.players.splice(i, 1);
            break;
          }
        }
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

      client.on('playerLeft', function(data) {
        // update the game state with the new reader if it changed
        if (data.custom.newReader !== null) {
          _.last(gameState.custom.rounds).reader = data.custom.newReader;
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

var setupGame = exports.setupGame = function(client, type) {
  return client.emitp('createGame', {type: type})
  .then(function(data) {
    return data.party;
  });
};

exports.setupAndJoinGame = function(numPlayers, type) {
  var out = {};
  out.clients = setupClients(numPlayers);
  return setupPlayers(out.clients)
  .then(function(players) {
    out.players = players;
    return setupGame(out.clients[0], type);
  })
  .then(function(party) {
    out.party = party;
    return allJoinGame(out.clients, party);
  })
  .then(function(gameStates) {
    out.gameStates = gameStates;
    return out;
  });
};

/**
 * Start a game; resolves once everyone has recieved `roundStarted`.
 */
var startGame = exports.startGame = function(clients) {
  return Q.all([
    allRecieve(clients, 'roundStarted'),
    allRecieve(clients, 'gameStarted'),
    clients[0].emitp('startGame', {})
  ]);
};

/**
 * Make all the provided clients join the party, serially.
 * @arg - array of sockets
 * @arg {string} - party
 * @return - promise for array of game states
 */
var allJoinGame = exports.allJoinGame = function(clients, party) {
  var gameStates = [];
  var promise = Q.when();
  _.each(clients, function(client) {
    promise = promise.then(function() {
      return joinGame(client, party).then(function(gameState) {
        gameStates.push(gameState);
      });
    });
  });
  return promise.then(function() { return gameStates; });
};

exports.makeChoice = function(client, gameState) {
  var index = _.random(gameState.custom.hand.length - 1);
  var card = gameState.custom.hand[index];
  return client.emitp('chooseCard', {
    card: card.id,
    round: _.last(gameState.custom.rounds).id
  })
  .then(function(newCard) {
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
  }).then(function(data) {
    return Q.when(data);
  });
};

/**
 * Return a promise that resolves once all players receive the specified event
 */
var allRecieve = exports.allRecieve = function(clients, event, ms) { 
  return Q.all(_.map(clients, function(c) {
    if (c) {
      return c.oncep(event);
    } else {
      return Q.when();
    }
  }))
  .then(function(result) {
    if (ms === undefined) {
      return Q.when(result);
    } else {
      return delay(ms).then(function() { return Q.when(result); });
    }
  });
};

/**
 * Return a promise that resolves if any players receive the specified event
 */
var anyRecieve = exports.anyRecieve = function(clients, event) { 
  var deferred = Q.defer();
  _.each(clients, function(c) {
    if (c) {
      return c.oncep(event);
    } else {
      return Q.when();
    }
  });
  return deferred.promise;
};

