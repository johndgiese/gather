/**
 * Module responsible for dealing cards in the game.
 * @module dealer
 */

var Q = require('q');
var models = require('./models');
var db = require('../db');
var util = require('util');
var debug = require('debug')('gather:words');

/**
 * Deal a prompt card for a given game.
 * @arg {Number}
 * @returns {Promise<words.models.Prompt>}
 */
exports.dealPrompt = function(gameId) {
  // TODO: make this smarter
  // TODO: handle the case when all prompts have been used!
  return db.raw('SELECT proId FROM tbPrompt WHERE proId NOT IN (SELECT proId FROM tbRound WHERE gId=?) AND proActive=TRUE ORDER BY RAND() LIMIT 1', [gameId]);
};

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
  var inserts = [playerGameId, gameId, timesAllCardsPlayed, numLeft];

  var query = '' + 
  'SELECT resId FROM tbResponse WHERE ' +
    'resId NOT IN (' +
      'SELECT resId FROM (' + 
        'SELECT resId, Count(*) as timesUsed FROM tbCard NATURAL JOIN tbPlayerGame ' + 
              'WHERE gId=? AND resActive=TRUE GROUP BY resId ' +
      ') as T WHERE T.timesUsed=? ' +
    ') ';
  if (timesAllCardsPlayed >= 1) {
    // ensure you don't get a card in two people's hands after a "wrap-around"
    query += '' + 
    'AND resId NOT IN (' +
      'SELECT resId FROM tbCard NATURAL JOIN tbPlayerGame WHERE gId=? AND rId is NULL ' +
    ') ';
  }
  query += 'ORDER BY RAND() LIMIT ?';

  return db.raw(query, inserts)
  .then(function(result) {
    dealt = dealt.concat(result);
    if (dealt.length < numToDeal) {
      timesAllCardsPlayed++;
      return pickResponses(playerGameId, gameId, numToDeal, dealt, timesAllCardsPlayed);
    }
    return dealt;
  });
}

