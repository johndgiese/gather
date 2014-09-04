angular.module('util')

.factory('lockService', ['$q',
  function lockService($q) {
    
    var exports = {};

    /**
     * Decorator that ensures a promise-returning function can only have one
     * simultaneous call at a time.  Calls to the decorated function, while
     * waiting for an earlier call to finish, return a rejected promise.
     * Places a `lock` property on the returned function to indicate whether it
     * is locked.
     */
    exports.lock = function(func) {
      var decorated = function() {
        if (!decorated.lock) {
          decorated.lock = true;
          return func.apply(this, arguments)
          .finally(function(val) {
            decorated.lock = false;
          });
        } else {
          return $q.reject("Function is locked");
        }
      };
      return decorated;
    };


    var groupQueues = {};
    exports.inOrderByGroup = function inOrderByGroup(group, func) {
      return function() {
        var args = arguments;

        var deferred = $q.defer();

        var queue = groupQueues[group];
        if (queue === undefined) {
          groupQueues[group] = [deferred];
          execute(group, deferred, func, args);
        } else {
          var prevCall = queue[queue.length - 1].promise;
          prevCall.then(function() {
            execute(group, deferred, func, args);
          });
          queue.push(deferred);
        }

        return deferred.promise;
      };
    };


    function execute(group, deferred, func, args) {
      func.apply(null, args)
      .then(function(val) {
        deferred.resolve(val);
      }, function(reason) {
        deferred.reject(reason);
      })
      .finally(function() {
        var queue = groupQueues[group];
        queue.shift();
        if (queue.length === 0) {
          delete groupQueues[group];
        }
      });
    }

    return exports;
  }
]);
