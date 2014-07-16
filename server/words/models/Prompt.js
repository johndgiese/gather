var orm = require('../../orm');
var words = require('./words');
var util = require('util');


var fields = {
  text: 'proText',
  type: 'proType',
  active: 'proActive'
};
var Prompt = orm.define('tbPrompt', fields, 'proId');
exports.Model = Prompt;

Prompt.isValidType = function(type) {
  var validTypes = [
    'fill',
    'assoc',
    'overhear',
  ];
  return validTypes.indexOf(type) !== -1;
};

Prompt.create = function(text, type, tags, active) {
  if (active === undefined) {
    active = true;
  }
  if (!Prompt.isValidType(type)) {
    throw new Error(util.format("Invalid type %s for prompt: %s", type, text));
  }
  return new Prompt({text: text, active: active, type: type})
  .save()
  .then(function(prompt) {
    return prompt.addTags(tags);
  });
};

Prompt.prototype.addTags = words.genAddTags('tbPromptTag', Prompt.idField);
