var models = require('./models');
var _ = require('underscore');
var logger = require('../logger');
var Q = require('Q');

exports.setup = function(socket) {

  // connection level state
  var player = null;
  var game = null;
  var playerGameIds = [];

  socket.on('createPlayer', createPlayer);
  socket.on('createGame', createGame);
  socket.on('joinGame', joinGame);
  socket.on('leaveGame', leaveGame);
  socket.on('startGame', startGame);

  socket.on('getGamePlayers', getGamePlayers);
  socket.on('getOpenGames', getOpenGames);

  socket.on('disconnect', disconnect);

  function requirePlayer(playerId) {
    return Q.fcall(function() {
      console.log(playerId);
      console.log(player.id);
      return playerId !== null && playerId === player.id;
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

  function requireValidPlayerName(name) {
    return Q.fcall(function() {

      var validName = _.isString(name) && name.length >= 1 && name.length <= 100;

      if (!validName) {
        throw new Error("Invalid nickname");
      } else {
        return true;
      }
    });
  }

  function createPlayer(nickname, acknowledge) {
    requireValidPlayerName(nickname)
    .then(function() {
      player = new models.Player({name: nickname});
      return player.save()
      .then(function() {
        acknowledge(player);
      });
    })
    .fail(function(error) {
      logger.error(error);
      acknowledge({_error: "Unable to create player"});
    });
  }

  function createGame(playerId, acknowledge) {
    requirePlayer(playerId)
    .then(function() {
      game = new models.Game({createBy: playerId});
      return game.save()
      .then(function() {
        joinGame(game.id, acknowledge);
      });
    })
    .fail(function(error) {
      logger.error(error);
      acknowledge({_error: "Unable to create game"});
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
      acknowledge({_error: "Unable to start game"});
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
      acknowledge({_error: "Unable to join game"});
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

};
