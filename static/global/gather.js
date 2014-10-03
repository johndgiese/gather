/**
 * This is where code that is used by django-pages and SPA pages is placed.
 * TODO: move over to using CommonJS or some other module system, instead of
 * using a global store like this!
 */

var gather = {};

(function(gather) {

  /**
   * Given an object, URL encode it into key/value pairs.  If values are
   * Arrays, they are converted to comma separated lists.
   */
  var encodeParams = gather.encodeParams = function encodeParams(params) {
    return _.map(params, function(value, key) {
      var encodedValue;
      if (_.isString(value)) {
        encodedValue = encodeURIComponent(value);
      } else if (_.isArray(value)) {
        encodedValue = _.map(value, encodeURIComponent).join(",");
      } else {
        throw Error("invalid param value type");
      }
      return key + "=" + encodedValue;
    }).join("&");
  };

  gather.tweetService = (function() {
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
  })();

  gather.facebookService = (function() {
    var exports = {};
    var BASE_URL = exports.BASE_URL = "https://www.facebook.com/sharer/sharer.php";
    // valid params: u -- url, t -- title
    exports.share = function(label, params) {
      var url = BASE_URL + "?" + encodeParams(params);
      return function() {
        ga('send', 'event', 'share', "facebook", label);
        window.open(url, '_blank');
      };
    };
    return exports;
  })();

})(gather);
