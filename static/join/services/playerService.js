angular.module('join')
.factory('playerService', [
  'localStorageService', 'socket', '$q', '$rootScope', 'lockService', '$modal',
  function(localStorageService, socket, $q, $rootScope, lockService, $modal) {
    var service = {};

    service.player = null;
    service.sync = lockService.inOrderByGroup('playerService', sync);
    service.syncOrNull = lockService.inOrderByGroup('playerService', syncOrNull);
    service.getOrCreate = lockService.inOrderByGroup('playerService', getOrCreate);
    service.logout = lockService.inOrderByGroup('playerService', logout);
    service.login = lockService.inOrderByGroup('playerService', login);
    service.sendPasswordReset = lockService.inOrderByGroup('playerService', sendPasswordReset);
    service.resetPassword = lockService.inOrderByGroup('playerService', resetPassword);

    return service;


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
        return sync().then(createPlayer, createPlayer);
      }
    }

    /**
     * Use locally stored session to relogin.
     */
    function sync() {
      var session = localStorageService.get('gameSession');
      if (_.isString(session)) {
        return socket.emitp('loginViaSession', {session: session})
        .then(function(response) {
          setPlayer(response.player, response.session);
          return response.player;
        }, function() {
          setPlayer(null);
          return $q.reject("Can't sync, bad response");
        });
      } else {
        return $q.reject("Can't sync, no local id");
      }
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
          setPlayer(response.player, response.session);
          return response.player;
        }
      });
    }

    function createPlayer() {
      return $modal.open({
        templateUrl: '/static/join/templates/create-player.html',
        controller: 'CreatePlayerCtrl',
      }).result
      .then(function(playerData) {
        return socket.emitp('createPlayer', playerData)
        .then(function(response) {
          setPlayer(response.player, response.session);
          return response.player;
        });
      });
    }

    function setPlayer(player, session) {
      if (_.isNull(player)) {
        service.player = null;
        localStorageService.set('gameSession', null);
      } else {
        service.player = player;
        localStorageService.set('gameSession', session);
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
      .then(function(response) {
        setPlayer(response.player, response.session);
      });
    }

  }
]);
