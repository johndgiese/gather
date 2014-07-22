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
};

/**
 * @constant {Number} 
 */
var CARDS_IN_HAND = exports.CARDS_IN_HAND = 7;

/**
 * Deals as many response cards as is required for a given player.
 * @arg {Number} playerGameId
 * @returns {Promise<words.models.Response[]>}
 */
exports.dealResponses = function(playerGameId, gameId) {
  return db.withinTransaction(function() {
    // TODO: avoid making so many DB calls
    return models.Card.serializeHand(playerGameId)
    .then(function(cards) {
      var fullHand = cards.length === CARDS_IN_HAND;
      var emptyHand = cards.length === 0;

      if (fullHand) {
        return Q.when(cards);
      } else if (emptyHand) {
        // TODO: make this smarter; avoid recently used cards etc.
        // TODO: optimize randomization
        var sql = 'INSERT INTO tbCard (resId, pgId) ' + 
          'SELECT resId, ? FROM tbResponse WHERE ' + 
          'resId NOT IN (' +
            'SELECT resId FROM tbCard NATURAL JOIN tbPlayerGame WHERE gId=?' +
          ') ' +
          'ORDER BY RAND() LIMIT ?';

        var inserts = [playerGameId, gameId, CARDS_IN_HAND];
        return db.raw(sql, inserts)
        .then(function() {
          return models.Card.serializeHand(playerGameId);
        });
      } else {
        throw new Error(util.format('Bad hand state: %j', cards));
      }
    });
  });
};

