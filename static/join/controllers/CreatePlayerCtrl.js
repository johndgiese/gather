angular.module('join')
.controller('CreatePlayerCtrl', [
  '$scope', '$modalInstance', '$state', 'nicknameService',
  function($scope, $modalInstance, $state, nicknameService) {

    $scope.currentState = $state.current.name;

    $scope.p = {};
    $scope.p.name = nicknameService();
    $scope.validNickname = true;
    $scope.$watch('p.name', function() { $scope.validNickname = $scope.p.name.length >= 3; });

    $scope.createPlayer = function() {
      $modalInstance.close({name: $scope.p.name});
    };

  }
]);

