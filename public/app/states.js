app.config(['$stateProvider', function($stateProvider) {

  $stateProvider

  .state('landing', {
    url: '/',
    controller: 'LandingCtrl',
    templateUrl: 'templates/landing.html',
  })

  .state('create', {
    url: '/create',
    controller: 'CreateCtrl',
    templateUrl: 'templates/create.html',
  })

  .state('search', {
    url: '/search',
    controller: 'SearchCtrl',
    templateUrl: 'templates/search.html',
  });

}]);


app.config(['$urlRouterProvider', function($urlRouterProvider) {
  $urlRouterProvider.otherwise('/');
}]);


app.config(['$locationProvider', function($locationProvider) {
  $locationProvider.html5Mode(true);
}]);
