angular.module('join')
.controller('AppCtrl', [
  '$scope', 'playerService', '$rootScope', '$state', '$modal',
  function($scope, playerService, $rootScope, $state, $modal) {

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

    $scope.menu = function() {
      return $modal.open({
        templateUrl: '/static/join/templates/menu.html',
        controller: 'MenuCtrl',
      });
    };

  }
]);

