var transaction = require('./transaction');
var expect = require('expect.js');
var Q = require('q');

describe('The transaction lock', function() {

  var a;
  var incrementIn2 = function(val) {
    return Q.delay(20).then(function() { 
      a++; 
    });
  };

  beforeEach(function() {
    a = 0;
  });


  it('serializes asynchronous function calls', function(done) {
    var group = 'A';
    var incrementIn2Ordered = transaction.inOrderByGroup(group, incrementIn2);

    var queue = transaction._groupQueus[group];
    expect(queue).to.be(undefined);

    expect(a).to.be(0);
    incrementIn2();
    incrementIn2();
    incrementIn2();
    expect(a).to.be(0);

    Q.delay(30).then(function() {
      expect(a).to.be(3);
      incrementIn2Ordered();
      incrementIn2Ordered();
      incrementIn2Ordered();
      expect(a).to.be(3);

      queue = transaction._groupQueus[group];
      expect(queue.length).to.be(3);

      return Q.delay(30);
    })
    .then(function() {
      expect(a).to.be(4);
      return Q.delay(40);
    })
    .then(function() {
      expect(a).to.be(6);
      return Q.delay(1);
    })
    .then(function() {
      expect(queue.length).to.be(0);
      expect(transaction._groupQueus[group]).to.be(undefined);
      done();
    })
    .fail(done);

  });

  it('has separate quques for different groups', function(done) {
    var incrementIn2_A = transaction.inOrderByGroup('A', incrementIn2);
    var incrementIn2_B = transaction.inOrderByGroup('B', incrementIn2);
    var incrementIn2_C = transaction.inOrderByGroup('C', incrementIn2);

    expect(a).to.be(0);
    incrementIn2_A();
    incrementIn2_B();
    incrementIn2_C();
    expect(a).to.be(0);

    Q.delay(30).then(function() {
      expect(a).to.be(3);
      incrementIn2_A();

      incrementIn2_B();
      incrementIn2_B();

      incrementIn2_C();
      incrementIn2_C();
      incrementIn2_C();
      expect(a).to.be(3);

      expect(transaction._groupQueus.A.length).to.be(1);
      expect(transaction._groupQueus.B.length).to.be(2);
      expect(transaction._groupQueus.C.length).to.be(3);

      return Q.delay(30);
    })
    .then(function() {
      expect(a).to.be(6);
      return Q.delay(20);
    })
    .then(function() {
      expect(a).to.be(8);
      return Q.delay(20);
    })
    .then(function() {
      expect(a).to.be(9);
      return Q.delay(20);
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

