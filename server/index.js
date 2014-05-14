var config = require('./config');

var express = require('express');
var socket = require('socket.io');
var models = require('./models');

var app = express();
var server = app.listen(config.PORT);
var io = socket.listen(server);


// USE EXPRESS FOR SERVERING STATIC FILES
app.use(function(request, result, next){
  console.log('%s %s', request.method, request.url);
  next();
});
app.use(express.static(__dirname + '/../public'));
app.get("/new", serveSite);
app.get("/search", serveSite);
app.get("/", serveSite);

function serveSite(request, result) {
  result.sendfile(__dirname + '/../public/index.html');
}


// USE SOCKETS FOR EVERYTHING ELSE
io.sockets.on('connection', function (socket) {

  // connection level state
  var player = null;
  var game = null;

  socket.on('createPlayer', createPlayer);
  socket.on('createGame', createGame);
  socket.on('joinGame', joinGame);
  socket.on('leaveGame', leaveGame);
  socket.on('startGame', startGame);

  socket.on('getGamePlayers', getGamePlayers);
  socket.on('getOpenGames', getOpenGames);

  socket.on('disconnect', disconnect);
 
  function createPlayer(data, acknowledge) {
    player = new models.Player(data.playerName);
    player.save().then(function() {
      acknowledge(player);
    });
  }

  function createGame(data, acknowledge) {
    var game = new models.Game({name: data.gameName, created_by: player.id});
    game.save()
    .then(function() {
      socket.broadcast.emit('gameOpen', game);
      joinGame(game.id, acknowledge);
    });
  }

  function startGame(data, acknowledge) {
    game.close().then(function() {
      socket.broadcast.emit('gameClosed', game);
      socket.broadcast.to(game.id).emit('gameStart', true);
      acknowledge();
    });
  }

  function getOpenGames(data, acknowledge) {
    models.Game.getOpen()
    .then(function(games) {
      acknowledge(games);
    });
  }

  function getGamePlayers(data, acknowledge) {
    game.getState(player.id).then(function(state) {
      acknowledge(state.players);
    });
  }

  function joinGame(gameId, acknowledge) {
    models.Game.get(gameId)
    .then(function(game_) {
      game = game_;
      player.join(game.id).then(function() {
        socket.join(game.id);
        socket.broadcast.to(game.id).emit('playerJoined', player);
        acknowledge(game);
      });
    });
  }

  function leaveGame(gameId) {
    player.leave(gameId)
    .then(function() {
      socket.broadcast.to(gameId).emit('playerLeft', player);
      socket.leave(gameId);
      models.Game.get(gameId)
      .then(function(game) {
        if (!game.open) {
          socket.broadcast.emit('gameClosed', game);
        }
      });
    });
    game = null;
  }

  function disconnect() {
    if (player && game) {
      leaveGame(game.id);
    }
  }

});

