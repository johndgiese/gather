var transaction = require('./transaction');
var expect = require('expect.js');
var Q = require('q');

describe('The transaction lock', function() {

  var a;
  var incrementAfterDelay = function(val) {
    return Q.delay(40).then(function() { 
      a++; 
    });
  };

  beforeEach(function() {
    a = 0;
  });


  it('serializes asynchronous function calls', function(done) {
    var group = 'A';
    var incrementAfterDelayOrdered = transaction.inOrderByGroup(group, incrementAfterDelay);

    var queue = transaction._groupQueus[group];
    expect(queue).to.be(undefined);

    expect(a).to.be(0);
    incrementAfterDelay();
    incrementAfterDelay();
    incrementAfterDelay();
    expect(a).to.be(0);

    Q.delay(60).then(function() {
      expect(a).to.be(3);
      incrementAfterDelayOrdered();
      incrementAfterDelayOrdered();
      incrementAfterDelayOrdered();
      expect(a).to.be(3);

      queue = transaction._groupQueus[group];
      expect(queue.length).to.be(3);

      return Q.delay(60);
    })
    .then(function() {
      expect(a).to.be(4);
      return Q.delay(80);
    })
    .then(function() {
      expect(a).to.be(6);
      return Q.delay(2);
    })
    .then(function() {
      expect(queue.length).to.be(0);
      expect(transaction._groupQueus[group]).to.be(undefined);
      done();
    })
    .fail(done);

  });

  it('has separate queues for different groups', function(done) {
    var incrementAfterDelay_A = transaction.inOrderByGroup('A', incrementAfterDelay);
    var incrementAfterDelay_B = transaction.inOrderByGroup('B', incrementAfterDelay);
    var incrementAfterDelay_C = transaction.inOrderByGroup('C', incrementAfterDelay);

    expect(a).to.be(0);
    incrementAfterDelay_A();
    incrementAfterDelay_B();
    incrementAfterDelay_C();
    expect(a).to.be(0);

    Q.delay(60).then(function() {
      expect(a).to.be(3);
      incrementAfterDelay_A();

      incrementAfterDelay_B();
      incrementAfterDelay_B();

      incrementAfterDelay_C();
      incrementAfterDelay_C();
      incrementAfterDelay_C();
      expect(a).to.be(3);

      expect(transaction._groupQueus.A.length).to.be(1);
      expect(transaction._groupQueus.B.length).to.be(2);
      expect(transaction._groupQueus.C.length).to.be(3);

      return Q.delay(60);
    })
    .then(function() {
      expect(a).to.be(6);
      return Q.delay(40);
    })
    .then(function() {
      expect(a).to.be(8);
      return Q.delay(40);
    })
    .then(function() {
      expect(a).to.be(9);
      return Q.delay(40);
    })
    .then(function() {
      expect(transaction._groupQueus.A).to.be(undefined);
      expect(transaction._groupQueus.B).to.be(undefined);
      expect(transaction._groupQueus.C).to.be(undefined);
      done();
    })
    .fail(done);
  });

});

