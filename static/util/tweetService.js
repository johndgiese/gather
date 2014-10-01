angular.module('util.tweetService', [
  'util.encodeParams',
])

.service('tweetService', ['encodeParams', function(encodeParams) {
  var exports = {};

  var BASE_URL = exports.BASE_URL = "https://twitter.com/intent/";

  exports.tweet = function(label, params) {
    var tweet = BASE_URL + "tweet?" + encodeParams(params);
    return function() {
      ga('send', 'event', 'share', "twitter", label);
      window.open(tweet, '_blank');
    };
  };

  return exports;
}]);
