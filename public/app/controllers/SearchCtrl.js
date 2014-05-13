app.controller('SearchCtrl', [
  '$scope', '$state', 'Socket', 'gameService', 'playerService', 'liveModelList',
  function($scope, $state, Socket, gameService, playerService, liveModelList) {
    var socket = new Socket($scope);

    $scope.games = liveModelList(socket, 'getOpenGames', 'gameOpen', 'gameClosed');

    $scope.join = function(gameId) {
      socket.emit('joinGame', gameId, function(game) {
        gameService.set(game);
        $state.go('waiting');
      });
    };

  }
]);

