angular.module('util.debugService', [])
.service('debugService', ['$timeout', function($timeout) {

  var logContainer = angular.element(
    '<div style="position: fixed; background-color: rgba(255, 255, 255, 0.8); width: 100%;"></div>'
  );

  window.onload = function() {
    angular.element(document.body).append(logContainer);
  };

  function debug(message, css) {
    if (css === undefined) {
      css = {};
    }
    css = angular.extend(css, {
      textAlign: 'center',
      fontWeight: 'bold',
    });
    var entry = angular.element('<p>' + message + '</p>').css(css);
    logContainer.append(entry);
    $timeout(function() {
      entry.remove();
    }, 5000);
  }

  return debug;
}]);
