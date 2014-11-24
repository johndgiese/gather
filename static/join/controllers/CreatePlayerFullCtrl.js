angular.module('join')
.controller('CreatePlayerFullCtrl', [
  '$scope', '$modalInstance', '$state', 'nicknameService', 'existingPlayer', 'socket', '$timeout',
  function($scope, $modalInstance, $state, nicknameService, existingPlayer, socket, $timeout) {

    function setFocus(item) {
      // delay focus to allow template rendering
      $timeout(function() {
        $scope.$broadcast(item);
      }, 50);
    }

    $scope.startedRegistering = existingPlayer !== null;

    $scope.step = $scope.startedRegistering ? 'two' : 'one';

    $scope.p = {};
    $scope.p.name = $scope.startedRegistering ? existingPlayer.name : nicknameService();
    $scope.p.email = '';
    $scope.p.password = '';
    $scope.validNickname = true;
    $scope.$watch('p.name', function() { $scope.validNickname = $scope.p.name.length >= 3; });
    $scope.emailTaken = false;

    if ($scope.step === 'one') {
      setFocus('focusName');
    } else {
      setFocus('focusEmail');
    }

    $scope.next = function() { 
      $scope.step = 'two';
      if ($scope.p.email !== '') {
        setFocus('focusPassword');
      } else {
        setFocus('focusEmail');
      }
    };

    $scope.back = function() { 
      $scope.step = 'one';
      setFocus('focusName');
    };

    $scope.currentState = $state.current.name;

    // TODO: de-duplicate between this and reset password
    $scope.validPassword = false;

    $scope.hasLowerCaseLetter = false;
    $scope.hasUpperCaseLetter = false;
    $scope.hasNumber = false;
    $scope.hasSpecial = false;
    $scope.longEnough = false;

    $scope.$watch('p.password', function(password) {
      $scope.longEnough = password.length >= 8;
      $scope.hasLowerCaseLetter = password.search(/[a-z]/) !== -1;
      $scope.hasUpperCaseLetter = password.search(/[A-Z]/) !== -1;
      $scope.hasNumber = password.search(/\d/) !== -1;
      $scope.hasSpecial = password.search(/[\!\@\#\$\%\^\&\*\(\)\_\+]/) !== -1;
      $scope.validPassword = ($scope.hasLowerCaseLetter && $scope.hasUpperCaseLetter && $scope.hasNumber && $scope.hasSpecial && $scope.longEnough);
    });

    $scope.createPlayer = function() {
      $scope.emailTaken = false;
      socket.emitp('checkEmailAvailability', {email: $scope.p.email})
      .then(function(result) {
        // TODO: handle error
        if (result.exists) {
          $scope.emailTaken = true;
          setFocus('focusEmail');
        } else {
          $modalInstance.close({
            name: $scope.p.name,
            email: $scope.p.email,
            password: $scope.p.password,
          });
        }
      });
    };

  }
]);


