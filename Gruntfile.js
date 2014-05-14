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
      all: '<%= src %>',
    },
    watch: {
      files: '<%= src %>',
      tasks: ['jshint', 'uglify']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['jshint', 'uglify', 'watch']);

};
