var orm = require('../../orm');
var words = require('./words');
var util = require('util');


var fields = {
  text: 'proText',
  active: 'proActive'
};
var Prompt = orm.define('tbPrompt', fields, 'proId');
exports.Model = Prompt;


Prompt.create = function(text, tags, active) {
  if (active === undefined) {
    active = true;
  }
  return new Prompt({text: text, active: active})
  .save()
  .then(function(prompt) {
    return prompt.addTags(tags);
  });
};

Prompt.prototype.addTags = words.genAddTags('tbPromptTag', Prompt.idField);
