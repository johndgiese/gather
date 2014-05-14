angular.module('join')
.controller('LandingCtrl', [
  '$scope', '$state', 'playerService', 'gameService',
  function($scope, $state, playerService, gameService) {

    gameService.set(null);

    $scope.createGame = function() {
      $state.go('createGame');
    };

    $scope.searchForGames = function() {
      if (playerService.get() === null) {
        $state.go('createPlayer');
      } else {
        $state.go('search');
      }
    };
  }
]);

