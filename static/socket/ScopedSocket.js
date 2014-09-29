/*
 * Scoped socket factory that is tied into the digest cycle and automatically
 * removes listeners when the scope is destroyed; useful in controllers.
 */
angular.module('socket')
.factory('ScopedSocket', [
  'socket', '$rootScope', '$q', 'debugService',
  function(socket, $rootScope, $q, debugService) {
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
        debugService("RECIEVED: " + event, {color: 'green'});
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

    /**
     * Emit an event, and return a promise for the acknowledged data.
     * NOTE: not tied into the scope at all!
     */
    ScopedSocket.prototype.emitp = function(event, data) {
      return socket.emitp(event, data);
    };

    ScopedSocket.prototype.removeAllListeners = function() {
      debugService('TEARING DOWN LISTENERS FOR SCOPE: ' + this.$scope.$id, {color: 'yellow'});
      var listeners = this.listeners;
      while (listeners.length) {
        var listener = listeners.pop();
        socket.removeListener(listener.event, listener.fn);
      }
    };

    return ScopedSocket;
  }
]);
