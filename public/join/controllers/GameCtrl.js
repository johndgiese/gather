angular.module('join')
.controller('GameCtrl', [
  '$scope', '$state', '$stateParams', 'ScopedSocket', 'liveModelList', 'playerService', 'gameService', '$q', 'stateStack',
  function($scope, $state, $stateParams, ScopedSocket, liveModelList, playerService, gameService, $q, stateStack) {
    var socket = new ScopedSocket($scope);

    var gameState;
    var player = playerService.get();
    if (player === null) {
      stateStack.push({name: 'game', params: {party: $stateParams.party}});
      return $state.go('createPlayer');
    }

    $scope.joinedGame = false;
    $scope.isCreator = false;
    $scope.creator = null;
    $scope.players = [];
    $scope.party = $stateParams.party;

    $q.when(gameService.get())
    .then(function(gameState) {
      if (gameState !== null) {
        return gameState;
      } else {
        return socket.emitp('joinGame', {party: $stateParams.party});
      }
    })
    .then(function(gameState_) {

      gameState = gameState_;
      $scope.joinedGame = true;
      gameService.set(gameState);

      socket.on('playerLeft', function(player) {
        var playerInListAlready = _.find(gameState.players, function(p) {
          return p.id === player.id;
        }) !== undefined;

        if (!playerInListAlready) {
          throw "Inconsistent State: removing player that doesn't exist";
        } else {
          _.reject(gameState.players, function(p) {
            return p.id === player.id;
          });
        }
      });

      socket.on('playerJoined', function(player) {
        var playerInListAlready = _.find(gameState.players, function(p) {
          return p.id === player.id;
        }) !== undefined;

        if (playerInListAlready) {
          throw "Inconsistent State: adding player that already exists";
        } else {
          gameState.players.push(player);
        }
      });

      var creatorId = gameState.game.createdBy;
      $scope.isCreator = creatorId === player.id;
      $scope.creator = _.find(gameState.players, function(p) {return p.id === creatorId;});
      $scope.players = gameState.players;
    })
    .catch(function(reason) {
      $state.go('joinGame', {invalid: $stateParams.party});
    });


    $scope.startGame = function() {
      socket.emitp('startGame', {})
      .then(function(data) {
        // TODO: make this generic
        $state.go('.words.score');
      })
      .catch(function(reason) {
        alert(reason);
      });
    };

    socket.on('gameStarted', function() {
      // TODO: make this generic
      $state.go('.words.score');
    });

  }
]);

