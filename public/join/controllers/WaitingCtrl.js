angular.module('join')
.controller('WaitingCtrl', [
  '$scope', '$state', 'ScopedSocket', 'gameService', 'playerService', 'liveModelList',
  function($scope, $state, ScopedSocket, gameService, playerService, liveModelList) {
    var socket = new ScopedSocket($scope);
    
    $scope.players = liveModelList(socket, 'getGamePlayers', 'playerJoined', 'playerLeft');

    socket.on('gameStart', function(data) {
      $state.go('game');
    });

  }
]);

