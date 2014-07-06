angular.module('join')
.controller('LandingCtrl', [
  '$scope', 'gameService',
  function($scope, gameService) {
    gameService.set(null);
  }
]);

