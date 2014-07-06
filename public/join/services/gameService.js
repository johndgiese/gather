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
    state = newState;
  }

}]);
