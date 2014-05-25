# The JOIN module
The join module's job is to:

1. Determine the current player's id (either by creating a new one or finding
   and authenticating one associated with an account)
2. Setup a game:
   1. Create a new game
   1. Connect or reconnect the player with an existing game

There are three core tables to the JOIN module:

## Game table
One row per game; has no game-type specific knowledge except knowing the "type"
of the game, e.g. "words".

Different types of games may have different rules/procedures for allowing new
players to join or re-join during a game.  The "open" flag on the game table
determines whether new Player-Game instances can be created.  The game may
change this value during game time as it wishes.

The player that creates the game is also stored on the Game itself.

## Player table
When the person visits the site, they can either login, which determines a
preexisting player object, or they can create a new player object at will
(possibly re-creating them over and over)

## Player-Game table
Possibly multiple values per player-game combination; there will be multiple
instances if a player has multiple devices logged in and playing in the game,
or if it is a long standing game where they have rejoined, creating a new
"session" within that game.

Player-Game rows have an "open" flag, which determines whether it is possible
for them to re-join the game after a disconnection.  The game module is
responsible for ensuring that, IF the Player-Game row has "open" set to true,
then it MUST be able to reproduce the game state for that player if he re-joins.

The player-game row also has an "active" flag, which indicates whether the
player is actually connected and in the game as that role.  Recall again, it is
possible for a given player to be connected to a game as multiple roles (and
hence have multiple active player-game rows with the same player and game).

# Re-connections
If a player drops from a game they may rejoin (and establish their state in the
game) if the Player-Game row has open set to true.

Also, if the game has it's open flag set to true, the player could rejoin as a
fresh "player-game".  At this point, it is up to the game to decide whether it
would want to set open to false on any older player-game instances.

Re-connecting involves these steps:
1. Establish the current game
2. Establish the current player

