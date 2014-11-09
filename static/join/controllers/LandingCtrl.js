angular.module('join')
.controller('LandingCtrl', [
  '$scope', 'playerService', 
  function($scope, playerService) {
    $scope.login = function() {
      playerService.login();
    };
  }
]);

