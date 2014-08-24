angular.module('words')
.controller('WordsVotingCtrl', [
  '$scope', '$stateParams', '$state', 'socket', 'gameService', 'playerService',
  function($scope, $stateParams, $state, socket, gameService, playerService) {
    var gameState = gameService.get();
    var playerName = playerService.get().name;

    // shuffle the list of choices to avoid voting order bias
    $scope.responses = _.shuffle(gameState.custom.choices);
    $scope.you = gameState.you;

    $scope.insult = null;
    var insults = [
      "You can't vote for yourself, bitch.",
      "How pathetic.  You really want to vote for yourself?  Well, you can't.",
      "Don't be a loser and vote for yourself.",
      playerName + ", don't be a dick and vote for yourself."
    ];

    var round = _.last(gameState.custom.rounds);
    $scope.prompt = round.prompt;

    $scope.vote = function(response) {
      if (response.player === gameState.you) {
        $scope.insult = _.sample(insults);
      } else {
        $state.go('^.waitingForVotes');
        socket.emit('castVote', {
          card: response.card.id,
          round: round.id
        }, function() {});
      }
    };

  }
]);
