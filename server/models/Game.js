var Model = require('../orm').Model;

exports.model = Game;

function Game(data) {
  var instance = this;
  this.getFields().forEach(function(field) {
    if (data[field] !== undefined) {
      instance[field] = data[field];
    }
  });
}

var fields = ['name', 'created_by', 'active_players', 'open'];
Game.prototype = new Model('tb_game', fields);

Game.prototype.getState = function(playerId) {
  var instance = this;

  var sql = 'SELECT * FROM tb_player JOIN tb_player_game ON ' + 
              'tb_player.id=tb_player_game.player_id WHERE game_id=? ' +
              'AND active=TRUE';

  return this.query(sql, [this.id])
  .then(function(players) {

    // game state currently just has players
    return {
      players: players
    };
  });

};

Game.prototype.close = function() {
  var inserts = [this.getTable(), this.id];
  return this.query('UPDATE ?? SET open=FALSE WHERE id=?', inserts);
};

Game.get = function(gameId) {
  return Game.prototype.query('SELECT * FROM tb_game WHERE id = ?', [gameId])
  .then(function(games) {
    if (games.length === 0) {
      throw new Error("No match found");
    } else if (games.length > 1) {
      throw new Error("Multiple matchs found");
    } else {
      return new Game(games[0]);
    }
  });
};

Game.getActive = function() {
  return Game.prototype.query('SELECT * FROM tb_game WHERE active_players > 0');
};

Game.getOpen = function() {
  return Game.prototype.query('SELECT * FROM tb_game WHERE open=TRUE');
};

