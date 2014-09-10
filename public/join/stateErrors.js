angular.module('join')
.run(['$rootScope', '$state', 'messageService',
  function($rootScope, $state, messageService) {

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

    });
  }
]);

