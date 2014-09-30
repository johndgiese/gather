angular.module('join')
.controller('LandingCtrl', [
  '$scope', 'wordsShareService',
  function($scope, wordsShareService) {
    var promptId = 38;
    var responseIds = [350, 343, 336, 329, 307, 306, 283];

    $scope.win = wordsShareService.win(promptId, responseIds[0]);
    $scope.hand = wordsShareService.hand(promptId, responseIds);
    $scope.mychoice = wordsShareService.mychoice(promptId, responseIds[0]);
    $scope.groupchoices = wordsShareService.groupchoices(promptId, responseIds);
  }
]);

