angular.module('join')
.controller('MenuCtrl', [
  '$scope', '$modalInstance', 'menuService', 'playerService',
  function($scope, $modalInstance, menuService, playerService) {
    $scope.player = playerService.player;
    $scope.menu = menuService.currentItems();
  }
]);


