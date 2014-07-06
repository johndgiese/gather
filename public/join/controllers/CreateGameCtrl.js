angular.module('join')
.controller('CreateGameCtrl', [
  '$scope', '$state', 'ScopedSocket', 'playerService', 'gameService', 'stateStack',
  function($scope, $state, ScopedSocket, playerService, gameService, stateStack) {
    var socket = new ScopedSocket($scope);

    var player = playerService.get();
    if (player === null) {
      stateStack.push({name: 'createGame'});
      $state.go('createPlayer');
    } else {
      // move on to the next state
      // eventually game setup code will go here
      socket.emit('createGame', {type: 'words'}, function(data) {
        $state.go('staging', {party: data.party});
      });
    }

  }
]);

