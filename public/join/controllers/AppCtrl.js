angular.module('join')
.controller('AppCtrl', [
  '$scope', '$state', 'liveModelList', 'ScopedSocket',
  function($scope, $state, liveModelList, ScopedSocket) {
    var socket = new ScopedSocket($scope);

    $scope.notifications = [];

    socket.on('notifyPlayer', function(notification) {
      $scope.notifications.push(notification);
    });

    $scope.home = function() {
      $state.go('landing');
    };
  }
]);

