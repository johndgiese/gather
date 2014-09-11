angular.module('words')
.controller('WordsCtrl', [
  '$scope', '$stateParams', '$state', 'ScopedSocket', 'gameState', 'player', 'lastRoundDetails', 'stateResolver', 'relogin', '$interval', 'messageService',
  function($scope, $stateParams, $state, ScopedSocket, gameState, player, lastRoundDetails, stateResolver, relogin, $interval, messageService) {

    var socket = new ScopedSocket($scope);

    socket.on('roundStarted', function(data) {
      gameState.custom.rounds.push(data.round);
      if (data.round.reader === gameState.you) {
        $state.go('^.readPrompt');
      } else {
        $state.go('^.waitingForPromptReader');
      }
    });

    socket.on('readingPromptDone', function(data) {
      var round = _.last(gameState.custom.rounds);
      round.doneReadingPrompt = data.at;
      $state.go('^.choosing');
    });

    socket.on('cardChoosen', function(data) {
      gameState.custom.choices.push(data);
    });

    socket.on('choosingDone', function(data) {
      var round = _.last(gameState.custom.rounds);
      round.doneChoosing = data.at;
      if (round.reader === gameState.you) {
        $state.go('^.readChoices');
      } else {
        $state.go('^.waitingForChoicesReader');
      }
    });

    socket.on('readingChoicesDone', function(data) {
      var round = _.last(gameState.custom.rounds);
      round.doneReadingChoices = data.at;
      $state.go('^.voting');
    });

    socket.on('voteCast', function(vote) {
      gameState.custom.votes.push(vote);
    });

    socket.on('votingDone', function(data) {
      
      // store details for the score screen
      lastRoundDetails.set({
        choices: gameState.custom.choices,
        votes: gameState.custom.votes,
        dscore: data.dscore,
      });

      gameState.custom.choices = [];
      gameState.custom.votes = [];

      var round = _.last(gameState.custom.rounds);
      round.doneVoting = data.at;

      // add in points made this round
      _.forEach(data.dscore, function(player) {
        var currentScore = _.findWhere(gameState.custom.score, {id: player.id});
        currentScore.score += player.score;
      });

      $state.go('^.score');
    });

    socket.on('playerJoined', wordsPlayerJoined);

    socket.on('playerLeft', wordsPlayerLeft);

    function wordsPlayerJoined(player) {
      var match = _.findWhere(gameState.custom.score, {id: player.id});
      if (match === undefined) {
        gameState.custom.score.push({name: player.name, id: player.id, score: 0});
      }
    }

    function wordsPlayerLeft(data) {
      if (!data.gameOver) {
        // update the game state with the new reader if it changed
        if (data.custom.newReader !== null) {
          _.last(gameState.custom.rounds).reader = data.custom.newReader;
        }

        // redirect you to the proper state if necessary
        if (data.custom.newReader === gameState.you) {
          messageService.message(
            "You have been promoted to be the new " +
            "reader, as the previous read left the game."
          ).then(function() {
            if ($state.current.name === "app.game.words.waitingForPromptReader") {
              $state.go("^.readPrompt");
            } else if ($state.current.name === "app.game.words.waitingForChoicesReader") {
              $state.go("^.readChoices");
            }
          });
        }
      }
    }

    _.forEach(gameState.players, wordsPlayerJoined);
  }
]);

