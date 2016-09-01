var gulp = require("gulp");

// sass

gulp.task("sass", function() {
    var postcss = require("gulp-postcss");
    var autoprefixer = require("autoprefixer");
    var sass = require("gulp-sass");

    return gulp.src("./source/style.scss")
        .pipe(sass().on("error", sass.logError))
        .pipe(postcss([ autoprefixer({ browsers: ["last 2 versions"] }) ]))
        .pipe(gulp.dest("./"));
});

// pug

gulp.task("pug", function() {
    var pug = require("gulp-pug");

    gulp.src("./source/index.pug")
        .pipe(pug())
        .pipe(gulp.dest("./"));
});

// watch

gulp.task("watch", function() {
    gulp.watch("./source/index.pug", ["pug"]);
    gulp.watch("./source/style.scss", ["sass"]);
});

// everything

gulp.task("default", ["pug", "sass", "watch"]);
