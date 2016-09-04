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
const layouts = require('metalsmith-layouts');

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
    ]
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
    .pipe(sass({
      includePaths: ['bower_components/foundation/scss']
    }));

  let vendorsStream = gulp.src(config.styles.vendors);

  return merge(sassStream, vendorsStream)
    .pipe(concat('app.css'))
    .pipe(gulp.dest(config.styles.dest));
});

gulp.task('webserver', () => {
  gulp.src(config.server.src)
    .pipe(webserver({
      host: config.server.host,
      port: config.server.port,
      livereload: true,
    }));
});


gulp.task('openbrowser', () => opn(`http://${config.server.host}:${config.server.port}`));

gulp.task('watch', () => {
  gulp.watch(config.styles.src, ['styles']);
  gulp.watch([
    path.join(paths.src, '**/*.md'),
    path.join(paths.src, '**/*.html'),
  ], ['html', 'styles', 'prism']);
});

/**
 * Metalsmith
 */
gulp.task('html', () => {
  return metalsmith('src')
    .destination('../dist')
    .source('html')
    .use(layouts({
      engine: 'handlebars',
    }))
    .build(() => {});
});

gulp.task('prism', () => {
  let languages = ['javascript', 'ruby', 'yaml', 'php', 'bash'];
  let components = languages.map(lang => `bower_components/prism/components/prism-${lang}.js`);
  components.unshift('bower_components/prism/prism.js');
  gulp.src(components)
    .pipe(concat('prism.js'))
    .pipe(gulp.dest(config.scripts.dest));
});

gulp.task('build', ['html', 'styles', 'prism']);
gulp.task('default', ['build', 'webserver', 'watch', 'openbrowser']);

