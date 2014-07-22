angular.module('words')
.controller('WordsCtrl', [
  '$scope', '$stateParams', 'ScopedSocket', 'gameService', 'playerService',
  function($scope, $stateParams, ScopedSocket, gameService, playerService) {
    var socket = new ScopedSocket($scope);

    var player = playerService.get();
    var gameState = gameService.get();

    socket.on('roundStarted', function(data) {
      if (data.reader === player.id) {
        $state.go('game.words.readPrompt');
      } else {
        $state.go('game.words.readPromptWait');
      }
    });

  }
]);

