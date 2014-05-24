var db = require('./db');
var Q = require('q');
var fs = require('fs');
var path = require('path');


function Model(table, fields) {
  this.setTable(table);
  this.setFields(fields);
}

exports.Model = Model;

Model.prototype.getTable = function() {
  return this._table;
};

Model.prototype.setTable = function(table) {
  this._table = table;
};

Model.prototype.getFields = function() {
  return this._fields;
};

Model.prototype.setFields = function(fieldNames) {
  this._fields = fieldNames;
  if (fieldNames.id === undefined) {
    this._fields.push('id');
  }
};

Model.prototype.getFieldData = function() {
  var data = {};
  var fields = this.getFields();
  var field;
  for (var i = 0, len = fields.length; i < len; i++) {
    field = fields[i];
    if (this[field]) {
      data[field] = this[field];
    }
  }
  return data;
};

Model.prototype.setFieldData = function(data) {
  var instance = this;
  instance.getFields().forEach(function(field) {
    if (data[field] !== undefined) {
      instance[field] = data[field];
    }
  });
  return instance;
};

// mysql query that uses a promise
Model.prototype.query = function() {
  var instance = this;
  var deferred = Q.defer();
  var after = function(error, result) {
    if (error !== null) {
      deferred.reject(error);
    } else {
      deferred.resolve(result);
    }
  };

  if (arguments.length == 2) {
    db.query(arguments[0], arguments[1], after);
  } else if (arguments.length == 1) {
    db.query(arguments[0], after);
  }

  return deferred.promise;
};

// execute a query then return the original instance
Model.prototype.queryThenSelf = function() {
  var instance = this;
  return Model.prototype.query.apply(instance, arguments)
  .then(function() {
    return instance;
  });
};

Model.prototype.save = function () {
  var instance = this;
  var inserts = [this.getTable(), this.getFieldData()];
  return this.query('INSERT INTO ?? SET ?', inserts)
  .then(function(result) {
    instance.id = result.insertId;
    return instance;
  });
};

Model.prototype.delete = function () {
  var instance = this;
  var inserts = [this.getTable(), this.id];
  return this.query('DELETE FROM ?? WHERE id = ?', inserts)
  .then(function(result) {
    var success = result.affectedRows === 1;
    if (success) {
      return true;
    } else {
      var msg = "Unable to delete id = " + instance.id +
                " from " + instance.getTable();
      throw new Error(msg);
    }
  });
};

// Load Model classes from a folder, and expose them as a single module.
// Grabs `Model` export from all modules in this folder that expose one; uses
// the filename as the the module name
exports.modelLoader = function(dir, exports) {
  var allFileNames = fs.readdirSync(dir);

  var fileNames = allFileNames.filter(function(fileName) {
    var isJsFile = fileName.substr(fileName.length - 3) === '.js';
    return fileName !== 'index.js' && isJsFile;
  });

  var modelNames = fileNames.map(function(fileName) {
    return fileName.split('.')[0];  // remove extension
  });

  modelNames.forEach(function(modelName) {
    var modulePath = path.join(dir, modelName);
    var Model = require(modulePath).Model;
    if (Model !== undefined) {
      exports[modelName] = Model;
    }
  });
};

