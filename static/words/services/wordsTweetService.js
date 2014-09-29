angular.module('words.wordsTweetService', [
  'util.tweetService',
])

.service('wordsTweetService', [
  'tweetService', function(tweetService) {
  var exports = {};

  exports.win = function(promptId, responseId) {
    var params = {
     text: "I won the last round with: ",
     url: "http://gather.gg/share/pair?prompt=" + promptId + "&response=" + responseId,
     hashtags: ["gather"],
     related: ["Gathergg:Be the first to know when we add new decks or features."],
    };

    return tweetService.tweet(params);
  };

  return exports;
}]);
