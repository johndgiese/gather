var orm = require('../../orm');


var fields = {
  voter: 'pgId',
  card: 'cId',
  createdOn: 'vCreatedOn',
};
var Vote = orm.define('tbVote', fields, 'vId');
exports.Model = Vote;


Vote.alreadyVotedByGame = function(gameId) {
  var sql = 'SELECT tbVote.pgId AS player FROM ' +
    'tbVote JOIN tbCard USING (cId) JOIN tbPlayerGame ON (tbVote.pgId=tbPlayerGame.pgId)' +
    'WHERE rId=(SELECT rId FROM tbRound WHERE gId=? ORDER BY rCreatedOn DESC LIMIT 1) ' +
    'AND pgActive=TRUE';

  var inserts = [gameId];
  return this.raw(sql, inserts);
};
