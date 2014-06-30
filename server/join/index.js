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
  socket.on('leaveGame', leaveGame);

  //socket.on('startGame', startGame);
  //socket.on('getGameState', getGameState);

  socket.on('disconnect', disconnect);

  function requirePlayer() {
    if (player === null) {
      throw new Error('No player connected to socket');
    }
  }

  function requirePlayerInGame() {
    var playerInGame = game !== null && playerGameId !== null;
    if (!playerInGame) {
      throw new Error('Player is not in a game');
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

  function requireGameOwnership() {
    // TODO: implement accounts and payment system
    return true;
  }

  function requireStartingPlayer() {
    return player.id === game.createdBy;
  }

  /**
   * Create a new player and attach it to the socket.
   */
  function createPlayer(data, acknowledge) {
    Q.fcall(function() {
      requireNoPlayerEstablished();
      requireValidPlayerName(data.name);
    })
    .then(function() {
      var p = new models.Player({name: data.name});
      return p.save()
      .then(function() {
        player = p;
        acknowledge(p);
      });
    })
    .fail(function(error) {
      logger.error(error);
      acknowledge({_error: "Unable to create player"});
    });
  }

  /**
   * Create a new game and attach it to the socket.
   */
  function createGame(data, acknowledge) {
    Q.fcall(function() {
      requirePlayer();
      requirePlayerNotInGame();
      requireGameOwnership();
    })
    .then(function() {
      // the connection-state game reference is set in `joinGame`
      var game = new models.Game({createdBy: player.id});
      return game.save()
      .then(function() {
        joinGame({hash: game.hash}, acknowledge);
      });
    })
    .fail(function(error) {
      logger.error(error);
      acknowledge({_error: "Unable to create game"});
    });
  }

  /**
   * Join an existing game.
   * Must be called even when creating a new one; places a link between the
   * player and the game in the database, and attaches the id to this link to
   * the socket.
   */
  function joinGame(data, acknowledge) {
    return Q.fcall(function() {
      requirePlayer();
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

  //function startGame(data, acknowledge) {
    //requireStartingPlayer()
    //.then(function() {
      //return game.close()
      //.then(function() {
        //socket.broadcast.emit('gameClosed', game);
        //socket.broadcast.to(game.id).emit('gameStart', true);
        //acknowledge();
      //});
    //})
    //.fail(function(error) {
      //logger.error(error);
      //acknowledge({_error: "Unable to start game"});
    //});
  //}

  //function getGameState(data, acknowledge) {
    //requirePlayerInGame()
    //.then(function() {
      //return game.getState(player.id)
      //.then(function(state) {
        //acknowledge(state.players);
      //});
    //})
    //.fail(function(error) {
      //logger.error(error);
      //acknowledge({error: "Unable get game players"});
    //});
  //}


  /**
   * Leave the current game.
   * Marks the player-game connection as inactive at the database level, and
   * clears out the socket state.
   */
  function leaveGame() {
    Q.fcall(function() {
      requirePlayerInGame();
    })
    .then(function() {
      return player.leave(playerGameId)
      .then(function() {
        socket.broadcast.to(game.id).emit('playerLeft', player.id);
        socket.leave(game.id);
        game = null;
        playerGameId = null;
        acknowledge(true);
      });
    })
    .fail(function(error) {
      logger.error(error);
      acknowledge({_error: "Unable to leave game"});
    });
  }

  function disconnect() {
    leaveGame();
  }

};
