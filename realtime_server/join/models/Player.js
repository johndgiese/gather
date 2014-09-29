var orm = require('../../orm');
var db = require('../../db');

var fields = {
  name: 'pName',
  createdOn: 'pCreatedOn'
};
var Player = orm.define('tbPlayer', fields, 'pId');
exports.Model = Player;

/**
 * Make the current player join (or rejoin) the specified game.  If a playerGame
 * exists, set it to active.  If not create one.
 * @arg {number} - playerGame
 * @returns - promise for the playerGameId and whether to broadcast
 * @throws {Error} if more than one playerGame exists for the game
 */
Player.prototype.join = function(gameId) {
  var self = this;
  return this.M.raw('SELECT pgId, pgActive FROM tbPlayerGame WHERE pId=? AND gId=?', [this.id, gameId])
  .then(function(result) {
    if (result.length === 0) {
      var playerGameData = {
        pId: self.id,
        gId: gameId
      };
      var inserts = [playerGameData];
      return self.M.raw('INSERT tbPlayerGame SET ?', inserts)
      .then(function(result) {
        return {playerGameId: result.insertId, broadcast: true};
      });
    } else if (result.length > 1) {
      throw new Error("Multiple playerGame matches for gId=" + gameId + " pId=" + self.id);
    } else {
      var isActive = result[0].pgActive;
      if (isActive) {
        return Q.when({playerGameId: result[0].pgId, broadcast: false});
      } else {
        // if inactive, broadcast the rejoin
        return self.M.raw('UPDATE tbPlayerGame SET pgActive=TRUE WHERE pgId=?', result[0].pgId)
        .then(function() {
          return {playerGameId: result[0].pgId, broadcast: true};
        });
      }
    }
  });
};

Player.prototype.leave = function(party) {
  var inserts = [this.id, party];
  var sql = 'UPDATE tbPlayerGame SET pgActive = FALSE WHERE pId=? ' +
              'AND gId=(SELECT gId from tbGame WHERE gParty=?)';
  return this.M.raw(sql, inserts);
};

Player.queryFromPlayerGameId = function(playerGameId) {
  var inserts = [playerGameId];
  var sql = 'SELECT * FROM tbPlayer WHERE pId=(' + 
              'SELECT pId FROM tbPlayerGame WHERE pgId=?);';
  return Player.queryOne(sql, inserts);
};
