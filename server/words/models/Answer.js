var Model = require('../../orm').Model;
var words = require('./words');

exports.Model = Answer;

var fields = ['word', 'active'];
Answer.prototype = new Model('tb_answer', fields);
function Answer(data) {
  this.setFieldData(data);
}

Answer.create = function(word, tags, active) {
  if (active === undefined) {
    active = true;
  }
  return new Answer({word: word, active: active})
    .save()
    .then(function(answer) {
      return answer.addTags(tags);
    });
};

Answer.prototype.addTags = words.genAddTags('tb_answer_tag', 'id_answer');
