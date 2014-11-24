angular.module('join')
.factory('playerService', [
  'localStorageService', 'socket', '$q', '$rootScope', 'lockService', '$modal',
  function(localStorageService, socket, $q, $rootScope, lockService, $modal) {
    var service = {};

    service.player = null;
    service.sync = lockService.inOrderByGroup('playerService', sync);
    service.syncOrNull = lockService.inOrderByGroup('playerService', syncOrNull);
    service.getOrCreate = lockService.inOrderByGroup('playerService', getOrCreate);
    service.getOrCreateFull = lockService.inOrderByGroup('playerService', getOrCreateFull);
    service.logout = lockService.inOrderByGroup('playerService', logout);
    service.login = lockService.inOrderByGroup('playerService', login);
    service.sendPasswordReset = lockService.inOrderByGroup('playerService', sendPasswordReset);
    service.resetPassword = lockService.inOrderByGroup('playerService', resetPassword);

    return service;

    /**
     * Use locally stored session to relogin.
     */
    function sync() {
      var session = localStorageService.get('gameSession');
      if (_.isString(session)) {
        return socket.emitp('loginViaSession', {session: session})
        .then(setPlayer, function() {
          setPlayer(null);
          return $q.reject("Can't sync, bad response");
        });
      } else {
        return $q.reject("Can't sync, no local id");
      }
    }

    function syncOrNull() {
      if (service.player !== null) {
        return $q.when(service.player);
      } else {
        return sync().catch(function() {
          return null;
        });
      }
    }

    /**
     * Return promise for the player object, obtained by relogging-in using
     * player id in localstorage, if no id, or if the relogin fails, ask for
     * player to create a player.  Rejects the prompise if player cancels the
     * create player.
     */
    function getOrCreate() {
      if (service.player !== null) {
        return $q.when(service.player);
      } else {
        return sync().catch(createPlayer);
      }
    }

    /**
     * Get or create a player; if player exists, ensure it is a "fully filled
     * out" player.
     */
    function getOrCreateFull() {
      var existingPlayerPromise;
      if (service.player !== null) {
        existingPlayerPromise = $q.when(service.player);
      } else {
        existingPlayerPromise = sync();
      }

      return existingPlayerPromise
      .then(function(player) {
        if (service.player.email !== null) {
          return $q.when(player);
        } else {
          return createPlayerFull(service.player);
        }
      }, function() {
          return createPlayerFull();
      });
    }

    function logout() {
      setPlayer(null);
      return socket.emitp('logout', {});
    }


    /**
     * Open a modal that will login the player.
     */
    function login() {
      return $modal.open({
        templateUrl: '/static/join/templates/login.html',
        controller: 'LoginCtrl',
        backdrop: 'static',  // would be annoying to accidentally close
        resolve: {
          login: function() { return makeLoginCall; },
          sendPasswordReset: function() { return sendPasswordReset; },
        }
      }).result;
    }

    /**
     * Actually make the request and set the state properly.
     */
    function makeLoginCall(email, password) {
      return socket.emitp('loginViaCredentials', {email: email, password: password})
      .then(function(response) {
        if (response.player === undefined) {
          return $q.reject(response);  // should be "email" or "password"
        } else {
          return setPlayer(response);
        }
      });
    }

    /**
     * Create a simple player (not fully registered with email/password)
     * @returns {Promise<Player>}
     */
    function createPlayer() {
      return $modal.open({
        templateUrl: '/static/join/templates/create-player.html',
        controller: 'CreatePlayerCtrl',
      }).result
      .then(function(playerData) {
        return socket.emitp('createPlayer', playerData)
        .then(setPlayer);
      }, function(reason) {
        if (reason === "logging in instead") {
          return login();
        } else {
          return $q.reject(reason);
        }
      });
    }

    /**
     * Create a fully registered player, or finish registering a partially registered on.
     * @returns {Promise<Player>}
     */
    function createPlayerFull(existingPlayer) {
      existingPlayer = existingPlayer ? existingPlayer : null;
      return $modal.open({
        templateUrl: '/static/join/templates/create-player-full.html',
        controller: 'CreatePlayerFullCtrl',
        resolve: {
          existingPlayer: function() { return existingPlayer; },
        }
      }).result
      .then(function(playerData) {
        return socket.emitp(existingPlayer === null ? 'createPlayer' : 'updatePlayer', playerData)
        .then(setPlayer);
      }, function(reason) {
        if (reason === "logging in instead") {
          return login();
        } else {
          return $q.reject(reason);
        }
      });
    }

    function setPlayer(data) {
      if (_.isNull(data)) {
        service.player = null;
        localStorageService.set('gameSession', null);
        return null;
      } else {
        service.player = data.player;
        localStorageService.set('gameSession', data.session);
        return service.player;
      }
    }

    function sendPasswordReset(email) {
      return socket.emitp('sendPasswordResetEmail', {email: email});
    }

    function resetPassword(playerId, token, newPassword) {
      return socket.emitp('resetPassword', {
        playerId: playerId,
        token: token,
        newPassword: newPassword
      })
      .then(setPlayer);
    }

  }
]);
