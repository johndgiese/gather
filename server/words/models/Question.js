var Model = require('../../orm').Model;
var words = require('./words');
var util = require('util');

exports.Model = Question;

var fields = ['text', 'type', 'active'];
Question.prototype = new Model('tb_question', fields);
function Question(data) {
  this.setFieldData(data);
}

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

Question.prototype.addTags = words.genAddTags('tb_question_tag', 'id_question');
