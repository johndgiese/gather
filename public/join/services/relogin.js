angular.module('join')
.factory('relogin', [
  'playerService', 'socket', '$q', 'localStorageService',
  function(playerService, socket, $q, localStorageService) {

    var alreadyAttempting = false;

    // TODO: figure out how to improve socket state
  }
]);
