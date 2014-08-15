angular.module('join')
.factory('relogin', [
  'playerService', 'socket', '$q', 
  function(playerService, socket, $q) {

    return function(force) {
      // login to an anonymous player session automatically this ensures that the
      // disconnects and page refreshes don't create a new player
      var player = playerService.get();

      var playerId = parseInt(localStorage.getItem('playerId'));
      if ((player === null || force ) && !_.isNaN(playerId)) {
        var deferred = $q.defer();
        socket.emit('login', {id: playerId}, function(player) {
          playerService.set(player);
          deferred.resolve();
        });
        return deferred.promise;
      } else {
        return $q.when({});
      }
    };
  }
]);
