var config = require('./config');
var debugRaw = require('debug')('db:raw');
var Q = require('Q');

var mysql = require('mysql');

var connection = module.exports = mysql.createConnection({
  host: 'localhost',
  user: config.DB_USERNAME,
  password: config.DB_PASSWORD,
  database: 'gather',
  multipleStatements: true,
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


var ISOLATE_SERIALIZABLE = connection.ISOLATE_SERIALIZABLE = 4;
var ISOLATE_REPEATABLE_READ = connection.ISOLATE_REPEATABLE_READ = 3;
var ISOLATE_READ_COMMITTED = connection.ISOLATE_READ_COMMITTED = 2;
var ISOLATE_READ_UNCOMMITTED = connection.ISOLATE_READ_UNCOMMITTED = 1;

/**
 * Decorator that ensures the provided function executes within a single transaction.
 * NOTE: the decorated function must return a promise (and not use callbacks),
 * otherwise there is no way to ensure that the transaction will "surround" any
 * intermittent database calls
 * @arg {Function}
 * @returns {Function}
 */
connection.withinTransaction = function(func, isolationLevel) {
  return function() {
    var self = this;
    var args = arguments;

    var startTransaction;
    switch(isolationLevel) {
      case undefined:
        startTransaction = connection.raw('START TRANSACTION');
        break;
      case ISOLATE_SERIALIZABLE:
        startTransaction = connection.raw('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE; START TRANSACTION');
        break;
      case ISOLATE_READ_COMMITTED:
        startTransaction = connection.raw('SET TRANSACTION ISOLATION LEVEL REEATABLE-READ; START TRANSACTION');
        break;
      case ISOLATE_READ_COMMITTED:
        startTransaction = connection.raw('SET TRANSACTION ISOLATION LEVEL READ-COMMITTED; START TRANSACTION');
        break;
      case ISOLATE_READ_UNCOMMITTED:
        startTransaction = connection.raw('SET TRANSACTION ISOLATION LEVEL READ-UNCOMMITTED; START TRANSACTION');
        break;
      default:
        throw "Invalid isolation level";
    }

    // call the function that should be executed in a single transaction
    startTransaction
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

