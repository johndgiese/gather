angular.module('words')
.config(['$stateProvider', function($stateProvider) {

  $stateProvider

  .state('game.words', {
    url: '/words',
    controller: 'WordsCtrl',
    templateUrl: 'app/templates/landing.html',
  });

}]);
