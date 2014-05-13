var app = angular.module('app', [
  'socket',
  'ui.router'
]);

app.config(['socketProvider', function(socketProvider) {
  socketProvider.setUrl('http://localhost:3000');
}]);

