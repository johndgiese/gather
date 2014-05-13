/*
 * Create a live list of models.
 *
 * - the socket argument is an instance of my special angular-socket class that
 *   is pre-attached the correct scope
 * - models are assumed to have a unique `id` property
 * - the `setupEvent` is assumed to return an array of pre-existing models
 * - the add and remove events are assumed to be fired every time a model is
 *   removed, and they are assumed to have a single model instance
 *
 * Inconsistent data will cause an error to be raised.
 *
 */

app.factory('liveModelList', function() {
  return function(socket, setupEvent, addEvent, removeEvent) {
    var list = [];
    var lookup = {};

    function add(item) {
      if (lookup[item.id] !== undefined)
        throw new Error("Attempting to add pre-existing item!");
      var index = list.length;
      lookup[item.id] = index;
      list[index] = item;
    }

    function remove(item) {
      var index = lookup[item.id];
      if (index === undefined)
        throw new Error("Attempting to remove a non-existent item!");
      delete lookup[item.id];
      list.splice(index, 1);
    }

    socket.emit(setupEvent, null, function(initialItems) {

      initialItems.forEach(add);

      socket.on(addEvent, function(item) {
        add(item);
      });

      socket.on(removeEvent, function(item) {
        remove(item);
      });

    });

    return list;

  };

});
