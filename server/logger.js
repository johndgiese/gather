var winston = require('winston');
var Logger = winston.Logger;


// TODO: add code to create _var if it doesn't exist
var logger = new Logger({
  transports: [
    new winston.transports.File({
      filename: __dirname + '/_var/_log.txt',
      colorize: true,
      level: 'debug'
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
