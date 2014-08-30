angular.module('words')
.controller('WordsWaitingForChoicesReaderCtrl', [
  '$scope', '$stateParams', 'gameState',
  function($scope, $stateParams, gameState) {

    $scope.reader = _.find(gameState.players, function(p) {
      return p.id === _.last(gameState.custom.rounds).reader;
    }).name;

  }
]);
