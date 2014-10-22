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
    // TODO: also allow players to log back in
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

    function createPlayer() {
      // TODO: create modal that gets a player name
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

  }
]);
