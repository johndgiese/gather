var fs = require('fs');
var csv = require('fast-csv');
var models = require('../models');
var words = require('../models/words');
var db = require('../../db');
var Q = require('q');
var debug = require('debug')('gather:words');

// categories used in the google doc are too long for the database, so
// translate them using this
var typeMap = {
  'Fill in the Blank': 'fill',
  'Word Association': 'assoc',
  'Overhear': 'overhear',
  'Answer': 'answer',
};

var responseCount = 0, promptCount = 0, promises = [];
var csvStream = csv({trim: true})
  .on("record", function(data) {
    var text = data[0];
    var type = typeMap[data[1]];
    var tagText = data[2] || null;
    var tags = [];
    if (tagText !== null) {
      tags = tagText.split(',')
        .map(function(untrimmed) {
          return untrimmed.trim();
        });
    }

    var p;
    if (type == "answer") {
      p = models.Response.create(text, tags);
      responseCount++;
    } else {
      p = models.Prompt.create(text, type, tags);
      promptCount++;
    }
    promises.push(p);
  }).on('end', function() {
    debug('Added %d responses and %d prompts.', responseCount, promptCount);
    Q.all(promises).then(function() {
      db.end();
    })
    .done();
  });

var wordFileName = process.argv[2];
var stream = fs.createReadStream(wordFileName);

words.createTags();
stream.pipe(csvStream);
