var fs = require('fs');

// Assumes all other modules in this folder export a `model` whose name matches
// the module name; this file aggregates these into a single `models` module.

function getModelNames() {
  var thisFileName = __filename.split('/').pop();
  var allFileNames = fs.readdirSync(__dirname);

  var fileNames = allFileNames.filter(function(fileName) {
    return fileName !== thisFileName;
  });

  var modelNames = fileNames.map(function(fileName) {
    return fileName.split('.')[0];  // remove extension
  });

  return modelNames;
}

var modelNames = getModelNames();

modelNames.forEach(function(modelName) {
  exports[modelName] = require('./' + modelName).model;
});
