var config = require('./config');
var debugRaw = require('debug')('db:raw');
var debugLog = require('debug')('db:log');
var Q = require('q');
var _ = require('underscore');

var mysql = require('mysql');


getConnection();


// TODO: investigate using a pool to speed things up
function getConnection() {
  // Test connection health before returning it to caller.
  if (module.exports && 
      module.exports._socket &&
      module.exports._socket.readable &&
      module.exports._socket.writable) {
    return module.connection;
  }

  debugLog(((module.connection) ? "UNHEALTHY SQL CONNECTION; RE" : "") + "CONNECTING TO SQL.");

  var connection = mysql.createConnection({
    host: 'localhost',
    user: config.DB_USERNAME,
    password: config.DB_PASSWORD,
    database: 'gather',
    multipleStatements: true,
  });

  connection.connect(function(err) {
    if (err) {
      debugLog("SQL CONNECT ERROR: " + err);
    } else {
      debugLog("SQL CONNECT SUCCESSFUL.");
    }
  });

  connection.on("close", function (err) {
    debugLog("SQL CONNECTION CLOSED.");
  });

  connection.on("error", function (err) {
    debugLog("SQL CONNECTION ERROR: " + err);
  });

  connection.raw = _.bind(raw, connection);
  connection.rawOne = _.bind(rawOne, connection);

  module.exports = connection;
  return connection;
}

/**
 * Execute a query and return a promise for the result.
 */
function raw() {
  var deferred = Q.defer();
  var after = function(error, result) {
    if (error === null) {
      deferred.resolve(result);
    } else {
      deferred.reject(error);
    }
  };

  try {
    if (arguments.length == 2) {
      debugRaw(this.format(arguments[0], arguments[1]));
      this.query(arguments[0], arguments[1], after);
    } else if (arguments.length == 1) {
      debugRaw(arguments[0]);
      this.query(arguments[0], after);
    }
  } catch(e) {
    return Q.when(e);
  }

  return deferred.promise;
}

/**
 * Execute a query for one row and return a promise for the result.
 */
function rawOne() {
  return this.raw.apply(this, arguments)
  .then(function(data) {
    if (data.length !== 1) {
      throw new Error("Expected one row and got ") + data.length;
    } else {
      return data[0];
    }
  });
}
