// core socket object; useful in services
// depends on socket.io
angular.module('socket')
.provider('socket', function socketProvider() {
  var socketUrl;
  this.setUrl = function(url) { socketUrl = url; };
  this.getUrl = function() { return socketUrl; };
  this.$get = ['$q', function($q) { 
    var socket = io.connect(socketUrl); 

    /**
     * Return a promise for the acknowledged data.
     * Reject if it has an `_error` field.
     */
    socket.emitp = function(event, data) {
      var deferred = $q.defer();
      this.emit(event, data, function(response) {
        if (response._error === undefined) {
          deferred.resolve(response);
        } else {
          deferred.reject(new Error(response._error));
        }
      });
      return deferred.promise;
    };

    return socket;
  }];
});
