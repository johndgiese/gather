angular.module('join')
.factory('menuService', [
  function MenuServiceFactory() {
    var exports = {};

    var items = [];

    exports.currentItems = function() {
      return _.filter(items, function(item) { 
        return item.visible === undefined || item.visible();
      });
    };

    exports.registerItem = function(item) {
      items.push(item);
    };

    return exports;
  }
]);
