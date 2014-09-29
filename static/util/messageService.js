angular.module('util.messageService', [
  'ui.bootstrap',
])

.factory('messageService', [
  '$modal', '$rootScope',
  function($modal, $rootScope) {
    var exports = {};

    /**
     * Display a message to the user, requiring them to press a "continue"
     * button, and return a promise that resolves once they hit continue.
     */
    exports.message = function (message, buttonText) {
      var scope = $rootScope.$new();
      scope.message = message;
      scope.buttonText = buttonText === undefined ? 'Continue' : buttonText;
      var modalInstance = $modal.open({
        templateUrl: '/static/util/templates/message.html',
        scope: scope
      });

      return modalInstance.result
      .then(angular.noop, angular.noop);  // don't allow user to dismiss
    };

    return exports;

  }
]);

