/* 
 * Scoped socket factory that is tied into the digest cycle and automatically
 * removes listeners when the scope is destroyed; useful in controllers.
 */
angular.module('socket')
.factory('ScopedSocket', ['socket', '$rootScope', function(socket, $rootScope) {
  function ScopedSocket($scope) {
    var instance = this;
    this.$scope = $scope;
    this.listeners = [];
    $scope.$on('$destroy', function() {
      instance.removeAllListeners();
    });
  }

  ScopedSocket.prototype.on = function(event, callback) {
    var $scope = this.$scope;
    var wrappedCallback = function() {
      var args = arguments;
      $scope.$apply(function() {
        callback.apply(socket, args);
      });
    };

    this.listeners.push({event: event, fn: wrappedCallback});
    socket.on(event, wrappedCallback);
  };

  ScopedSocket.prototype.emit = function(event, data, callback) {
    var $scope = this.$scope;
    socket.emit(event, data, function() {
      var args = arguments;
      $scope.$apply(function() {
        if (callback) {
          callback.apply(socket, args);
        }
      });
    });
  };

  ScopedSocket.prototype.removeAllListeners = function() {
    var listeners = this.listeners;
    while (listeners.length) {
      var listener = listeners.pop();
      socket.removeListener(listener.event, listener.fn);
    }
  };

  return ScopedSocket;
}]);
