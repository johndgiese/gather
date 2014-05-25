var orm = require('../../orm');
var words = require('./words');
var util = require('util');


var fields = {
  text: 'qText',
  type: 'qType',
  active: 'qActive'
};
var Question = orm.define('tbQuestion', fields, 'qId');
exports.Model = Question;

Question.isValidType = function(type) {
  var validTypes = [
    'fill',
    'assoc',
    'overhear',
  ];
  return validTypes.indexOf(type) !== -1;
};

Question.create = function(text, type, tags, active) {
  if (active === undefined) {
    active = true;
  }
  if (!Question.isValidType(type)) {
    throw new Error(util.format("Invalid type %s for question: %s", type, text));
  }
  return new Question({text: text, active: active, type: type})
    .save()
    .then(function(question) {
      return question.addTags(tags);
    });
};

Question.prototype.addTags = words.genAddTags('tbQuestionTag', Question.idField);
