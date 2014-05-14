angular.module('join')
.controller('StagingCtrl', [
  '$scope', '$state', 'ScopedSocket', 'liveModelList',
  function($scope, $state, ScopedSocket, liveModelList) {
    var socket = new ScopedSocket($scope);

    $scope.players = liveModelList(socket, 'getGamePlayers', 'playerJoined', 'playerLeft');

    $scope.startGame = function() {
      socket.emit('startGame', null, function(data) {
        $state.go('game');
      });
    };

  }
]);

