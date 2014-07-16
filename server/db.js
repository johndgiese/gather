var config = require('./config');
var debugRaw = require('debug')('db:raw');

var mysql = require('mysql');

var connection = module.exports = mysql.createConnection({
  host: 'localhost',
  user: config.DB_USERNAME,
  password: config.DB_PASSWORD,
  database: 'gather'
});

/**
 * Execute a query and return a promise for the result.
 */
connection.raw = function() {
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
      debugRaw(connection.format(arguments[0], arguments[1]));
      connection.query(arguments[0], arguments[1], after);
    } else if (arguments.length == 1) {
      debugRaw(arguments[0]);
      connection.query(arguments[0], after);
    }
  } catch(e) {
    return Q.when(e);
  }

  return deferred.promise;
};


/**
 * Execute the provided function within a single transaction.
 * @arg {Function} - executes in a single transaction
 * @returns - promise for the return value of the argument
 */
connection.withinTransaction = function(func) {
  return connection.raw('START TRANSACTION')
  .then(function() {
    return Q.fcall(func);
  })
  .then(function(value) {
    return db.raw('COMMIT');
  })
  .fail(function(reason) {
    connection.query('ROLLBACK', function() {
      throw reason;
    });
  });
};

