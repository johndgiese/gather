var orm = require('../../orm');
var logger = require('../../logger');


var fields = {
  game: 'gId',
  prompt: 'proId',
  reader: 'pgId',
  number: 'rNumber',
  createdOn: 'rCreatedOn',
};
var Round = orm.define('tbRound', fields, 'rId');
exports.Model = Round;

/**
 * Create a new round for the current game of the specified party.
 */
Round.newByGame = function(gameId) {
  var prompterListProm = this.raw('SELECT pgId, pgActive FROM tbPlayerGame WHERE gId=? ORDER BY pgCreatedOn', [gameId]);

  var lastPrompterProm = this.raw('SELECT pgId FROM tbRound WHERE gId=? ORDER BY rCreatedOn LIMIT 1', [gameId]);

  // TODO: make this smarter
  // TODO: handle the case when all prompts have been used!
  var nextPromptProm = this.raw('SELECT proId, proText FROM tbPrompt WHERE proId NOT IN (SELECT proId FROM tbRound WHERE gId=?) AND proActive=TRUE ORDER BY RAND() LIMIT 1', [gameId]);

  return Q.all([prompterListProm, lastPrompterProm, nextPromptProm])
  .then(function(data) {
    console.log(data);
    prompterList = data[0];
    lastPrompter = data[1];
    var prompter;

    nextPrompt = data[2];
  });
};

Round.queryByParty = function(party) {
  inserts = [this.table, party];
  var sql = 'SELECT * from ?? NATURAL JOIN tbGame where gParty=?';
  return this.query(sql, inserts);
};
