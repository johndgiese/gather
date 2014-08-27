angular.module('words_analytics')
.config(['$stateProvider', function($stateProvider) {

  $stateProvider

  .state('wordsAnalytics', {
    url: '/analytics/',
    controller: 'WordsAnalyticsCtrl',
    templateUrl: '/static/words_analytics/templates/analytics.html',
  });


}]);

