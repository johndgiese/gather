angular.module('join')
.factory('playerService', [
  'localStorageService', 
  function(localStorageService) {
    var service = {};

    var player = null;

    service.get = function() {
      return player;
    };

    service.set = function(val) {
      player = val;
      if (player && _.isNumber(player.id)) {
        localStorageService.set('playerId', player.id);
      } else {
        localStorageService.set('playerId', null);
      }
    };

    service.unset = function() {
      service.set(null);
    };

    return service;
  }
]);
