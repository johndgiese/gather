angular.module('words')
.controller('WordsScoreCtrl', [
  '$scope', '$stateParams', 'gameService',
  function($scope, $stateParams, gameService) {
    var gameState = gameService.get();

    $scope.score = gameState.custom.score;
  }
]);
