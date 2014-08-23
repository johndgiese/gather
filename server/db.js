var config = require('./config');
var debugRaw = require('debug')('db:raw');
var debugLog = require('debug')('db:log');
var Q = require('q');
var _ = require('underscore');

var mysql = require('mysql');


var pool = mysql.createPool({
    host: 'localhost',
    user: config.DB_USERNAME,
    password: config.DB_PASSWORD,
    database: 'gather',
    multipleStatements: true,
});

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
      debugRaw(mysql.format(arguments[0], arguments[1]));
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

pool.raw = _.bind(raw, pool);
pool.rawOne = _.bind(rawOne, pool);

module.exports = pool;

