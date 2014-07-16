var orm = require('../../orm');
var words = require('./words');

var map = {
  text: 'resText',
  active: 'resActive'
};
var Response = orm.define('tbResponse', map, 'resId');
exports.Model = Response;

Response.create = function(text, tags, active) {
  if (active === undefined) {
    active = true;
  }
  return new Response({text: text, active: active})
  .save()
  .then(function(response) {
    return response.addTags(tags);
  });
};

Response.prototype.addTags = words.genAddTags('tbResponseTag', Response.idField);
