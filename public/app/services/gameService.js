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
    var newGameId = newGame && newGame.id;
    if (gameId !== newGameId && game !== null) {
      socket.emit('leaveGame', game.id);
    }
    game = newGame;
  };

}]);
