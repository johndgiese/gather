var Q = require('q');
var http = require('http');
var _ = require('underscore');
var querystring = require('querystring');
var config = require('../config');
var crypto = require('crypto');


function randomValueBase64(len) {
  return crypto.randomBytes(Math.ceil(len * 3 / 4))
  .toString('base64')   // convert to base64 format
  .slice(0, len)        // return required number of characters
  .replace(/\+/g, '0')  // replace '+' with '0'
  .replace(/\//g, '0'); // replace '/' with '0'
}


/**
 * Check if a password is valid.
 * @arg {String} - password
 * @returns {Boolean} - is it valid?
 */
function validPassword(password) {
  return password.length >= 8 &&
         password.search(/[a-z]/) !== -1 &&
         password.search(/[A-Z]/) !== -1 &&
         password.search(/\d/) !== -1 &&
         password.search(/[\!\@\#\$\%\^\&\*\(\)\_\+]/) !== -1;
}


/**
 * Post request to internal django api.
 * @arg {String} - url path
 * @arg {Object} - data that will be url encoded
 */
function booleanInternalAPIRequestProm(path, data) {
  var deferred = Q.defer();

  var dataWithSecret = _.extend({}, {secret: config.SECRET}, data);
  var encodedData = querystring.stringify(dataWithSecret);

  var options = {
    host: '127.0.0.1',
    port: 8000,
    path: path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': encodedData.length,
    }
  };

  var request = http.request(options, function(response) {
    if (response.statusCode === 200) {
      deferred.resolve();
    } else {
      deferred.reject(response.statusCode);
    }
  });

  request.on('error', function(reason) {
    deferred.reject(reason);
  });

  request.write(encodedData);
  request.end();

  return deferred.promise;
}


/**
 * Send request to the django server to create a password for the specified
 * user.  Use djano for this, so that we can share the django and game login
 * systems.
 * @arg {String} - player email
 * @arg {String} - plain text password
 * @returns {Promise} - is rejected if not succesful
 */
exports.setPassword = function(email, password) {
  if (validPassword(password)) {
    return booleanInternalAPIRequestProm('/api/set_password', {
      email: email,
      password: password,
    });
  } else {
    return Q.reject("Invalid Password");
  }
};

/**
 * Check the password using a call to django's server.
 * @arg {String} - player email
 * @arg {String} - plain text password
 * @returns {Promise(String)} - "good" if passed, "email" if bad email,
 * "password" if bad password, promise is rejected if error on transmission.
 */
exports.checkPassword = function(email, password) {
  return booleanInternalAPIRequestProm('/api/check_password', {
    email: email,
    password: password
  })
  .then(function(v) {
    return "good";
  }, function(reason) {
    if (reason === 404) {
      return "email";
    } else if (reason === 403) {
      return "password";
    } else {
      return Q.reject(reason);
    }
  });
};


/**
 * Given a player object, generate a password reset token.
 * @arg {Player} - player object
 * @arg {Number} - life time in days (default is 7)
 * @returns {Promise<String>} - token
 */
exports.generatePasswordResetToken = function(player, days) {
  if (days === undefined) {
    days = 7;
  }

  var timeOut = new Date();
  timeOut.setDate(timeOut.getDate() + days);

  var token = randomValueBase64(20);
  player.resetToken = token;
  player.resetTokenTimeout = timeOut;

  return player.save()
  .then(function() {
    Q.when(token);
  });
};


/**
 * Check a token against a player object.
 * @arg {Player} - player object
 * @arg {String} - token
 * @returns {Boolean} - days until it expires (0 if invalid)
 */
exports.checkPasswordResetToken = function(player, token) {
  if (player.resetTokenTimeout < new Date()) {
    return false;
  } else {
    return player.resetToken === token;
  }
};
