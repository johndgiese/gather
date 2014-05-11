var Model = require('../orm').Model;

exports.model = Player;

function Player(name) {
  this.name = name;
}

var fields = ['name'];
Player.prototype = new Model('tb_player', fields);
