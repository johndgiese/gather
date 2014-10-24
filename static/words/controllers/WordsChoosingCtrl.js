angular.module('words')
.controller('WordsChoosingCtrl', [
  '$scope', '$stateParams', '$state', 'socket', 'gameState', 'wordsShareService', 'lockService', '$timeout', '$q',
  function($scope, $stateParams, $state, socket, gameState, wordsShareService, lockService, $timeout, $q) {

    // copy the hand, so that you don't see the new card (just before the state
    // change) when the game state is updated
    $scope.hand = _.map(gameState.custom.hand, _.clone);

    var round = _.last(gameState.custom.rounds);
    $scope.prompt = round.prompt;

    $scope.currentSelected = null;
    var confirmTimeout = null;
    $scope.playedIndex = null;
    $scope.play = lockService.lockByGroup('ui', function(cardId, cardIndex) {
      if ($scope.currentSelected !== cardIndex) {
        // on first tap, just display confirm message
        if (confirmTimeout !== null) {
          $timeout.cancel(confirmTimeout);
        }
        $scope.currentSelected = cardIndex;
        confirmTimeout = $timeout(function() {
          $scope.currentSelected = null;
          confirmTimeout = null;
        }, 2500);
        return $timeout(function() {}, 200);
      } else {
        // already tapped card once
        $scope.currentSelected = null;
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
          return $state.transition;
        })
        .then(function() {
          var currentState = _.last($state.current.name.split("."));
          if (currentState === "choosing") {
            $state.go('^.waitingForChoices');
          }
          return $state.transition;
        })
        .catch(function() {
          $scope.playedIndex = null;
        });
      }
    });

    var responseIds = _.pluck(gameState.custom.hand, 'responseId');
    $scope.shareHand = wordsShareService.hand(round.promptId, responseIds);

  }
]);
