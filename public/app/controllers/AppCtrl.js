app.controller('AppCtrl', [
  '$scope', 'Socket',
  function($scope, Socket) {
    var socket = new Socket($scope);

    $scope.visits = 0;

    socket.on('visit', function() {
      $scope.visits++;
    });

  }
]);

