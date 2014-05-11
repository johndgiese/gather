var express = require('express');
var socket = require('socket.io');
var models = require('./models');

var app = express();
var server = app.listen(3000);
var io = socket.listen(server);

// use express for servering static files
app.use(function(request, result, next){
  console.log('%s %s', request.method, request.url);
  next();
});
app.use(express.static(__dirname + '/../public'));
app.get('/', function(request, result) {
  result.sendfile(__dirname + '/../public/index.html');
});

// use sockets for everything else
io.sockets.on('connection', function (socket) {
  socket.on('createPlayer', createPlayer);
  socket.on('createGame', createGame);
});

function createPlayer(data, acknowledge) {
  var player = new models.Player(data.playerName);
  player.save().then(function() {
    acknowledge({player: player});
  }, function(error) {
    acknowledge({error: error});
  });
};

function createGame(data, acknowledge) {
  var player = new models.Player(data.playerName);
  player.save().then(function() {
    acknowledge({player: player});
  }, function(error) {
    acknowledge({error: error});
  });
};

