app.controller('AppCtrl', [
  '$scope', '$state',
  function($scope, $state) {
    $scope.home = function() {
      $state.go('landing');
    }
  }
]);

