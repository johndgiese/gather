angular.module('words')
.controller('WordsWaitingForPromptReaderCtrl', [
  '$scope', '$stateParams', 'gameState',
  function($scope, $stateParams, gameState) {

    updateReader();
    $scope.$watch(readerId, updateReader);

    function readerId() {
      return _.last(gameState.custom.rounds).reader;
    }
      
    function updateReader() {
      $scope.reader = _.find(gameState.players, function(p) {
        return p.id === _.last(gameState.custom.rounds).reader;
      });
    }

  }
]);
