angular.module('util')
.factory('stateStack', function() {
  var internal = [];

  var service = {};

  service.pop = function() {
    if (internal.length === 0) {
      return null;
    } else {
      return internal.pop();
    }
  };

  service.push = function(state) {
    // assumes "states" are not undefined
    internal.push(state);
  };

  return service;
});
