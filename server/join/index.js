var models = require('./models');
var _ = require('underscore');
var logger = require('../logger');
var Q = require('q');
var util = require('util');
var db = require('../db');
var debug = require('debug')('gather:join');
var transaction = require('../transaction');


exports.setup = function(socket) {

  // null if no player has been created or logged into
  var player = null;

  // null if the player isn't in a party
  var party, playerGameId, game;

  function clearPartyState() {
    party = null;
    playerGameId = null;
    game = null;
  }

  clearPartyState();

  socket.on('login', login);
  socket.on('logout', logout);
  socket.on('createPlayer', createPlayer);
  socket.on('createGame', createGame);
  socket.on('joinGame', joinGame);
  socket.on('leaveGame', leaveGame);
  socket.on('disconnect', disconnect);

  socket.on('startGame', startGame);

  function debugSocketState() {
    debug('socket state: player=%j, party=%s, pgId=%s, game=%j', player, party, playerGameId, game);
  }

  function requirePlayer() {
    if (player === null) {
      throw new Error('No player connected to socket');
    }
  }

  function requireNoPlayer() {
    if (player !== null) {
      throw new Error("Player already established");
    }
  }

  function requirePlayerInParty() {
    if (party === null) {
      throw new Error('Player is not in a party');
    }
  }

  function requireValidPlayerName(name) {
    var validName = _.isString(name) && name.length >= 1 && name.length <= 100;
    if (!validName) {
      throw new Error("Invalid nickname");
    }
  }

  function requireGameOwnership(gameType) {
    // TODO: implement accounts and payment system
    if (gameType == "words") {
      return true;
    } else {
      return true;
    }
  }

  function requireStartingPlayer() {
    // TODO: actually enforce this
    return true;
  }

  /**
   * Create a new player and attach it to the socket.
   */
  function createPlayer(data, acknowledge) {
    Q.fcall(function() {
      debugSocketState();
      requireNoPlayer();
      requireValidPlayerName(data.name);
    })
    .then(function() {
      return new models.Player({name: data.name})
      .save()
      .then(function(player_) {
        player = player_;
        acknowledge(player);
      });
    })
    .fail(function(error) {
      logger.error(error);
      acknowledge({_error: "Unable to create player"});
    });
  }

  /**
   * Login a player, given the player's id.
   */
  // TODO: make this more secure
  function login(data, acknowledge) {
    Q.fcall(function() {
      debugSocketState();
      requireNoPlayer();
    })
    .then(function() {
      return models.Player.queryOneId(data.id)
      .then(function(player_) {
        player = player_;
        acknowledge(player);
      });
    })
    .fail(function(error) {
      logger.error(error);
      acknowledge({_error: "Unable to login"});
    });
  }

  /**
   * Logout a player based on the current socket state.  Set all associated
   * playerGameId's inactive.
   */
  function logout(data, acknowledge) {
    Q.fcall(function() {
      debugSocketState();
      requirePlayer();
    })
    .then(function() {
      player = null;
      if (party !== null) {
        socket.leave(party);
        party = null;
        playerGameId = null;
        game = null;
      }
      acknowledge({});
    })
    .fail(function(error) {
      logger.error(error);
      acknowledge({_error: "Unable to logout"});
    });
  }

  /**
   * Create a new game and send back its party hash.
   * Note: this is separate from joining the game, which most be done separately
   * and in addition to creating it.
   * Note: if the player is already in a party, this will create the game
   * within that party, otherwise it will create a new "party".
   */
  function createGame(data, acknowledge) {
    Q.fcall(function() {
      debugSocketState();
      requirePlayer();
      requireGameOwnership(data.type);
    })
    .then(function() {
      game = new models.Game({createdBy: player.id, type: data.type});
      if (party !== null) {
        game.party = party;
      }
      return game.save()
      .then(function() {
        var gameModule = require('../' + game.type);
        return gameModule.create(game);
      })
      .then(function() {
        acknowledge({party: game.party});
      });
    })
    .fail(function(error) {
      logger.error(error);
      acknowledge({_error: "Unable to create game"});
    });
  }

  /**
   * Join the current game for a specified party.
   * Must be called even when creating a new game; places a link between the
   * player and the game in the database, and attaches the id to this link to
   * the socket.  Returns the session state.
   */
  function joinGame(data, acknowledge) {
    Q.fcall(function() {
      debugSocketState();
      requirePlayer();
    })
    .then(function() {
      // TODO: add throttling to help prevent people from joining other
      // people's parties by guessing the party code
      // TODO: teardown any listeners from previous games
      // TODO: make this more efficient for the person making the game (who
      // already has the game reference)
      clearPartyState();

      var broadcast;
      return models.Game.getByParty(data.party)
      .then(transaction.inOrderByGroup(data.party, function(game_) {
        game = game_;
        party = game.party;
        socket.join(game.party);
        return player.join(game.id)

        // setup listeners etc. for the appropriate game module
        .then(function(data) {
          playerGameId = data.playerGameId;
          broadcast = data.broadcast;
          var gameModule = require('../' + game.type);
          return gameModule.join(socket, player, party, game, playerGameId);
        })

        // then build up the game state using custom data returned from the
        // game module setup function
        .then(function(customGameState) {
          return game.getState()
          .then(function(gameState) {
            gameState.you = playerGameId;
            gameState.custom = customGameState;
            return gameState;
          });
        })

        .then(function(gameState) {
          if (broadcast) {
            socket.broadcast.to(party).emit('playerJoined', {
              name: player.name,
              id: playerGameId
            });
          }
          acknowledge(gameState);
        });
      }));
    })
    .fail(function(error) {
      logger.error(error);
      clearPartyState();
      acknowledge({_error: "Unable to join game"});
    });
  }

  /**
   * Start the current game.
   */
  function startGame(data, acknowledge) {
    Q.fcall(function() {
      debugSocketState();
      requireStartingPlayer();
      requirePlayerInParty();
    })
    .then(function() {
      game.startedOn = new Date();
      game.startedOn.setMilliseconds(0);
      game.save()
      .then(function() {
        var gameModule = require('../' + game.type);
        return gameModule.startGame(socket, player, game);
      })
      .then(function() {
        socket.emit('gameStarted', {startedOn: game.startedOn});
        socket.broadcast.to(party).emit('gameStarted', {startedOn: game.startedOn});
        acknowledge({});
      });
    })
    .fail(function(error) {
      logger.error(error);
      acknowledge({_error: "Unable to start game"});
    });
  }

  /**
   * Leave the current party.
   * Marks the player-game connection as inactive at the database level, and
   * clears out the socket state.
   */
  // TODO: eventually only close if is the last owener in the game
  function leaveGame(data, acknowledge) {
    Q.fcall(function() {
      debugSocketState();
      requirePlayerInParty();
    })
    .then(function() {
      return player.leave(party);
    })
    .then(function() {
      var gameModule = require('../' + game.type);
      var gameCleanupPromise = gameModule.leave(socket, player, party, game, playerGameId);

      // stop the game if the creator leaves
      var leavingPlayerIsCreator = game.createdBy === player.id;
      if (leavingPlayerIsCreator) {
        gameCleanupPromise = gameCleanupPromise
        .then(function(customLeaveData) {
          game.party = null;
          game.save();
          return customLeaveData;
        });
      }

      return gameCleanupPromise
      .then(function(customLeaveData) {
        socket.broadcast.to(party).emit('playerLeft', {
          player: {
            name: player.name,
            id: playerGameId
          },
          gameOver: leavingPlayerIsCreator,
          custom: customLeaveData,
        });
      });
    })
    .then(function() {
      socket.leave(party);
      party = null;
      playerGameId = null;
      game = null;
      acknowledge({});
    })
    .fail(function(error) {
      logger.error(error);
      acknowledge({_error: "Unable to leave game"});
    });
  }

  function disconnect() {
    if (playerGameId !== null && party !== null) {
      socket.broadcast.to(party).emit('playerDisconnected', {player: playerGameId});
    }
  }

};
