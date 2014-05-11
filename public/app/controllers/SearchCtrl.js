app.controller('SearchCtrl', [
  '$scope', '$state',
  function($scope, $state) {
    $scope.cancelSearch = function() {
      $state.go('landing');
    };
  }
]);

