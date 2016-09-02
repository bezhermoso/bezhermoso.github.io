/*eslint-env es6*/

const gulp = require('gulp');
const plumber = require('gulp-plumber');
const sass = require('gulp-sass');
const webserver = require('gulp-webserver');
const opn = require('opn');
const path = require('path');
const concat = require('gulp-concat');
const merge = require('merge-stream');
const metalsmith = require('metalsmith');

const paths = {
  src: 'src',
  dest: 'dist'
};

var options = {
  styles: {
    src: path.join(paths.src, 'assets/scss/**/*.scss'),
    dest: path.join(paths.dest, 'css'),
    vendors: [
      'bower_components/prism/themes/prism.css',
    ]
  },
  scripts: {
    dest: path.join(paths.dest, 'js')
  },
  server: {
    src: paths.dest,
    host: 'localhost',
    port: '8001'
  }
};

gulp.task('styles', () => {
  let sassStream = gulp.src(options.styles.src)
    .pipe(plumber())
    .pipe(sass({
      includePaths: ['bower_components/foundation/scss']
    }));

  let vendorsStream = gulp.src(options.styles.vendors);

  return merge(sassStream, vendorsStream)
    .pipe(concat('app.css'))
    .pipe(gulp.dest(options.styles.dest));
});

gulp.task('webserver', () => {
  gulp.src(options.server.src)
    .pipe(webserver({
      host: options.server.host,
      port: options.server.port,
      livereload: true,
    }));
});


gulp.task('openbrowser', () => {
  opn( 'http://' + options.server.host + ':' + options.server.port );
});

gulp.task('watch', () => {
  gulp.watch(options.styles.src, ['styles']);
});

/**
 * Metalsmith
 */
gulp.task('html', () => {
  let m = metalsmith(paths.src)
    .
});

gulp.task('prism', () => {
  let languages = ['javascript', 'ruby', 'yaml', 'php', 'bash'];
  let components = languages.map(lang => `bower_components/prism/components/prism-${lang}.js`);
  components.unshift('bower_components/prism/prism.js');
  gulp.src(components)
    .pipe(concat('prism.js'))
    .pipe(gulp.dest(options.scripts.dest));
});

gulp.task('build', ['styles', 'prism']);
gulp.task('default', ['build', 'webserver', 'watch', 'openbrowser']);

