angular.module('words')
.controller('WordsReadChoicesCtrl', [
  '$scope', '$stateParams', '$state', 'ScopedSocket', 'gameService',
  function($scope, $stateParams, $state, ScopedSocket, gameService) {
    var socket = new ScopedSocket($scope);
    var gameState = gameService.get();
    $scope.prompt = _.last(gameState.custom.rounds).prompt;
    $scope.responses = _.shuffle(gameState.custom.choices);
    $scope.currentResponse = 0;

    $scope.next = function() {
      $scope.currentResponse += 1;
    };

    $scope.back = function() {
      $scope.currentResponse -= 1;
    };

    $scope.done = function() {
      socket.emit('doneReadingChoices', {}, function(data) {
        $state.go('^.voting');
      });
    };
  }
]);
