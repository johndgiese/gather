app.factory('Value', function() {
  function Value(init) {
    var internal = init;
    this.get = function() { return internal };
    this.set = function(val) { internal = val };
  }
  return Value;
});
