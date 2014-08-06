angular.module('words')
.controller('WordsWaitingForChoicesCtrl', [
  '$scope', '$stateParams', 'gameService',
  function($scope, $stateParams, gameService) {
    var gameState = gameService.get();

    $scope.choices = gameState.custom.choices;
    $scope.waitingFor = [];
    $scope.$watch('choices.length', function() {
      // TODO: optimize this
      var alreadyChoice = _.pluck(gameState.custom.choices, 'id');
      $scope.waitingFor = _.filter(gameState.players, function(p) {
        return !_.contains(alreadyChoice, p.id);
      });
    });

  }
]);
