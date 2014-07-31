angular.module('words')
.controller('WordsCtrl', [
  '$scope', '$stateParams', 'ScopedSocket', 'gameService', 'playerService',
  function($scope, $stateParams, ScopedSocket, gameService, playerService) {
    var socket = new ScopedSocket($scope);

    var player = playerService.get();
    var gameState = gameService.get();

    socket.on('roundStarted', function(round) {
      gameState.custom.choices = [];
      gameState.custom.votes = [];
      gameState.custom.rounds.push(data.round);

      if (round.reader === gameState.you) {
        $state.go('game.words.readPrompt');
      } else {
        $state.go('game.words.waitingForPromptReader');
      }
    });

    socket.on('readingPromptDone', function() {
      $state.go('game.words.choosing');
    });

    socket.on('cardChoosen', function(data) {
      gameState.custom.choices.push(data);
    });

    socket.on('readingChoicesDone', function() {
      $state.go('game.words.voting');
    });

    socket.on('voteCast', function(data) {
      gameState.custom.votes.push(data);
    });

    socket.on('votingDone', function(score) {
      gameState.custom.score = score;
      $state.go('game.words.score');
    });


    socket.on('playerLeft', function(player) {
      var playerInListAlready = _.find(gameState.players, function(p) {
        return p.id === player.id;
      }) !== undefined;

      if (!playerInListAlready) {
        throw "Inconsistent State: removing player that doesn't exist";
      } else {
        _.reject(gameState.players, function(p) {
          return p.id === player.id;
        });
      }
    });

    socket.on('playerJoined', function(player) {
      var playerInListAlready = _.find(gameState.players, function(p) {
        return p.id === player.id;
      }) !== undefined;

      if (playerInListAlready) {
        throw "Inconsistent State: adding player that already exists";
      } else {
        gameState.players.push(player);
      }
    });

  }
]);

