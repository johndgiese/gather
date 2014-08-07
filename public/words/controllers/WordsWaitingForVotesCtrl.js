angular.module('words')
.controller('WordsWaitingForVotesCtrl', [
  '$scope', '$stateParams', 'gameService',
  function($scope, $stateParams, gameService) {
    var gameState = gameService.get();

    $scope.votes = gameState.custom.votes;
    $scope.waitingFor = [];
    $scope.$watch('votes.length', function() {
      var alreadyChose = _.pluck(gameState.custom.votes, 'player');
      $scope.waitingFor = _.filter(gameState.players, function(p) {
        return !_.contains(alreadyChose, p.id);
      });
    });

  }
]);
