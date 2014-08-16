angular.module('join')
.factory('relogin', [
  'playerService', 'socket', '$q', 
  function(playerService, socket, $q) {

    var alreadyAttempting = false;

    return function(force) {
      // login to an anonymous player session automatically this ensures that the
      // disconnects and page refreshes don't create a new player
      var player = playerService.get();

      var playerId = parseInt(localStorage.getItem('playerId'));
      if ((player === null || force ) && !_.isNaN(playerId) && !alreadyAttempting) {
        alreadyAttempting = true;
        var deferred = $q.defer();
        socket.emit('login', {id: playerId}, function(player) {
          if (player._error === undefined) {
            playerService.set(player);
            deferred.resolve();
          } else {
            playerService.set(null);  // the player must be bad
            deferred.reject(player._error);
          }
          alreadyAttempting = false;
        });
        return deferred.promise;
      } else {
        return $q.when({});
      }
    };
  }
]);
