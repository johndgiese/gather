angular.module('words.wordsShareService', [
  'util.tweetService',
  'util.facebookService',
])

.service('wordsShareService', [
  'tweetService', 'facebookService', function(tweetService, facebookService) {
  var exports = {};

  exports.win = function(promptId, responseId) {
    var title = "Check out my win";
    var url = "http://gather.gg/share/prompt/" + promptId + "/mywin/" + responseId + "/";

    var params = {
     text: title,
     url: url,
     hashtags: ["gather"],
     related: ["Gathergg:Be the first to know when we add new decks or features."],
    };

    return {
      twitter: tweetService.tweet("perfect win", params),
      facebook: facebookService.share("perfect win", {t: title, u: url})
    };
  };


  exports.hand = function(promptId, responseIds) {
    var title = "Check out my hand";
    var url = "http://gather.gg/share/prompt/" + promptId + "/hand/" + responseIds.join("/") + "/";
    var params = {
     text: title,
     url: url,
     hashtags: ["gather"],
     related: ["Gathergg:Be the first to know when we add new decks or features."],
    };

    return {
      twitter: tweetService.tweet("hand", params),
      facebook: facebookService.share("hand", {t: title, u: url})
    };
  };


  exports.mychoice = function(promptId, responseId) {
    var title = "Check out what I played this round";
    var url = "http://gather.gg/share/prompt/" + promptId + "/mychoice/" + responseId + "/";
    var params = {
     text: title,
     url: url,
     hashtags: ["gather"],
     related: ["Gathergg:Be the first to know when we add new decks or features."],
    };

    return {
      twitter: tweetService.tweet("my choice", params),
      facebook: facebookService.share("my choice", {t: title, u: url})
    };
  };


  exports.groupchoices = function(promptId, responseIds) {
    var title = "Check out everyone's responses this round";
    var url = "http://gather.gg/share/prompt/" + promptId + "/groupchoices/" + responseIds.join("/") + "/";
    var params = {
     text: title,
     url: url,
     hashtags: ["gather"],
     related: ["Gathergg:Be the first to know when we add new decks or features."],
    };

    return {
      twitter: tweetService.tweet("group choices", params),
      facebook: facebookService.share("group choices", {t: title, u: url})
    };
  };

  return exports;
}]);
