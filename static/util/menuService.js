angular.module('util.menuService', [])
.factory('menuService', [
  '$injector',
  function MenuServiceFactory($injector) {

    var exports = {};

    var items = [];
    var itemGenerators = [];

    function removeItem(items, id) {
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (item.id === id) {
          items.splice(i, 1);
          return;
        }
      }
      throw new Error("Unable to remove item");
    }

    var idCounter = 0;
    var orderCounter = 0;

    exports.currentItems = function() {
      var visibleItems = _.filter(items, function(item) { 
        return item.visible === undefined || $injector.invoke(item.visible);
      });

      _.forEach(itemGenerators, function(itemGenerator) {
        var baseOrder = itemGenerator.order;
        var items = $injector.invoke(itemGenerator.generator);
        _.forEach(items, function(item, index) {
          item.order = baseOrder + index*0.001;
          visibleItems.push(item);
        });
      });

      var sortedItems = _.sortBy(visibleItems, function(item) { return item.order; });

      return _.map(sortedItems, function(item) {
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
    exports.registerItemGenerator = registerItemGenerator;

    return exports;

    /**
     * Register a menu item.
     * @arg {{
     *    title: (string|injectable),
     *    visible?: injectable():boolean, 
     *    action: injectable(),
     *    order?: number
     * }} - a menu item
     * @returns {function} - call it to remove the item from the menu
     */
    function registerItem(item) {
      if (item.order === undefined) {
        item.order = orderCounter++;
      } else {
        orderCounter = Math.max(orderCounter, item.order + 1);
      }
      item.id = idCounter++;
      items.push(item);
      return function() {
        removeItem(items, item.id);
      };
    }

    /**
     * Register an itemGenerator.  The generator property should generate an
     * array of items, except without the `visible` property.
     * @arg {{generator: injectable, order: number}}
     * @returns {function} - call it to remove the item from the menu
     */
    function registerItemGenerator(itemGenerator) {
      if (itemGenerator.order === undefined) {
        itemGenerator.order = orderCounter++;
      } else {
        orderCounter = Math.max(orderCounter, itemGenerator.order + 1);
      }

      itemGenerator.id = idCounter++;

      itemGenerators.push(itemGenerator);
      return function() {
        removeItem(itemGenerators, itemGenerator.id);
      };
    }

  }
]);
