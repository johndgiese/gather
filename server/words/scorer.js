db = require('../db');

/**
 * Calculate the score of the current game, not using votes in unfinished rounds.
 * @arg {Number} - game id
 * @return - promise for an array of objects with a pgId and score
 */
exports.currentScore = function(gameId) {
  var sql = 'SELECT tbPlayer.pName AS name, tbPlayerGame.pgId AS id, Count(vId) AS score FROM ' +
    'tbVote JOIN ( ' +
      'SELECT * FROM tbCard WHERE tbCard.rId NOT IN ' +
        '(SELECT rId FROM tbRound WHERE gId=? AND rDoneVoting IS NULL) ' +
      ') AS cardsInOlderRounds ' +
    'USING (cId) RIGHT JOIN tbPlayerGame ON ' +
    '(cardsInOlderRounds.pgId=tbPlayerGame.pgId) JOIN tbPlayer USING (pId) ' +
    'WHERE gId=? GROUP BY tbPlayerGame.pgId';
  var inserts = [gameId, gameId];
  return db.raw(sql, inserts);
};

/**
 * Calculate score changes during the most recent round.
 */
exports.scoreDifferential = function(gameId) {
  var sql = 'SELECT tbPlayerGame.pgId AS id, Count(vId) AS score FROM ' +
    'tbVote JOIN tbCard USING (cId) RIGHT JOIN tbPlayerGame ON ' +
    '(tbCard.pgId=tbPlayerGame.pgId) WHERE ' +
    'tbCard.rId=(SELECT rId FROM tbRound WHERE gId=? ORDER BY rNumber DESC LIMIT 1)' +
    'GROUP BY tbPlayerGame.pgId';
  var inserts = [gameId, gameId];
  return db.raw(sql, inserts);
};
