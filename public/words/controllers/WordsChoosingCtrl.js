angular.module('words')
.controller('WordsChoosingCtrl', [
  '$scope', '$stateParams', '$state', 'socket', 'gameService',
  function($scope, $stateParams, $state, socket, gameService) {
    var gameState = gameService.get();

    $scope.hand = gameState.custom.hand;

    $scope.prompt = _.last(gameState.custom.rounds).prompt;

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

  }
]);
