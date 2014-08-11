db = require('../db');

/**
 * Calculate the score of the current game, up to the most recent round.
 * @arg {Number} - game id
 * @return - promise for an array of objects with a pgId and score
 */
exports.currentScore = function(gameId) {
  var sql = 'SELECT tbPlayer.pName AS name, tbPlayerGame.pgId AS id, Count(vId) AS score FROM ' +
    'tbVote JOIN tbCard USING (cId) RIGHT JOIN tbPlayerGame ON ' +
    '(tbCard.pgId=tbPlayerGame.pgId) JOIN tbPlayer USING (pId) ' +
    'WHERE gId=? AND ' +
    'tbCard.rId NOT IN (SELECT rId FROM tbRound WHERE gId=? AND rDoneVoting=NULL) ' +
    'GROUP BY tbPlayerGame.pgId';
  var inserts = [gameId, gameId];
  return db.raw(sql, inserts);
};
