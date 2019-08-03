// Dependencies
// ------------

var gulp = require('gulp')
var $ = require('gulp-load-plugins')({camelize: true})
var sequence = require('run-sequence')
var del = require('del')
var LessPluginNpmImport = require('less-plugin-npm-import')
var LessPluginAutoPrefix = require('less-plugin-autoprefix')

// Config
// ------

// Set variable via $ gulp --type production
var environment = $.util.env.type || 'development'
var isProduction = environment === 'production'
var distPath = 'priv'

var npmPlugin = new LessPluginNpmImport()
var autoprefixPlugin = new LessPluginAutoPrefix({
  browsers: ['last 2 versions']
})

// Tasks
// -----

gulp.task('clean', function () {
  return del(distPath)
})

gulp.task('less', function () {
  return less({src: 'assets/less/app.less', dest: distPath})
})

gulp.task('build', function (done) {
  sequence(
    'clean',
    ['less'],
    done
  )
})

gulp.task('default', ['lint', 'build'])

var less = function (options) {
  return gulp.src(options.src)
    .pipe($.less({
      plugins: [
        npmPlugin,
        autoprefixPlugin
      ]
    }))
    .pipe($.plumber())
    .pipe($.if(isProduction, $.cleanCss({
      compatibility: 'ie8',
      processImport: false
    })))
    .pipe($.if(isProduction, $.rev()))
    .pipe($.size({title: 'less'}))
    .pipe(gulp.dest(options.dest))
}
