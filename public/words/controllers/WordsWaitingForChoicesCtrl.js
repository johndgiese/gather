angular.module('words')
.controller('WordsWaitingForChoicesCtrl', [
  '$scope', '$stateParams', 'gameService',
  function($scope, $stateParams, gameService) {
    var gameState = gameService.get();

    $scope.players = gameState.players;
    $scope.choices = gameState.custom.choices;
    $scope.waitingFor = [];
    $scope.$watch('players.length', updateWaitingFor);
    $scope.$watch('choices.length', updateWaitingFor);

    function updateWaitingFor() {
      var alreadyChose = _.pluck(gameState.custom.choices, 'player');
      $scope.waitingFor = _.filter(gameState.players, function(p) {
        return !_.contains(alreadyChose, p.id);
      });
    }

  }
]);
