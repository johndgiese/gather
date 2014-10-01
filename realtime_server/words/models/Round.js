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
  doneChoosing: 'rDoneChoosing',
  doneReadingChoices: 'rDoneReadingChoices',
  doneVoting: 'rDoneVoting',
};
var Round = orm.define('tbRound', fields, 'rId');
exports.Model = Round;

function readerList(gameId) {
  return Round.raw('SELECT pgId, pgActive AS active FROM tbPlayerGame WHERE gId=? ORDER BY pgCreatedOn', [gameId]);
}

/**
 * Create a new round for the current game of the specified party.
 */
Round.newByGame = function(gameId) {

  var lastRoundProm = this.raw('SELECT pgId, rNumber AS number FROM tbRound WHERE gId=? ORDER BY rNumber DESC LIMIT 1', [gameId]);

  var promptProm = dealer.dealPrompt(gameId);

  return Q.all([
    readerList(gameId),
    lastRoundProm,
    promptProm
  ])
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
      doneReadingPrompt: null,
      doneChoosing: null,
      doneReadingChoices: null,
      doneVoting: null
    };

    return new Round(roundData).save();
  });
};

/**
 * Promote a new reader, update in database, and return the playerGameId of the
 * new reader.
 */
Round.prototype.promoteNewLeader = function() {
  var self = this;
  return readerList(self.game)
  .then(function(readerList) {
    self.reader = getNextActivePrompter(readerList, self.reader).pgId;
    return self.save()
    .then(function() {
      return self;
    });
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
  var sql = 'SELECT rId AS id, pgId AS reader, rNumber AS number, proText AS prompt, ' +
    'proId AS promptId, ' +
    'rDoneReadingPrompt AS doneReadingPrompt, ' +
    'rDoneChoosing AS doneChoosing, ' +
    'rDoneReadingChoices AS doneReadingChoices, ' +
    'rDoneVoting AS doneVoting ' +
    'FROM tbRound NATURAL JOIN tbPrompt NATURAL JOIN tbGame ' +
    'WHERE gId=? ORDER BY rNumber';
  var inserts = [gameId];
  return Round.raw(sql, inserts);
};

Round.queryLatestByGame = function(gameId) {
  inserts = [this.table, this.table, gameId];
  var sql = 'SELECT ??.* FROM ?? NATURAL JOIN tbGame WHERE gId=? ORDER BY rNumber DESC LIMIT 1';
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
      promptId: self.prompt,
      doneReadingPrompt: self.doneReadingPrompt,
      doneChoosing: self.doneChoosing,
      doneReadingChoices: self.doneReadingChoices,
      doneVoting: self.doneVoting,
    };
  });
};

var markMethodNamePostfixes = [
  'ReadingPrompt',
  'Choosing',
  'ReadingChoices',
  'Voting',
];

// create mark done methods for each stage
_.each(markMethodNamePostfixes, function(postfix) {
  var methodName = 'markDone' + postfix;

  Round[methodName] = function(gameId) {
    var sql = 'UPDATE tbRound SET ??=? WHERE gId=? AND ?? IS NULL';
    var at = new Date(); at.setMilliseconds(0);
    var field = 'rDone' + postfix;
    return this.raw(sql, [field, at, gameId, field])
    .then(function() {
      return at;
    });
  };

  Round.prototype[methodName] = function() {
    return Round[methodName](this.game);
  };
});


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
  return this.rawOne(sql, inserts)
  .then(function(result) {
    return result.playersLeft;
  });
};

Round.prototype.numPlayersNeedingToVote = function() {
  return Round.numPlayersNeedingToVote(this.id, this.game);
};

Round.numPlayersNeedingToChoose = function(roundId, gameId) {
  var inserts = [gameId, roundId];
  var sql = 'SELECT Count(pgId) AS playersLeft FROM tbPlayerGame WHERE gId=? ' +
    'AND pgId NOT IN (' +
       'SELECT tbCard.pgId FROM tbCard WHERE rId=?' +
    ') ' +
    'AND pgActive=TRUE';
  return this.rawOne(sql, inserts)
  .then(function(result) {
    return result.playersLeft;
  });
};

Round.prototype.numPlayersNeedingToChoose = function() {
  return Round.numPlayersNeedingToChoose(this.id, this.game);
};

Round.prototype.stage = function() {
  if (this.doneReadingPrompt === null) {
    return "readingPrompt";
  } else if (this.doneChoosing === null) {
    return "choosing";
  } else if (this.doneReadingChoices === null) {
    return "readingChoices";
  } else if (this.doneVoting === null) {
    return "voting";
  } else {
    return "over";
  }
};
