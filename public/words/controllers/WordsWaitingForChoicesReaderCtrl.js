angular.module('words')
.controller('WordsWaitingForChoicesReaderCtrl', [
  '$scope', '$stateParams', 'gameService',
  function($scope, $stateParams, gameService) {
    var gameState = gameService.get();

    $scope.reader = _.find(gameState.players, function(p) {
      return p.id === _.last(gameState.custom.rounds).reader;
    }).name;

  }
]);
