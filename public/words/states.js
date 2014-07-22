angular.module('words')
.config(['$stateProvider', function($stateProvider) {

  $stateProvider

  .state('game.words', {
    url: '/words',
    controller: 'WordsCtrl',
    templateUrl: '/static/words/templates/index.html',
  });

}]);
