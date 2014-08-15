var _ = require('underscore');

// IMPORANT: always update parallel copy of this in public/words/services/stateResolver.js

/**
 * Given a game state object, return the appropriate client-side state.
 */
module.exports = function stateResolver(gameState) {

  if (gameState.game.startedOn === null) {
    return 'game';
  }

  var round = _.last(gameState.custom.rounds);
  var you = gameState.you;

  if (round === undefined || round.doneVoting) {
    return 'game.words.score';
  }

  if (round.doneReadingPrompt === null) {
    if (you === round.reader) {
      return 'game.words.readPrompt';
    } else {
      return 'game.words.waitingForPromptReader';
    }
  }

  if (round.doneChoosing === null) {
    if (_.findWhere(gameState.custom.choices, {player: you})) {
      return 'game.words.waitingForChoices';
    } else {
      return 'game.words.choosing';
    }
  }

  if (round.doneReadingChoices === null) {
    if (you === round.reader) {
      return 'game.words.readChoices';
    } else {
      return 'game.words.waitingForChoicesReader';
    }
  }

  if (round.doneVoting === null) {
    if (_.findWhere(gameState.custom.votes, {player: you})) {
      return 'game.words.waitingForVotes';
    } else {
      return 'game.words.voting';
    }
  }

  throw new Error("Unable to resolve state");
};
