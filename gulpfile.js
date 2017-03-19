var gulp = require('gulp');
var jshint = require('gulp-jshint');
var ghPages = require('gulp-gh-pages');
var processhtml = require('gulp-processhtml');


gulp.task('deploy', ['build'], function() {
  return gulp.src('./dist/**/*')
    .pipe(ghPages());
});

gulp.task('lint', function() {
  return gulp.src(['gulpfile.js', './src/js/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('watch', function() {
  gulp.watch('src/js/*.js', ['lint']);
});

gulp.task('build', ['processhtml', 'bowerdist']);

gulp.task('copysrc', function() {
  return gulp.src('src/**')
    .pipe(gulp.dest('./dist/'));
});

gulp.task('bowerdist', function() {
  var bowerfiles = ['bower_components/html2canvas/build/html2canvas.min.js',
    'bower_components/leaflet-control-geocoder/dist/**/*',
    'bower_components/qrcodejs/qrcode.min.js'
  ];
  return gulp.src(bowerfiles)
    .pipe(gulp.dest('./dist/lib'));
});

gulp.task('processhtml', ['copysrc'], function() {
  return gulp.src('src/index.html')
    .pipe(processhtml())
    .pipe(gulp.dest('./dist/'));
});

gulp.task('default', ['lint', 'build']);
