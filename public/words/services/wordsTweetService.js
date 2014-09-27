angular.module('words.wordsTweetService', [
  'util.tweetService',
])

.service('wordsTweetService', [
  'tweetService', function(tweetService) {
  var exports = {};

  exports.win = function(prompt, response) {
    var tweet = prompt + ": " + response;
    tweet = tweet + "#Gather";
    return tweet;
  };

  return exports;
}]);
