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
  var instance = this;
  var playerGame = {
    pId: instance.id,
    gId: gameId
  };
  var inserts = [playerGame];
  return instance.query('INSERT tbPlayerGame SET ?', inserts)
    .then(function(){
      return instance;
    });
};

Player.prototype.leave = function(gameId) {
  var inserts = [gameId, this.id];
  var sql = 'UPDATE tbPlayerGame SET pgActive = FALSE WHERE gId=? AND pId=?';
  return this.query(sql, inserts);
};

