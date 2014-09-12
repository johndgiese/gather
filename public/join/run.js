angular.module('join')
.run(['$rootScope', '$state', 'messageService', 'socket', 'playerService', 'debugService', 'menuService',
  function($rootScope, $state, messageService, socket, playerService, debugService, menuService) {

    $rootScope.$on('$stateChangeError', function(event, to, toParams, from, fromParams, error) {

      if (from.name === 'app.joinGame' && to.name === 'app.game') {
        return $state.go('app.joinGame', {invalid: toParams.party});
      } else if (to.name === 'app.game') {
        return messageService.message(
          "The game you are attempting to join is over, " +
          "has been cancelled, or is no longer accepting new players"
        )
        .then(function() {
          $state.go('app.landing');
        });
      }

      console.log("unhandled state change error: ");
      console.log(event);
      console.log(to);
      console.log(toParams);
      console.log(from);
      console.log(fromParams);
      console.log(error);
      debugService("unhandled state change error: " + error);

    });

    // resign in and then reload the state
    socket.on('reconnect', function() {
      playerService.sync()
      .then(function() {
        debugService('reloading state');
        $state.reload();
      });
    });

    menuService.registerItem({
      title: 'Logout',
      action: function() {
        playerService.logout();
        $state.go('app.landing');
      },
      visible: function() { 
        return playerService.player !== null;
      }
    });

  }
]);

