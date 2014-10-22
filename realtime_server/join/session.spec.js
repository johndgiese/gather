var expect = require('../expect');
var _ = require('underscore');
var session = require('./session');
var Q = require('q');


describe('The session module', function() {
  var secureId = 5;
  var timeout = 200;
  var key = "testkey";

  it('provides the ability to make sessions', function() {
    var sessionStr = session.generateSession(key, secureId, timeout);
    expect(session.secureIdFromSession(key, sessionStr)).to.equal(secureId);
  });

  it('fails to make sessions for non integer Ids', function() {
    var bigSecureId = Number.MAX_VALUE + 1;
    var toBigCall = function() {
      session.generateSession(key, bigSecureId, timeout);
    };
    expect(toBigCall).to.throw(Error);
  });

  it('timesout as expected', function() {
    var sessionStr = session.generateSession(key, secureId, timeout);
    return Q.delay(timeout/2)
    .then(function() {
      var secureId = session.secureIdFromSession(key, sessionStr);
      expect(secureId).to.equal(secureId);
    })
    .delay(timeout)
    .then(function() {
      var secureId = session.secureIdFromSession(key, sessionStr);
      expect(secureId).to.equal(null);
    });
  });

  it('returns null when deciphering crap', function() {
    expect(session.secureIdFromSession(key, 1)).to.equal(null);
    expect(session.secureIdFromSession(key, "")).to.equal(null);
    expect(session.secureIdFromSession(key, "hello")).to.equal(null);
    expect(session.secureIdFromSession(key, Date())).to.equal(null);
    expect(session.secureIdFromSession(key, null)).to.equal(null);
  });

});
