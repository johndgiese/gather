angular.module('util.encodeParams', [])

.service('encodeParams', function() {
  return function encodeParams(params) {
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
  };
});
