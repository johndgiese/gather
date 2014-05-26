var orm = require('../../orm');

var fields = {
  name: 'gName',
  createdBy: 'gCreatedBy',
  activePlayer: 'gActivePlayers',
  open: 'gOpen',
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

Game.queryActive = function() {
  return Game.query('SELECT * FROM tbGame WHERE gActivePlayers > 0');
};

Game.queryOpen = function() {
  return Game.query('SELECT * FROM tbGame WHERE gOpen=TRUE');
};

Game.isPlayerActive = function(playerId) {
  var inserts = [this.id, playerId];
  var sql = 'SELECT count(*) ' +
              'FROM tbGame NATURAL JOIN tbPlayerGame NATURAL JOIN tbGame ' +
              'WHERE gId=? AND pId=? AND pgActive=TRUE';
  var inGame = Game.raw(sql, inserts);
  return inGame[0] === 1;
};

