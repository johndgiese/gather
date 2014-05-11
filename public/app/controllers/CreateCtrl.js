app.controller('CreateCtrl', [
  '$scope', '$state', 'Socket',
  function($scope, $state, Socket) {
    var socket = new Socket($scope);

    $scope.playerName = "";
    $scope.gameName = "";

    $scope.$watch('playerName', function(playerName) {
      if (playerName && !$scope.form.gameName.$dirty) {
        $scope.gameName = playerName + "'s Game";
      }
    });

    $scope.createGame = function() {
      socket.emit('createPlayer', {
        playerName: $scope.playerName,
      }, function(player) {
        console.log(player);
      });
    };
  }
]);

