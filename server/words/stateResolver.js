
/**
 * Given a game state object, return the appropriate client-side state.
 */
module.exports = function stateResolver(gameState) {
  if (gameState.game.startedOn === null) {
    return 'game';
  }

};
