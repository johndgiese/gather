angular.module('words')
.controller('WordsReadPromptCtrl', [
  '$scope', '$stateParams', 'gameService',
  function($scope, $stateParams, gameService) {
    $scope.gs = gameService.get();
  }
]);
