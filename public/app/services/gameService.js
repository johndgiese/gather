app.factory('gameService', ['socket', function(socket) {
  var game = null;

  return {
    set: setGame,
    get: getGame
  };

  function getGame() {
    return game;
  };

  function setGame(newGame) { 
    var gameId = game && game.id;
    var newGameId = newGame && newGameId;
    if (gameId !== newGameId && game !== null) {
      socket.emit('leaveGame', game.id);
    }
    game = newGame;
  };

}]);
