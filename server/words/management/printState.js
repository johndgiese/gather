var db = require('../../db');
var _ = require('underscore');
var Q = require('q');

var models = require('../models');
var dealer = require('../dealer');
var scorer = require('../scorer');

try {
  var gameId = parseInt(process.argv[2]);

  if (gameId === undefined) {
    console.log("You must pass in a game id");
    process.exit(1);
  }

  db.raw('SELECT pgId FROM tbPlayerGame WHERE gId=?', [gameId])
  .then(function(pgIds) {
    var promises = _.map(pgIds, function(result) {
      var playerGameId = result.pgId;
      return Q.all([
        dealer.dealResponses(playerGameId, gameId),
        models.Round.forApiByGame(gameId),
        scorer.currentScore(gameId),
        models.Vote.alreadyVotedByGame(gameId),
        models.Card.queryLatestByGame(gameId),
      ])
      .then(function(data) {
        var gs = {
          hand: data[0],
          rounds: data[1],
          score: data[2],
          votes: data[3],
          choices: data[4],
        };
        console.log("PLAYER %d GAMESTATE: ", playerGameId);
        console.log(gs);
      });
    });

    return Q.all(promises)
    .then(function() {
      process.exit();
    });
  })
  .fail(function(reason) {
    console.error(reason);
    process.exit(1);
  });

} catch (e) {
  console.error(e);
  process.exit(1);
}
