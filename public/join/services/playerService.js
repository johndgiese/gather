angular.module('join')
.factory('playerService', [
  'localStorageService', 'socket', '$q', '$rootScope', 'lockService', '$modal',
  function(localStorageService, socket, $q, $rootScope, lockService, $modal) {
    var service = {};

    service.player = null;
    service.syncOrNull = lockService.inOrderByGroup('lockService', syncOrNull);
    service.getOrCreate = lockService.inOrderByGroup('lockService', getOrCreate);
    service.logout = lockService.inOrderByGroup('lockService', logout);

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
        return sync().catch(
          function() {
            return createPlayer();
        });
      }
    }

    /**
     * Use locally stored playerId to relogin.
     */
    function sync() {
      var playerId = localStorageService.get('playerId');
      if (_.isNumber(playerId)) {
        return socket.emitp('login', {id: playerId})
        .then(function(player) {
          setPlayer(player);
          return player;
        }, function() {
          setPlayer(null);
          return $q.reject("Can't sync, bar response");
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
        .then(function(player) {
          setPlayer(player);
          return player;
        });
      });
    }

    function setPlayer(player) {
      if (player && _.isNumber(player.id)) {
        service.player = player;
        localStorageService.set('playerId', player.id);
      } else if (_.isNull(player)) {
        service.player = null;
        localStorageService.set('playerId', null);
      } else {
        throw new Error("invalid player object");
      }
    }

  }
]);
