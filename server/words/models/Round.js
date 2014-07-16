var orm = require('../../orm');
var logger = require('../../logger');


var fields = {
  game: 'gId',
  prompt: 'proId',
  reader: 'pgId',
  number: 'rNumber',
  createdOn: 'rCreatedOn',
};
var Round = orm.define('tbRound', fields, 'rId');
exports.Model = Round;

/**
 * Create a new round for the current game of the specified party.
 */
Round.newByParty = function(party) {
  // TODO: finish this
  //inserts = [this.table, party];
  //var sql = 'INSERT ?? SET SELECT * from ?? where gParty=?';
  //return this.queryOne(sql, inserts);
};

Round.queryByParty = function(party) {
  inserts = [this.table, party];
  var sql = 'SELECT * from ?? NATURAL JOIN tbGame where gParty=?';
  return this.query(sql, inserts);
};
