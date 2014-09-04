angular.module('join')
.controller('CreatePlayerCtrl', [
  '$scope', '$modalInstance', '$state',
  function($scope, $modalInstance, $state) {

    $scope.currentState = $state.current.name;

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
      'Lightning God',
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

    $scope.playerName = _.sample(adjectives) + ' ' + _.sample(nouns);

    $scope.createPlayer = function() {
      $modalInstance.close({name: $scope.playerName});
    };

  }
]);

