angular.module('join')
.controller('CreateGameCtrl', [
  '$scope', '$state', 'socket', 'player',
  function($scope, $state, socket, player) {
    // TODO: make the back button work here

    socket.emitp('createGame', {type: 'words'})
    .then(function(data) {
      // eventually game setup code will go here
      $state.go('app.game', {party: data.party});
    })
    .catch(function() {
      // they must have already made a game and are going backwards
      $state.go('app.landing');
    });

  }
]);

