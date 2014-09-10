var expect = require('./expect');

var transaction = require('./transaction');
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


  it('serializes asynchronous function calls', function() {
    var group = 'A';
    var incrementAfterDelayOrdered = transaction.inOrderByGroup(group, incrementAfterDelay);

    var queue = transaction._groupQueus[group];
    expect(queue).to.equal(undefined);

    expect(a).to.equal(0);
    incrementAfterDelay();
    incrementAfterDelay();
    incrementAfterDelay();
    expect(a).to.equal(0);

    return Q.delay(60).then(function() {
      expect(a).to.equal(3);
      incrementAfterDelayOrdered();
      incrementAfterDelayOrdered();
      incrementAfterDelayOrdered();
      expect(a).to.equal(3);

      queue = transaction._groupQueus[group];
      expect(queue.length).to.equal(3);

      return Q.delay(60);
    })
    .then(function() {
      expect(a).to.equal(4);
      return Q.delay(80);
    })
    .then(function() {
      expect(a).to.equal(6);
      return Q.delay(2);
    })
    .then(function() {
      expect(queue.length).to.equal(0);
      expect(transaction._groupQueus[group]).to.equal(undefined);
    });
  });

  it('has separate queues for different groups', function() {
    var incrementAfterDelay_A = transaction.inOrderByGroup('A', incrementAfterDelay);
    var incrementAfterDelay_B = transaction.inOrderByGroup('B', incrementAfterDelay);
    var incrementAfterDelay_C = transaction.inOrderByGroup('C', incrementAfterDelay);

    expect(a).to.equal(0);
    incrementAfterDelay_A();
    incrementAfterDelay_B();
    incrementAfterDelay_C();
    expect(a).to.equal(0);

    return Q.delay(60).then(function() {
      expect(a).to.equal(3);
      incrementAfterDelay_A();

      incrementAfterDelay_B();
      incrementAfterDelay_B();

      incrementAfterDelay_C();
      incrementAfterDelay_C();
      incrementAfterDelay_C();
      expect(a).to.equal(3);

      expect(transaction._groupQueus.A.length).to.equal(1);
      expect(transaction._groupQueus.B.length).to.equal(2);
      expect(transaction._groupQueus.C.length).to.equal(3);

      return Q.delay(60);
    })
    .then(function() {
      expect(a).to.equal(6);
      return Q.delay(40);
    })
    .then(function() {
      expect(a).to.equal(8);
      return Q.delay(40);
    })
    .then(function() {
      expect(a).to.equal(9);
      return Q.delay(40);
    })
    .then(function() {
      expect(transaction._groupQueus.A).to.equal(undefined);
      expect(transaction._groupQueus.B).to.equal(undefined);
      expect(transaction._groupQueus.C).to.equal(undefined);
    });
  });

});

