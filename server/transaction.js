Q = require('Q');


/**
 * Store a promise for each `group` of function calls; the existence of a 
 * promise for a given key indicates a lock on that group, and subsequent 
 * calls in that group are delayed until that promise is resolved.  After the
 * last call is complete, the lock (i.e. key) is cleared.
 */ 
var lockPromises = {};

/**
 * Decorate a promise-returning function to ensure that it completes its work
 * as a single "transaction" within the specified group.  
 * @arg {String} - group identifier
 * @arg {Function} - work that needs to be done as a transaction within the group
 * @return {Function} - decorated function
 *
 * @example You are writing a game application; when players join a game, you
 * have a series of inter-related database calls that must occur; in order to
 * ensure the game state is consistent for all players (even if the players are
 * joining at the same time), you need to ensure this series of database calls
 * completes before the next player starts their join process.  Typically, this
 * would by performing the database calls in a transaction.  In node, while
 * using websockets, it is not feasible to use database transactions, because
 * you have fewer database connections than you have players connected to
 * websockets.  To get around this, you can use application-level transactions
 * as implemented here.  As an added bonus, you can improve performance by
 * locking at a group level (as opposed to at a full database level).  Note
 * that the transaction isolation level created here is equivalent to
 * "serializable" in the SQL standard.
 */
exports.inOrderByGroup = function inOrderByGroup(group, func) {
  return function() {
    var args = arguments;

    var lock = lockPromises[group];
    if (lock === undefined) {
      var deferred = Q.defer();
      lockPromises[group] = deferred.promise;
      return Q.fapply(func, args)
      .then(function(val) {
        delete lockPromises[group];
        deferred.resolve();
        return Q.when(val);
      }, function(reason) {
        delete lockPromises[group];
        deferred.resolve();
        return Q.when(new Error(reason));
      });

    } else {
      lock.then(function() {
        return inOrderByGroup(group, func).apply(null, args);
      });
    }
  };
};

