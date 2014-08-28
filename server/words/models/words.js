var util = require('util');
var db = require('../../db');
var mysql = require('mysql');

var validTags = [
  'Cards Against Humanity',
  'Custom',
  'Mature',
  'UT',
  'Pop Culture',
  'Tech',
  'Sports',
  'Contemporary',
  'Literature',
  'Historical',
  'Music',
];

exports.genAddTags = function(joinTableName, wordColName) {
  var sqlTemplate = 'INSERT %s (%s, tId) SELECT ?, tId FROM tbTag WHERE tText IN (?)';
  var sql = util.format(sqlTemplate, joinTableName, wordColName);

  return function(tags) {
    if (tags === undefined || tags.length === 0) {
      return this;
    }

    if (allValidTags(tags)) {
      var instance = this;
      var inserts = [instance.id, tags];
      return this.rawThenSelf(sql, inserts);
    } else {
      throw new Error(util.format("Invalid tags present: %j", tags));
    }
  };
};

function allValidTags(tags) {
  return tags.every(function(tag) {
    return validTags.indexOf(tag) >= 0;
  });
}

// TODO: eventually this shouldn't be done here, but it is easy for now
exports.createTags = function() {
  var sql = 'INSERT INTO tbTag (tText) VALUES (?)';
  validTags.forEach(function(tag) {
    db.query(sql, [tag]);
  });
};

