var orm = require('../../orm');


var fields = {
  response: 'resId',
  round: 'rId',
  owner: 'pgId',
  createdOn: 'cCreatedOn',
  playedOn: 'cPlayedOn',
};
var Card = orm.define('tbCard', fields, 'cId');
exports.Model = Card;


Card.queryHand = function(playerGameId) {
  var sql = 'SELECT cId, resText FROM tbCard ' +
    'NATURAL JOIN tbPlayerGame ' + 
    'NATURAL JOIN tbResponse ' + 
    'WHERE rId=NULL AND pgId=?';

  var inserts = [playerGameId];
  return Card.query(sql, inserts);
};
