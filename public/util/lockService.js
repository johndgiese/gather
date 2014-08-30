angular.module('util')

.factory('lockService', ['$q',
  function lockService($q) {
    
    var service = {};

    /**
     * Decorator that ensures a promise-returning function can only have one
     * simultaneous call at a time.  Calls to the decorated function, while
     * waiting for an earlier call to finish, return a rejected promise.
     * Places a `lock` property on the returned function to indicate whether it
     * is locked.
     */
    service.lock = function(func) {
      var decorated = function() {
        if (!decorated.lock) {
          decorated.lock = true;
          return func.apply(null, arguments)
          .finally(function(val) {
            decorated.lock = false;
          });
        } else {
          return $q.reject("Function is locked");
        }
      };
      return decorated;
    };

    return service;

  }
]);
