angular.module('words')
.factory('stateResolver', [function() {

  // IMPORANT: always update parallel copy of this in server/words/stateResolver.js

  return stateResolver;

  function stateResolver(gameState) {

    if (gameState.game.startedOn === null) {
      return 'app.game';
    }

    var round = _.last(gameState.custom.rounds);
    var you = gameState.you;

    if (round === undefined || round.doneVoting) {
      return 'app.game.words.score';
    }

    if (round.doneReadingPrompt === null) {
      if (you === round.reader) {
        return 'app.game.words.readPrompt';
      } else {
        return 'app.game.words.waitingForPromptReader';
      }
    }

    if (round.doneChoosing === null) {
      if (_.findWhere(gameState.custom.choices, {player: you})) {
        return 'app.game.words.waitingForChoices';
      } else {
        return 'app.game.words.choosing';
      }
    }

    if (round.doneReadingChoices === null) {
      if (you === round.reader) {
        return 'app.game.words.readChoices';
      } else {
        return 'app.game.words.waitingForChoicesReader';
      }
    }

    if (round.doneVoting === null) {
      if (_.findWhere(gameState.custom.votes, {player: you})) {
        return 'app.game.words.waitingForVotes';
      } else {
        return 'app.game.words.voting';
      }
    }

    throw new Error("Unable to resolve state");
  }

}]);
