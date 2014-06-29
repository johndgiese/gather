var models = require('./models');
var _ = require('underscore');
var logger = require('../logger');
var Q = require('Q');
var util = require('util');

exports.setup = function(socket) {

  // null if no player has been created or logged into
  var player = null;  

  // both of these are null if player hasn't joined a game
  // for now a single connection can only be attached to one game at a time
  var game = null;
  var playerGameId = null;

  socket.on('createPlayer', createPlayer);
  socket.on('createGame', createGame);
  socket.on('joinGame', joinGame);
  socket.on('startGame', startGame);
  socket.on('leaveGame', leaveGame);

  socket.on('getGameState', getGameState);

  socket.on('disconnect', disconnect);

  function requirePlayer(playerId) {
    var validPlayer = playerId !== null && playerId === player.id;
    if (!validPlayer) {
      var msg = util.format('socket pid = %s, provided pid = %s', playerId, player.id);
      throw new Error(msg);
    }
  }

  function requirePlayerNotInGame() {
    var playerNotInGame = game === null && playerGameId === null;
    if (!playerNotInGame) {
      throw new Error('Player is already in a game');
    }
  }

  function requireNoPlayerEstablished() {
    if (player !== null) {
      throw new Error("Player already established");
    }
  }

  function requireValidPlayerName(name) {
    var validName = _.isString(name) && name.length >= 1 && name.length <= 100;
    if (!validName) {
      throw new Error("Invalid nickname");
    }
  }

  function requireGameOwnership(playerId) {
    // TODO: implement accounts and payment system
    return true;
  }

  function requireStartingPlayer() {
    return player.id === game.createdBy;
  }

  function requirePlayerInGame() {
    return game.isPlayerActive(player.id);
  }

  function createPlayer(name, acknowledge) {
    Q.fcall(function() {
      requireNoPlayerEstablished();
      requireValidPlayerName(name);
    })
    .then(function() {
      player = new models.Player({name: name});
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
    Q.fcall(function() {
      requirePlayer(playerId);
      requirePlayerNotInGame();
      requireGameOwnership(playerId);
    })
    .then(function() {
      // the connection-state game reference is set in `joinGame`
      var game = new models.Game({createdBy: playerId});
      return game.save()
      .then(function() {
        joinGame({hash: game.hash, playerId: playerId}, acknowledge);
      });
    })
    .fail(function(error) {
      logger.error(error);
      acknowledge({_error: "Unable to create game"});
    });
  }

  function joinGame(data, acknowledge) {
    Q.fcall(function() {
      requirePlayer(data.playerId);
      requirePlayerNotInGame();
    })
    .then(function() {
      return models.Game.getByHash(data.hash)
      .then(function(game_) {
        game = game_;
        return player.join(game.id);
      })
      .then(function(playerGameId_) {
        playerGameId = playerGameId_;
        socket.join(game.id);
        socket.broadcast.to(game.id).emit('playerJoined', player);
        acknowledge({game: game, playerGameId: playerGameId});
      });
    })
    .fail(function(error) {
      logger.error(error);
      acknowledge({_error: "Unable to join game"});
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

  function getGameState(data, acknowledge) {
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
