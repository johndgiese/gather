angular.module('words')
.config(['$stateProvider', function($stateProvider) {

  $stateProvider

  .state('app.game.words', {
    abstract: true,
    controller: 'WordsCtrl',
    template: '<ui-view />',
  })

  .state('app.game.words.score', {
    controller: 'WordsScoreCtrl',
    templateUrl: '/static/words/templates/score.html',
  })

  .state('app.game.words.readPrompt', {
    controller: 'WordsReadPromptCtrl',
    templateUrl: '/static/words/templates/read-prompt.html',
  })

  .state('app.game.words.waitingForPromptReader', {
    controller: 'WordsWaitingForPromptReaderCtrl',
    templateUrl: '/static/words/templates/waiting-for-prompt-reader.html',
  })

  .state('app.game.words.choosing', {
    controller: 'WordsChoosingCtrl',
    templateUrl: '/static/words/templates/choosing.html',
  })

  .state('app.game.words.waitingForChoices', {
    controller: 'WordsWaitingForChoicesCtrl',
    templateUrl: '/static/words/templates/waiting-for-choices.html',
  })

  .state('app.game.words.readChoices', {
    controller: 'WordsReadChoicesCtrl',
    templateUrl: '/static/words/templates/read-choices.html',
  })

  .state('app.game.words.waitingForChoicesReader', {
    controller: 'WordsWaitingForChoicesReaderCtrl',
    templateUrl: '/static/words/templates/waiting-for-choices-reader.html',
  })

  .state('app.game.words.voting', {
    controller: 'WordsVotingCtrl',
    templateUrl: '/static/words/templates/voting.html',
  })

  .state('app.game.words.waitingForVotes', {
    controller: 'WordsWaitingForVotesCtrl',
    templateUrl: '/static/words/templates/waiting-for-votes.html',
  });

}]);
