app.config(['$stateProvider', function($stateProvider) {

  $stateProvider

  .state('landing', {
    url: '/',
    controller: 'LandingCtrl',
    templateUrl: 'templates/landing.html',
  })

  // create a new game
  .state('createGame', {
    url: '/new',
    controller: 'CreateGameCtrl',
    templateUrl: 'templates/create-game.html',
  })

  // create a player
  .state('createPlayer', {
    url: '/signin',
    controller: 'CreatePlayerCtrl',
    templateUrl: 'templates/create-player.html',
  })

  // created a game, waiting for users to join
  .state('staging', {
    url: '/staging',
    controller: 'StagingCtrl',
    templateUrl: 'templates/staging.html',
  })

  // search for an existing game
  .state('search', {
    url: '/search',
    controller: 'SearchCtrl',
    templateUrl: 'templates/search.html',
  })

  // joined an existing game, but waiting for it to start
  .state('waiting', {
    url: '/waiting',
    controller: 'WaitingCtrl',
    templateUrl: 'templates/waiting.html',
  })

  // parent controller for the actual game
  .state('game', {
    url: '/game',
    controller: 'GameCtrl',
    templateUrl: 'templates/game.html',
  });

}]);


app.config(['$urlRouterProvider', function($urlRouterProvider) {
  $urlRouterProvider.otherwise('/');
}]);


app.config(['$locationProvider', function($locationProvider) {
  $locationProvider.html5Mode(true);
}]);
