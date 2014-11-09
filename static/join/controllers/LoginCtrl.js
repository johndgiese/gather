angular.module('join')
.controller('LoginCtrl', [
  '$scope', '$modalInstance', 'socket', 'login', 'sendPasswordReset',
  function($scope, $modalInstance, socket, login, sendPasswordReset) {

    $scope.internalPage = 'login';
    $scope.goTo = function(state) {
      $scope.internalPage = state;
    };

    $scope.p = {};
    $scope.p.email = '';
    $scope.incorrectEmail = false;
    $scope.p.password = '';
    $scope.incorrectPassword = false;

    $scope.$watch('p.email', function(newVal, oldVal) {
      if (newVal !== oldVal) {
        $scope.incorrectEmail = false;
      }
    });

    $scope.$watch('p.password', function(newVal, oldVal) {
      if (newVal !== oldVal) {
        $scope.incorrectPassword = false;
      }
    });

    $scope.login = function() {
      login($scope.p.email, $scope.p.password)
      .then(function(player) {
        $modalInstance.close(player);
      }, function(reason) {
        if (reason === 'password') {
          $scope.incorrectEmail = false;
          $scope.incorrectPassword = true;
          $scope.$broadcast('incorrectPassword');
        } else if (reason === 'email') {
          $scope.incorrectEmail = true;
          $scope.incorrectPassword = false;
          $scope.$broadcast('incorrectEmail');
        } else {
          $scope.goTo('error');
        }
      });
    };


    $scope.sendPasswordReset = function() {
      sendPasswordReset($scope.p.email)
      .then(function() {
        $scope.goTo('success');
      }, function(reason) {
        $scope.goTo('error');
      });
    };

  }
]);


