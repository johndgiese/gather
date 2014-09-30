angular.module('util.tweetService', [
  'util.encodeParams',
])

.service('tweetService', ['encodeParams', function(encodeParams) {
  var exports = {};

  var BASE_URL = exports.BASE_URL = "https://twitter.com/intent/";

  exports.tweet = function(params) {
    var tweet = BASE_URL + "tweet?" + encodeParams(params);
    return tweet;
  };

  return exports;
}]);
