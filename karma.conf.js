module.exports = function(config) {
  config.set({
    basePath: './public/',
    files: [
      '_vendor/angular/angular.js',
      '_vendor/angular-mocks/angular-mocks.js',
      '_dist/index.js',
      './**/*.spec.js',
    ],
    autoWatch: false,
    frameworks: ['jasmine'],
    browsers: ['Chrome'],
    plugins: [
      'karma-junit-reporter',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-jasmine',
    ],
  });
};
