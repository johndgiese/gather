angular.module('words')
.controller('WordsReadingChoicesCtrl', [
  '$scope', '$stateParams', '$state', 'ScopedSocket', 'gameService',
  function($scope, $stateParams, $state, ScopedSocket, gameService) {
    var socket = new ScopedSocket($scope);
    var gameState = gameService.get();
    $scope.prompt = _.last(gameState.custom.rounds).prompt;
    $scope.response = gameState.custom.choices;
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
