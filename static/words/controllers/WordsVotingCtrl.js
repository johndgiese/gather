angular.module('words')
.controller('WordsVotingCtrl', [
  '$scope', '$stateParams', '$state', 'socket', 'gameState', 'wordsShareService',
  function($scope, $stateParams, $state, socket, gameState, wordsShareService) {

    // shuffle the list of choices to avoid voting order bias
    $scope.responses = _.shuffle(gameState.custom.choices);
    $scope.you = gameState.you;

    $scope.insult = null;
    var insults = [
      "You can't vote for yourself, bitch.",
      "How pathetic.  You really want to vote for yourself?  Well, you can't.",
      "Don't be a loser and vote for yourself.",
      $scope.player.name + ", don't be a dick and vote for yourself.",
      "You aren't as funny as you think!",
      "You aren't allowed to pick the worst answer.",
    ];
    insultCount = 0;

    function getNextInsult(oldInsult) {
      insultCount++;
      if (insultCount === 5) {
        return "You will crash the server if you try again!";
      } else if (insultCount === 6) {
        return "Crashing!!!!";
      } else if (insultCount === 7) {
        return "Ok, I was just kidding, but really you can not vote for yourself.";
      } else {
        var newInsult;
        do {
          newInsult = _.sample(insults);
        } while (newInsult === oldInsult);
        return newInsult;
      }
    }

    var round = _.last(gameState.custom.rounds);
    $scope.prompt = round.prompt;

    $scope.vote = function(response) {
      if (response.player === gameState.you) {
        $scope.insult = getNextInsult($scope.insult);
      } else {
        $state.go('^.waitingForVotes');
        socket.emit('castVote', {
          card: response.card.id,
          round: round.id
        }, function() {});
      }
    };

    var responseIds = _.pluck(_.pluck($scope.responses, 'card'), 'responseId');
    $scope.shareGroupchoices = wordsShareService.groupchoices(round.promptId, responseIds);

  }
]);
