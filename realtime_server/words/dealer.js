/**
 * Module responsible for dealing cards in the game.
 * @module dealer
 */

var Q = require('q');
var models = require('./models');
var db = require('../db');
var util = require('util');
var debug = require('debug')('gather:words');
var _ = require('underscore');

/**
 * @constant {Number}
 */
var CARDS_IN_HAND = exports.CARDS_IN_HAND = 7;


/**
 * Deals as many response cards as is required for a given player.
 * Should be used to retrieve initial game state (not for dealing individual
 * cards)
 * @arg {Number} playerGameId
 * @arg {Number} gameId
 * @returns {Promise<words.models.Response[]>}
 */
exports.dealResponses = function(playerGameId, gameId) {
  // TODO: avoid making so many DB calls
  return models.Card.serializeHand(playerGameId)
  .then(function(cards) {
    var fullHand = cards.length === CARDS_IN_HAND;
    var emptyHand = cards.length === 0;

    if (fullHand) {
      return Q.when(cards);
    } else if (emptyHand) {
      return pickResponses(playerGameId, gameId, CARDS_IN_HAND)
      .then(function(responseIds) {
        return models.Card.dealFor(playerGameId, responseIds);
      });
    } else {
      throw new Error(util.format('Bad hand state: %j', cards));
    }
  });
};


/**
 * Deals as many response cards as is required for a given player.
 * Should be used to retrieve initial game state (not for dealing individual
 * cards)
 * @arg {Number} playerGameId
 * @arg {Number} gameId
 * @returns {Promise<words.models.Response>}
 */
exports.dealResponse = function(gameId, playerGameId) {
  return models.Card.serializeHand(playerGameId)
  .then(function(cards) {
    if (cards.length === CARDS_IN_HAND - 1) {
      return pickResponses(playerGameId, gameId, 1)
      .then(function(responseIds) {
        return models.Card.dealFor(playerGameId, responseIds);
      })
      .then(function(cards) {
        return cards[0];
      });
    } else {
      throw new Error(util.format('Bad hand state: %j', cards));
    }
  });
};


/**
 * Randomly deal responses for a particular player in a particular game.
 * Returns a promise for an array of responseIds of the requested length.
 * Usually is not called with the last two arguments (this is used internally
 * for recursively handling the situation when a game plays through all the
 * cards)
 */
// TODO: make this smarter; avoid recently used cards etc.
// TODO: optimize randomization
function pickResponses(playerGameId, gameId, numToDeal, dealt, timesAllCardsPlayed) {
  if (dealt === undefined) {
    dealt = [];
    timesAllCardsPlayed = 0;
  }

  var numLeft = numToDeal - dealt.length;

  var inserts, query;
  if (timesAllCardsPlayed === 0) {
    inserts = [gameId, numLeft];
    query = '' + 
    'SELECT resId FROM tbResponse WHERE ' +

      // don't pick a card that has already been played
      'resId NOT IN (' +
        'SELECT resId FROM tbCard JOIN tbPlayerGame USING (pgId) ' + 
              'WHERE gId=?' +
      ') AND resActive=TRUE ORDER BY RAND() LIMIT ?';
  } else {
    inserts = [gameId, timesAllCardsPlayed, gameId, numLeft];
    query = '' + 
    'SELECT resId FROM tbResponse WHERE ' +

      // don't pick cards that have been played more than `timesAllCardsPlayed`
      'resId NOT IN (' +
        'SELECT resId FROM (' + 
          'SELECT resId, Count(*) as timesUsed FROM tbCard NATURAL JOIN tbPlayerGame ' + 
                'WHERE gId=? GROUP BY resId ORDER BY NULL' +
        ') as T WHERE T.timesUsed>?' +
      ') ' + 

      // ensure the card two people's hands after a "wrap-around"
      'AND resId NOT IN (' +
        'SELECT resId FROM tbCard NATURAL JOIN tbPlayerGame WHERE gId=? AND rId is NULL ' +
      ') AND resActive=TRUE ORDER BY RAND() LIMIT ?';
  }

  return db.raw(query, inserts)
  .then(function(result) {
    dealt = dealt.concat(_.pluck(result, 'resId'));

    // if not enough dealt, is because all the responses have been played at
    // least `timesAllCardsPlayed` times, so we have to start using cards over
    // again from the begging (by recursively calling this function).  This is
    // equivalent to "re-shuffling" the deck
    if (dealt.length < numToDeal) {
      timesAllCardsPlayed++;
      return pickResponses(playerGameId, gameId, numToDeal, dealt, timesAllCardsPlayed);
    } else {
      return dealt;
    }

  });
}


/**
 * Deal a prompt card for a given game.
 * @arg {Number}
 * @arg {Number} - should never be used in the outer call
 * @returns {Promise<words.models.Prompt>}
 */
var dealPrompt = exports.dealPrompt = function(gameId, timesAllCardsPlayed) {
  if (timesAllCardsPlayed === undefined) {
    timesAllCardsPlayed = 0;
  }

  var sql = 'SELECT proId FROM tbPrompt ' + 
    'WHERE proId NOT IN (' + 
      'SELECT proId FROM (' + 
        'SELECT proId, Count(*) as timesUsed FROM tbRound WHERE gId=? GROUP BY proId ORDER BY NULL' +
      ') as T WHERE T.timesUsed>?' + 
    ') ' + 
    'AND proActive=TRUE ORDER BY RAND() LIMIT 1';

  return db.raw(sql, [gameId, timesAllCardsPlayed])
  .then(function(result) {
    if (result.length === 0) {
      timesAllCardsPlayed++;
      return dealPrompt(gameId, timesAllCardsPlayed);
    } else {
      return result;
    }
  });
};

