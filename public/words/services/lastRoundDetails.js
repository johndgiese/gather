angular.module('words')
.factory('lastRoundDetails', [function() {
  var exports = {};
  var details = null;

  exports.set = function(details_) {
    details = details_;
  };

  exports.get = function() {
    return details;
  };

  exports.clear = function() {
    details = null;
  };

  return exports;
}]);

