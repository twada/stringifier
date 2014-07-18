var gulp = require('gulp'),
    gutil = require('gulp-util'),
    mocha = require('gulp-mocha'),
    mochaPhantomJS = require('gulp-mocha-phantomjs'),
    connect = require('gulp-connect'),
    clean = require('gulp-clean'),
    source = require('vinyl-source-stream'),
    browserify = require('browserify'),
    config = {
        bundle: {
            standalone: 'stringifier',
            srcFile: './index.js',
            destDir: './build',
            destName: 'stringifier.js'
        },
        test: {
            base: './test/',
            pattern: '**/*_test.js',
            amd: 'test/test-amd.html',
            browser: 'test/test-browser.html'
        }
    };

function runMochaSimply() {
    return gulp
        .src(config.test.base + config.test.pattern, {read: false})
        .pipe(mocha({
            ui: 'bdd',
            reporter: 'dot'
        }))
        .on('error', gutil.log);
}

gulp.task('connect', function() {
    connect.server({
        root: [__dirname],
        port: 9001,
        keepalive: true
    });
});

gulp.task('clean_bundle', function () {
    return gulp
        .src(config.bundle.destDir, {read: false})
        .pipe(clean());
});

gulp.task('bundle', ['clean_bundle'], function() {
    var bundleStream = browserify(config.bundle.srcFile).bundle({standalone: config.bundle.standalone});
    return bundleStream
        .pipe(source(config.bundle.destName))
        .pipe(gulp.dest(config.bundle.destDir));
});

gulp.task('unit', function () {
    return runMochaSimply();
});

gulp.task('test_amd', ['bundle'], function () {
    return gulp
        .src(config.test.amd)
        .pipe(mochaPhantomJS({reporter: 'dot'}));
});

gulp.task('test_browser', ['bundle'], function () {
    return gulp
        .src(config.test.browser)
        .pipe(mochaPhantomJS({reporter: 'dot'}));
});

gulp.task('clean', ['clean_bundle']);

gulp.task('test', ['unit','test_browser','test_amd']);
