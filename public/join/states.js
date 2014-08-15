angular.module('join')
.config(['$stateProvider', function($stateProvider) {

  $stateProvider

  .state('landing', {
    url: '/',
    controller: 'LandingCtrl',
    templateUrl: '/static/join/templates/landing.html',
  })

  // create a new game and session
  .state('createGame', {
    url: '/new',
    controller: 'CreateGameCtrl',
    templateUrl: '/static/join/templates/create-game.html',
  })

  .state('createPlayer', {
    url: '/login?party',
    controller: 'CreatePlayerCtrl',
    templateUrl: '/static/join/templates/create-player.html',
  })

  // join an existing game session
  .state('joinGame', {
    url: '/join?invalid',
    controller: 'JoinGameCtrl',
    templateUrl: '/static/join/templates/join.html',
  })

  // staging ground for a game session (you are now leaving the `join` app)
  .state('game', {
    url: '/:party',
    controller: 'GameCtrl',
    templateUrl: '/static/join/templates/game.html',
    resolve: {
      storedPlayer: ['relogin', function(relogin) {
        return relogin();
      }]
    }
  });

}]);
