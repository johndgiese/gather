angular.module('words')
.controller('WordsScoreCtrl', [
  '$scope', '$stateParams', 'gameService', '$interval',
  function($scope, $stateParams, gameService, $interval) {
    var gameState = gameService.get();

    $scope.roundNum = _.last(gameState.custom.rounds);
    $scope.playser = gameState.playser;
    $scope.score = [];

    var INTER_ROUND_DELAY = 7;

    $scope.countdown = INTER_ROUND_DELAY;
    $interval(function() {
      $scope.countdown = $scope.countdown - 1;
    }, 1000, INTER_ROUND_DELAY);
      
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
