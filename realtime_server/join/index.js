var _ = require('underscore');
var Q = require('q');
var validator = require('validator');
var util = require('util');

var models = require('./models');
var logger = require('../logger');
var db = require('../db');
var debug = require('debug')('gather:join');
var transaction = require('../transaction');
var session = require('./session');
var config = require('../config');
var auth = require('./auth');

// a month
var SESSION_LENGTH = 1000*60*60*24*31;

function createSession(player) {
  return session.generateSession(config.SECRET, player.id, SESSION_LENGTH);
}

function playerIdFromSession(sessionStr) {
  return session.secureIdFromSession(config.SECRET, sessionStr);
}


exports.setup = function(socket) {

  // null if no player has been created or logged into
  var player = null;

  // null --> the player isn't in a party
  // not null --> player may or may not be in a party
  // i.e. these values are NOT explicitly nulled upon leaving a game
  var party, playerGameId, game, gameCleanup;

  function clearPartyState() {
    if (_.isFunction(gameCleanup)) {
      gameCleanup();
    }
    gameCleanup = null;
    party = null;
    playerGameId = null;
    game = null;
  }

  clearPartyState();

  socket.on('loginViaCredentials', loginViaCredentials);
  socket.on('loginViaSession', loginViaSession);
  socket.on('logout', logout);
  socket.on('createPlayer', createPlayer);
  socket.on('createGame', createGame);
  socket.on('joinGame', joinGame);
  socket.on('leaveGame', leaveGame);
  socket.on('disconnect', disconnect);
  socket.on('kickPlayer', kickPlayer);
  socket.on('startGame', startGame);

  // TODO: make these "ideal" functions by passing in the "socket state",
  // instead of creating closures for each socket; will save on memory and be
  // easier to understand
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
    var validName = _.isString(name) && name.length >= 3 && name.length <= 100;
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

  /**
   * Require the game's master (for now this is just the master).
   */
  function requireGameMaster() {
    if (game.master !== playerGameId) {
      throw new Error("Must be the games master");
    }
  }

  /**
   * Create a new player and attach it to the socket.
   */
  function createPlayer(data, acknowledge) {
    Q.fcall(function() {
      requireNoPlayer();
      requireValidPlayerName(data.name);
    })
    .then(function() {

      if (false) {
        // TODO: handle email/password creation
        if (!validator.isEmail(data.email)) {
          throw new Error("Invalid email address");
        }
        if (!validator.isLength(data.password, 6)) {
          throw new Error("Password is too short");
        }
      }

      return new models.Player({
        name: data.name,
        lastLogin: new Date(),
        email: data.email || null,
      })
      .save()
      .then(function(player_) {
        player = player_;
        acknowledge({
          player: player.forApi(),
          session: createSession(player),
        });
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
  function loginViaSession(data, acknowledge) {
    Q.fcall(function() {
      var playerId = playerIdFromSession(data.session);
      if (playerId === null) {
        throw new Error('Invalid session');
      } else {
        return playerId;
      }
    })
    .then(function(playerId) {
      return models.Player.queryOneId(playerId)
      .then(function(player_) {
        player = player_;
        acknowledge({
          player: player.forApi(),
          session: createSession(player),
        });
      });
    })
    .fail(function(error) {
      logger.error(error);
      acknowledge({_error: "Unable to login"});
    });
  }

  /**
   * Login a player, given the player's email and password.
   */
  function loginViaCredentials(data, acknowledge) {
    Q.fcall(function() {
      requireNoPlayer();
    })
    .then(function() {
      return auth.checkPassword(data.email, data.password);
    })
    .then(function(valid) {
      if (valid === "good") {
        return models.Player.queryOneEmail(data.email)
        .then(function(player_) {
          player = player_;
          acknowledge({
            player: player.forApi(),
            session: createSession(player),
          });
        });
      } else if (valid === "password") {
        acknowledge("password");
      } else {
        acknowledge("email");
      }
    })
    .fail(function(error) {
      logger.error(error);
      acknowledge({_error: "Unable to login using credentials"});
    });
  }

  /**
   * Logout a player based on the current socket state.  Set all associated
   * playerGameId's inactive.
   */
  function logout(data, acknowledge) {
    Q.fcall(function() {
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
      requirePlayer();
      requireGameOwnership(data.type);
    })
    .then(function() {
      var game = new models.Game({createdBy: player.id, type: data.type});
      //if (party !== null) {
        //game.party = party;
      //}
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
      requirePlayer();
    })
    .then(function() {
      // TODO: add throttling to help prevent people from joining other
      // people's parties by guessing the party code
      // TODO: make this more efficient for the person making the game (who
      // already has the game reference)
      clearPartyState();

      var broadcast;
      return models.Game.queryByParty(data.party)
      .then(transaction.inOrderByGroup(data.party, function(game_) {
        game = game_;
        party = game.party;
        socket.join(game.party);
        return player.join(game.id)

        // setup listeners etc. for the appropriate game module
        .then(function(data) {
          playerGameId = data.playerGameId;
          broadcast = data.broadcast;
          var promise;
          if (player.id === game.createdBy) {
            game.master = playerGameId;
            promise = game.save();
          } else {
            promise = Q.when();
          }
          return promise;
        })
        .then(function() {
          var gameModule = require('../' + game.type);
          return gameModule.join(socket, player, party, game, playerGameId);
        })

        // then build up the game state using custom data returned from the
        // game module setup function
        .then(function(data) {
          customGameState = data.gameState;
          gameCleanup = data.cleanup;
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
    transaction.inOrderByGroup(party, function() {
      return Q.fcall(function() {
        requireGameMaster();
        requirePlayerInParty();

        game.startedOn = new Date();
        game.startedOn.setMilliseconds(0);
        return game.save();
      })
      .then(function() {
        var gameModule = require('../' + game.type);
        return gameModule.startGame(socket, player, game);
      })
      .then(function() {
        socket.emit('gameStarted', {startedOn: game.startedOn});
        socket.broadcast.to(party).emit('gameStarted', {startedOn: game.startedOn});
        acknowledge({});
      })
      .fail(function(error) {
        logger.error(error);
        acknowledge({_error: "Unable to start game"});
      });
    })();
  }

  /**
   * Leave the current party.
   * Marks the player-game connection as inactive at the database level, and
   * clears out the socket state.
   */
  // TODO: eventually only close if is the last owener in the game
  function leaveGame(data, acknowledge) {
    transaction.inOrderByGroup(party, function() {
      return Q.fcall(function() {
        requirePlayerInParty();
        return removeFromGame(player, playerGameId);
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
    })();
  }


  function disconnect() {
    if (playerGameId !== null && party !== null) {
      socket.broadcast.to(party).emit('playerDisconnected', {player: playerGameId});
    }
  }

  function kickPlayer(data, acknowledge) {
    transaction.inOrderByGroup(party, function() {
      return Q.fcall(function() {
        requireGameMaster();
        // TODO: require playerGame is active
        // TODO: require the playerGame is in the current party!
      })
      .then(function() {
        var kickedPlayerGameId = data.player;
        return models.Player.queryFromPlayerGameId(kickedPlayerGameId)
        .then(function(kickedPlayer) {
          return removeFromGame(kickedPlayer, kickedPlayerGameId);
        })
        .then(function() {
          acknowledge({});
        });
      })
      .fail(function(error) {
        logger.error(error);
        acknowledge({_error: "Unable to kick player"});
      });
    })();
  }

  function removeFromGame(kickedPlayer, kickedPlayerGameId) {
    return kickedPlayer.leave(party)
    .then(function() {
      var gameModule = require('../' + game.type);
      var gameCleanupPromise = gameModule.leave(socket, kickedPlayer, party, game, kickedPlayerGameId);

      // stop the game if the master leaves
      var leavingPlayerIsMaster = game.master === kickedPlayerGameId;
      if (leavingPlayerIsMaster) {
        gameCleanupPromise = gameCleanupPromise
        .then(function(customLeaveData) {
          game.party = null;
          game.save();
          return customLeaveData;
        });
      }

      return gameCleanupPromise
      .then(function(customLeaveData) {
        var leaveData = {
          player: {
            name: kickedPlayer.name,
            id: kickedPlayerGameId
          },
          gameOver: leavingPlayerIsMaster,
          kicked: player.id !== kickedPlayer.id,
          custom: customLeaveData,
        };
        socket.emit('playerLeft', leaveData);
        socket.broadcast.to(party).emit('playerLeft', leaveData);
      });
    });
  }

};
