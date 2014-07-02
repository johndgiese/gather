angular.module('join')
.controller('CreateGameCtrl', [
  '$scope', '$state', 'ScopedSocket', 'playerService', 'gameService', 'stateStack',
  function($scope, $state, ScopedSocket, playerService, gameService, stateStack) {
    var socket = new ScopedSocket($scope);

    var player = playerService.get();
    if (player === null) {
      stateStack.push('createGame');
      $state.go('createPlayer');
    } else {
      socket.emit('createGame', {}, function(gameState) {
        gameService.set(gameState);
        $state.go('staging', {hash: gameState.game.hash});
      });
    }

  }
]);

