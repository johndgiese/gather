angular.module('join')
.controller('LandingCtrl', [
  '$scope', '$state', 'playerService', 'gameService',
  function($scope, $state, playerService, gameService) {

    gameService.set(null);

    $scope.createGame = function() {
      $state.go('createGame');
    };
    
    $scope.joinGame = function() {
      $state.go('joinGame');
    };
  }
]);

