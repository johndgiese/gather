// core socket object; useful in services
// depends on socket.io
angular.module('socket')
.provider('socket', function socketProvider() {
  var socketUrl;
  this.setUrl = function(url) { socketUrl = url; };
  this.getUrl = function() { return socketUrl; };
  this.$get = function() { return io.connect(socketUrl); };
});
