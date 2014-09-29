angular.module('join')
.controller('JoinGameCtrl', [
  '$scope', '$stateParams',
  function($scope, $stateParams) {
    $scope.party = "";
    $scope.invalidCode = $stateParams.invalid;
  }
]);

