var db = require('./db');
var Q = require('q');
var fs = require('fs');
var path = require('path');
var _ = require('underscore');


exports.Model = Model;
exports.define = define;
exports.loader = loader;

function define(table, propFieldMap, idField) {

  var map = _.extend(_.clone(propFieldMap), {id: idField});
  var props = _.keys(map);
  var fields = _.values(map);

  var M = function(data) {
    this.M = M;
    this.hydrate(data);
  };

  // add row/instance functions
  M.prototype = new Model(map);
  
  // add table/Model functions
  M.table = table;
  M.idField = idField;
  M.props = props;
  M.fields = fields;
  M.propFieldMap = map;
  _.extend(M, Model);

  return M;
}

function Model(map) {
  var self = this;
  _.each(map, function(field, prop) {
    if (field !== prop) {
      self.__defineGetter__(field, function() { 
        return this[prop]; 
      });
      self.__defineSetter__(field, function(val) {
        this[prop] = val; 
      });
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
    for (var i = 0, len = keys.length; i < len; i++) {
      this[keys[i]] = data[keys[i]];
    }
  } else {
    throw new Error("Keys must be all fields or all properties");
  }
};

Model.prototype.fieldData = function(props) {
  if (props === undefined) {
    props = this.M.props;
  }
  var fieldData = {};
  for (var i = 0, len = props.length; i < len; i++) {
    var prop = props[i];
    if (this[prop] !== undefined && prop !== 'id') {
      var field = this.M.propFieldMap[prop];
      fieldData[field] = this[prop];
    }
  }
  return fieldData;
};

Model.prototype.serialize = function(props) {
  if (props === undefined) {
    props = this.M.props;
  }
  return _.pick(this, props);
};

Model.raw = db.raw;
Model.rawOne = db.rawOne;

Model.query = function() {
  var Model = this;
  return Model.raw.apply(null, arguments)
  .then(function(raw) {
    var objs = [];
    for (var i = 0, len = raw.length; i < len; i++) {
      objs.push(new Model(raw[i]));
    }
    return objs;
  });
};

Model.queryOne = function() {
  return this.query.apply(this, arguments)
  .then(function(matches) {
    if (matches.length === 0) {
      throw new Error("No match found");
    } else if (matches.length > 1) {
      throw new Error("Multiple matches!");
    } else {
      return matches[0];
    }
  });
};

Model.queryOneId = function(id) {
  inserts = [this.table, this.idField, id];
  var sql = 'SELECT * from ?? where ??=?';
  return this.queryOne(sql, inserts);
};

// execute a query then return the original self
Model.prototype.rawThenSelf = function() {
  var self = this;
  return this.M.raw.apply(self, arguments)
  .then(function() {
    return self;
  });
};

Model.prototype.save = function () {
  var self = this;
  var data = self.fieldData();
  var inserts;

  if (self.id === undefined) {
    var setId = function(result) {
      self.id = result.insertId;
      return self;
    };

    if (_.isEmpty(data)) {
      inserts = [this.M.table, this.M.idField];
      return this.M.raw('INSERT INTO ?? (??) VALUES (NULL)', inserts)
      .then(setId);
    } else {
      inserts = [this.M.table, data];
      return this.M.raw('INSERT INTO ?? SET ?', inserts)
      .then(setId);
    }

  } else {

    if (_.isEmpty(data)) {
      return Q.when(self);
    } else {
      inserts = [this.M.table, data, this.M.idField, this.id];
      return this.rawThenSelf('UPDATE ?? SET ? WHERE ??=?', inserts);
    }
  }
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

