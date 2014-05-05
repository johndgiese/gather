var app = angular.module('app', [
  'socket',
  'ui.router'
]);

app.config(['SocketProvider', function(SocketProvider) {
  SocketProvider.setUrl('http://localhost:3000');
}]);

