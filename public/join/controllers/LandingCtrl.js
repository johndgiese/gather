angular.module('join')
.controller('LandingCtrl', [
  '$scope', 'playerService', 'socket', 'relogin', 'gameService',
  function($scope, playerService, socket, relogin, gameService) {
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
      socket.emit('logout', {}, function() {});
    };
  }
]);

