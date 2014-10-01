angular.module('join')
.controller('CreatePlayerCtrl', [
  '$scope', '$modalInstance', '$state',
  function($scope, $modalInstance, $state) {

    $scope.currentState = $state.current.name;

    var adjectives = [
      'Purple', 'Green', 'Orange', 'Bright Pink',
      'Overweight', 'Unfortunate', 'Sexy Mr.', 'Smoking',
      'Expensive', 'Grotesque', 'Grumpy', 'Combative',
      'Canadian', 'African', 'Low Income', 'Almighty', 'Big', 'Insignificant',
      'Asian', 'White', 'Dizzy', 'Breezy', 'Tender', 'Average',
      'Splendid', 'Weary', 'Tasteless', 'Wide-eyed', 'Quaint', 'Lucky',
      'Filthy', 'Thundering', 'Sweet', 'Bitter', 'Courageous', 'Gentle',
      'Noxious', 'Zealous', 'Unfun', 'Disagreeable', 'Enjoyable',
      'Merry', 'Attractive', 'Pleasantly Plump', 'Jittery', 'Rebellious',
      'Recyclable', 'Generic', 'Gorgeous', 'Gelatinous', 'Graceful', 
    ];

    var nouns = [
      'Enchanter', 'Bacon Hunter', 'Lightning God', 'Pumpkin', 'Dr. Boss','Mango',
      'Monkey', 'Seagull', 'Photo Fiend', 'Blonde', 'Calligrapher', 'Hottub Hound',
      'Olive Oil', 'George Bush Senior', 'Cured Bacon', 'Burglar', 'Texan',
      'Toilet Cleaner', 'Palm Tree', 'Convertible', 'Mom', 'Politican',
      'Video Gamer', 'Gardener', 'Bookshelf Maker', 'Jeweler', 'Professor',
      'Vice President', 'Gangster', 'Gentleman', 'Geochemist', 'Girl', 'Gnome',
      'Graffiti Artist', 'Gunman', 'Gymnast', 'Groundhog',
    ];

    $scope.playerName = _.sample(adjectives) + ' ' + _.sample(nouns);

    $scope.createPlayer = function() {
      $modalInstance.close({name: $scope.playerName});
    };

  }
]);

