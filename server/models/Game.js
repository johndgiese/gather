var Model = require('../orm').Model;

exports.model = Game;

function Game(name) {
  this.name = name;
}

var fields = ['name', 'created_by'];
Game.prototype = new Model('tb_game', fields);
