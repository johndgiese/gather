angular.module('words')
.controller('WordsReadPromptCtrl', [
  '$scope', '$stateParams', '$state', 'socket', 'gameState',
  function($scope, $stateParams, $state, socket, gameState) {

    $scope.prompt = _.last(gameState.custom.rounds).prompt;

    $scope.doneReading = function() {
      socket.emit('doneReadingPrompt', {}, function() {
        $state.go('^.choosing');
      });
    };

  }
]);
