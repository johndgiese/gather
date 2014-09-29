var config = require('./config');
var join = require('./join');
var io = require('socket.io')();

// setup websocket server
io.sockets.on('connection', join.setup);
io.listen(config.NODE_PORT);
