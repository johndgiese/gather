var orm = require('../../orm');
var hash = require('../hash');
var logger = require('../../logger');

var fields = {
  createdBy: 'gCreatedBy',
  activePlayers: 'gActivePlayers',
  open: 'gOpen',
  hash: 'gHash',
  createdOn: 'gCreatedOn',
};
var Game = orm.define('tbGame', fields, 'gId');
exports.Model = Game;

Game.prototype.getState = function(playerId) {
  var instance = this;

  var sql = 'SELECT pgId AS id, pName AS name ' +
              'FROM tbPlayer NATURAL JOIN tbPlayerGame ' +
              'WHERE gId=? AND pgActive=TRUE';

  return Game.raw(sql, [this.id])
    .then(function(players) {
      return {
        players: players
      };
    });
};

Game.prototype.close = function() {
  var inserts = [this.table, this.id];
  return Game.raw('UPDATE ?? SET gOpen = FALSE WHERE gId=?', inserts);
};

Game.get = function(gameId) {
  return Game.queryOneId(gameId);
};

Game.getByHash = function(hash) {
  inserts = [this.table, hash];
  var sql = 'SELECT * from ?? where gHash=?';
  return this.queryOne(sql, inserts);
};

Game.queryActive = function() {
  return Game.query('SELECT * FROM tbGame WHERE gActivePlayers > 0');
};

Game.queryOpen = function() {
  return Game.query('SELECT * FROM tbGame WHERE gOpen=TRUE');
};

Game.prototype.isPlayerActive = function(playerId) {
  var inserts = [this.id, playerId];
  var sql = 'SELECT count(*) ' +
              'FROM tbGame NATURAL JOIN tbPlayerGame NATURAL JOIN tbPlayer ' +
              'WHERE gId=? AND pId=? AND pgActive=TRUE';
  var inGame = Game.raw(sql, inserts);
  return inGame[0] === 1;
};

var MAX_HASH_ATTEMPTS = 10;
Game.prototype._save = Game.prototype.save;
Game.prototype.save = function() {
  if (this.id === undefined) {  // first save
    if (this.createdBy === undefined) {
      throw new Error("Must provide player id before creating a game");
    }

    var attempts = 0;
    while (attempts < MAX_HASH_ATTEMPTS) {
      attempts++;
      this.hash = hash.gamehash(this.createdBy);
      try {
        return this._save();
      } catch (e) {
        logger.warn(e);
      }
    }
    throw new Error("Unable to find a unique hash for the game");
  } else {
    return this._save();
  }
};

