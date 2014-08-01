
# Technology Stack

Game would be a realtime web-app.  Backend will use node to drive realtime
stuff, while client will use angular js and socket.io for realtime events.

# Signup Mechanics

## Geolocation Signup

Players could use geolocation to avoid requiring members to create user accounts.
This means that the game could only played locally.

The first user would go to the site, and would be presented a simple menu that
allows them to create a game.  The app would ask for their location, and they would
grant access.  They would then select any options and give the game room a name.

Subsequent users would go to the site, and a menu would pop up saying: "The following
games were found in your area" and the user can then click one of the games and join.
Usually they would need to write their name down for identification.

## Normal signup

It would also be easy to add an alternate signup process.

# Minimum viable Apples to Apples game

The controlling user (the user that created the group) clicks a button that triggers
the start of the game.

The game is broken up into a discrete set of rounds (e.g. 20).  Each round begins by
a randomly chosen noun showing up at the top of each person's screen.

Each user is provided six adjectives, which are displayed at the bottom of the screen.

A round ends once each users has chosen one of their adjectives.

After this occurs, one person is chosen to be the reader, and they read the adjective/noun
combination one by one.  Once they are done reading them, all of the adjective/noun
combinations are shown on everyone's screen, and everyone gets to vote for first and
second best words.

Everyone gets two points to divide up, and can give both to the same person, or can
abstain from voting for the round, but can not vote for themselves.

Bonuses are awarded if:
1. Someone gets one vote from everyone (except themselves) +N
2. Someone gets two votes from everyone (except themselves) +3*N

After tallying the scores, the final vote is displated to everyone.  Audible "awards" are
given for the winner, and anyone who gets bonuses!

Finally, the score for the round is displayed (and subsequently shrunk to a submenu)
and then the next round starts.

On the fifth-to-last round a notification shows up indicating that it is the fifth-to-last
round; such a message also occurs on the last round.

After the last round is finished, the final score is annonced, and the winner is given
an "audible reward".


# Database

## Game

A particular game instance.

- Id
- CreatedOn
- PlayerId (Started by this person)

## Player

A participant in a game.  Created once someone has generated a name.

- Id
- Name

## GameHistory

Association between a player and a particular game.

- Id
- PlayerId
- GameId
- Latitude/Longitude (location of where they were when they joined)

## Word

A word in the database

- Id
- Type (Adjective or Noun)
- Word

## Round

A single round of the game.

- Id
- GameId
- Number
- WordId (Noun)
- StartTime

## Choice

The selection of the adjective

- Id
- RoundId
- PlayerId
- WordId (Adjective)
- TimeStamp

## Vote

A vote for a choice; two per player per round

- Id
- ChoiceId (what they are voting for--null if they abstain)
- PlayerId (who is voting)
- Num (1 or 2)
- TimeStamp

## Distribution

Words given to each player; will be one per round except on the first round,
when there will be multiple.

- Id
- WordId (the word that was given)
- RoundId (when it was given)
- PlayerId (who it was given to)

