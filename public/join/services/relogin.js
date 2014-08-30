angular.module('join')
.factory('relogin', [
  'playerService', 'socket', '$q', 'localStorageService', 'gameService',
  function(playerService, socket, $q, localStorageService, gameService) {

    var alreadyAttempting = false;

    return function(force) {
      gameService.set(null);
    };

    // TODO: figure out how to improve socket state
  }
]);
