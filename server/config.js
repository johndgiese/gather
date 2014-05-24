
// Non-local settings go here

var local = require('./_local');
for (var key in local) {
  exports[key] = local[key];
}

