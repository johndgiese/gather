
# Home

Shows two buttons:
- Look for games near me
- Create game

# Look for games near me

Click "look for games near me" and the browser asks for geolocation permission,
and then makes a call to the server with the location information, and listens for
nearby games.  Once it starts looking for nearby games, it will display a spinner
and will continue looking (waiting for real time message indicating a game start).
A "stop search" button will be displayed on the bottom of the page.  If a nearby
game is found, it will display a button saying: "Join GAMENAME".  Clicking the
button will then ask the user to enter a name.  After entering their name, a message
will be sent to the server saying that they have joined the game.  They will then
see a screen saying "Joined game GAMENAME, waiting for game to start." at which point
they will wait until the game create clicks "start game".

# Create game

If you click "create game" it will ask you for geolocation permissions.  Then it will
ask you for your name.  Then it will ask you for your game's name (defaulting to your
name possessive game).  After clicking next again, a message will be sent to the server
with the game location, creating a player row for you, and a game row.  The client will
then display a page with "waiting for players to join" and a start game button.  The
"start game" button will be dimmed until at least two other players join.  As players
join, they will be added to the list of players.  Upon clicking "start game", a message
is sent to the server, which will be relayed to all players indicating the start of the
game.

# Round

## Client side state

Current noun
List of adjectives
Score for all players


]]] new noun

- update current noun
- show noun and available adjectives

[[[ submit adjective

- remove adjective from list of adjectives
- display waiting for other submissions

= once all votes are in

]]] start reading (if not the reader)

]]] read submissions (if the reader)
[[[ done reading

]]] choices
[[[ submit vote

= once all votes are in

]]] results

- displays results briefly, plays sounds, and then goes back to start unless it
  is the last round

