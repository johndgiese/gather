angular.module('join')
.factory('gameService', ['socket', '$q', function(socket, $q) {
  var state = null;

  return {
    set: setGameState,
    get: getGameState
  };

  function getGameState() {
    return state;
  }

  function setGameState(newState) { 
    var gameId = state && state.game.id;
    var newGameId = newState && newState.game.id;
    if (gameId !== newGameId && state !== null) {
      socket.emit('leaveGame', gameId);
    }
    state = newState;
  }

}]);
