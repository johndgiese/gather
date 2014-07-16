var fs = require('fs');

serverConfig = require('./server/config');

module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-shell');

  grunt.initConfig({
    config: serverConfig,
    pkg: grunt.file.readJSON('package.json'),
    clientSrc: [

      // defined modules in order
      'public/index.js',

      'public/join/index.js',
      'public/util/index.js',
      'public/socket/index.js',
      'public/modal/index.js',
      'public/words/index.js',

      'public/join/**/*.js',
      'public/util/**/*.js',
      'public/socket/**/*.js',
      'public/modal/**/*.js',
      'public/words/**/*.js',
    ],
    serverSrc: [
      'server/**/*.js',
    ],
    lessSrc: [
      'public/css/**/*.less',
      'public/css/**/*.css',
      'public/_vendor/bootstrap/less/*.less'
    ],
    externalClientSrc: [
      'public/modal/ui-bootstrap-modal-0.10.0.js',
      'public/modal/ui-bootstrap-modal-tpls-0.10.0.js',
      'public/_vendor/angular-ui-router/release/angular-ui-router.js',
      'public/_vendor/socket.io-client/socket.io.js',
      'public/_vendor/underscore/underscore.js',
    ],

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        sourceMap: true,
        mangle: false
      },
      build: {
        dest: 'public/_dist/index.js',
        src: ['<%= clientSrc %>', '<%= externalClientSrc %>']
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
      configFiles: {
        files: ['Gruntfile.js'],
        options: {
          livereload: true
        }
      },
      style: {
        files: '<%= lessSrc %>',
        tasks: ['less'],
      },
    },

    less: {
      public: {
        options: {
          paths: '<%= lessSrc %>',
          sourceMap: true,
          sourceMapFilename: 'public/_dist/index.map.css',
          sourceMapURL: '/_dist/index.map.css',
          strictImports: true
        },
        files: {
          'public/_dist/index.css': 'public/css/index.less'
        }
      }
    },

    shell: {
      setupDirectories: {
        command: 'mkdir _var',
        options: {
          failOnError: false,
        }
      },
      setupDatabase: {
        command: [
          'cd server',
          'mysql -u<%= config.DB_USERNAME %> -p<%= config.DB_PASSWORD %> gather < schema.sql',
          'cd -'
        ].join('&&')
      },
      loadWords: {
        command: 'node server/words/data/loadWords server/words/data/words.csv'
      }
    }

  });


  grunt.event.on('watch', function(action, filepath, target) {
    if (target == 'tests') {
      var fileIsTest = !!filepath.match('spec.js$');
      var fileHasTest, filepathOfTest;

      if (!fileIsTest) {
        filepathOfTest = filepath.slice(0, filepath.length - 3) + '.spec.js';
        fileHasTest = fs.existsSync(filepathOfTest);
      } else {
        filepathOfTest = filepath;
        fileHasTest = false;
      }

      if (fileIsTest || fileHasTest) {
        grunt.config('mochaTest.test.src', filepathOfTest)
      }
    }

    if (target == 'jshint') {
      grunt.config('jshint.all.src', filepath)
    }

  });


  grunt.registerTask('default', ['jshint', 'mochaTest', 'less', 'uglify', 'watch']);
  grunt.registerTask('tests', ['jshint', 'mochaTest']);
  grunt.registerTask('setup', ['shell:setupDirectories', 'shell:setupDatabase', 'shell:loadWords', 'less', 'uglify']);

};
