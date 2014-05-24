var fs = require('fs');
var csv = require('fast-csv');
var models = require('./models');
var words = require('./models/words');

// categories used in the google doc are too long for the database, so
// translate them using this
var typeMap = {
  'Fill in the Blank': 'fill',
  'Word Association': 'assoc',
  'Overhear': 'overhear',
  'Answer': 'answer',
};

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

    if (type == "answer") {
      models.Answer.create(text, tags);
    } else {
      models.Question.create(text, type, tags);
    }
  });

var wordFileName = process.argv[2];
var stream = fs.createReadStream(wordFileName);

words.createTags();
stream.pipe(csvStream);
