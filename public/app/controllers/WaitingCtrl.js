app.controller('WaitingCtrl', [
  '$scope', '$state', 'Socket', 'gameService', 'playerService', 'liveModelList',
  function($scope, $state, Socket, gameService, playerService, liveModelList) {
    var socket = new Socket($scope);
    
    $scope.players = liveModelList(socket, 'getGamePlayers', 'playerJoined', 'playerLeft');

    socket.on('gameStart', function(data) {
      $state.go('game');
    });

    $scope.cancelSearch = function() {
      $state.go('landing');
    };

  }
]);

