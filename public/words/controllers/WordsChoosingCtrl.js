angular.module('words')
.controller('WordsChoosingCtrl', [
  '$scope', '$stateParams', '$state', 'ScopedSocket', 'gameService',
  function($scope, $stateParams, $state, ScopedSocket, gameService) {
    var socket = new ScopedSocket($scope);
    var gameState = gameService.get();

    $scope.hand = gameState.custom.hand;

    $scope.prompt = _.last(gameState.custom.rounds).prompt;

    $scope.play = function(cardId, handIndex) {
      var currentRound = _.last(gameState.custom.rounds);
      socket.emit('chooseCard', {
        round: currentRound.id,
        card: cardId
      }, function(newCard) {
        // TODO: handle errors
        console.log(newCard);
        gameState.custom.hand[handIndex] = newCard;
        $state.go('^.waitingForChoices');
      });
    };

  }
]);
