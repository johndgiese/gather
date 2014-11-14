angular.module('join')
.controller('ResetPasswordCompleteCtrl', [
  '$scope', '$stateParams',
  function($scope, $stateParams) {
    $scope.invalidCode = $stateParams.invalid;
  }
]);



