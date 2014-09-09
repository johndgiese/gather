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
 * IMPORTANT: Assumes that a `roundStarted` event will be emitted by the server
 * after calling this function; this event is what starts the cascade!
 */
module.exports = function playRoundWith(clients, gameStates, hooks, maxDelay) {

  return function() {

    var serial = maxDelay === undefined;

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
      return tu.allRecieve(clients, 'roundStarted', 10)
      .then(function() {
        var readerId = _.last(gameStates[0].custom.rounds).reader;
        for(var i = 0; i < gameStates.length; i++) {
          if (gameStates[i].you === readerId) {
            readerIndex = i;
            break;
          }
        }
      });
    })
    .then(invokeGroupHook('beforeReadingPrompt'))
    .then(function() {
      return Q.all([
        clients[readerIndex].emitp('doneReadingPrompt', {}, tu.expectNoError),
        tu.allRecieve(clients, 'readingPromptDone'),
      ]);
    })
    .then(invokeGroupHook('beforeChoosing'))
    .then(function() {
      var donePromise = tu.anyRecieve(clients, 'choosingDone');
      var promise;
      if (serial) {
        promise = Q.when();
        _.each(gameStates, function(gameState, i) {
          var client = clients[i];
          promise = promise
          .then(invokeIndividualHook('beforeChoice', i))
          .then(function() { return tu.makeChoice(clients[i], gameStates[i]); })
          .then(invokeIndividualHook('afterChoice', i));
        });
      } else {
        var promises = _.map(gameStates, function(gameState, i) {
          var client = clients[i];
          return Q.delay(_.random(0, maxDelay))
          .then(invokeIndividualHook('beforeChoice', i))
          .then(function() { return tu.makeChoice(clients[i], gameStates[i]); })
          .then(invokeIndividualHook('afterChoice', i));
        });
        promise = Q.all(promises);
      }
      return Q.all([
        promise,
        donePromise,
      ]);
    })
    .then(invokeGroupHook('beforeReadingChoices'))
    .then(function() {
      return Q.all([
        clients[readerIndex].emitp('doneReadingChoices', {}, tu.expectNoError),
        tu.allRecieve(clients, 'readingChoicesDone'),
      ]);
    })
    .then(invokeGroupHook('beforeVoting'))
    .then(function() {
      var donePromise = tu.anyRecieve(clients, 'votingDone');
      var promise;
      if (serial) {
        promise = Q.when();
        _.each(gameStates, function(gameState, i) {
          var client = clients[i];
          promise = promise
          .then(invokeIndividualHook('beforeVote', i))
          .then(function() { return tu.castVote(clients[i], gameStates[i]); })
          .then(invokeIndividualHook('afterVote', i));
        });
      } else {
        var promises = _.map(gameStates, function(gameState, i) {
          var client = clients[i];
          return Q.delay(_.random(0, maxDelay))
          .then(invokeIndividualHook('beforeVote', i))
          .then(function() { return tu.castVote(clients[i], gameStates[i]); })
          .then(invokeIndividualHook('afterVote', i));
        });
        promise = Q.all(promises);
      }
      return Q.all([
        promise,
        donePromise,
      ]);
    });
  };
};
