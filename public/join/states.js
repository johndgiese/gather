angular.module('join')
.config(['$stateProvider', function($stateProvider) {

  $stateProvider

  .state('landing', {
    url: '/',
    controller: 'LandingCtrl',
    templateUrl: '/static/join/templates/landing.html',
  })

  // create a new game
  .state('createGame', {
    url: '/new',
    controller: 'CreateGameCtrl',
    templateUrl: '/static/join/templates/create-game.html',
  })

  // create a player
  .state('createPlayer', {
    url: '/signin',
    controller: 'CreatePlayerCtrl',
    templateUrl: '/static/join/templates/create-player.html',
  })

  // created a game, waiting for users to join
  .state('staging', {
    url: '/staging',
    controller: 'StagingCtrl',
    templateUrl: '/static/join/templates/staging.html',
  })

  // search for an existing game
  .state('search', {
    url: '/search',
    controller: 'SearchCtrl',
    templateUrl: '/static/join/templates/search.html',
  })

  // joined an existing game, but waiting for it to start
  .state('waiting', {
    url: '/waiting',
    controller: 'WaitingCtrl',
    templateUrl: '/static/join/templates/waiting.html',
  })

  // parent controller for the actual game
  .state('game', {
    url: '/game',
    controller: 'GameCtrl',
    templateUrl: '/static/join/templates/game.html',
  });

}]);
