angular.module('join')
.config(['$stateProvider', function($stateProvider) {

  $stateProvider

  .state('app', {
    abstract: true,
    url: '/g',
    controller: 'AppCtrl',
    template: '<ui-view />',
    resolve: {
      sync: ['playerService', function(playerService) {
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
    url: '/new',
    controller: 'CreateGameCtrl',
    templateUrl: '/static/join/templates/create-game.html',
    resolve: {
      player: ['playerService', function(playerService) {
        // TODO: handle failure
        return playerService.getOrCreateFull();
      }]
    }
  })

  // join an existing game session
  .state('app.joinGame', {
    url: '/join?invalid',
    controller: 'JoinGameCtrl',
    templateUrl: '/static/join/templates/join.html',
    resolve: {
      player: ['playerService', function(playerService) {
        // TODO: handle failure
        return playerService.getOrCreate();
      }]
    }
  })

  // staging ground for a game session (you are now leaving the `join` app)
  .state('app.game', {
    url: '/:party',
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
  })

  // reset your password
  .state('app.resetPassword', {
    url: '/account/passwordreset/:playerId/:token',
    controller: 'ResetPasswordCtrl',
    templateUrl: '/static/join/templates/password-reset.html',
  })

  // done reseting your password
  .state('app.resetPasswordComplete', {
    url: '/account/passwordreset-complete',
    controller: 'ResetPasswordCompleteCtrl',
    templateUrl: '/static/join/templates/password-reset-complete.html',
  });

}]);
