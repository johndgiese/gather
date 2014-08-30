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
    url: '/new/',
    controller: 'CreateGameCtrl',
    templateUrl: '/static/join/templates/create-game.html',
    resolve: {
      player: ['playerService', function(playerService) {
        // TODO: handle failure
        return playerService.get();
      }]
    }
  })

  // join an existing game session
  .state('joinGame', {
    url: '/join/?invalid',
    controller: 'JoinGameCtrl',
    templateUrl: '/static/join/templates/join.html',
  })

  // staging ground for a game session (you are now leaving the `join` app)
  .state('game', {
    url: '/:party/',
    controller: 'GameCtrl',
    templateUrl: '/static/join/templates/game.html',
    resolve: {
      player: ['playerService', function(playerService) {
        return playerService.get();
      }],
      gameState: ['socket', '$stateParams', function(socket, $stateParams) {
        // TODO: handle invalid party!
        return socket.emitp('joinGame', {party: $stateParams.party});
      }]
    }
  });

}]);
