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

var FOR_API_SQL = 'SELECT cId AS id, resText AS text, resId AS responseId FROM ' +
    'tbCard JOIN tbPlayerGame USING (pgId) JOIN tbResponse USING (resId) ';

Card.play = function(cardId, roundId) {
  var sql = 'UPDATE ?? SET rId=? WHERE ??=?';
  var inserts = [this.table, roundId, this.idField, cardId];
  return this.raw(sql, inserts);
};


Card.serializeHand = function(playerGameId) {
  var sql = FOR_API_SQL + 'WHERE rId IS NULL AND pgId=?';
  var inserts = [playerGameId];
  return Card.raw(sql, inserts);
};


Card.forApi = function(cardId) {
  var sql = FOR_API_SQL + 'WHERE cId=?';
  var inserts = [cardId];
  return Card.rawOne(sql, inserts);
};


Card.queryLatestByGame = function(gameId) {
  // get latest batch of choices for a game
  inserts = [gameId];
  var sql = FOR_API_SQL + 'WHERE rId=(SELECT rId FROM tbRound WHERE gId=? AND rDoneVoting IS NULL)';
  return this.raw(sql, inserts)
  .then(function(cards) {
    return _.map(cards, function(c) {
      return {
        player: c.pgId,
        card: {
          id: c.id,
          text: c.text,
          responseId: c.responseId
        }
      };
    });
  });
};


/**
 * Given a playerGameId and an array of responseIds, insert them into their
 * hand; return a list of card objects (ready for Api).
 */
Card.dealFor = function(playerGameId, responseIds) {
  var cardData = _.map(responseIds, function(r) { return [playerGameId, r]; });
  var inserts = [cardData];
  var sql = 'INSERT INTO tbCard (pgId, resId) VALUES ?';
  return this.raw(sql, inserts)
  .then(function(result) {
    var sql = FOR_API_SQL + 'WHERE pgId=? AND resId IN (?)';
    var inserts = [playerGame, responseIds];
    return Card.raw(sql, inserts);
  });
};
