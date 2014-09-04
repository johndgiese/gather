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

    $rootScope.$on('$stateChangeError', function(event, to, toParams, from, fromParams, error) {

      if (from.name === 'app.joinGame' && to.name === 'app.game') {
        return $state.go('app.joinGame', {invalid: toParams.party});
      }

      console.log("unhandled state change error: ");
      console.log(event);
      console.log(to);
      console.log(toParams);
      console.log(from);
      console.log(fromParams);
      console.log(error);

    });


  }
]);

