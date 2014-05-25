var orm = require('../../orm');
var words = require('./words');

var map = {
  text: 'aText',
  active: 'aActive'
};
var Answer = orm.define('tbAnswer', map, 'aId');
exports.Model = Answer;

Answer.create = function(text, tags, active) {
  if (active === undefined) {
    active = true;
  }
  return new Answer({text: text, active: active})
    .save()
    .then(function(answer) {
      return answer.addTags(tags);
    });
};

Answer.prototype.addTags = words.genAddTags('tbAnswerTag', Answer.idField);
