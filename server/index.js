var express = require('express');
var socket = require('socket.io');
var path = require('path');
var Q = require('q');

var config = require('./config');
var models = require('./join/models');

var app = express();
var server = app.listen(config.PORT);
var io = socket.listen(server);


// USE EXPRESS FOR SERVERING STATIC FILES
app.use(function(request, result, next){
  console.log('%s %s', request.method, request.url);
  next();
});
app.use('/static', express.static(__dirname + '/../public'));
app.use(function(request, result) {
  var indexPagePath = path.resolve(__dirname, '../public/index.html');
  result.sendfile(indexPagePath);
});


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

  function createPlayer(data, acknowledge) {
    player = new models.Player({name: data.playerName});
    player.save()
    .then(function() {
      acknowledge(player);
    })
    .fail(function(error) {
      console.error(error);
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
      })
      .done();
    })
    .fail(function(error) {
      console.error(error);
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
      })
      .done();
    })
    .fail(function(error) {
      console.error(error);
      acknowledge({error: "Unable to start game"});
    });
  }

  function getOpenGames(data, acknowledge) {
    models.Game.getOpen()
    .then(function(games) {
      acknowledge(games);
    })
    .fail(function(error) {
      console.error(error);
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
      })
      .done();
    })
    .fail(function(error) {
      console.error(error);
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
      })
      .done();
    })
    .fail(function(error) {
      console.error(error);
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
      })
      .done();
    })
    .fail(function(error) {
      console.error(error);
      acknowledge({error: "Unable to leave game"});
    });
  }

  function disconnect() {
    if (player && game) {
      leaveGame(game.id);
    }
  }

});

