var config = require('./config');
var join = require('./join');
var io = require('socket.io')({
  'pingInterval': 10000,
  'pingTimeout': 15000,
  'browser client': false,
});

// setup websocket server
io.sockets.on('connection', join.setup);
var server = io.listen(config.NODE_PORT);
