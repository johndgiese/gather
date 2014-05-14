angular.module('join')
.controller('CreatePlayerCtrl', [
  '$scope', '$state', 'playerService', 'ScopedSocket',
  function($scope, $state, playerService, ScopedSocket) {
    var socket = new ScopedSocket($scope);

    $scope.playerName = "";

    $scope.createPlayer = function() {
      socket.emit('createPlayer', {
        playerName: $scope.playerName,
      }, function(player) {
        playerService.set(player);
        $state.go('search');
      });
    };

  }
]);

