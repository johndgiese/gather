var expect = require('expect.js');
var io = require('socket.io-client');
var _ = require('underscore');
var Q = require('Q');


exports.expectError = function(data) {
  expect(data._error).not.to.be(undefined);
};

exports.expectNoError = function(data) {
  expect(data._error).to.be(undefined);
};

exports.setupClients = function(num, url, options) {
  var clients = [];
  for(var i = 0; i < num; i++) {
    clients[i] = setupClient(url, options);
  }
  return clients;
};

exports.setupClient = setupClient = function(url, options) {
  var client = io.connect(url, options);
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
    return client.emitp('createPlayer', name, function(player) {
      return player;
    });
  });
  return Q.all(players);
};

exports.joinGame = function(client, playerId, hash) {
  var joinRequestData = {playerId: playerId, hash: hash};
  return client.emitp('joinGame', joinRequestData, function(data) {
    return data;
  });
};

