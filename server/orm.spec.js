var orm = require('./orm');
var db = require('./db');

var expect = require('expect.js');


describe('The orm', function() {
  var A;
  beforeEach(function(done) {
    var sql = '' +
      'CREATE TABLE A (' +
         'resId INT NOT NULL AUTO_INCREMENT, ' +
         'aName VARCHAR(255), ' +
         'aAge INT, ' +
         'PRIMARY KEY(resId) ' +
       ');';
    db.query(sql, [], done);

    var fields = {
      name: 'aName',
      age: 'aAge',
    };
    A = orm.define('A', fields, 'resId');
  });

  afterEach(function(done) {
    var sql = 'DROP TABLE A;';
    db.query(sql, [], done);
  });

  describe('defines Models:', function() {
    it('should have some predefined properties', function() {
      expect(A.raw).not.to.be(undefined);
      expect(A.query).not.to.be(undefined);
      expect(A.queryOne).not.to.be(undefined);
      expect(A.queryOneId).not.to.be(undefined);
    });

    it('should contain some import self knowledge', function() {
      expect(A.table).to.equal('A');
      expect(A.idField).to.equal('resId');
      expect(A.fields.length).to.equal(3);
    });

    it('should provide instance properties', function() {
      var a = new A();
      expect(a.save).not.to.be(undefined);
      expect(a.hydrate).not.to.be(undefined);
      expect(a.fieldData).not.to.be(undefined);
      expect(a.rawThenSelf).not.to.be(undefined);
      expect(a.save).not.to.be(undefined);
      expect(a.delete).not.to.be(undefined);
    });

    it('should be able to initialize with field names', function() {
      var a = new A({aName: 'hello', aAge: 43});
      expect(a.name).to.be('hello');
      expect(a.age).to.be(43);
      a.name = 'goodbye';
      expect(a.aName).to.be('goodbye');
      a.aAge = 22;
      expect(a.aAge).to.be(22);
    });

    it('  or properties', function() {
      var a = new A({name: 'hello', age: 43});
      expect(a.name).to.be('hello');
      expect(a.age).to.be(43);
      a.name = 'goodbye';
      expect(a.aName).to.be('goodbye');
      a.aAge = 22;
      expect(a.aAge).to.be(22);
    });

    it('  but not both', function() {
      var initWithMix = function() {
        var a = new A({name: 'hello', aAge: 43});
      };
      expect(initWithMix).to.throwError();
    });

    it('should attach auto ids upon saving', function(done) {
      var a = new A();
      expect(a.id).to.be(undefined);
      a.name = 'hello';
      a.save().then(function(){
        expect(a.id).not.to.be(undefined);
        done();
      });
    });

    it('  even when there is no data', function(done) {
      var a = new A();
      expect(a.id).to.be(undefined);
      a.save().then(function(){
        expect(a.id).not.to.be(undefined);
        done();
      });
    });

    it('should use an "update" when there is an id', function(done) {
      var a = new A({age: 4, name: 'David'});
      expect(a.id).to.be(undefined);
      var origId;
      a.save()
      .then(function(){
        origId = a.id;
        expect(a.id).not.to.be(undefined);
        a.age = 5;
        return a.save();
      })
      .then(function(a) {
        expect(a.id).to.be(origId);
        done();
      })
      .fail(function(a) {
        console.log(a);
      });

    });

  });

});
