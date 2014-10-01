angular.module('words')
.controller('WordsChoosingCtrl', [
  '$scope', '$stateParams', '$state', 'socket', 'gameState', 'wordsShareService',
  function($scope, $stateParams, $state, socket, gameState, wordsShareService) {

    $scope.hand = gameState.custom.hand;

    var round = _.last(gameState.custom.rounds);
    $scope.prompt = round.prompt;

    $scope.play = function(cardId, cardIndex) {
      var currentRound = _.last(gameState.custom.rounds);
      $state.go('^.waitingForChoices');
      socket.emit('chooseCard', {
        round: currentRound.id,
        card: cardId
      }, function(newCard) {
        gameState.custom.hand[cardIndex] = newCard;
      });
    };

    var responseIds = _.pluck(gameState.custom.hand, 'responseId');
    $scope.shareHand = wordsShareService.hand(round.promptId, responseIds);

  }
]);
