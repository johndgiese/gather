db = require('../db');

/**
 * Calculate the score of the current game, up to the most recent round.
 * @arg {Number} - game id
 * @return - promise for an object where keys are pgIds, values are scores
 */
// TODO: calculate score differentials for the latest round
// TODO: ensure you aren't counting votes from the current unfinished round (as
// waiting players may see the score in between votes)
exports.currentScore = function(gameId) {
  var sql = 'SELECT pName AS name, Count(vId) AS score FROM ' +
    'tbVote JOIN tbCard USING (cId) RIGHT JOIN tbPlayerGame ON ' +
    'tbCard.pgId=tbPlayerGame.pgId JOIN tbPlayer USING (pId)' +
    'WHERE gId=? GROUP BY tbPlayerGame.pgId ORDER BY score DESC';
  var inserts = [gameId];
  return db.raw(sql, inserts);
};
