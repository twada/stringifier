var gulp = require('gulp');
var gutil = require('gulp-util');
var mocha = require('gulp-mocha');
var mochaPhantomJS = require('gulp-mocha-phantomjs');
var webserver = require('gulp-webserver');
var del = require('del');
var path = require('path');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var licensify = require('licensify');
var derequire = require('gulp-derequire');
var dereserve = require('gulp-dereserve');
var config = {
    bundle: {
        standalone: 'stringifier',
        srcFile: './index.js',
        destDir: './build',
        destName: 'stringifier.js'
    },
    assert_bundle: {
        standalone: 'assert',
        require: 'assert',
        destDir: './build',
        destName: 'assert.js'
    },
    test: {
        base: './test/',
        pattern: '**/*_test.js',
        amd: 'test/test-amd.html',
        browser: 'test/test-browser.html'
    }
};
var BUILDS = ['assert'];

function runMochaSimply() {
    return gulp
        .src(config.test.base + config.test.pattern, {read: false})
        .pipe(mocha({
            ui: 'bdd',
            reporter: 'dot'
        }))
        .on('error', gutil.log);
}

gulp.task('serve', function() {
    gulp.src(__dirname)
        .pipe(webserver({
            port: 9001,
            directoryListing: true
        }));
});

gulp.task('clean_bundle', function () {
    del.sync([config.bundle.destDir]);
});

gulp.task('bundle', ['clean_bundle'], function() {
    var b = browserify({entries: config.bundle.srcFile, standalone: config.bundle.standalone});
    b.plugin(licensify);
    var bundleStream = b.bundle();
    return bundleStream
        .pipe(source(config.bundle.destName))
        .pipe(dereserve())
        .pipe(derequire())
        .pipe(gulp.dest(config.bundle.destDir));
});

BUILDS.forEach(function (name) {
    gulp.task('clean_' + name + '_bundle', function () {
        del.sync([path.join(config[name + '_bundle'].destDir, config[name + '_bundle'].destName)]);
    });
    gulp.task(name + '_bundle', ['clean_' + name + '_bundle'], function() {
        var b = browserify({standalone: config[name + '_bundle'].standalone});
        if (config[name + '_bundle'].srcFile) {
            b.add(config[name + '_bundle'].srcFile);
        }
        if (config[name + '_bundle'].require) {
            b.require(config[name + '_bundle'].require);
        }
        return b.bundle()
            .pipe(source(config[name + '_bundle'].destName))
            .pipe(derequire())
            .pipe(gulp.dest(config[name + '_bundle'].destDir));
    });
});
gulp.task('clean_deps', BUILDS.map(function (name) { return 'clean_' + name + '_bundle'; }));
gulp.task('build_deps', BUILDS.map(function (name) { return name + '_bundle'; }));

gulp.task('unit', function () {
    return runMochaSimply();
});

gulp.task('test_amd', ['bundle', 'build_deps'], function () {
    return gulp
        .src(config.test.amd)
        .pipe(mochaPhantomJS({reporter: 'dot'}));
});

gulp.task('test_browser', ['bundle', 'build_deps'], function () {
    return gulp
        .src(config.test.browser)
        .pipe(mochaPhantomJS({reporter: 'dot'}));
});

gulp.task('clean', ['clean_bundle', 'clean_deps']);

gulp.task('test', ['unit','test_browser','test_amd']);
