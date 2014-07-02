var orm = require('../../orm');
var db = require('../../db');

var fields = {
  name: 'pName'
};
var Player = orm.define('tbPlayer', fields, 'pId');
exports.Model = Player;

Player.prototype.serialize = function() {
  return {name: this.name};
};

Player.prototype.join = function(gameId) {
  var playerGameData = {
    pId: this.id,
    gId: gameId
  };
  var inserts = [playerGameData];
  return this.M.raw('INSERT tbPlayerGame SET ?', inserts)
  .then(function(result) {
    return result.insertId;  // the playerGameId
  });
};

Player.prototype.leave = function(party) {
  var inserts = [this.id, party];
  var sql = 'UPDATE tbPlayerGame SET pgActive = FALSE WHERE pId=? ' +
              'AND gId=(SELECT gId from tbGame WHERE gParty=?)';
  return this.M.raw(sql, inserts);
};

