var _ = require('underscore');
var crypto = require('crypto');

/**
 * Given a secureId, generate a session that timesout for it.
 * @arg {String} - encryption key
 * @arg {Number} - secure id
 * @arg {Number} - number of milliseconds until the session expires
 * @returns {String} - session
 */
exports.generateSession = function(key, secureId, msUntilTimeout) {
  if (!isInteger(secureId)) {
    throw new Error("Id is too big");
  }
  var cipher = crypto.createCipher('aes256', key);
  var timeString = String(Date.now() + msUntilTimeout);
  var unecryptedSession = String(secureId) + "$" + timeString;
  return cipher.update(unecryptedSession, 'utf8', 'hex') + cipher.final('hex');
};

/**
 * Determine id from decrypting the session key
 * @arg {String} - decryption key
 * @arg {String} - the key used to decrypt the session
 * @arg {String} - the session
 * @returns {Null|Number} - id, or null if no match (or session timed out)
 */
exports.secureIdFromSession = function(key, sessionKey) {
  var decipher = crypto.createDecipher('aes256', key);
  try {
    var unecryptedSession = decipher.update(sessionKey, 'hex', 'utf8') + decipher.final('utf8');
    var parts = unecryptedSession.split("$");
    if (parts.length === 2) {
      var secureId = Number(parts[0]);
      var msSinceEpoch = Number(parts[1]);
      if (!isNaN(secureId) && !isNaN(msSinceEpoch)) {
        if (Date.now() < msSinceEpoch) {
          return secureId;
        }
      }
    }
  } catch (e) {
    // occurs if session string is not proper block length
  }
  return null;
};

/**
 * Ensure a number can be represented as an integer.
 */
function isInteger(n) {
  return n === +n && n === (n|0);
}
