var express = require('express');
var http = require('http');
var socket = require('socket.io');
var mysql = require('mysql');

var app = express();
var server = http.createServer(app);
var io = socket.listen(server);

var db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'abbddy!',
  database: 'nounadj',
});


app.use(function(req, res, next){
  console.log('%s %s', req.method, req.url);
  var url = db.escape(req.url);
  var method = db.escape(req.method);
  db.query('INSERT INTO tbvisit (url, method) VALUES (' + url + ', ' + method + ');');
  next();
});

app.get('/', function(req, res){
  res.send('<p>hello world</p>');
});

app.listen(3000);
