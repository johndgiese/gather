var config = require('./config');
var join = require('./join');

var app;
if (config.SSL_KEY_PATH !== "CHANGME") {
  var https = require('https');
  var fs = require('fs');
  var https_options = {
    key: fs.readFileSync(config.SSL_KEY_PATH),
    cert: fs.readFileSync(config.SSL_CERT_PATH),
    ca: fs.readFileSync(config.SSL_CA_PATH),
  };
  app = https.createServer(https_options);
} else if (config.ENV !== "PROD") {
  var http = require('http');
  app = http.createServer();
} else {
  throw Error("Must use HTTPS when in production mode");
}

var io = require('socket.io')({
  'pingInterval': 10000,
  'pingTimeout': 15000,
  'browser client': false,
});

// setup websocket server
io.sockets.on('connection', join.setup);
io.listen(app);

app.listen(config.NODE_PORT);
