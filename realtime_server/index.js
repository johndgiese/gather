var config = require('./config');
var join = require('./join');
var io = require('socket.io')();

// setup websocket server
io.sockets.on('connection', join.setup);
var server = io.listen(config.NODE_PORT);

//server.configure(function() {
  //server.set('browser client', false);
  //server.set('heartbeat interval', 3000);
  //server.set('heartbeat timeout', 10*3000);
//});
