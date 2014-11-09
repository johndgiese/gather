angular.module('join')
.controller('LoginCtrl', [
  '$scope', '$modalInstance', 'socket', 'login',
  function($scope, $modalInstance, socket, login) {

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
        if (reason === "password") {
          $scope.incorrectEmail = false;
          $scope.incorrectPassword = true;
          // TODO: focus on element
        } else {
          $scope.incorrectEmail = true;
          // TODO: focus on element
        }
      });
    };

  }
]);


