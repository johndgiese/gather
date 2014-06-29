var crypto = require('crypto');

exports.gamehash = function(playerId) {
  var millisecsSinceUTC = (new Date()).valueOf();
  var str = String(millisecsSinceUTC) + String(playerId);
  return hash(str, 6);
};

// TODO: make a real implementation of this that uses all upper case letters
// (i.e. is base 36); want to keep only 6 character length as it is easy to
// tell other people directly in two three-character chunks
function hash(str, hashLength) {
  var shasum = crypto.createHash('sha1');
  shasum.update(str);
  var fullHash = shasum.digest('hex');
  return fullHash.substr(0, hashLength).toUpperCase();
}
