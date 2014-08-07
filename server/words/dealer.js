/**
 * Module responsible for dealing cards in the game.
 * @module dealer
 */

var Q = require('Q');
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


// TODO: make this smarter; avoid recently used cards etc.
// TODO: optimize randomization
var DEAL_CARDS_SQL = 'INSERT INTO tbCard (resId, pgId) ' +
  'SELECT resId, ? FROM tbResponse WHERE ' +
  'resId NOT IN (' +
    'SELECT resId FROM tbCard NATURAL JOIN tbPlayerGame WHERE gId=?' +
  ') ' +
  'ORDER BY RAND() LIMIT ?';

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

      var inserts = [playerGameId, gameId, CARDS_IN_HAND];
      return db.raw(DEAL_CARDS_SQL, inserts)
      .then(function() {
        return models.Card.serializeHand(playerGameId);
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
      var inserts = [playerGameId, gameId, 1];
      return db.raw(DEAL_CARDS_SQL, inserts)
      .then(function(result) {
        return models.Card.forApi(result.insertId);
      });
    } else {
      throw new Error(util.format('Bad hand state: %j', cards));
    }
  });
};

