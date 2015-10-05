var fs = require('fs'),
    gulp = require('gulp'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    streamify = require('gulp-streamify'),
    livereload = require('gulp-livereload'),
    del = require('del'),
    browserify = require('browserify'),
    babelify = require('babelify'),
    webserver = require('gulp-webserver'),
    source = require('vinyl-source-stream'),
    server = {
        host: 'localhost',
        port: '8000'
    },
    jsAssets = [
        'node_modules/bootstrap/dist/js/bootstrap.min.js'
    ],
    cssAssets = [
        'node_modules/bootstrap/dist/css/bootstrap.css',
        'node_modules/font-awesome/css/font-awesome.css',
        'node_modules/medium-editor/dist/css/medium-editor.css',
        'node_modules/medium-editor/dist/css/themes/beagle.css',
        'src/css/**/*.css'
    ],
    cleanFolders = [
        'dist/assets/images/**/*',
        'dist/assets/fonts/**/*',
        'dist/assets/css/**/*',
        'dist/assets/js/**/*'
    ];

gulp.task('webserver', function() {
    gulp.src('.')
    .pipe(webserver({
        host:               server.host,
        port:               server.port,
        livereload:         true,
        directoryListing:   false,
        open:               true
    }));
});

gulp.task('clean', function(cb) {
    del(cleanFolders, cb);
});

gulp.task('sass', function() {
    gulp.src('src/styles/**/*.scss', {style: 'expanded'})
        .pipe(sass())
        .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1'))
        .pipe(concat('style.css'))
        .pipe(gulp.dest('src/css'));
});

gulp.task('css', function() {
    gulp.src(cssAssets, {style: 'expanded'})
        .pipe(concat('main.css'))
        .pipe(rename({suffix: '.min'}))
        .pipe(minifycss())
        .pipe(gulp.dest('dist/assets/css'));
});

gulp.task('scripts', function() {
    // Single entry point to browserify
    return browserify({
            entries: 'src/js/app.js',
            extensions: ['.jsx'],
            debug: true
        })
        .transform(babelify)
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(streamify(uglify()))
        .pipe(gulp.dest('dist/assets/js'));
});

gulp.task('assets', function() {
    gulp.src(['node_modules/bootstrap/fonts/**/*.*']).pipe(gulp.dest('dist/assets/fonts'));
    gulp.src(['node_modules/font-awesome/fonts/**/*.*']).pipe(gulp.dest('dist/assets/fonts'));
    gulp.src(['src/images/**/*.*']).pipe(gulp.dest('dist/assets/images'));
    gulp.src(jsAssets).pipe(gulp.dest('dist/assets/js'));
});

gulp.task('notify', function() {
    gulp.src('gulpfile.js').pipe(notify({title: 'Build complete', message: 'Done'}));
});

gulp.task('watch', function() {
    // Watch .scss files
    gulp.watch('src/styles/**/*.scss', ['sass', 'css', 'notify']);

    // Watch .js files
    gulp.watch('src/js/**/*.js', ['scripts', 'notify']);

    // Watch .jsx files
    gulp.watch('src/js/**/*.jsx', ['scripts', 'notify']);
});

gulp.task('default', ['clean', 'assets', 'sass', 'css', 'scripts', 'webserver', 'watch']);

