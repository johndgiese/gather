angular.module('words')
.controller('WordsScoreCtrl', [
  '$scope', '$stateParams', 'gameState', '$interval', '$timeout', 'lastRoundDetails', 'wordsShareService', 'player',
  function($scope, $stateParams, gameState, $interval, $timeout, lastRoundDetails, wordsShareService, player) {

    var round = $scope.round = _.last(gameState.custom.rounds);
    $scope.score = _.sortBy(gameState.custom.score, 'score').reverse();

    var details = lastRoundDetails.get();
    $scope.haveLastRoundDetails = !_.isNull(details);


    $scope.getDifferential = function(playerGameId) {
      if ($scope.haveLastRoundDetails) {
        var playersScoreThisRound = _.findWhere(details.dscore, {id: playerGameId});
        if (playersScoreThisRound !== undefined) {
          return "+" + playersScoreThisRound.score;
        }
      }
    };

    $scope.perfectWin = false;

    if ($scope.haveLastRoundDetails) {
      var maxDifferential = _.max(details.dscore, function(d) { return d.score; }).score;
      var maxScorers = _.filter(details.dscore, function(d) { return d.score === maxDifferential; });
      $scope.tie = maxScorers.length > 1;
      $scope.winners = _.map(maxScorers, function(s) {
        return {
          name: _.findWhere($scope.score, {id: s.id}).name,
          response: _.findWhere(details.choices, {player: s.id}).card.text,
          responseId: _.findWhere(details.choices, {player: s.id}).card.responseId,
        };
      });


      // only show perfect win if there are at least 4 players
      $scope.perfectWin = (maxDifferential === $scope.players.length - 1) && ($scope.players.length >= 4);

      if ($scope.perfectWin) {
      var winAdjectives = [
          'Crushing',
          'Grandslam',
          'Demonstrable',
          'Annihilating',
          'Major',
          'Sizable',
          'Dominant',
          'Ultra',
          'Perfect',
          'Non-insignificant',
          'Annoyingly good',
        ];
        $scope.winAdjective = winAdjectives[(round.number - 1) % winAdjectives.length];
        $scope.shareWin = wordsShareService.win(round.promptId, $scope.winners[0].responseId);
      }

    }

    var INTER_ROUND_DELAY = round === undefined ? 5000 : 12000;  // in ms

    // 1. determine ms before next round starts
    // 2. round counter up to nearest sec
    // 3. set delay for fraction of second until next countdown
    // 4. then set timeout for remaining whole seconds, decrememting counter on
    //    each whole second
    var timerStart;
    if (round) {
      timerStart = round.doneVoting;
    } else {
      timerStart = gameState.game.startedOn;
    }
    var sinceVotingDone = Date.now() - new Date(timerStart);
    var timeLeft = INTER_ROUND_DELAY - sinceVotingDone;
    var wholeSecondsLeft = Math.floor(timeLeft/1000);
    var fraction = timeLeft - wholeSecondsLeft*1000;
    $scope.countdown = Math.ceil(timeLeft/1000);
    $timeout(function() {
      $interval(function() {
        $scope.countdown = $scope.countdown - 1;
        $scope.countdownChanged = true;
      }, 1000, wholeSecondsLeft);
    }, fraction);
      
  }
]);
