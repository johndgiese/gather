angular.module('words')
.controller('WordsCtrl', [
  '$scope', '$stateParams', '$state', 'ScopedSocket', 'gameService', 'playerService',
  function($scope, $stateParams, $state, ScopedSocket, gameService, playerService) {

    var socket = new ScopedSocket($scope);

    var player = playerService.get();
    var gameState = gameService.get();

    socket.on('gameStarted', function(data) {
      gameState.game.startedOn = new Date(data.startedOn);
    });

    socket.on('roundStarted', function(data) {
      gameState.custom.choices = [];
      gameState.custom.votes = [];
      gameState.custom.rounds.push(data.round);

      if (data.round.reader === gameState.you) {
        $state.go('^.readPrompt');
      } else {
        $state.go('^.waitingForPromptReader');
      }
    });

    socket.on('readingPromptDone', function() {
      $state.go('^.choosing');
    });

    socket.on('cardChoosen', function(data) {
      gameState.custom.choices.push(data);
    });

    socket.on('choosingDone', function(data) {
      var round = _.last(gameState.custom.rounds);
      if (round.reader === gameState.you) {
        $state.go('^.readChoices');
      } else {
        $state.go('^.waitingForChoicesReader');
      }
    });

    socket.on('readingChoicesDone', function() {
      $state.go('^.voting');
    });

    socket.on('voteCast', function(vote) {
      gameState.custom.votes.push(vote);
    });

    socket.on('votingDone', function(score) {
      gameState.custom.score = score;
      $state.go('^.score');
    });


  }
]);

