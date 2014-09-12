angular.module('util.debugService', [])
.service('debugService', ['$timeout', function($timeout) {

  var logContainer = angular.element(
    '<div style="position: fixed; background-color: rgba(250, 240, 240, 0.2); width: 100%;"></div>'
  );

  window.onload = function() {
    angular.element(document.body).append(logContainer);
  };

  function debug(message) {
    var entry = angular.element('<p style="text-align: center;">' + message + '</p>');
    logContainer.append(entry);
    $timeout(function() {
      entry.remove();
    }, 2000);
  }

  return debug;
}]);
