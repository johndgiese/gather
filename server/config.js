
// Non-local settings go here

var local = require('./_local');
for (key in local) {
  exports[key] = local[key];
}

console.log(exports);
