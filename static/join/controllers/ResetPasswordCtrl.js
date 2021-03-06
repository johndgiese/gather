angular.module('join')
.controller('ResetPasswordCtrl', [
  '$scope', '$state', '$stateParams', 'playerService',
  function($scope, $state, $stateParams, playerService) {
    $scope.showError = false;
    $scope.p = {};
    $scope.p.newPassword = '';
    $scope.p.newPasswordAgain = '';
    $scope.validPassword = false;

    $scope.hasLowerCaseLetter = false;
    $scope.hasUpperCaseLetter = false;
    $scope.hasNumber = false;
    $scope.hasSpecial = false;
    $scope.longEnough = false;

    function validatePassword(password) {
      $scope.longEnough = password.length >= 8;
      $scope.hasLowerCaseLetter = password.search(/[a-z]/) !== -1;
      $scope.hasUpperCaseLetter = password.search(/[A-Z]/) !== -1;
      $scope.hasNumber = password.search(/\d/) !== -1;
      $scope.hasSpecial = password.search(/[\!\@\#\$\%\^\&\*\(\)\_\+]/) !== -1;
      $scope.match = $scope.p.newPassword === $scope.p.newPasswordAgain;
      $scope.validPassword = ($scope.hasLowerCaseLetter && $scope.hasUpperCaseLetter && $scope.hasNumber && $scope.hasSpecial && $scope.longEnough && $scope.match);
    }

    $scope.$watch('p.newPassword', validatePassword);
    $scope.$watch('p.newPasswordAgain', validatePassword);

    $scope.resetPassword = function() {
      $scope.showError = false;
      var playerId = parseInt($stateParams.playerId);
      var token = $stateParams.token;
      return playerService.resetPassword(playerId, token, $scope.p.newPassword)
      .then(function() {
        $state.go('app.resetPasswordComplete');
      }, function() { 
        $scope.showError = true;
      });
    };

  }
]);


