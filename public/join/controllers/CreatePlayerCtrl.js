angular.module('join')
.controller('CreatePlayerCtrl', [
  '$scope', '$state', '$stateParams', 'playerService', 'ScopedSocket', 'stateStack',
  function($scope, $state, $stateParams, playerService, ScopedSocket, stateStack) {
    var socket = new ScopedSocket($scope);

    $scope.exampleNickname = _.sample([
      'Enchanter',
      'Bacon Hunter',
      'Lightning god',
      'Mr. Pumpkin',
      'Purple Haze',
      'Always Late',
      'Dr. Boss',
      'Mango',
      'Monkey',
      'Seagull',
      'Photo Fiend',
      'Blonde',
      'Calligrapher',
      'Hottub Hound',
      'Olive Oil',
      'George Bush Senior',
      'Canadian Bacon',
      'Cured Bacon',
      'Burglar',
    ]);

    // this state is only ever traversed via a redirect, hence we need a way of
    // knowing the next state
    $scope.nextState = stateStack.pop() || {name: 'landing'};

    $scope.playerName = "";

    $scope.createPlayer = function() {
      socket.emit('createPlayer', {
        name: $scope.playerName,
      }, function(player) {
        playerService.set(player);
        $state.go($scope.nextState.name, $scope.nextState.params);
      });
    };

  }
]);

