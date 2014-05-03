var express = require('express');
var app = express();

app.use(function(req, res, next){
  console.log('%s %s', req.method, req.url);
  next();
});

app.get('/', function(req, res){
  res.send('<p>hello world</p>');
});

app.listen(3000);
