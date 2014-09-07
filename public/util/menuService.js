angular.module('util.menuService', [])
.provider('menuService',
  function MenuServiceProvider() {

    items = [];

    this.registerItem = registerItem;

    this.$get = ['$injector', function($injector) {
      var exports = {};

      exports.currentItems = function() {

        var visibleItems = _.filter(items, function(item) { 
          return item.visible === undefined || $injector.invoke(item.visible);
        });

        return _.map(visibleItems, function(item) {
          var publicItem = {};

          publicItem.action = function() {
            return $injector.invoke(item.action);
          };

          if (angular.isFunction(item.title)) {
            publicItem.title = $injector.invoke(item.title);
          } else {
            publicItem.title = item.title;
          }

          if (item.visible !== undefined) {
            publicItem.visible = function() {
              return $injector.invoke(item.visible);
            };
          }

          return publicItem;
        });
      };

      exports.registerItem = registerItem;

      return exports;
    }];

    function registerItem(item) {
      items.push(item);
    }

  }
);
