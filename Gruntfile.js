var fs = require('fs');

serverConfig = require('./server/config');

module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-express-server');
  grunt.loadNpmTasks('grunt-karma');

  grunt.initConfig({
    config: serverConfig,
    pkg: grunt.file.readJSON('package.json'),
    clientSrc: [

      // defined modules in order
      'public/index.js',

      'public/join/index.js',
      'public/util/index.js',
      'public/socket/index.js',
      'public/words/index.js',
      'public/words_analytics/index.js',

      'public/join/**/*.js',
      'public/util/**/*.js',
      'public/socket/**/*.js',
      'public/modal/**/*.js',
      'public/words/**/*.js',
      'public/words_analytics/**/*.js',

      '!public/**/*.spec.js',
    ],
    clientTests: [
      'public/**/*.spec.js',
    ],
    serverSrc: [
      'server/**/*.js',
    ],
    lessSrc: [
      'public/**/*.less',
      '!public/_vendor/**/*.less'
    ],
    externalClientSrc: [
      'public/_vendor/angular-ui-router/release/angular-ui-router.js',
      'public/_vendor/socket.io-client/socket.io.js',
      'public/_vendor/underscore/underscore.js',
    ],

    express: {
      options: {
        script: 'server/index.js',
      }
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        sourceMap: true,
        mangle: false
      },
      build: {
        files: {
          'public/_dist/index.js': ['<%= clientSrc %>', '<%= externalClientSrc %>'],
          'public/_dist/landing.js': ['public/landing.js']
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
        src: ['server/**/*.spec.js']
      }
    },

    karma: {
      unit: {
        background: true,
        configFile: 'karma.conf.js',
        singleRun: true,
      },
    },

    watch: {
      express: {
        files:  ['<%= serverSrc %>'],
        tasks:  ['express:dev'],
        options: {
          spawn: false
        }
      },
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
          'public/_dist/index.css': 'public/index.less',
          'public/_dist/landing.css': 'public/landing.less',
        }
      }
    },

    shell: {
      setupDirectories: {
        command: 'mkdir server/_var',
        options: {
          failOnError: false,
        }
      },
      setupDatabase: {
        command: [
          'cd server',
          'mysql -u<%= config.DB_USERNAME %> -p<%= config.DB_PASSWORD %> <%= config.DB_NAME %> < schema.sql',
          'cd -'
        ].join(' && ')
      },
      loadWords: {
        command: 'node server/words/data/loadWords server/words/data/words.csv'
      }
    }

  });


  grunt.registerTask('default', ['jshint', 'mochaTest', 'less', 'uglify', 'watch']);
  grunt.registerTask('tests', ['jshint', 'mochaTest']);
  grunt.registerTask('setup', ['shell:setupDirectories', 'shell:setupDatabase', 'shell:loadWords', 'static']);
  grunt.registerTask('static', ['jshint', 'less', 'uglify']);
  grunt.registerTask('server', [ 'express', 'watch:express' ]);

};
