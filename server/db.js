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
 * Execute a query for one row and return a promise for the result.
 */
connection.rawOne = function() {
  return connection.raw.apply(connection, arguments)
  .then(function(data) {
    if (data.length !== 1) {
      throw "Expected one row and got " + data.length;
    } else {
      return data[0];
    }
  });
};


/**
 * Decorator that ensures the provided function executes within a single transaction.
 * NOTE: the decorated function must return a promise (and not use callbacks),
 * otherwise there is no way to ensure that the transaction will "surround" any
 * intermittent database calls
 * @arg {Function}
 * @returns {Function}
 */
connection.withinTransaction = function(func) {
  return function() {
    var self = this;
    var args = arguments;

    // start the transaction
    connection.raw('START TRANSACTION')

    // call the function that should be executed in a single transaction
    .then(function() {
      return func.apply(self, args);
    })

    // commit and then return a promise for the original value
    .then(function(value) {
      return connection.raw('COMMIT')
      .then(function() {
        return Q.when(value);
      });
    })
  
    // if error in `func` or during the commit, then rollback
    .fail(function(reason) {
      connection.query('ROLLBACK', function() {
        throw reason;
      });
    });
  };
};

