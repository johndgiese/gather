angular.module('words')
.controller('WordsScoreCtrl', [
  '$scope', '$stateParams', 'gameService',
  function($scope, $stateParams, gameService) {
    console.log("in word score ctrl");
    var gameState = gameService.get();

    $scope.score = gameState.custom.score;
  }
]);
