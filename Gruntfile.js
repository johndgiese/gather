var fs = require('fs');

serverConfig = require('./realtime_server/config');

module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  grunt.initConfig({
    config: serverConfig,
    STATIC_ROOT: 'static',
    SERVER_ROOT: 'server',
    NODE_ROOT: 'realtime_server',
    pkg: grunt.file.readJSON('package.json'),
    clientSrc: [

      // defined modules in order
      '<%= STATIC_ROOT %>/index.js',

      '<%= STATIC_ROOT %>/join/index.js',
      '<%= STATIC_ROOT %>/util/index.js',
      '<%= STATIC_ROOT %>/socket/index.js',
      '<%= STATIC_ROOT %>/words/index.js',

      '<%= STATIC_ROOT %>/join/**/*.js',
      '<%= STATIC_ROOT %>/util/**/*.js',
      '<%= STATIC_ROOT %>/socket/**/*.js',
      '<%= STATIC_ROOT %>/modal/**/*.js',
      '<%= STATIC_ROOT %>/words/**/*.js',

      '!<%= STATIC_ROOT %>/**/*.spec.js',
    ],
    clientTests: [
      '<%= STATIC_ROOT %>/**/*.spec.js',
    ],
    serverSrc: [
      '<%= NODE_ROOT %>/**/*.js',
    ],
    lessSrc: [
      '<%= STATIC_ROOT %>/**/*.less',
      '!<%= STATIC_ROOT %>/_vendor/**/*.less'
    ],
    uglifiedExternalClientSrc: [
      '<%= STATIC_ROOT %>/_vendor/angular-ui-router/release/angular-ui-router.js',
      '<%= STATIC_ROOT %>/_vendor/socket.io-client/socket.io.js',
      '<%= STATIC_ROOT %>/_vendor/angular-qrcode/qrcode.js',
      '<%= STATIC_ROOT %>/_vendor/qrcode-generator/js/qrcode.js',
    ],
    separateExternalClientSrc: [
      '<%= STATIC_ROOT %>/_vendor/angular/angular.js',
      '<%= STATIC_ROOT %>/_vendor/angular-mocks/angular-mocks.js',
      '<%= STATIC_ROOT %>/_vendor/underscore/underscore.js',
    ],
    globalSrc: [
      '<%= STATIC_ROOT %>/global/gather.js',
    ],

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        sourceMap: true,
        mangle: false
      },
      build: {
        files: {
          '<%= STATIC_ROOT %>/_dist/index.js': ['<%= clientSrc %>', '<%= uglifiedExternalClientSrc %>'],
          '<%= STATIC_ROOT %>/_dist/gather.js': ['<%= globalSrc %>'],
        }
      }
    },

    jshint: {
      all: {
        src: ['<%= clientSrc %>', '<%= serverSrc %>'],
      },
    },

    mochaTest: {
      all: {
        options: {
          reporter: 'spec',
          clearRequireCache: true
        },
        src: ['<%= NODE_ROOT %>/**/*.spec.js']
      }
    },

    karma: {
      unit: {
        options: {
          "basePath": './',
          "colors": true,
          "files": [
            '<%= separateExternalClientSrc %>',
            '<%= clientSrc %>',
            '<%= uglifiedExternalClientSrc %>',
            '<%= clientTests %>',
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
        }
      }
    },

    watch: {
      static: {
        files: ['<%= serverSrc %>', '<%= clientSrc %>', '<%= lessSrc %>', '<%= globalSrc %>'],
        tasks: ['static'],
      },
      tests: {
        files: ['<%= serverSrc %>'],
        tasks: ['tests']
      },
      karma: {
        files: ['<%= clientSrc %>', '<%= clientTests %>'],
        tasks: ['karma:unit:run'],
        options: {
          spawn: true,
        }
      }
    },

    less: {
      public: {
        options: {
          paths: '<%= lessSrc %>',
          sourceMap: true,
          strictImports: true
        },
        files: {
          '<%= STATIC_ROOT %>/_dist/index.css': '<%= STATIC_ROOT %>/index.less',
          '<%= STATIC_ROOT %>/_dist/landing.css': '<%= STATIC_ROOT %>/landing.less',
        }
      }
    },

    cssmin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= STATIC_ROOT %>/_dist/',
          src: ['*.css', '!*.min.css'],
          dest: '<%= STATIC_ROOT %>/_dist',
          ext: '.min.css',
        }]
      }
    },

    shell: {
      setupDirectories: {
        command: 'mkdir <%= NODE_ROOT %>/_var',
        options: {
          failOnError: false,
        }
      },
      setupDatabase: {
        command: [
          'cd <%= SERVER_ROOT %>',
          './manage.py migrate',
          './manage.py loaddata join/initial_data.json',
          './manage.py load_csv_data words/fixtures/tbprompt.csv',
          './manage.py load_csv_data words/fixtures/tbresponse.csv',
          'cd ..',
        ].join(' && ')
      },
    }
  });


  grunt.registerTask('default', ['jshint', 'mochaTest', 'less', 'uglify', 'watch']);
  grunt.registerTask('tests', ['jshint', 'mochaTest']);
  grunt.registerTask('setup', ['shell:setupDirectories', 'shell:setupDatabase', 'static']);
  grunt.registerTask('static', ['jshint', 'less', 'uglify', 'cssmin']);

};
