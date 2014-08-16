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

  $urlRouterProvider.rule(function ($injector, $location) {
      var path = $location.url();

      // check to see if the path already has a slash where it should be
      if (path[path.length - 1] === '/' || path.indexOf('/?') > -1) {
          return;
      }

      if (path.indexOf('?') > -1) {
          return path.replace('?', '/?');
      }

      return path + '/';
  });

}])

.config(['$locationProvider', function($locationProvider) {
  $locationProvider.html5Mode(true);
}]);
