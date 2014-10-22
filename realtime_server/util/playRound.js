/*jshint loopfunc: true */

var tu = require('./test');
var debug = require('debug')('gather:playRound');
var _ = require('underscore');

function allActiveRecieve(clients, gameStates, event) {
  var activeClients = [];
  for (var i = 0; i < clients.length; i++) {
    if (gameStates[i]) {
      activeClients.push(clients[i]);
    }
  }
  debug("setup all recieve " + event + " for " + activeClients.length + " clients");
  return tu.allRecieve(activeClients, event);
}

/**
 * Return a function that plays through a round of the game.
 * @arg - array of clients with state listeners setup etc.
 * @arg - array of gamestates
 * @arg - array of session strings
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
 * gameStates, an array of sessions, and the index of the reader for the round.
 * Hook functions must return a promise.
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
 * set that gameState to false, and if you are in a individual hook (and not a
 * group hook) you also need to reject the promise.
 */
// TODO reduce code duplication
module.exports = function playRoundWith(clients, gameStates, sessions, hooks, maxDelay) {

  return function() {

    var serial = maxDelay === undefined;

    if (hooks === undefined) {
      hooks = {};
    }

    function readerIndex() {
      var readerId = _.last(gameStates[0].custom.rounds).reader;
      for(var i = 0; i < gameStates.length; i++) {
        if (gameStates[i].you === readerId) {
          return i;
        }
      }
    }

    function invokeGroupHook(hookName) {
      return function() {
        if (hooks[hookName] !== undefined) {
          debug("Calling " + hookName);
          return hooks[hookName](clients, gameStates, sessions, readerIndex());
        } else {
          debug("No listener " + hookName);
          return Q.when();
        }
      };
    }

    function invokeIndividualHook(hookName, index) {
      return function() {
        if (hooks[hookName] !== undefined) {
          debug("Calling " + hookName + ' for ' + index);
          return hooks[hookName](clients, gameStates, sessions, readerIndex(), index);
        } else {
          debug("No listener " + hookName);
          return Q.when();
        }
      };
    }

    return Q.fcall(invokeGroupHook('beforeReadingPrompt'))
    .then(function() {
      return Q.all([
        allActiveRecieve(clients, gameStates, 'readingPromptDone'),
        clients[readerIndex()].emitp('doneReadingPrompt', {}),
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
          promise = promise
          .then(invokeIndividualHook('beforeChoice', i))
          .then(function() { 
            if (gameStates[i]) {
              debug('making choice ' + i);
              return tu.makeChoice(clients[i], gameStates[i]); 
            } else {
              return Q.when();
            }
          })
          .then(invokeIndividualHook('afterChoice', i))
          .then(function() {
            var round = _.last(gameStates[i].custom.rounds);
            if (round.doneChoosing === null) {
              donePromises.push(clients[i].oncep('choosingDone'));
            }
          })
          .then(function() {}, function() {});
        });
      } else {
        var promises = _.map(gameStates, function(gameState, i) {
          var client = clients[i];
          return Q.delay(_.random(0, maxDelay))
          .then(invokeIndividualHook('beforeChoice', i))
          .then(function() { 
            if (gameStates[i]) {
              debug('making choice ' + i);
              return tu.makeChoice(clients[i], gameStates[i]); 
            } else {
              return Q.when();
            }
          })
          .then(invokeIndividualHook('afterChoice', i))
          .then(function() {
            var round = _.last(gameStates[i].custom.rounds);
            if (round.doneChoosing === null) {
              donePromises.push(clients[i].oncep('choosingDone'));
            }
          })
          .then(function() {}, function() {});
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
        allActiveRecieve(clients, gameStates, 'readingChoicesDone'),
        clients[readerIndex()].emitp('doneReadingChoices', {}),
      ]);
    })
    .then(invokeGroupHook('beforeVoting'))
    .then(function() {
      var donePromises = [];
      var promise;
      if (serial) {
        promise = Q.when();
        _.each(gameStates, function(gameState, i) {
          var client = clients[i];
          promise = promise
          .then(invokeIndividualHook('beforeVote', i))
          .then(function() { 
            if (gameStates[i]) {
              debug('casting vote for ' + i);
              return tu.castVote(clients[i], gameStates[i]); 
            } else {
              return Q.when();
            }
          })
          .then(invokeIndividualHook('afterVote', i))
          .then(function() {
            var round = _.last(gameStates[i].custom.rounds);
            if (round.doneVoting === null) {
              donePromises.push(clients[i].oncep('votingDone'));
            }
          })
          .then(function() {}, function() {});
        });
      } else {
        var promises = _.map(gameStates, function(gameState, i) {
          var client = clients[i];
          return Q.delay(_.random(0, maxDelay))
          .then(invokeIndividualHook('beforeVote', i))
          .then(function() { 
            if (gameStates[i]) {
              debug('casting vote for ' + i);
              return tu.castVote(clients[i], gameStates[i]); 
            } else {
              return Q.when();
            }
          })
          .then(invokeIndividualHook('afterVote', i))
          .then(function() {
            var round = _.last(gameStates[i].custom.rounds);
            if (round.doneVoting === null) {
              donePromises.push(clients[i].oncep('votingDone'));
            }
          })
          .then(function() {}, function() {});
        });
        promise = Q.all(promises);
      }
      return Q.all([
        promise,
        Q.all(donePromises)
      ]);
    })
    .then(function() {
      return allActiveRecieve(clients, gameStates, 'roundStarted');
    });
  };
};
