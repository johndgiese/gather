angular.module('words')
.controller('WordsVotingCtrl', [
  '$scope', '$stateParams', '$state', 'ScopedSocket', 'gameService',
  function($scope, $stateParams, $state, ScopedSocket, gameService) {
    var socket = new ScopedSocket($scope);
    var gameState = gameService.get();

    $scope.responses = _.filter(gameState.custom.choices, function(c) {
      return c.player !== gameState.you;
    });

    var round = _.last(gameState.custom.rounds);
    $scope.prompt = round.prompt;

    $scope.vote = function(response) {
      socket.emit('castVote', {
        card: response.card.id,
        round: round.id
      }, function() {});

      $state.go('^.waitingForVotes');
    };

  }
]);
