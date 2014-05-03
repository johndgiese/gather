var express = require('express');
var socket = require('socket.io');
var mysql = require('mysql');

var app = express();
var server = app.listen(3000);
var io = socket.listen(server);

var db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'abbddy!',
  database: 'nounadj',
});


// use express for servering static files
app.use(function(req, res, next){
  console.log('%s %s', req.method, req.url);
  next();
});
app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res) {
  res.sendfile(__dirname + '/index.html');
});


// use sockets for everything else
io.sockets.on('connection', function (socket) {
  console.log("setting up connection");
  socket.broadcast.emit('visit');
});

