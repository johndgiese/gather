var constants = require('./_local');

var mysql = require('mysql');

module.exports = mysql.createConnection({
  host: 'localhost',
  user: constants.DB_USERNAME,
  password: constants.DB_PASSWORD,
  database: 'gather'
});
