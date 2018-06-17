/*eslint-env es6*/

const gulp = require('gulp');
const gUtil = require('gulp-util');
const plumber = require('gulp-plumber');
const sass = require('gulp-sass');
const compass = require('gulp-compass');
const webserver = require('gulp-webserver');
const opn = require('opn');
const path = require('path');
const concat = require('gulp-concat');
const merge = require('merge-stream');
const metalsmith = require('metalsmith');
const layouts = require('metalsmith-layouts');
const childProcess = require('child_process');
const runSequence = require('run-sequence');
const ARGS = require('minimist')(process.argv);

const paths = {
  src: 'src',
  dest: 'dist'
};

const DEV = ARGS.dev;

var config = {
  styles: {
    src: path.join(paths.src, 'assets/scss/**/*.scss'),
    dest: path.join(paths.dest, 'css'),
    vendors: [
      'bower_components/prism/themes/prism.css',
    ],
    sassConfig: {
      includePaths: ['bower_components/foundation/scss']
    },
    compassConfig: {
      bundle_exec: true,
      css: `${__dirname}/dist/css`,
      sass: `${__dirname}/src/assets/scss`,
      import_path: [
        `${__dirname}/bower_components`,
        `${__dirname}/bower_components/foundation/scss`
      ],
      relative: false,
      style: 'expanded'
    },
  },
  scripts: {
    dest: path.join(paths.dest, 'js')
  },
  images: {
    src: path.join(paths.src, 'assets/images/**'),
    dest: path.join(paths.dest, 'img')
  },
  server: {
    src: paths.dest,
    host: 'localhost',
    port: '8001'
  },
  prism: {
    theme: 'dark',
    languages: ['javascript', 'ruby', 'yaml', 'php', 'bash', 'html', 'lua', 'vim', 'applescript', 'zsh'],
  },
};

gulp.task('styles', () => {
  let sassStream = gulp.src(config.styles.src)
    .pipe(plumber())
    .pipe(compass(config.styles.compassConfig));

  let vendorsStream = gulp.src(config.styles.vendors);

  return merge(sassStream, vendorsStream)
    .pipe(concat('app.css'))
    .pipe(gulp.dest(config.styles.dest));
});

gulp.task('images', () => {
  return gulp.src(config.images.src)
    .pipe(gulp.dest(config.images.dest));
});

gulp.task('webserver', ['build'], () => {
  gulp.src(config.server.src)
    .pipe(webserver({
      host: config.server.host,
      port: config.server.port,
      livereload: true
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
  let jekyllArgs = [
    `--config=${paths.src}/jekyll/_config.yml`,
    `--source=${paths.src}/jekyll`,
    `--destination=${paths.dest}`
  ].concat(DEV ? ['--drafts'] : []);
  return childProcess.spawn('bundle', [
    'exec', 'jekyll', 'build'].concat(jekyllArgs), {stdio: 'inherit'})
    .on('error', e => gUtil.log(gUtil.colors.red(e.message)))
    .on('close', (code) => {
      cb(code == 0 ? null : `Jekyll returned an error with code: ${code}`);
    });
});

gulp.task('prism', ['prism-theme'], () => {
  let components = config.prism.languages.map(lang => `bower_components/prism/components/prism-${lang}.js`);
  components.unshift('bower_components/prism/prism.js');
  gulp.src(components)
    .pipe(concat('prism.js'))
    .pipe(gulp.dest(config.scripts.dest));
});

gulp.task('prism-theme', () => {
  const files = [
    'bower_components/prism/themes/prism.css',
  ];
  if (config.prism.theme) {
    files.push(`bower_components/prism/themes/prism-${config.prism.theme}.css`);
  }
  gulp.src(files)
    .pipe(concat('prism.css'))
    .pipe(gulp.dest(config.styles.dest));
});

gulp.task('build', (cb) => {
  runSequence('html', ['styles', 'prism', 'images'], cb);
});

gulp.task('default', ['build', 'webserver', 'watch', 'openbrowser']);

