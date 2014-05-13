app.controller('StagingCtrl', [
  '$scope', '$state', 'Socket', 'liveModelList',
  function($scope, $state, Socket, liveModelList) {
    var socket = new Socket($scope);

    $scope.players = liveModelList(socket, 'getGamePlayers', 'playerJoined', 'playerLeft');

    $scope.startGame = function() {
      socket.emit('startGame', null, function(data) {
        $state.go('game');
      });
    };

  }
]);

