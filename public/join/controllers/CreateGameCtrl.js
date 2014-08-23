angular.module('join')
.controller('CreateGameCtrl', [
  '$scope', '$state', 'ScopedSocket', 'playerService', 'gameService', 'stateStack',
  function($scope, $state, ScopedSocket, playerService, gameService, stateStack) {
    var socket = new ScopedSocket($scope);

    var player = playerService.get();
    var gameState = gameService.get();
    if (player === null) {
      stateStack.push({name: 'createGame'});
      $state.go('createPlayer');
    } else if (gameState === null) {
      // move on to the next state
      // eventually game setup code will go here
      socket.emit('createGame', {type: 'words'}, function(data) {
        $state.go('game', {party: data.party});
      });
    } else {
      // they must have already made a game and are going backwards
      $state.go('landing');
    }

  }
]);

