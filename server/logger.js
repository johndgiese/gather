var winston = require('winston');
var Logger = winston.Logger;
var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');


var logFile = __dirname + '/_var/log.txt';
var logDir = path.dirname(logFile);
if (!fs.existsSync(logDir)) {
  mkdirp.sync(logDir);
}

var logger = new Logger({
  transports: [
    new winston.transports.File({
      filename: logFile,
      colorize: true,
      level: 'debug',
      json: false, 
    })
  ]
});

// extend winston logger by making it expand errors when passed in as the
// second argument (the first argument is the log level)
function expandErrors(logger) {
  var oldLogFunc = logger.log;
  logger.log = function() {
    var args = Array.prototype.slice.call(arguments, 0);
    if (args.length >= 2 && args[1] instanceof Error) {
      args[1] = args[1].stack;
    }
    return oldLogFunc.apply(this, args);
  };
  return logger;
}

module.exports = expandErrors(logger);
