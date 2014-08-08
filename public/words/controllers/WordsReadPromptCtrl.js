angular.module('words')
.controller('WordsReadPromptCtrl', [
  '$scope', '$stateParams', '$state', 'socket', 'gameService',
  function($scope, $stateParams, $state, socket, gameService) {
    var gameState = gameService.get();

    $scope.prompt = _.last(gameState.custom.rounds).prompt;

    $scope.doneReading = function() {
      socket.emit('doneReadingPrompt', {}, function() {
        $state.go('^.choosing');
      });
    };

  }
]);
