var expect = require('expect.js');
var io = require('socket.io-client');
var _ = require('underscore');
var Q = require('Q');
var models = require('../join/models');
var config = require('../config');

var debug = require('debug')('gather:test');

var SOCKET_URL = "http://localhost:" + config.PORT;
var SOCKET_OPTIONS = {
  transports: ['websocket'],
  'force new connection': true,
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


// joing game setup game state listeners
// TODO: modularize and include in front end
var joinGame = exports.joinGame = function(client, party) {
  return client.emitp('joinGame', {party: party}, function(gameState) {

    if (gameState._error !== undefined) {
      throw gameState._error;
    }

    client.on('roundStarted', function(data) {
      debug('roundStarted: %j', data);
      gameState.custom.choices = [];
      gameState.custom.votes = [];
      gameState.custom.rounds.push(data.round);
    });

    client.on('cardChoosen', function(data) {
      debug('cardChoosen: %j', data);
      gameState.custom.choices.push(data);
    });

    client.on('voteCast', function(data) {
      debug('voteCast: %j', data);
      gameState.custom.votes.push(data);
    });

    // TODO: figure out error handling on this stuff
    client.on('playerLeft', function(player) {
      debug('playerLeft: %j', player);
      var playerInListAlready = _.find(gameState.players, function(p) {
        return p.id === player.id;
      }) !== undefined;

      if (!playerInListAlready) {
        throw "Inconsistent State: removing player that doesn't exist";
      } else {
        _.reject(gameState.players, function(p) {
          return p.id === player.id;
        });
      }
    });

    client.on('playerJoined', function(player) {
      debug('playerJoined: %j', player);
      var playerInListAlready = _.find(gameState.players, function(p) {
        return p.id === player.id;
      }) !== undefined;

      if (playerInListAlready) {
        throw "Inconsistent State: adding player that already exists";
      } else {
        gameState.players.push(player);
      }
    });

    return gameState;
  });
};

exports.activePlayers = function(party) {
  return models.Game.getByParty(party)
  .then(function(game) {
    return game.activePlayers();
  });
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

exports.msg = function(indents, msg) {
  var buffer = Array(indents + 1).join("  ");
  console.log(buffer + msg);
};
