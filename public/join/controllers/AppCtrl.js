angular.module('join')
.controller('AppCtrl', [
  '$scope', 'playerService', '$rootScope', '$state',
  function($scope, playerService, $rootScope, $state) {

    $scope.player = playerService.player;
    $scope.$watch(function() {
      return playerService.player; 
    }, function() {
      $scope.player = playerService.player;
    });

    $scope.logout = function() {
      playerService.logout();
      $state.go('app.landing');
    };

    $rootScope.$on('$stateChangeError', 
      function(event, toState, toParams, fromState, fromParams, error) {
        console.log(event);
        console.log(toState);
        console.log(toParams);
        console.log(fromState);
        console.log(fromParams);
        console.log(error);
      }
    );
  }
]);

