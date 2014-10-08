angular.module('words')
.controller('WordsChoosingCtrl', [
  '$scope', '$stateParams', '$state', 'socket', 'gameState', 'wordsShareService', 'lockService',
  function($scope, $stateParams, $state, socket, gameState, wordsShareService, lockService) {

    // copy the hand, so that you don't see the new card (just before the state
    // change) when the game state is updated
    $scope.hand = _.map(gameState.custom.hand, _.clone);

    var round = _.last(gameState.custom.rounds);
    $scope.prompt = round.prompt;

    $scope.playedIndex = null;
    $scope.play = lockService.lockByGroup('ui', function(cardId, cardIndex) {
      $scope.playedIndex = cardIndex;
      var currentRound = _.last(gameState.custom.rounds);
      return socket.emitp('chooseCard', {
        round: currentRound.id,
        card: cardId
      })
      .then(function(newCard) {
        $scope.playedIndex = null;
        $scope.hand.splice(cardIndex, 1);  // trigger leave animation
        gameState.custom.hand[cardIndex] = newCard;
        var currentState = _.last($state.current.name.split("."));
        if (currentState === "choosing") {
          $state.go('^.waitingForChoices');
        }
      }, function() {
        $scope.playedIndex = null;
      });
    });

    var responseIds = _.pluck(gameState.custom.hand, 'responseId');
    $scope.shareHand = wordsShareService.hand(round.promptId, responseIds);

  }
]);
