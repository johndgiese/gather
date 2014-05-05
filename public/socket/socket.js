(function(angular, io) {
  'use strict';

  var socket = angular.module('socket', []);

  socket.provider('Socket', function SocketProvider() {

    var socketUrl;
    this.setUrl = function(url) { socketUrl = url; };
    this.getUrl = function() { return socketUrl; };

    this.$get = ['$rootScope', function($rootScope) {
      var socket = io.connect(socketUrl);

      function Socket($scope) {
        this.$scope = $scope;
        this.listeners = [];
        $scope.$on('$destroy', this.removeAllListeners);
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
        while (listeners) {
          var listener = listeners.pop();
          socket.removeListener(listener.event, listener.fn);
        }
      };

      return Socket;
    }];

  });

})(angular, io);
