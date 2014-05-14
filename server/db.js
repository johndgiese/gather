var config = require('./config');

var mysql = require('mysql');

module.exports = mysql.createConnection({
  host: 'localhost',
  user: config.DB_USERNAME,
  password: config.DB_PASSWORD,
  database: 'gather'
});
