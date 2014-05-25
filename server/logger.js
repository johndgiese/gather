var winston = require('winston');
var Logger = winston.Logger;

exports.logger = new Logger({
  transports: [
    new winston.transports.Console({
      colorize: true,
      level: 'debug'
    })
  ]
});
