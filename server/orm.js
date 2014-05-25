var db = require('./db');
var Q = require('q');
var fs = require('fs');
var path = require('path');
var _ = require('underscore');


exports.Model = Model;
exports.define = define;
exports.loader = loader;

function define(table, propFieldMap, idField) {

  var map = _.extend(propFieldMap, {id: idField});
  var props = _.keys(map);
  var fields = _.values(map);

  var M = function(data) {
    this.M = M;
    this.hydrate(data);
  };

  // add row/instance functions
  M.prototype = new Model(map);
  
  // add table/Model functions
  M.M = M;
  M.table = table;
  M.idField = idField;
  M.props = props;
  M.fields = fields;
  _.extend(M, Model);

  return M;
}

function Model(map) {
  var self = this;
  _.each(map, function(field, prop) {
    if (field !== prop) {
      self.__defineGetter__(field, function() { return self[prop]; });
      self.__defineSetter__(field, function(val) { self[prop] = val; });
    }
  });
}

Model.prototype.hydrate = function(data) {
  var keys = _.keys(data);
  var self = this;

  var allKeysAreFields = _.every(keys, function(k) {
    return _.include(self.M.fields, k);
  });

  var allKeysAreProps = _.every(keys, function(k) {
    return _.include(self.M.props, k);
  });

  if (allKeysAreFields || allKeysAreProps) {
    _.extend(this, data);
  } else {
    console.log("Hydrating with %j", data);
    throw new Error("Keys must be all fields or all properties");
  }
};

Model.prototype.fieldData = function(fields) {
  if (fields === undefined) {
    fields = this.M.fields;
  }
  var fieldData = {};
  for (var i = 0, len = fields.length; i < len; i++) {
    var field = fields[i];
    if (this[field] !== undefined) {
      fieldData[field] = this[field];
    }
  }
  return fieldData;
};

Model.raw = Model.prototype.raw = function() {
  var deferred = Q.defer();
  var after = function(error, result) {
    if (error !== null) {
      console.log(error);
      deferred.reject(error);
    } else {
      console.log(result);
      deferred.resolve(result);
    }
  };

  console.log(arguments);
  if (arguments.length == 2) {
    db.query(arguments[0], arguments[1], after);
  } else if (arguments.length == 1) {
    db.query(arguments[0], after);
  }

  return deferred.promise;
};

Model.query = function() {
  var M = this.M;
  M.raw(arguments)
    .then(function(raw) {
      if (_.isObject(result)) {
         return new M(result);
      } else {
        objs = [];
        for (var i = 0, len = result.length; i < len; i++) {
          objs.push(new M(result[i]));
        }
        return objs;
      }
    });
};

// execute a query then return the original self
Model.prototype.rawThenSelf = function() {
  return this.raw.apply(self, arguments)
  .then(function() {
    return self;
  });
};

Model.prototype.save = function () {
  var deferred = Q.defer();
  var self = this;
  if (self.id === undefined) {
    var data = self.fieldData();
    if (_.isEmpty(data)) {
      deferred.reject(new Error("Nothing to save"));
    } else {
      var inserts = [this.M.table, fieldData];
      this.raw('INSERT INTO ?? SET ?', inserts)
      .then(function(result) {
        self.id = result.insertId;
        deferred.resolve(self);
      });
    }
  } else {
    deferred.reject(new Error("Update part of saving not implemented yet"));
  }
  return deferred.promise;
};

Model.prototype.delete = function () {
  var self = this;
  var inserts = [this.M.table, this.M.idField, this.id];
  return this.raw('DELETE FROM ?? WHERE ??=?', inserts)
    .then(function(result) {
      var success = result.affectedRows === 1;
      if (success) {
        return true;
      } else {
        var msg = "Unable to delete id = " + self.id +
                  " from " + self.M.table;
        throw new Error(msg);
      }
    });
};

// Load Model classes from a folder, and expose them as a single module.
// Grabs `Model` export from all modules in this folder that expose one; uses
// the filename as the the module name
function loader(dir, exports) {
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
}

