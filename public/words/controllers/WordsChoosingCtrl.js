angular.module('words')
.controller('WordsChoosingCtrl', [
  '$scope', '$stateParams', 'ScopedSocket', 'gameService',
  function($scope, $stateParams, ScopedSocket, gameService) {
    var socket = new ScopedSocket($scope);
    var gameState = gameService.get();

    $scope.hand = gameState.custom.hand;

    $scope.play = function(cardId, handIndex) {
      var currentRound = _.last(gameState.custom.rounds);
      socket.emit('cardChoosen', {
        round: currentRound.id,
        card: cardId
      }, function(newCard) {
        // TODO: handle errors
        gameState.custom.hand[handIndex] = newCard;
        $state.go('game.words.waitingForChoices');
      });
    };

  }
]);
