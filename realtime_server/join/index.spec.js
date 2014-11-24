var expect = require('../expect');

var io = require('socket.io-client');
var config = require('../config');
var _ = require('underscore');
var tu = require('../util/test');
var models = require('./models');

var server = require('../index').server;

var validPassword = 'aA12!@@FF';
var validEmail = 'a@a.a';
var validEmail2 = 'b@b.b';


describe('The join socket API', function() {

  var client;

  beforeEach(function() {
    client = tu.setupClient();
    var connectedClientProm = client.oncep('connect');

    // delete all test users
    return Q.allSettled([
      models.Player.queryOneEmail(validEmail),
      models.Player.queryOneEmail(validEmail2),
    ])
    .then(function(playersToDelete) {
      var deleted = [];
      playersToDelete.forEach(function(result) {
        if (result.state === "fulfilled") {
          var player = result.value;
          deleted.push(player.delete());
        }
      });
      return Q.all(deleted);
    })
    .then(function() {
      return connectedClientProm;
    });
  });

  describe('provides a way to create players', function() {
    it('returns a player object on success', function() {
      return client.emitp('createPlayer', {name: 'test player'})
      .then(function(data) {
        expect(data.player.id).not.to.equal(undefined);
      });
    });
    it('returns an error if an invalid data is passed into it', function() {
      return client.emitp('createPlayer', 3).should.be.rejectedWith(Error);
    });
    it('returns an error if the name is too long', function() {
      var longName = new Array(101 + 1).join('a');
      return client.emitp('createPlayer', {name: longName}).should.be.rejectedWith(Error);
    });
    it('returns an error if already attached to a player', function() {
      return client.emitp('createPlayer', {name: 'david'})
      .then(function(data) {
        return client.emitp('createPlayer', {name: 'david'}).should.be.rejectedWith(Error);
      });
    });
    it('allows you to fill in an email and password', function() {
      return client.emitp('createPlayer', {name: 'david', email: validEmail, password: validPassword})
      .then(function(data) {
        expect(data.player.id).not.to.equal(undefined);
      });
    });
    it('will complain if the email is in use already', function() {
      return client.emitp('createPlayer', {name: 'david', email: validEmail, password: validPassword})
      .then(function() {
        client.emitp('createPlayer', {name: 'david', email: validEmail, password: validPassword})
        .should.be.rejectedWith(Error);
      });
    });
    it('but you need both a valid email AND password', function() {
      return client.emitp('createPlayer', {name: 'dav', email: validEmail})
      .should.be.rejectedWith(Error)
      .then(function() {
        return client.emitp('createPlayer', {name: 'dav', password: validPassword})
        .should.be.rejectedWith(Error);
      })
      .then(function() {
        return client.emitp('createPlayer', {name: 'dav', password: 'aa', email: validEmail})
        .should.be.rejectedWith(Error);
      })
      .then(function() {
        return client.emitp('createPlayer', {name: 'dav', password: validPassword, email: 'ass'})
        .should.be.rejectedWith(Error);
      });
    });
  });

  describe('provides a way to log back in as a player', function() {
    var player, session;
    var origName = 'test dude';

    beforeEach(function() {
      return client.emitp('createPlayer', {name: origName})
      .then(function(response) {
        session = response.session;
        player = response.player;
      });
    });

    it('you can then log back in with a different connection', function() {
      return client.emitp('loginViaSession', {session: session})
      .then(function(response) {
        expect(response.player).to.eql(player);
      });
    });
    it('if you login with an invalid session id you get an error', function() {
      return client.emitp('loginViaSession', {session: "asdfasdfasdf"})
      .should.be.rejectedWith(Error);
    });
    it('is possible to update the player once logged in', function() {
      return client.emitp('loginViaSession', {session: session})
      .then(function() {
        return models.Player.queryOneId(player.id);
      })
      .then(function(player_) {
        expect(player_.name).to.equal(origName);
      })
      .then(function() {
        return client.emitp('updatePlayer', {name: 'new name'});
      })
      .then(function() {
        return models.Player.queryOneId(player.id);
      })
      .then(function(player_) {
        expect(player_.name).to.equal('new name');
      });
    });

    it('is possible to fill in the email and password once', function() {
      return client.emitp('loginViaSession', {session: session})
      .then(function() {
        return client.emitp('updatePlayer', {email: validEmail, password: validPassword});
      })
      .then(function() {
        return models.Player.queryOneId(player.id);
      })
      .then(function(player_) {
        expect(player_.email).to.equal(validEmail);
      })
      .then(function() {
        // shouldn't let you set the password since it is already set above
        return client.emitp('updatePlayer', {email: validEmail, password: validPassword})
        .should.be.rejectedWith(Error);
      })
      .then(function() {
        return client.emitp('updatePlayer', {email: validEmail2});
      })
      .then(function() {
        return models.Player.queryOneId(player.id);
      })
      .then(function(player_) {
        expect(player_.email).to.equal(validEmail2);
      });
    });
  });

  describe('provides a way of creating games', function() {
    var player;
    beforeEach(function() {
      return client.emitp('createPlayer', {name: 'david'})
      .then(function(player_) {
        player = player_;
      });
    });

    it('returns the party promise', function() {
      return client.emitp('createGame', {type: 'dummy'})
      .then(function(data) {
        expect(_.isString(data.party)).to.equal(true);
      });
    });
    it.skip('requires that the player owns the game', function() {
    });
    it('throws an error if there is no `createPlayer` call first', function() {
      var client = tu.setupClient();
      client.emitp('createGame', {type: 'dummy'}).should.be.rejectedWith(Error);
    });
  });

  describe('provides a way to join and leave existing games', function() {

    var clients, players, party;
    beforeEach(function() {
      clients = tu.setupClients(3);
      return tu.setupPlayers(clients)
      .then(function(data) {
        players = data.players;
        return clients[0].emitp('createGame', {type: 'dummy'});
      })
      .then(function(data) {
        party = data.party;
        return models.Game.queryByParty(party);
      })
      .then(function(game) {
        expect(game.master).to.equal(null);
        return clients[0].emitp('joinGame', {party: party});
      })
      .then(function(gameState) {
        return models.Game.queryByParty(party)
        .then(function(game) {
          expect(game.master).to.equal(gameState.you);
        });
      });
    });

    it('it broadcasts the event to other players in the party', function() {
      var gameState;

      var client0promise = clients[0].oncep('playerJoined');

      return clients[1].emitp('joinGame', {party: party})
      .then(function(gameState_) {
        gameState = gameState_;
        expect(gameState.game.id).to.be.a('number');
        expect(_.isString(gameState.game.party)).to.equal(true);
        return client0promise;
      })
      .then(function(broadcastPlayer) {
        var playerInGameState = gameState.players[1];
        expect(broadcastPlayer).to.eql(playerInGameState);
      });
    });

    it('throws an error if given an invalid party', function() {
      return clients[1].emitp('joinGame', {party: 'AAAAAA'}).should.be.rejectedWith(Error);
    });

    it('provides the master a way to kick another player', function() {
      return clients[1].emitp('joinGame', {party: party})
      .then(function(gameState) {
        var player1Id = gameState.you;
        var kickedPromise = clients[1].oncep('playerLeft')
        .then(function(data) {
          expect(data.player.id).to.equal(player1Id);
          expect(data.kicked).to.equal(true);
        });
        return Q.all([
          kickedPromise,
          clients[0].emitp('kickPlayer', {
            player: player1Id
          }),
        ]);
      });
    });

  });

  describe('should never change state if there is an error', function() {
    it('that means the database shouldn\'t be altered', function() {});
    it('and neither should the connection-level state (e.g. `game`, `player`, or `gamePlayerId`', function() {});
    // but I don't know how to tests these things
    // except to look for them
    // and they currently aren't true at all, although some types of errors are very unlikley
    // TODO: make sure these items are true
  });


  // TODO: test password reset

});

