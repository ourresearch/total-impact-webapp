module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-testacular');
  grunt.loadNpmTasks('grunt-html2js');

  // Default task.
  grunt.registerTask('default', ['jshint','build','testacular:unit']);
  grunt.registerTask('build', ['clean','html2js','concat']);
  grunt.registerTask('release', ['clean','html2js','uglify','jshint','testacular:unit','concat:index','testacular:e2e']);
  grunt.registerTask('test-watch', ['testacular:watch']);

  // Print a timestamp (useful for when watching)
  grunt.registerTask('timestamp', function() {
    grunt.log.subhead(Date());
  });

  var testacularConfig = function(configFile, customOptions) {
    var options = { configFile: configFile, keepalive: true };
    var travisOptions = process.env.TRAVIS && { browsers: ['Firefox'], reporters: 'dots' };
    return grunt.util._.extend(options, customOptions, travisOptions);
  };

  // Project configuration.
  grunt.initConfig({
    distdir: 'dist',
    pkg: grunt.file.readJSON('package.json'),
    banner:
    '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
    '<%= pkg.homepage ? " * " + pkg.homepage + "\\n" : "" %>' +
    ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>;\n' +
    ' * Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %>\n */\n',
    src: {
      js: ['src/**/*.js', '<%= distdir %>/templates/**/*.js'],
      specs: ['test/**/*.spec.js'],
      scenarios: ['test/**/*.scenario.js'],
      html: ['src/index.html'],
      tpl: {
        app: ['src/app/**/*.tpl.html'],
        common: ['src/common/**/*.tpl.html']
      }
    },
    clean: ['<%= distdir %>/*'],

    testacular: {
      unit: { options: testacularConfig('test/config/unit.js') },
      e2e: { options: testacularConfig('test/config/e2e.js') },
      watch: { options: testacularConfig('test/config/unit.js', { singleRun:false, autoWatch: true}) }
    },
    html2js: {
      app: {
        options: {
          base: 'src/app'
        },
        src: ['<%= src.tpl.app %>'],
        dest: '<%= distdir %>/templates/app.js',
        module: 'templates.app'
      },
      common: {
        options: {
          base: 'src/common'
        },
        src: ['<%= src.tpl.common %>'],
        dest: '<%= distdir %>/templates/common.js',
        module: 'templates.common'
      }
    },
    concat:{
      dist:{
        options: {
          banner: "<%= banner %>"
        },
        src:['<%= src.js %>'],
        dest:'<%= distdir %>/<%= pkg.name %>.js'
      },
      index: {
        src: ['src/index.html'],
        dest: '<%= distdir %>/index.html',
        options: {
          process: true
        }
      },
      angular: {
        src:['vendor/angular/*.js'],
        dest: '<%= distdir %>/angular.js'
      },
      bootstrap: {
        src:['vendor/angular-ui/bootstrap/*.js'],
        dest: '<%= distdir %>/bootstrap.js'
      },
      jquery: {
        src:['vendor/jquery-plugins/*.js'],
        dest: '<%= distdir %>/jquery-plugins.js'
      },
      libs: {
        src:['vendor/libs/*.js'],
        dest: '<%= distdir %>/libs.js'
      }
    },
    uglify: {
      dist:{
        options: {
          banner: "<%= banner %>"
        },
        src:['<%= src.js %>'],
        dest:'<%= distdir %>/<%= pkg.name %>.js'
      },
      angular: {
        src:['<%= concat.angular.src %>'],
        dest: '<%= distdir %>/angular.js'
      },
      mongo: {
        src:['vendor/mongolab/*.js'],
        dest: '<%= distdir %>/mongolab.js'
      },
      bootstrap: {
        src:['vendor/angular-ui/bootstrap/*.js'],
        dest: '<%= distdir %>/bootstrap.js'
      },
      jquery: {
        src:['vendor/jquery/*.js'],
        dest: '<%= distdir %>/jquery.js'
      }
    },
    watch:{
      all: {
        files:['<%= src.js %>', '<%= src.specs %>', '<%= src.tpl.app %>', '<%= src.tpl.common %>', '<%= src.html %>'],
        tasks:['default','timestamp']
      },
      build: {
        files:['<%= src.js %>', '<%= src.specs %>', '<%= src.tpl.app %>', '<%= src.tpl.common %>', '<%= src.html %>'],
        tasks:['build','timestamp']
      }
    },
    jshint:{
      files:['grunt.js', '<%= src.js %>', '<%= src.specs %>', '<%= src.scenarios %>'],
      options:{
        curly:true,
        eqeqeq:true,
        immed:true,
        latedef:true,
        newcap:true,
        noarg:true,
        sub:true,
        boss:true,
        eqnull:true,
        globals:{}
      }
    }
  });

};