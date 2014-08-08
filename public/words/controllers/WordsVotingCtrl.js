angular.module('words')
.controller('WordsVotingCtrl', [
  '$scope', '$stateParams', '$state', 'socket', 'gameService',
  function($scope, $stateParams, $state, socket, gameService) {
    var gameState = gameService.get();

    $scope.responses = _.filter(gameState.custom.choices, function(c) {
      return c.player !== gameState.you;
    });

    var round = _.last(gameState.custom.rounds);
    $scope.prompt = round.prompt;

    $scope.vote = function(response) {
      $state.go('^.waitingForVotes');
      socket.emit('castVote', {
        card: response.card.id,
        round: round.id
      }, function() {});
    };

  }
]);
