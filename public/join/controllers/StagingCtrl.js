angular.module('join')
.controller('StagingCtrl', [
  '$scope', '$state', '$stateParams', 'ScopedSocket', 'liveModelList', 'playerService', 'gameService', '$q', 'stateStack', 
  function($scope, $state, $stateParams, ScopedSocket, liveModelList, playerService, gameService, $q, stateStack) {
    var socket = new ScopedSocket($scope);

    var player = playerService.get();
    if (player === null) {
      stateStack.push('staging');
      $state.go('createPlayer');
    }

    var stateProm, state = gameService.get();
    var joinedGame = state !== null;
    if (joinedGame) {
      stateProm = $q.when(state);
    } else {
      var deferred = $q.defer();
      var hash = $stateParams.hash;
      socket.emit('joinGame', {hash: hash}, function(state) {
        gameService.set(state);
        joinedGame = true;
        $q.resolve(state);
        // TODO: handle failure
      });
    }

    $scope.isCreator = false;
    $scope.creator = {};
    $scope.players = [];

    stateProm.then(function(state_) {
      state = state_;
      var creatorId = state.game.createdBy;
      isCreator = creatorId === player.id;
      $scope.creator = state.game.players[creatorId];

      $scope.players = state.players;
      liveModelList(socket, $scope.players, 'playerJoined', 'playerLeft');
    });

    $scope.startGame = function() {
      socket.emit('startGame', {}, function(data) {
        $state.go('game');
      });
    };

  }
]);

