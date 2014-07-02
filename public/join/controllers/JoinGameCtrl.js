angular.module('join')
.controller('SearchCtrl', [
  '$scope', '$state', 'ScopedSocket', 'gameService', 'playerService', 'liveModelList',
  function($scope, $state, ScopedSocket, gameService, playerService, liveModelList) {
    var socket = new ScopedSocket($scope);

    $scope.games = liveModelList(socket, 'getOpenGames', 'gameOpen', 'gameClosed');

    $scope.join = function(gameId) {
      socket.emit('joinGame', gameId, function(game) {
        gameService.set(game);
        $state.go('waiting');
      });
    };

  }
]);

