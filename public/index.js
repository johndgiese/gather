angular.module('app', [
  'join',
  'words',
  'socket',
  'ui.router',
])

.config(['socketProvider', function(socketProvider) {
  socketProvider.setUrl('/');
}])

.config(['$urlRouterProvider', function($urlRouterProvider) {
  $urlRouterProvider.otherwise('/');
}])

.config(['$locationProvider', function($locationProvider) {
  $locationProvider.html5Mode(true);
}]);
