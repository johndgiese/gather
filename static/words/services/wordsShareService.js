angular.module('words.wordsShareService', [
  'util.tweetService',
  'util.facebookService',
])

.service('wordsTweetService', [
  'tweetService', 'facebookService', function(tweetService, facebookService) {
  var exports = {};

  exports.win = function(promptId, responseId) {
    var title = "I won the last round with: ";
    var url = "http://gather.gg/share/pair?prompt=" + promptId + "&response=" + responseId;

    var params = {
     text: title,
     url: url,
     hashtags: ["gather"],
     related: ["Gathergg:Be the first to know when we add new decks or features."],
    };

    return {
      twitter: tweetService.tweet(params),
      facebook: facebookService.share({t: title, u: url})
    };
  };

  return exports;
}]);
