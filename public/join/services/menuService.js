angular.module('join')
.factory('menuService', [
  '$injector',
  function MenuServiceFactory($injector) {
    var exports = {};

    var items = [];

    exports.currentItems = function() {
      return _.filter(items, function(item) { 
        return item.visible === undefined || item.visible();
      });
    };

    exports.registerItem = function(item) {
      var originalAction = item.action;
      item.action = function() {
        return $injector.invoke(originalAction);
      };
      items.push(item);
    };

    return exports;
  }
]);
