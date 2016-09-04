/*eslint-env es6*/

const gulp = require('gulp');
const gUtil = require('gulp-util');
const plumber = require('gulp-plumber');
const sass = require('gulp-sass');
const webserver = require('gulp-webserver');
const opn = require('opn');
const path = require('path');
const concat = require('gulp-concat');
const merge = require('merge-stream');
const metalsmith = require('metalsmith');
const layouts = require('metalsmith-layouts');
const childProcess = require('child_process');
const runSequence = require('run-sequence');

const paths = {
  src: 'src',
  dest: 'dist'
};

var config = {
  styles: {
    src: path.join(paths.src, 'assets/scss/**/*.scss'),
    dest: path.join(paths.dest, 'css'),
    vendors: [
      'bower_components/prism/themes/prism.css',
    ],
    sassConfig: {
      includePaths: ['bower_components/foundation/scss']
    }
  },
  scripts: {
    dest: path.join(paths.dest, 'js')
  },
  server: {
    src: paths.dest,
    host: 'localhost',
    port: '8001'
  },
};

gulp.task('styles', () => {
  let sassStream = gulp.src(config.styles.src)
    .pipe(plumber())
    .pipe(sass(config.styles.sassConfig));

  let vendorsStream = gulp.src(config.styles.vendors);

  return merge(sassStream, vendorsStream)
    .pipe(concat('app.css'))
    .pipe(gulp.dest(config.styles.dest));
});

gulp.task('webserver', ['build'], () => {
  gulp.src(config.server.src)
    .pipe(webserver({
      host: config.server.host,
      port: config.server.port,
      livereload: true,
    }));
});


gulp.task('openbrowser', ['webserver'], () => opn(`http://${config.server.host}:${config.server.port}`));

gulp.task('watch', ['build'], () => {
  gulp.watch(config.styles.src, ['styles']);
  gulp.watch([
    path.join(paths.src, 'jekyll', '**', '*'),
  ], ['build']);
});

/**
 * Jekyll
 */
gulp.task('html', (cb) => {
  return childProcess.spawn('bundle', [
    'exec', 'jekyll', 'build',
    `--config=${paths.src}/jekyll/_config.yml`,
    `--source=${paths.src}/jekyll`,
    `--destination=${paths.dest}`
  ], {stdio: 'inherit'})
    .on('error', e => gUtil.log(gUtil.colors.red(e.message)))
    .on('close', (code) => {
      cb(code == 0 ? null : `Jekyll returned an error with code: ${code}`);
    });
});

gulp.task('prism', () => {
  let languages = ['javascript', 'ruby', 'yaml', 'php', 'bash', 'html', 'lua', 'vim'];
  let components = languages.map(lang => `bower_components/prism/components/prism-${lang}.js`);
  components.unshift('bower_components/prism/prism.js');
  gulp.src(components)
    .pipe(concat('prism.js'))
    .pipe(gulp.dest(config.scripts.dest));
});

gulp.task('build', (cb) => {
  runSequence('html', ['styles', 'prism'], cb);
});

gulp.task('default', ['build', 'webserver', 'watch', 'openbrowser']);

