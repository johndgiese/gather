angular.module('util.debugService', [])
.service('debugService', [
  '$timeout', '$location', 'localStorageService',
  function($timeout, $location, localStorageService) {
    if ($location.host() === 'localhost' || localStorageService.get('gatherDebug')) {

      var logContainer = angular.element(
        '<div style="position: fixed; background-color: rgba(255, 255, 255, 0.8); top: 0; width: 100%; pointer-events: none;"></div>'
      );

      window.onload = function() {
        angular.element(document.body).append(logContainer);
      };

      return function debug(message, css) {
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
      };
    } else {
      return function() {};
    }
  }
]);
