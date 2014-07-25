var orm = require('../../orm');
var logger = require('../../logger');
var dealer = require('../dealer');


var fields = {
  game: 'gId',
  prompt: 'proId',
  reader: 'pgId',
  number: 'rNumber',
  createdOn: 'rCreatedOn',
  doneReadingPrompt: 'rDoneReadingPrompt', 
  doneReadingChoices: 'rDoneReadingChoices', 
};
var Round = orm.define('tbRound', fields, 'rId');
exports.Model = Round;

/**
 * Create a new round for the current game of the specified party.
 */
Round.newByGame = function(gameId) {
  var readerListProm = this.raw('SELECT pgId, pgActive FROM tbPlayerGame WHERE gId=? ORDER BY pgCreatedOn DESC', [gameId]);

  var lastRoundProm = this.raw('SELECT pgId, rNumber FROM tbRound WHERE gId=? ORDER BY rCreatedOn DESC LIMIT 1', [gameId]);

  var promptProm = dealer.dealPrompt(gameId);

  return Q.all([readerListProm, lastRoundProm, promptProm])
  .then(function(data) {
    var readerList = data[0];
    var lastRound = data[1];
    var prompt = data[2][0];

    var reader, number;
    if (lastRound.length === 0) {
      reader = readerList[0];
      number = 1;
    } else {
      reader = getNextActivePrompter(readerList, lastRound.pgId);
      number = lastRound.number++;
    }

    var roundData = {
      game: gameId,
      prompt: prompt.proId,
      reader: reader.pgId,
      number: number,
    };

    return new Round(roundData).save();
  });
};

/**
 * Loop through players in the game and select the next person in line to be a
 * reader for the round.  Cycles in order based on when players join the
 * game.  Skips active players.
 * @param - array of readers (includes their id and whether they are active;
 * sorted in order of time joined the game)
 * @param {Number} - the last person to have been reader for a round
 */
function getNextActivePrompter(readerList, lastPrompterId) {
  var index = _.find(readerList, function(p) {
    return p.pgId === lastPrompterId;
  });

  var nextPrompter;
  var n = readerList.length;
  do {
    index = index + 1;
    index = ((index % n) + n) % n;
    nextPrompter = readerList[index];
  } while (!nextPrompter.active && nextPrompter.pgId !== lastPrompterId);

  return nextPrompter;
}

Round.queryByParty = function(party) {
  var inserts = [this.table, party];
  var sql = 'SELECT * from ?? NATURAL JOIN tbGame where gParty=?';
  return this.query(sql, inserts);
};

Round.forApiByParty = function(party) {
  var sql = 'SELECT rId AS id, pgId AS reader, rNumber AS NUMBER, proText AS prompt ' + 
    'FROM tbRound NATURAL JOIN tbPrompt NATURAL JOIN tbGame ' + 
    'WHERE gParty=?';
  var inserts = [party];
  return Round.raw(sql, inserts);
};

Round.queryLatestByParty = function(party) {
  inserts = [this.table, this.table, party];
  var sql = 'SELECT ??.* FROM ?? NATURAL JOIN tbGame where gParty=? ORDER BY rCreatedOn DESC LIMIT 1';
  return this.queryOne(sql, inserts);
};

Round.queryLatestById = function(gameId) {
  inserts = [this.table, gameId];
  var sql = 'SELECT * FROM ?? ORDER BY rCreatedOn DESC LIMIT 1';
  return this.queryOne(sql, inserts);
};

Round.prototype.forApi = function() {
  var self = this;
  var sql = "SELECT proText FROM tbPrompt WHERE proId=?";
  var inserts = self.prompt;
  return Round.raw(sql, inserts)
  .then(function(data) {
    return {
      id: self.id,
      reader: self.reader,
      number: self.number,
      prompt: data[0].proText,
    };
  });
};

Round.prototype.markDoneReadingPrompt = function() {
  if (this.doneReadingPrompt !== null) {
    throw "The reader has already finished reading the prompt!";
  } else {
    this.doneReadingPrompt = new Date();
    return this.save();
  }
};

Round.prototype.markDoneReadingChoices = function() {
  if (this.doneReadingChoices !== null) {
    throw "The reader has already finished reading the choices!";
  } else if (this.doneReadingPrompt === null ) {
    throw "Not the right time to finish reading choices!";
  } else {
    this.doneReadingChoices = new Date();
    return this.save();
  }
};

