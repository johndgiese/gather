angular.module('join')
.controller('MenuCtrl', [
  '$scope', '$modalInstance', 'menuService', 'playerService', 'lockService', '$q',
  function($scope, $modalInstance, menuService, playerService, lockService, $q) {
    $scope.player = playerService.player;
    $scope.menu = menuService.currentItems();
    $scope.close = lockService.lockByGroup('menu', function() { return $q.when().then($scope.$dismiss); });
  }
]);


