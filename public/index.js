angular.module('app', [
  'join',
  'socket',
  'ui.router',
])

.config(['socketProvider', function(socketProvider) {
  socketProvider.setUrl('http://localhost:3000');
}])

.config(['$urlRouterProvider', function($urlRouterProvider) {
  $urlRouterProvider.otherwise('/');
}])

.config(['$locationProvider', function($locationProvider) {
  $locationProvider.html5Mode(true);
}]);
