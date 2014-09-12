angular.module('join')
.controller('GameCtrl', [
  '$scope', '$state', 'ScopedSocket', 'gameState', '$location', '$rootScope', 'stateResolver', 'player', 'menuService', 'messageService',
  function($scope, $state, ScopedSocket, gameState, $location, $rootScope, stateResolver, player, menuService, messageService) {
    var socket = new ScopedSocket($scope);

    $scope.link = $location.absUrl();

    var creatorId = gameState.game.createdBy;
    $scope.isCreator = creatorId === player.id;
    $scope.creator = _.findWhere(gameState.players, {id: creatorId});
    $scope.players = gameState.players;

    socket.on('playerLeft', function(data) {
      var playerInListAlready = _.findWhere(gameState.players, {id: data.player.id}) !== undefined;
      if (!playerInListAlready) {
        throw "Inconsistent State: removing player that doesn't exist";
      } else {

        if (data.gameOver) {
          messageService.message("The game's creator canceled the game!")
          .then(function() {
            $state.go('app.landing');
          });
        } else {
          for (var i = 0; i < gameState.players.length; i++) {
            if (data.player.id === gameState.players[i].id) {
              gameState.players.splice(i, 1);
              break;
            }
          }
        }
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
          $state.go('app.game.words.score');
        });
      };

      socket.on('gameStarted', function() {
        // TODO: make this generic
        $state.go('app.game.words.score');
      });

    } else {
      // TODO: make the state resolver generic
      $state.go(stateResolver(gameState));
    }

  }
])


.config(['menuServiceProvider', function(menuServiceProvider) {

    menuServiceProvider.registerItem({
      title: 'Leave Game',
      action: ['$state', 'socket', function($state, socket) { 
        socket.emitp('leaveGame', {});
        $state.go('app.landing');
      }],
      visible: ['$state', function($state) { 
        return $state.current.name.substr(0, 3 + 1 + 4) === 'app.game'; 
      }]
    });

}]);
