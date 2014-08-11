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
 * @returns - promise for the playerGameId
 * @throws {Error} if more than one playerGame exists for the game
 * @throws {Error} if playerGame match is already active
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
        return result.insertId;  // the playerGameId
      });
    } else if (result.length > 1) {
      throw new Error("Multiple playerGame matches for gId=" + gameId + " pId=" + self.id);
    } else if (result[0].pgActive) {
      throw new Error("Existing playerGame (" + result[0].pgId + ") is already active");
    } else {
      return self.M.raw('UPDATE tbPlayerGame SET pgActive=TRUE WHERE pgId=?', result[0].pgId)
      .then(function() {
        return result[0].pgId;
      });
    }
  });
};

Player.prototype.leave = function(party) {
  var inserts = [this.id, party];
  var sql = 'UPDATE tbPlayerGame SET pgActive = FALSE WHERE pId=? ' +
              'AND gId=(SELECT gId from tbGame WHERE gParty=?)';
  return this.M.raw(sql, inserts);
};

