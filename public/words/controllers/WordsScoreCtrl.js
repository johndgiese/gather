angular.module('words')
.controller('WordsScoreCtrl', [
  '$scope', '$stateParams', 'gameService',
  function($scope, $stateParams, gameService) {
    var gameState = gameService.get();

    $scope.playser = gameState.playser;
    $scope.score = [];
      
    $scope.$watch('players.length', function() {
      var rawScores = gameState.custom.score;
      var unsortedScore = [];
      _.forEach(gameState.players, function(p) {
        var match = _.find(rawScores, function(s) { return p.id == s.id; });
        var score = match && match.score;
        unsortedScore.push({'name': p.name, 'score': score || 0});
      });
      $scope.score = _.sortBy(unsortedScore, 'score');
    });
  }
]);
