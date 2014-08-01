angular.module('words')
.controller('WordsReadPromptCtrl', [
  '$scope', '$stateParams', 'ScopedSocket', 'gameService',
  function($scope, $stateParams, ScopedSocket, gameService) {
    var socket = new ScopedSocket($scope);

    var gameState = gameService.get();

    $scope.prompt = _.last(gameState.custom.rounds).prompt;

    $scope.doneReading = function() {
      socket.emit('doneReadingPrompt', {}, function() {
        $state.go('game.words.choosing');
      });
    };

  }
]);
