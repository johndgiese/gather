angular.module('join')
.factory('playerService', [function() {
  var service = {};

  var player = null;

  service.get = function() {
    return player;
  };

  service.set = function(val) {
    player = val;
    if (_.isNumber(player.id)) {
      localStorage.setItem('playerId', player.id);
    } else {
      localStorage.setItem('playerId', null);
    }
  };

  service.unset = function() {
    localStorage.removeItem('playerId');
    player = null;
  };

  return service;
}]);
