var orm = require('../../orm');


var fields = {
  voter: 'pgId',
  card: 'cId',
  createdOn: 'vCreatedOn',
};
var Vote = orm.define('tbVote', fields, 'vId');
exports.Model = Vote;

