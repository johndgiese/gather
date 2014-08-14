var orm = require('../../orm');
var _ = require('underscore');


var fields = {
  response: 'resId',
  round: 'rId',
  owner: 'pgId',
  createdOn: 'cCreatedOn',
  playedOn: 'cPlayedOn',
};
var Card = orm.define('tbCard', fields, 'cId');
exports.Model = Card;


Card.play = function(cardId, roundId) {
  var sql = 'UPDATE ?? SET rId=? WHERE ??=?';
  var inserts = [this.table, roundId, this.idField, cardId];
  return this.raw(sql, inserts);
};


Card.serializeHand = function(playerGameId) {
  var sql = 'SELECT cId AS id, resText AS text FROM tbCard ' +
    'NATURAL JOIN tbPlayerGame ' +
    'NATURAL JOIN tbResponse ' +
    'WHERE rId IS NULL AND pgId=?';

  var inserts = [playerGameId];
  return Card.raw(sql, inserts);
};

Card.forApi = function(cardId) {
  var sql = 'SELECT cId AS id, resText AS text FROM ' +
    'tbCard JOIN tbPlayerGame USING (pgId) JOIN tbResponse USING (resId) ' +
    'WHERE cId=?';

  var inserts = [cardId];
  return Card.rawOne(sql, inserts);
};

Card.queryLatestByGame = function(gameId) {
  // get latest batch of choices for a game
  inserts = [gameId];
  var sql = 'SELECT pgId, cId AS id, resText AS text FROM ' +
    'tbCard JOIN tbPlayerGame USING (pgId) JOIN tbResponse USING (resId) ' +
    'WHERE rId=(SELECT rId FROM tbRound WHERE gId=? AND rDoneVoting IS NULL)';
  return this.raw(sql, inserts)
  .then(function(cards) {
    return _.map(cards, function(c) {
      return {
        player: c.pgId,
        card: {
          id: c.id,
          text: c.text
        }
      };
    });
  });
};

