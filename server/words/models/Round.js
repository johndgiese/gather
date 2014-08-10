var orm = require('../../orm');
var logger = require('../../logger');
var dealer = require('../dealer');
var _ = require('underscore');


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
  var readerListProm = this.raw('SELECT pgId, pgActive AS active FROM tbPlayerGame WHERE gId=? ORDER BY pgCreatedOn', [gameId]);

  var lastRoundProm = this.raw('SELECT pgId, rNumber AS number FROM tbRound WHERE gId=? ORDER BY rCreatedOn DESC LIMIT 1', [gameId]);

  var promptProm = dealer.dealPrompt(gameId);

  return Q.all([readerListProm, lastRoundProm, promptProm])
  .then(function(data) {
    var readerList = data[0];
    var lastRound = data[1][0];
    var prompt = data[2][0];

    var reader, number;
    if (lastRound === undefined) {
      reader = readerList[0];
      number = 1;
    } else {
      reader = getNextActivePrompter(readerList, lastRound.pgId);
      number = lastRound.number + 1;
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

  // get the index of the previous prompter
  var lastReader = _.find(readerList, function(p) {
    return p.pgId === lastPrompterId;
  });
  var index = _.indexOf(readerList, lastReader);

  var nextPrompter;
  var n = readerList.length;
  do {
    index = index + 1;
    index = ((index % n) + n) % n;
    nextPrompter = readerList[index];
  } while (!nextPrompter.active && nextPrompter.pgId !== lastPrompterId);

  return nextPrompter;
}

Round.queryByGame = function(party) {
  var inserts = [this.table, party];
  var sql = 'SELECT * from ?? NATURAL JOIN tbGame where gId=?';
  return this.query(sql, inserts);
};

Round.forApiByGame = function(gameId) {
  var sql = 'SELECT rId AS id, pgId AS reader, rNumber AS number, proText AS prompt ' +
    'FROM tbRound NATURAL JOIN tbPrompt NATURAL JOIN tbGame ' +
    'WHERE gId=? ORDER BY rNumber';
  var inserts = [gameId];
  return Round.raw(sql, inserts);
};

Round.queryLatestByGame = function(gameId) {
  inserts = [this.table, this.table, gameId];
  var sql = 'SELECT ??.* FROM ?? NATURAL JOIN tbGame WHERE gId=? ORDER BY rCreatedOn DESC LIMIT 1';
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
    throw new Error("The reader has already finished reading the prompt!");
  } else {
    this.doneReadingPrompt = new Date();
    return this.save();
  }
};

Round.prototype.markDoneReadingChoices = function() {
  if (this.doneReadingChoices !== null) {
    throw new Error("The reader has already finished reading the choices!");
  } else if (this.doneReadingPrompt === null ) {
    throw new Error("Not the right time to finish reading choices!");
  } else {
    this.doneReadingChoices = new Date();
    return this.save();
  }
};

// NOTE: it is not strictly necessary to include the gameId and roundId, it
// just makes the query simpler; alternatively, just the gameId could be used,
// and the most recent roundId could be deduced from that
Round.numPlayersNeedingToVote = function(roundId, gameId) {
  var inserts = [gameId, roundId];
  var sql = 'SELECT Count(pgId) AS playersLeft FROM tbPlayerGame WHERE gId=? ' +
    'AND pgId NOT IN (' +
       'SELECT tbVote.pgId FROM tbVote JOIN tbCard USING (cId) JOIN tbRound USING (rId) WHERE rId=?' +
    ') ' +
    'AND pgActive=TRUE';
  return this.rawOne(sql, inserts);
};


Round.numPlayersNeedingToChoose = function(roundId, gameId) {
  var inserts = [gameId, roundId];
  var sql = 'SELECT Count(pgId) AS playersLeft FROM tbPlayerGame WHERE gId=? ' +
    'AND pgId NOT IN (' +
       'SELECT tbCard.pgId FROM tbCard WHERE rId=?' +
    ') ' +
    'AND pgActive=TRUE';
  return this.rawOne(sql, inserts);
};

