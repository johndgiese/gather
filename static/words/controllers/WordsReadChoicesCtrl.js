angular.module('words')
.controller('WordsReadChoicesCtrl', [
  '$scope', '$stateParams', '$state', 'socket', 'gameState', 'lockService',
  function($scope, $stateParams, $state, socket, gameState, lockService) {
    $scope.prompt = _.last(gameState.custom.rounds).prompt;
    $scope.responses = _.shuffle(gameState.custom.choices);
    $scope.currentResponse = 0;

    $scope.next = function() {
      $scope.currentResponse += 1;
    };

    $scope.back = function() {
      $scope.currentResponse -= 1;
    };

    $scope.done = lockService.lockByGroup('ui', function() {
      return socket.emitp('doneReadingChoices', {})
      .then(function(data) {
        $state.go('^.voting');
      });
    });
  }
]);
