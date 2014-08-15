angular.module('join')
.controller('LandingCtrl', [
  '$scope', 'gameService', 'relogin',
  function($scope, gameService, relogin) {
    gameService.set(null);
    relogin();
  }
]);

