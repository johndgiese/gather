/**
 * Send request to the django server to create a password for the specified
 * user.  Use djanog for this, so that we can share the django and game login
 * systems.
 * @arg {String} - player email
 * @arg {String} - plain text password
 * @throws - exception if the playerId email exist in the database already
 */
exports.setPassword = function(email, password) {
};

/**
 * Check the password using a call to django's server.
 * @arg {String} - player email
 * @arg {String} - plain text password
 * @returns {Boolean} - true if it matches, false if it doesn't
 */
exports.checkPassword = function(email, password) {
};
