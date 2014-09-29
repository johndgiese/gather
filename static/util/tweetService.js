angular.module('util.tweetService', [])

.service('tweetService', function() {
  var exports = {};

  var BASE_URL = exports.BASE_URL = "https://twitter.com/intent/";

  function encodeParams(params) {
    return _.map(params, function(value, key) {
      var encodedValue;
      if (_.isString(value)) {
        encodedValue = encodeURIComponent(value);
      } else if (_.isArray(value)) {
        encodedValue = _.map(value, encodeURIComponent).join(",");
      } else {
        throw Error("invalid param value");
      }
      return key + "=" + encodedValue;
    }).join("&");
  }

  exports.tweet = function(params) {
    var tweet = BASE_URL + "tweet?" + encodeParams(params);
    return tweet;
  };

  return exports;
});
