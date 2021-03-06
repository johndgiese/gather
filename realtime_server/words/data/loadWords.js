var fs = require('fs');
var csv = require('fast-csv');
var models = require('../models');
var words = require('../models/words');
var db = require('../../db');
var Q = require('q');
var debug = require('debug')('gather:words');

var responseCount = 0, promptCount = 0, promises = [];
var csvStream = csv({trim: true})
  .on("record", function(data) {
    var text = data[0];
    var createdOn = data[1];

    var p;
    if (type == "Answer") {
      p = models.Response.create(text, tags);
      responseCount++;
    } else {
      p = models.Prompt.create(text, tags);
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

stream.pipe(csvStream);
