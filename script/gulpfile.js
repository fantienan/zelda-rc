// 引入插件
const { src, dest, parallel } = require("gulp");
const less = require("gulp-less");
// // var concat = require("gulp-concat");
// // var uglify = require("gulp-uglify");
// // var rename = require("gulp-rename");
function convertLess() {
  return src("../src/components/**/*.less")
    .pipe(dest("../dist/es"))
    .pipe(less())
    .pipe(dest("../dist/es"))
}

exports.default = parallel(convertLess);
