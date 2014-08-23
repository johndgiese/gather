angular.module('join')
.controller('LandingCtrl', [
  '$scope', 'gameService', 'relogin', 'playerService',
  function($scope, gameService, relogin, playerService) {
    gameService.set(null);
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
    };
  }
]);

