angular.module('words')
.controller('WordsScoreCtrl', [
  '$scope', '$stateParams', 'gameService',
  function($scope, $stateParams, gameService) {
    var gameState = gameService.get();

    var unsortedScore = _.forEach(gameState.players, function(p) {
      $scope.score.push({
        name: p.name,
        score: gameState.custom.score[p.id]
      });
    });

    $scope.score = _.sortBy(unsortedScore, function(s) { return s.score; });
  }
]);
