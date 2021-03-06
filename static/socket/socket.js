// core socket object; useful in services
// depends on socket.io
angular.module('socket')
.provider('socket', [
  function socketProvider() {
    var socketUrl;
    this.setUrl = function(url) { socketUrl = url; };
    this.getUrl = function() { return socketUrl; };
    this.$get = ['$q', 'debugService', function($q, debugService) { 
      var socket = io.connect(socketUrl, {
        reconnectionDelay: 100,
        reconnectionDelayMax: 1000,
      }); 

      socket.on('connect', function() {
        debugService('CONNECTED');
      });

      socket.on('reconnect', function() {
        debugService('RE-CONNECTED');
      });

      socket.on('reconnect_error', function() {
        debugService('RECONNECT ERROR', {color: 'red'});
      });

      socket.on('connect_error', function() {
        debugService('CONNECT ERROR', {color: 'red'});
      });

      socket.on('reconnecting', function() {
        debugService('RECONNECTING');
      });

      socket.on('reconnect_attempt', function(number) {
        debugService('RECONNECT ATTEMPT ' + number);
      });

      /**
       * Return a promise for the acknowledged data.
       * Reject if it has an `_error` field.
       */
      // TODO: reject promises after a timeout (so that a closed socket won't
      // leave a never-ending promise)
      socket.emitp = function(event, data) {
        var deferred = $q.defer();
        debugService('SENDING: ' + event, {color: 'blue'});
        this.emit(event, data, function(response) {
          if (response._error === undefined) {
            deferred.resolve(response);
          } else {
            debugService('ERROR: ' + response._error, {color: 'red'});
            deferred.reject(new Error(response._error));
          }
        });
        return deferred.promise;
      };

      return socket;
    }];
  }
]);
