angular.module('join')
.controller('GameCtrl', [
  '$scope', '$state', 'ScopedSocket', 'gameState', '$location', '$rootScope', 'stateResolver', 'player', 'menuService', 'messageService',
  function($scope, $state, ScopedSocket, gameState, $location, $rootScope, stateResolver, player, menuService, messageService) {
    var socket = new ScopedSocket($scope);

    $scope.link = $location.absUrl();

    var masterId = gameState.game.master;
    $scope.isMaster = gameState.you === masterId;
    $scope.master = _.findWhere(gameState.players, {id: masterId});
    $scope.players = gameState.players;

    if ($scope.isMaster) {
      var removeMenuItems = menuService.registerItemGenerator({
        generator: function() {
          var otherPlayers = [];
          for (var i = 0, len = $scope.players.length; i < len; i++) {
            var player = $scope.players[i];
            if (player.id !== masterId) {
              otherPlayers.push(player);
            }
          }
          return _.map(otherPlayers, function(player) {
            return {
              title: 'Kick ' + player.name,
              action: ['socket', function(socket) { 
                return socket.emitp('kickPlayer', {player: player.id});
              }]
            };
          });
        }
      });
      $scope.$on('$destroy', removeMenuItems);
    }

    socket.on('playerLeft', function(data) {
      var playerInListAlready = _.findWhere(gameState.players, {id: data.player.id}) !== undefined;
      if (!playerInListAlready) {
        throw "Inconsistent State: removing player that doesn't exist";
      } else {

        if (data.player.id === gameState.you && data.kicked) {
          messageService.message("You have been kicked out of the game!")
          .then(function() {
            $state.go('app.landing');
          });
        } else if (data.gameOver) {
          messageService.message("The game master canceled the game!")
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
]);
