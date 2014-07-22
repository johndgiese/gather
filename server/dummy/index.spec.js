var expect = require('expect.js');
var io = require('socket.io-client');
var config = require('../config');
var _ = require('underscore');
var Q = require('Q');

describe('Testing promises', function() {
  it('to see if I understand them', function(done) {
    Q.when('a')
    .then(function(val) {
      return Q.when('b')
      .then(function(inner) {
        return Q.when(inner);
      })
      .then(function(inner) {
        throw new Error("testing");
      });
    })
    .fail(function(e) {
      done();
    });
  });
});
