/**
 * Dummy game module (for testing).
 */

var Q = require('q');

exports.join = function(socket, player, party, playerGameId) {
  return Q.when({});
};

exports.create = function(game) {
  return Q.when({});
};

exports.leave = function(socket, kickPlayer, party, game, kickedPlayerGameId) {
  return Q.when({});
};
