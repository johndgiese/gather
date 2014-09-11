/*jshint loopfunc: true */

var tu = require('./test');
var debug = require('debug')('gather:tests');
var _ = require('underscore');

/**
 * Return a function that plays through a round of the game.
 * @arg - array of clients with state listeners setup etc.
 * @arg - array of gamestates
 * @arg - object of hooks that execute functions at certain times during a
 * round. There are two types of hooks, groupHooks, and individual hooks.
 * Possible group hooks include:
 *
 *    beforeReadingPrompt
 *    beforeChoosing
 *    beforeReadingChoices
 *    beforeVoting
 *
 * All group hook function are passed in an array of clients, an array of
 * gameStates, and the index of the reader for the round. Hook functions must
 * return a promise.
 *
 * Possible individual hooks include:
 *
 *    beforeChoice
 *    afterChoice
 *    beforeVote
 *    afterVote
 *
 * All individual hook functions are passed in an array of clients, an array
 * of gameStates, the index of the reader, and the index of the individual.
 * @arg {number} - max delay between players making votes and/or choices, i.e.
 * If undefined, then it is assumed that choosing and voting should be done
 * serially.
 *  
 * IMPORTANT: Assumes that a round just started!  Thus, you need to only start
 * this after all clients have received a roundStarted event.  Returns only
 * after the next round has started, so you can chain them together.
 *
 * ALSO IMPORTANT: If you have a hook that disconnects a client, you need to
 * set that client to false, and if you are in a individual hook (and not a
 * group hook) you also need to reject the promise.
 */
// TODO reduce code duplication
module.exports = function playRoundWith(clients, gameStates, hooks, maxDelay) {

  return function() {

    var serial = maxDelay === undefined;

    if (hooks === undefined) {
      hooks = {};
    }

    var readerIndex = null;

    function invokeGroupHook(hookName) {
      return function() {
        if (hooks[hookName] !== undefined) {
          debug("Calling " + hookName);
          return hooks[hookName](clients, gameStates, readerIndex);
        } else {
          return Q.when();
        }
      };
    }

    function invokeIndividualHook(hookName, index) {
      return function() {
        if (hooks[hookName] !== undefined) {
          debug("Calling " + hookName);
          return hooks[hookName](clients, gameStates, readerIndex, index);
        } else {
          return Q.when();
        }
      };
    }

    return Q.fcall(function() {
      var readerId = _.last(gameStates[0].custom.rounds).reader;
      for(var i = 0; i < gameStates.length; i++) {
        if (gameStates[i].you === readerId) {
          readerIndex = i;
          break;
        }
      }
    })
    .then(invokeGroupHook('beforeReadingPrompt'))
    .then(function() {
      return Q.all([
        tu.allRecieve(clients, 'readingPromptDone'),
        clients[readerIndex].emitp('doneReadingPrompt', {}),
      ]);
    })
    .then(invokeGroupHook('beforeChoosing'))
    .then(function() {
      var donePromises = [];
      var promise;
      if (serial) {
        promise = Q.when();
        _.each(gameStates, function(gameState, i) {
          var client = clients[i];
          if (client) {
            promise = promise
            .then(invokeIndividualHook('beforeChoice', i))
            .then(function() { return tu.makeChoice(clients[i], gameStates[i]); })
            .then(invokeIndividualHook('afterChoice', i))
            .then(function() {
              var round = _.last(gameStates[i].custom.rounds);
              if (round.doneChoosing === null) {
                donePromises.push(clients[i].oncep('choosingDone'));
              }
            })
            .then(function() {}, function() {});
          }
        });
      } else {
        var promises = _.map(gameStates, function(gameState, i) {
          var client = clients[i];
          if (client) {
            return Q.delay(_.random(0, maxDelay))
            .then(invokeIndividualHook('beforeChoice', i))
            .then(function() { return tu.makeChoice(clients[i], gameStates[i]); })
            .then(invokeIndividualHook('afterChoice', i))
            .then(function() {
              var round = _.last(gameStates[i].custom.rounds);
              if (round.doneChoosing === null) {
                donePromises.push(clients[i].oncep('choosingDone'));
              }
            })
            .then(function() {}, function() {});
          }
        });
        promise = Q.all(promises);
      }
      return Q.all([
        promise,
        Q.all(donePromises),
      ]);
    })
    .then(invokeGroupHook('beforeReadingChoices'))
    .then(function() {
      return Q.all([
        tu.allRecieve(clients, 'readingChoicesDone'),
        clients[readerIndex].emitp('doneReadingChoices', {}),
      ]);
    })
    .then(invokeGroupHook('beforeVoting'))
    .then(function() {
      var donePromises = [];
      var promise;
      if (serial) {
        promise = Q.when();
        _.each(gameStates, function(gameState, i) {
          var index = i;
          var client = clients[index];
          if (client) {
            promise = promise
            .then(invokeIndividualHook('beforeVote', index))
            .then(function() { return tu.castVote(clients[index], gameStates[index]); })
            .then(invokeIndividualHook('afterVote', index))
            .then(function() {
              var round = _.last(gameStates[index].custom.rounds);
              if (round.doneVoting === null) {
                donePromises.push(clients[index].oncep('votingDone'));
              }
            })
            .then(function() {}, function() {});
          }
        });
      } else {
        var promises = _.map(gameStates, function(gameState, i) {
          var client = clients[i];
          if (client) {
            return Q.delay(_.random(0, maxDelay))
            .then(invokeIndividualHook('beforeVote', i))
            .then(function() { return tu.castVote(clients[i], gameStates[i]); })
            .then(invokeIndividualHook('afterVote', i))
            .then(function() {
              var round = _.last(gameStates[i].custom.rounds);
              if (round.doneVoting === null) {
                donePromises.push(clients[i].oncep('votingDone'));
              }
            })
            .then(function() {}, function() {});
          }
        });
        promise = Q.all(promises);
      }
      return Q.all([
        promise,
        Q.all(donePromises)
      ]);
    })
    .then(function() {
      return tu.allRecieve(clients, 'roundStarted');
    });
  };
};
