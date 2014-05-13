app.controller('CreatePlayerCtrl', [
  '$scope', '$state', 'playerService', 'Socket',
  function($scope, $state, playerService, Socket) {
    var socket = new Socket($scope);

    $scope.playerName = "";

    $scope.createPlayer = function() {
      socket.emit('createPlayer', {
        playerName: $scope.playerName,
      }, function(player) {
        playerService.set(player);
        $state.go('search');
      });
    };

    $scope.cancel = function() {
      $state.go('landing');
    };

  }
]);

