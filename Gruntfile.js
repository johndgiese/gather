serverConfig = require('./server/config');

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    src: [

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
    externalSrc: [
      'public/modal/ui-bootstrap-modal-0.10.0.js',
      'public/modal/ui-bootstrap-modal-tpls-0.10.0.js',
      'public/_vendor/angular-ui-router/release/angular-ui-router.js',
      'public/_vendor/socket.io-client/dist/socket.io.js',
    ],

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        sourceMap: true
      },
      build: {
        dest: 'public/_dist/index.js',
        src: ['<%= src %>', '<%= externalSrc %>']
      }
    },

    jshint: {
      all: ['<%= src %>', '<%= serverSrc %>'],
    },

    watch: {
      js: {
        files: '<%= src %>',
        tasks: ['jshint', 'uglify']
      },
      configFiles: {
        files: ['Gruntfile.js'],
        options: {
          livereload: true
        }
      },
      style: {
        files: '<%= lessSrc %>',
        tasks: ['less:development'],
      }
    },

    less: {
      development: {
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
    }


  });

  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['jshint', 'less', 'uglify', 'watch']);

};
