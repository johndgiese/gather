angular.module('join')
.controller('AppCtrl', [
  '$scope', 'playerService', '$rootScope', '$state', '$modal', 'lockService',
  function($scope, playerService, $rootScope, $state, $modal, lockService) {

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

    $scope.menu = lockService.lockByGroup('ui', function() {
      return $modal.open({
        templateUrl: '/static/join/templates/menu.html',
        controller: 'MenuCtrl',
      }).result;
    });

  }
]);

