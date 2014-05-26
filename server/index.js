var config = require('./config');
var logger = require('./logger');

var path = require('path');
var Q = require('q');


// USE EXPRESS FOR SERVERING STATIC FILES
var express = require('express');
var app = express();
var server = app.listen(config.PORT);

app.use(function(request, result, next){
  logger.log('%s %s', request.method, request.url);
  next();
});
app.use('/static', express.static(__dirname + '/../public'));
app.use(function(request, result) {
  var indexPagePath = path.resolve(__dirname, '../public/index.html');
  result.sendfile(indexPagePath);
});


// USE SOCKETS FOR EVERYTHING ELSE
var socket = require('socket.io');
var io = socket.listen(server);
var models = require('./join/models');

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

  function requirePlayer() {
    return Q.fcall(function() {
      return player.id;
    });
  }

  function requireStartingPlayer() {
    return Q.fcall(function() {
      return player.id === game.createdBy;
    });
  }

  function requirePlayerInGame() {
    return Q.fcall(function() {
      return game.isPlayerActive(player.id);
    });
  }

  function requireValidPlayerName(data) {
    return Q.fcall(function() {
      var name = data.playerName;
      return name instanceof String && name.length >= 1;
    });
  }

  function createPlayer(data, acknowledge) {
    requireValidPlayerName(data)
    .then(function() {
      player = new models.Player({name: data.playerName});
      return player.save()
      .then(function() {
        acknowledge(player);
      });
    })
    .fail(function(error) {
      logger.error(error);
      acknowledge({error: "Unable to create player"});
    });
  }

  function createGame(data, acknowledge) {
    requirePlayer()
    .then(function() {
      var game = new models.Game({name: data.gameName, createdBy: player.id});
      return game.save()
      .then(function() {
        socket.broadcast.emit('gameOpen', game);
        joinGame(game.id, acknowledge);
      });
    })
    .fail(function(error) {
      logger.error(error);
      acknowledge({error: "Unable to create game"});
    });
  }

  function startGame(data, acknowledge) {
    requireStartingPlayer()
    .then(function() {
      return game.close()
      .then(function() {
        socket.broadcast.emit('gameClosed', game);
        socket.broadcast.to(game.id).emit('gameStart', true);
        acknowledge();
      });
    })
    .fail(function(error) {
      logger.error(error);
      acknowledge({error: "Unable to start game"});
    });
  }

  function getOpenGames(data, acknowledge) {
    models.Game.queryOpen()
    .then(function(games) {
      acknowledge(games);
    })
    .fail(function(error) {
      logger.error(error);
      acknowledge({error: "Unable retrieve open games"});
    });
  }

  // TODO add this to the game!
  function getGamePlayers(data, acknowledge) {
    requirePlayerInGame()
    .then(function() {
      return game.getState(player.id)
      .then(function(state) {
        acknowledge(state.players);
      });
    })
    .fail(function(error) {
      logger.error(error);
      acknowledge({error: "Unable get game players"});
    });
  }

  function joinGame(gameId, acknowledge) {
    requirePlayer()
    .then(function() {
      return models.Game.get(gameId)
      .then(function(game_) {
        game = game_;
        return player.join(game.id);
      })
      .then(function() {
        socket.join(game.id);
        socket.broadcast.to(game.id).emit('playerJoined', player);
        acknowledge(game);
      });
    })
    .fail(function(error) {
      logger.error(error);
      acknowledge({error: "Unable to join game"});
    });
  }

  function leaveGame(gameId) {
    requirePlayer()
    .then(function() {
      return player.leave(gameId)
      .then(function() {
        socket.broadcast.to(gameId).emit('playerLeft', player);
        socket.leave(gameId);
        return models.Game.get(gameId);
      })
      .then(function(game) {
        if (!game.open) {
          socket.broadcast.emit('gameClosed', game);
        }
        game = null;
      });
    })
    .fail(function(error) {
      logger.error(error);
      acknowledge({error: "Unable to leave game"});
    });
  }

  function disconnect() {
    if (player && game) {
      leaveGame(game.id);
    }
  }

});

