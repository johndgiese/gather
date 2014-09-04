angular.module('join')
.controller('GameCtrl', [
  '$scope', '$state', '$stateParams', 'ScopedSocket', 'gameState', '$q', '$location', '$rootScope', 'stateResolver', 'player',
  function($scope, $state, $stateParams, ScopedSocket, gameState, $q,  $location, $rootScope, stateResolver, player) {
    var socket = new ScopedSocket($scope);

    $scope.link = $location.absUrl();

    var creatorId = gameState.game.createdBy;
    $scope.isCreator = creatorId === player.id;
    $scope.creator = _.findWhere(gameState.players, {id: creatorId});
    $scope.players = gameState.players;


    socket.on('playerLeft', function(player) {
      var playerInListAlready = _.findWhere(gameState.players, {id: player.id}) !== undefined;
      if (!playerInListAlready) {
        throw "Inconsistent State: removing player that doesn't exist";
      } else {
        gameState.players = _.reject(gameState.players, function(p) {
          return p.id === player.id;
        });
      }
    });

    socket.on('playerJoined', function(player) {
      var playerInListAlready = _.findWhere(gameState.players, {id: player.id}) !== undefined;
      if (playerInListAlready) {
        throw "Inconsistent State: adding player that already exists";
      } else {
        gameState.players.push(player);
      }
    });

    if (gameState.game.startedOn === null) {
      socket.on('gameStarted', function(data) {
        gameState.game.startedOn = data.startedOn;
      });

      $scope.startGame = function() {
        socket.emitp('startGame', {})
        .then(function(data) {
          // TODO: make this generic
          // TODO: handle the fact that this may get called twice; once from the
          // ack, once from the broadcast
          $state.go('.words.score');
        });
      };

      socket.on('gameStarted', function() {
        // TODO: make this generic
        $state.go('.words.score');
      });

    } else {
      // TODO: make the state resolver generic
      $state.go(stateResolver(gameState));
    }

  }
]);

