app.controller('LandingCtrl', [
  '$scope', '$state',
  function($scope, $state) {
    $scope.createGame = function() {
      $state.go('create');
    };

    $scope.searchForGames = function() {
      $state.go('search');
    };
  }
]);

