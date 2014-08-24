angular.module('join')
.controller('AppCtrl', [
  '$scope', 'gameService',
  function($scope, gameService) {
    gameService.set(null);
  }
]);

