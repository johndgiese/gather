module.exports = function(config) {
  config.set({
    "basePath": 'public/',
    "colors": true,
    "files": [
      '_vendor/angular/angular.js',
      '_vendor/angular-mocks/angular-mocks.js',
      '**/*.spec.js',
      '_dist/index.js',
    ],
    "frameworks": ['mocha', 'expect'],
    "browsers": ['Chrome'],
    "reporters": ['dots', 'beep'],
    "plugins": [
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-expect',
      'karma-mocha',
      'karma-beep-reporter',
    ]
  });
};

