angular.module('join')
.controller('AppCtrl', [
  '$scope', 'playerService', '$rootScope', '$state', '$modal', 'menuService', 'messageService', 'sync',
  function($scope, playerService, $rootScope, $state, $modal, menuService, messageService, sync) {

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

    menuService.registerItem({
      title: 'Logout',
      action: $scope.logout,
      visible: function() { return playerService.player !== null; }
    });

  }
]);

