angular.module('join')
.controller('MenuCtrl', [
  '$scope', '$modalInstance', 'menuService',
  function($scope, $modalInstance, menuService) {

    $scope.menu = menuService.currentItems();

  }
]);


