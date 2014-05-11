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

Model.prototype.save = function () {
  var instance = this;
  var deferred = Q.defer();

  var inserts = [this.getTable(), this.getFieldData()];
  var afterInsert = function(error, result) {
    if (error) {
      deferred.reject(new Error(error));
    } else {
      instance.id = result.insertId;
      deferred.resolve(instance);
    }
  }

  db.query('INSERT INTO ?? SET ?', inserts, afterInsert);
  return deferred.promise;
};


Model.prototype.delete = function () {
  var instance = this;
  var deferred = Q.defer();

  var inserts = [this.getTable(), instance.id];
  var afterDelete = function(error, result) {
    if (error) {
      deferred.reject(new Error(error));
    } else {
      var success = result.affectedRows === 1;
      deferred.resolve(success);
    }
  };

  db.query('DELETE FROM ?? WHERE id = ?', inserts, afterDelete);
  return deferred.promise;
};
