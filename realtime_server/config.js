
// Non-local settings go here

var local = require('../_local');
for (var key in local) {
  exports[key] = local[key];
}

if (local.ENV === 'DEV') {
  Q = require('q');
  Q.longStackSupport = true;
}

exports.MANDRILL_API_KEY = '3ttDkoUzVEhYS5IJ3zMHlg';
