angular.module('join')
.controller('AppCtrl', [
  '$scope', 'playerService', 'socket', 'relogin',
  function($scope, playerService, socket, relogin) {
    $scope.loggedInAs = null;

    relogin()
    .then(function() {
      var player = playerService.get();
      if (player !== null) {
        $scope.loggedInAs = player.name;
      }
    });

    $scope.logout = function() {
      playerService.set(null);
      $scope.loggedInAs = null;
      socket.emit('leaveParty');
    };
  }
]);

