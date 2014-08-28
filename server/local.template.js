// local sensitive pieces of information
//
// make a copy of this and rename it: _local.js

exports.DB_PASSWORD = 'CHANGEME';
exports.DB_USERNAME = 'CHANGEME';
exports.DB_NAME = 'gather';
exports.PORT = 80;

// global flag for controlling environment specific settings
// is either 'DEV' for development settings or 'PROD' for production settings
exports.ENV = 'DEV';
