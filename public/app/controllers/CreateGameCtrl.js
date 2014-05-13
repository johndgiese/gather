app.controller('CreateGameCtrl', [
  '$scope', '$state', 'Socket', 'playerService', 'gameService', '$q', 
  function($scope, $state, Socket, playerService, gameService, $q) {
    var socket = new Socket($scope);

    $scope.playerCreated = playerService.get() !== null;

    if (!$scope.playerCreated) {
      $scope.playerName = "";
      $scope.gameName = "";

      $scope.$watch('playerName', function(playerName) {
        if (playerName && !$scope.form.gameName.$dirty) {
          $scope.gameName = playerName + "'s Game";
        }
      });
    } else {
      $scope.playerName = playerService.get().name;
      $scope.gameName = $scope.playerName + "'s Game";
    }

    $scope.create = function() {

      if (!$scope.playerCreated) {
        var player = createPlayer($scope.playerName);
      } else {
        var player = $q.when(playerService.get());
      }

      player.then(function() {
        return createGame($scope.gameName);
      })
      .then(function() {
        $state.go('staging');
      });

    };


    function createPlayer(playerName) {
      var deferred = $q.defer();
      socket.emit('createPlayer', {
        playerName: playerName,
      }, function(player) {
        playerService.set(player);
        deferred.resolve(player);
      });
      return deferred.promise;
    }

    function createGame(gameName) {
      var deferred = $q.defer();
      socket.emit('createGame', {
        gameName: gameName,
      }, function(game) {
        gameService.set(game);
        deferred.resolve(game);
      });
      return deferred.promise;
    }


  }
]);

