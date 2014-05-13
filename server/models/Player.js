var Model = require('../orm').Model;
var db = require('../db');

exports.model = Player;

function Player(name) {
  this.name = name;
}

var fields = ['name'];
Player.prototype = new Model('tb_player', fields);

Player.prototype.serialize = function() {
  var fields = this.getFieldData();
  return fields;
};

Player.prototype.join = function(gameId) {
  var instance = this;
  var playerGame = {
    player_id: instance.id,
    game_id: gameId
  };
  var inserts = [playerGame];
  return instance.query('INSERT tb_player_game SET ?', inserts)
  .then(function(){
    return instance;
  });
};

Player.prototype.leave = function(gameId) {
  var inserts = [gameId, this.id];
  var sql = 'UPDATE tb_player_game SET active=FALSE WHERE game_id = ? AND player_id = ?';
  return this.query(sql, inserts);
};
