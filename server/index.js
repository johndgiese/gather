var config = require('./config');
var logger = require('./logger');
var _ = require('underscore');

var path = require('path');


// USE EXPRESS FOR SERVERING STATIC FILES
var express = require('express');
var app = express();
app.disable('x-powered-by');
var server = exports.server = app.listen(config.PORT);

app.use(function(request, response, next){
  logger.log('%s %s', request.method, request.url);
  next();
});
app.use('/static', express.static(__dirname + '/../public'));
app.use(function(request, response) {
  var indexPagePath = path.resolve(__dirname, '../public/index.html');
  response.sendfile(indexPagePath, function(error) {
    if (error) {
      console.log("error");
      logger.log("Error serving index.html: " + reason);
    }
  });
});


// USE SOCKETS FOR EVERYTHING ELSE
var socket = require('socket.io');
var io = socket.listen(server);

var join = require('./join');
io.sockets.on('connection', join.setup);

