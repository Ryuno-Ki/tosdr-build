// Generated on 2013-12-23 using generator-webapp 0.2.6
'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {
  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);
	
  // Configurable paths for the application
  var appConfig = {
    src: 'src', // TODO When implementing bower, change to: require('./bower.json').srcPath || 'src'
    dist: 'dist'
  };
  
  grunt.initConfig({
		
		// Project settings
		conf: appConfig,
		
    imagemin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= conf.src %>/img',
          src: '{,*/}*.{png,jpg,jpeg,ico}',
          dest: '<%= conf.dist %>/img'
        },
				{
          expand: true,
          cwd: '<%= conf.src %>/logo',
          src: '*.{png,jpg,jpeg}',
          dest: '<%= conf.dist %>/logo'
        }]
      }
    },
    svgmin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= conf.src %>/img',
          src: '{,*/}*.svg',
          dest: '<%= conf.dist %>/img'
        }]
      }
    },
    less : {
      all: {
        options: {
          paths: 'css/',
          compress: true
        },
        files: {
          '<%= conf.dist %>/css/custom.css': 'css/custom.less'
        }
      }
    },
    copy: {
      data: {
        files: [
          {
            expand: true,
						cwd: '<%= conf.src %>',
            src: 'points/*',
            dest: '<%= conf.dist %>'
          },
          {
            expand: true,
						cwd: '<%= conf.src %>',
            src: 'topics/*',
            dest: '<%= conf.dist %>'
          },
          {
            expand: true,
						cwd: '<%= conf.src %>',
            src: 'services/*',
            dest: '<%= conf.dist %>'
          },
          {
            expand: true,
						cwd: '<%= conf.src %>',
            src: 'cases/*',
            dest: '<%= conf.dist %>'
          },
          {
            expand: true,
						cwd: '<%= conf.src %>',
            src: 'posts/*',
            dest: '<%= conf.dist %>'
          },
          {
            expand: true,
            src: 'comments/*',
            dest: '<%= conf.dist %>'
          },
          {
            expand: true,
            src: 'index/*',
            dest: '<%= conf.dist %>'
          }
        ]
      },
			assets: {
				files: [
					{
						expand: true,
						cwd: '<%= conf.src %>',
						src: ['README.md',
                              'LICENSE',
                              'favicon.ico',
                             'conf/{,*/}*',
                             'blog/**/*',
                             'bootstrap-3.1.1/**/*',
                             '!bootstrap-3.1.1/docs',
                             'bootstrap/**/*',
                              '!bootstrap/docs',
                              '1901/*',
                              'css/*',
                              'js/*',
                              'img/*.gif'
                             ],
                        dest: '<%= conf.dist %>'
					},
					{
						expand: true,
						cwd: '<%= conf.src %>',
						src: ['*.html',
                              '!index.html', // index.html and get-involved.html are generated by the renderPages task
                              '!get-involved.html'],
                        dest: '<%= conf.dist %>'
					}
				]
			}
    },
    // Empties folders to start fresh
    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '<%= conf.dist %>/{,*/}*',
            '!<%= conf.dist %>/.git*'
          ]
        }]
      }
    },
    concurrent: {
      fix: [
        'fixpoints',
        'fixservices',
        'fixtopics'
      ],
      minify: [
        'less',
        'imagemin',
        'svgmin'
      ]
    }
  });

  // Load the scripts from the build directory
  grunt.loadTasks('build');
  
  grunt.registerTask('render', ['concurrent:fix', 'buildIndexes', 'prettify', 'copy:data', 'copy:assets', 'generateApiFiles', 'renderPages']);
    
  grunt.registerTask('build', [
		'clean:dist',
    'render',
    'concurrent:minify'
  ]);
  
  grunt.registerTask('default', [
    'build'
  ]);
};
