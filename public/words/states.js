angular.module('words')
.config(['$stateProvider', function($stateProvider) {

  $stateProvider

  .state('game.words', {
    abstract: true,
    controller: 'WordsCtrl',
    templateUrl: '/static/words/templates/index.html',
  })

  .state('game.words.score', {
    controller: 'WordsScoreCtrl',
    templateUrl: '/static/words/templates/score.html',
  })

  .state('game.words.readPrompt', {
    controller: 'WordsReadPromptCtrl',
    templateUrl: '/static/words/templates/read-prompt.html',
  })

  .state('game.words.waitingForPromptReader', {
    controller: 'WordsWaitingForPromptReaderCtrl',
    templateUrl: '/static/words/templates/waiting-for-prompt-reader.html',
  })

  .state('game.words.choosing', {
    controller: 'WordsChoosingCtrl',
    templateUrl: '/static/words/templates/choosing.html',
  })

  .state('game.words.waitingForChoices', {
    controller: 'WordsWaitingForChoicesCtrl',
    templateUrl: '/static/words/templates/waiting-for-choices.html',
  })

  .state('game.words.readingChoices', {
    controller: 'WordsReadingChoicesCtrl',
    templateUrl: '/static/words/templates/reading-choices.html',
  })

  .state('game.words.waitingForChoicesReader', {
    controller: 'WordsWaitingForChoicesReaderCtrl',
    templateUrl: '/static/words/templates/waiting-for-choices-reader.html',
  })

  .state('game.words.voting', {
    controller: 'WordsVotingCtrl',
    templateUrl: '/static/words/templates/voting.html',
  })

  .state('game.words.waitingForVotes', {
    controller: 'WordsWaitingForVotesCtrl',
    templateUrl: '/static/words/templates/waiting-for-votes.html',
  });

}]);
