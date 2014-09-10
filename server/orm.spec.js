var orm = require('./orm');
var db = require('./db');
var expect = require('./expect');


describe('The orm', function() {
  var A;
  beforeEach(function() {
    var fields = {
      name: 'aName',
      age: 'aAge',
    };
    A = orm.define('A', fields, 'resId');

    var sql = '' +
      'CREATE TABLE A (' +
         'resId INT NOT NULL AUTO_INCREMENT, ' +
         'aName VARCHAR(255), ' +
         'aAge INT, ' +
         'PRIMARY KEY(resId) ' +
       ');';
    return db.raw(sql, []);

  });

  afterEach(function() {
    var sql = 'DROP TABLE A;';
    return db.raw(sql, []);
  });

  describe('defines Models:', function() {
    it('should have some predefined properties', function() {
      expect(A.raw).not.to.equal(undefined);
      expect(A.query).not.to.equal(undefined);
      expect(A.queryOne).not.to.equal(undefined);
      expect(A.queryOneId).not.to.equal(undefined);
    });

    it('should contain some import self knowledge', function() {
      expect(A.table).to.equal('A');
      expect(A.idField).to.equal('resId');
      expect(A.fields.length).to.equal(3);
    });

    it('should provide instance properties', function() {
      var a = new A();
      expect(a.save).not.to.equal(undefined);
      expect(a.hydrate).not.to.equal(undefined);
      expect(a.fieldData).not.to.equal(undefined);
      expect(a.rawThenSelf).not.to.equal(undefined);
      expect(a.save).not.to.equal(undefined);
      expect(a.delete).not.to.equal(undefined);
    });

    it('should be able to initialize with field names', function() {
      var a = new A({aName: 'hello', aAge: 43});
      expect(a.name).to.equal('hello');
      expect(a.age).to.equal(43);
      a.name = 'goodbye';
      expect(a.aName).to.equal('goodbye');
      a.aAge = 22;
      expect(a.aAge).to.equal(22);
    });

    it('  or properties', function() {
      var a = new A({name: 'hello', age: 43});
      expect(a.name).to.equal('hello');
      expect(a.age).to.equal(43);
      a.name = 'goodbye';
      expect(a.aName).to.equal('goodbye');
      a.aAge = 22;
      expect(a.aAge).to.equal(22);
    });

    it('  but not both', function() {
      var initWithMix = function() {
        var a = new A({name: 'hello', aAge: 43});
      };
      expect(initWithMix).to.throw(Error);
    });

    it('should attach auto ids upon saving', function() {
      var a = new A();
      expect(a.id).to.equal(undefined);
      a.name = 'hello';
      return a.save().then(function(){
        expect(a.id).not.to.equal(undefined);
      });
    });

    it('  even when there is no data', function() {
      var a = new A();
      expect(a.id).to.equal(undefined);
      return a.save().then(function(){
        expect(a.id).not.to.equal(undefined);
      });
    });

    it('should use an "update" when there is an id', function() {
      var a = new A({age: 4, name: 'David'});
      expect(a.id).to.equal(undefined);
      var origId;
      return a.save()
      .then(function(){
        origId = a.id;
        expect(a.id).not.to.equal(undefined);
        a.age = 5;
        return a.save();
      })
      .then(function(a) {
        expect(a.id).to.equal(origId);
      });

    });

  });

});
