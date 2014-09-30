angular.module('util.facebookService', [
  'util.encodeParams',
])

.service('facebookService', ['encodeParams', function(encodeParams) {
  var exports = {};

  var BASE_URL = exports.BASE_URL = "https://www.facebook.com/sharer/sharer.php";

  // valid params: u -- url, t -- title
  exports.share = function(params) {
    var url = BASE_URL + "?" + encodeParams(params);
    return function() {
      window.open(url, '_blank');
    };
  };

  return exports;
}]);

