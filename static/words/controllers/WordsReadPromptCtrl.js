angular.module('words')
.controller('WordsReadPromptCtrl', [
  '$scope', '$stateParams', '$state', 'socket', 'gameState', 'lockService',
  function($scope, $stateParams, $state, socket, gameState, lockService) {

    $scope.prompt = _.last(gameState.custom.rounds).prompt;

    $scope.doneReading = lockService.lockByGroup('ui', function() {
      return socket.emitp('doneReadingPrompt', {})
      .then(function() {
        $state.go('^.choosing');
      });
    });

  }
]);
