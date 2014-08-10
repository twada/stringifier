var gulp = require('gulp'),
    gutil = require('gulp-util'),
    mocha = require('gulp-mocha'),
    mochaPhantomJS = require('gulp-mocha-phantomjs'),
    webserver = require('gulp-webserver'),
    del = require('del'),
    source = require('vinyl-source-stream'),
    browserify = require('browserify'),
    derequire = require('gulp-derequire'),
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

gulp.task('webserver', function() {
    gulp.src(__dirname)
        .pipe(webserver({
            port: 9001,
            directoryListing: true
        }));
});

gulp.task('clean_bundle', function (done) {
    del([config.bundle.destDir], done);
});

gulp.task('bundle', ['clean_bundle'], function() {
    var bundleStream = browserify({entries: config.bundle.srcFile, standalone: config.bundle.standalone}).bundle();
    return bundleStream
        .pipe(source(config.bundle.destName))
        .pipe(derequire())
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
