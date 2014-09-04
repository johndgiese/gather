angular.module('join')
.config(['$stateProvider', function($stateProvider) {

  $stateProvider

  .state('app', {
    abstract: true,
    controller: 'AppCtrl',
    template: '<ui-view />',
    resolve: {
      player: ['playerService', function(playerService) {
        return playerService.syncOrNull();
      }],
    }
  })

  .state('app.landing', {
    url: '/',
    controller: 'LandingCtrl',
    templateUrl: '/static/join/templates/landing.html',
  })

  // create a new game and session
  .state('app.createGame', {
    url: '/new/',
    controller: 'CreateGameCtrl',
    templateUrl: '/static/join/templates/create-game.html',
    resolve: {
      player: ['playerService', function(playerService) {
        // TODO: handle failure
        return playerService.getOrCreate();
      }]
    }
  })

  // join an existing game session
  .state('app.joinGame', {
    url: '/join/?invalid',
    controller: 'JoinGameCtrl',
    templateUrl: '/static/join/templates/join.html',
  })

  // staging ground for a game session (you are now leaving the `join` app)
  .state('app.game', {
    url: '/:party/',
    controller: 'GameCtrl',
    templateUrl: '/static/join/templates/game.html',
    resolve: {
      player: ['playerService', function(playerService) {
        return playerService.getOrCreate();
      }],
      gameState: ['socket', '$stateParams', 'player', function(socket, $stateParams, player) {
        // TODO: handle invalid party!
        return socket.emitp('joinGame', {party: $stateParams.party});
      }]
    }
  });

}]);
