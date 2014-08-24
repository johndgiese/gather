angular.module('join')
.controller('CreatePlayerCtrl', [
  '$scope', '$state', '$stateParams', 'playerService', 'ScopedSocket', 'stateStack',
  function($scope, $state, $stateParams, playerService, ScopedSocket, stateStack) {
    var socket = new ScopedSocket($scope);

    var adjectives = [
      'Purple',
      'Green',
      'Bright Pink',
      'Overweight',
      'Unfortunate',
      'Sexy Mr.',
      'Smoking',
      'Expensive',
      'Grotesque',
      'Grumpy',
      'Combative',
      'Canadian',
      'African',
      'Low Income',
      'Almighty',
      'Big',
      'Insignificant',
    ];

    var nouns = [
      'Enchanter',
      'Bacon Hunter',
      'Lightning god',
      'Pumpkin',
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
      'Cured Bacon',
      'Burglar',
      'Texan',
      'Toilet Cleaner',
      'Palm Tree',
      'Convertible',
      'Mom',
      'Politican',
    ];

    // this state is only ever traversed via a redirect, hence we need a way of
    // knowing the next state
    $scope.nextState = stateStack.pop() || {name: 'landing'};

    $scope.playerName = _.sample(adjectives) + ' ' + _.sample(nouns);

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

