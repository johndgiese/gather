(function(angular, io) {
  'use strict';

  var socket = angular.module('socket', []);

  // core socket object; useful in services
  socket.provider('socket', function socketProvider() {
    var socketUrl;
    this.setUrl = function(url) { socketUrl = url; };
    this.getUrl = function() { return socketUrl; };
    this.$get = function() { return io.connect(socketUrl); };
  });

  // scoped socket factory that is tied into the digest cycle and automatically
  // removes listeners when the scope is destroyed; useful in controllers
  socket.factory('Socket', ['socket', '$rootScope', function(socket, $rootScope) {
    function Socket($scope) {
      var instance = this;
      this.$scope = $scope;
      this.listeners = [];
      $scope.$on('$destroy', function() {
        instance.removeAllListeners();
      });
    }

    Socket.prototype.on = function(event, callback) {
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

    Socket.prototype.emit = function(event, data, callback) {
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

    Socket.prototype.removeAllListeners = function() {
      var listeners = this.listeners;
      while (listeners.length) {
        var listener = listeners.pop();
        socket.removeListener(listener.event, listener.fn);
      }
    };

    return Socket;
  }]);

})(angular, io);
