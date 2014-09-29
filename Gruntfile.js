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

  grunt.initConfig({
    config: serverConfig,
    STATIC_ROOT: 'static',
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
      '<%= STATIC_ROOT %>/_vendor/underscore/underscore.js',
    ],
    separateExternalClientSrc: [
      '<%= STATIC_ROOT %>/_vendor/angular/angular.js',
      '<%= STATIC_ROOT %>/_vendor/angular-mocks/angular-mocks.js',
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
      uglify: {
        files: '<%= clientSrc %>',
        tasks: ['uglify']
      },
      jshint: {
        files: ['<%= serverSrc %>', '<%= clientSrc %>'],
        tasks: ['jshint'],
        options: {
          spawn: false,
        },
      },
      style: {
        files: '<%= lessSrc %>',
        tasks: ['less'],
      },
      tests: {
        files: ['<%= serverSrc %>'],
        tasks: ['tests']
      },
      static: {
        files: ['<%= serverSrc %>', '<%= clientSrc %>', '<%= lessSrc %>'],
        tasks: ['static'],
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

    shell: {
      setupDirectories: {
        command: 'mkdir <%= NODE_ROOT %>/_var',
        options: {
          failOnError: false,
        }
      },
      setupDatabase: {
        command: [
          'cd <%= NODE_ROOT %>',
          'mysql -u<%= config.DB_USERNAME %> -p<%= config.DB_PASSWORD %> <%= config.DB_NAME %> < schema.sql',
          'cd -'
        ].join(' && ')
      },
      loadWords: {
        command: 'node <%= NODE_ROOT %>/words/data/loadWords <%= NODE_ROOT %>/words/data/words.csv'
      }
    }
  });


  grunt.registerTask('default', ['jshint', 'mochaTest', 'less', 'uglify', 'watch']);
  grunt.registerTask('tests', ['jshint', 'mochaTest']);
  grunt.registerTask('setup', ['shell:setupDirectories', 'shell:setupDatabase', 'shell:loadWords', 'static']);
  grunt.registerTask('static', ['jshint', 'less', 'uglify']);

};
