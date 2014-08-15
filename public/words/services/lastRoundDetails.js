angular.module('words')
.factory('lastRoundDetails', [function() {
  var service = {};
  var details = null;
  service.set = function(details_) {
    details = details_;
  };

  service.get = function() {
    return details;
  };

  return service;
}]);

