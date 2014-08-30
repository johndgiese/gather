angular.module('join')
.factory('playerService', [
  'localStorageService', 'socket', '$q', '$rootScope', 'lockService',
  function(localStorageService, socket, $q, $rootScope, lockService) {
    var service = {};

    service.player = null;
    service.get = getPlayer;
    service.loginOrCreate = loginOrCreate;
    service.logout = logout;

    sync();

    return service;

    function getPlayer() {
      if (service.player !== null) {
        return $q.when(service.player);
      } else {
        return loginOrCreate();
      }
    }

    /**
     * Return promise for the player object, obtained by relogging-in using
     * player id in localstorage, if no id, or if the relogin fails, ask for
     * player to create a player.  Rejects the prompise if player cancels the
     * create player.
     */
    // TODO: also allow players to log back in
    function loginOrCreate() {
      return sync().catch(createPlayer);
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
      socket.emit('logout', {}, function() {});
    }

    function createPlayer() {
      // TODO: create modal that gets a player name
      return $q.when({name: 'testing'})
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
