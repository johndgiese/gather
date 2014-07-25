var orm = require('../../orm');
var partyHash = require('../partyHash');
var logger = require('../../logger');

var fields = {
  createdBy: 'gCreatedBy',
  party: 'gParty',
  type: 'gType',
  createdOn: 'gCreatedOn',
};
var Game = orm.define('tbGame', fields, 'gId');
exports.Model = Game;

Game.prototype.getState = function(playerId) {
  var self = this;

  var sql = 'SELECT pgId AS id, pName AS name ' +
              'FROM tbPlayer NATURAL JOIN tbPlayerGame ' +
              'WHERE gId=? AND pgActive=TRUE';

  return Game.raw(sql, [this.id])
    .then(function(players) {
      return {
        game: self.serialize(),
        players: players,
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

Game.getByParty = function(party) {
  inserts = [this.table, party];
  var sql = 'SELECT * from ?? where gParty=?';
  return this.queryOne(sql, inserts);
};

Game.queryOpen = function() {
  return Game.query('SELECT * FROM tbGame WHERE gOpen=TRUE');
};

Game.prototype.activePlayers = function() {
  var inserts = [this.id];
  var sql = 'SELECT count(*) AS activePlayers ' +
              'FROM tbGame NATURAL JOIN tbPlayerGame ' +
              'WHERE gId=? AND pgActive=TRUE';
  return Game.raw(sql, inserts)
  .then(function(result) {
    return result[0].activePlayers;
  });
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
  if (this.party === undefined) {
    if (this.createdBy === undefined) {
      throw new Error("Must provide player id before creating a game");
    }

    var attempts = 0;
    while (attempts < MAX_HASH_ATTEMPTS) {
      attempts++;
      this.party = partyHash(this.createdBy);
      try {
        return this._save();
      } catch (e) {
        logger.warn(e);
      }
    }
    var msg = "Unable to find a unique party hash for the game";
    logger.error(msg);
    throw new Error(msg);
  } else {
    return this._save();
  }
};

