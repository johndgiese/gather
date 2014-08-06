db = require('../db');

/**
 * Calculate the score of the current game, up to the most recent round.
 * @arg {Number} - game id
 * @return - promise for an array of objects with a pgId and score
 */
// TODO: calculate score differentials for the latest round
// TODO: ensure you aren't counting votes from the current unfinished round (as
// waiting players may see the score in between votes)
exports.currentScore = function(gameId) {
  var sql = 'SELECT tbPlayerGame.pgId AS id, Count(vId) AS score FROM ' +
    'tbVote JOIN tbCard USING (cId) RIGHT JOIN tbPlayerGame ON ' +
    'tbCard.pgId=tbPlayerGame.pgId ' +
    'WHERE gId=? GROUP BY tbPlayerGame.pgId';
  var inserts = [gameId];
  return db.raw(sql, inserts);
};
