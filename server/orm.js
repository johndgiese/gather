var db = require('./db');
var Q = require('q');

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

// mysql query that uses a promise
Model.prototype.query = function() {
  var instance = this;
  var deferred = Q.defer();
  var after = function(error, result) {
    if (error) {
      deferred.reject(new Error(error));
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
}


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

