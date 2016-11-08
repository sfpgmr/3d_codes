(()=>{
'use strict';
const fs = require('fs');
const gulp = require('gulp');
const logger = require('gulp-logger');
const watch = require('gulp-watch');
const source = require('vinyl-source-stream');
const plumber = require('gulp-plumber');

const browserSync =require('browser-sync');

const rollup = require('rollup').rollup;
const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');

let srcJSDir = './js';
let htmlDir = './';
let distDir = '../../dist/00002';
let snapDir = '../../snapshot/00002';

try {
  fs.mkdirSync(distDir);
  fs.mkdirSync(`${distDir}/js`);
} catch (e){
  
}


gulp.task('browser_js',()=>{
  rollup({
    entry: `${srcJSDir}/index.js`,
    plugins: [
      nodeResolve({ jsnext: true }),
      commonjs()
    ],
    external:[
      'events'
    ]
  }).then((bundle)=>{
    bundle.write({
      format: 'iife',
      dest: `${distDir}/js/index.js`
    });
  });
});

//HTMLのコピー
gulp.task('html',function(){
  gulp.src(`${htmlDir}/index.html`).pipe(gulp.dest(`${distDir}`));
});

// devverディレクトリへのコピー
gulp.task('snap',function(){
  var date = new Date();
  var destdir = snapDir + '/' + date.getUTCFullYear() + ('0' + (date.getMonth() + 1)).slice(-2)  + ('0' + date.getDate()).slice(-2);
  
  try {
    fs.mkdirSync(destdir);
    fs.mkdirSync(destdir + '/js');
  } catch (e){
    
  }
  gulp.src(distDir + '/**/*.*').pipe(gulp.dest(destdir));
});

gulp.task('browser-sync', function() {
    browserSync({
        server: {
             baseDir: `${distDir}`
            ,index  : "index.html"
        },
        files:[`${distDir}/**/*.*`]
    });
});

gulp.task('bs-reload', function () {
    browserSync.reload();
});

gulp.task('default',['html','browser_js','browser-sync'],()=>{
    watch(`${srcJSDir}/**/*.js`,()=>gulp.start(['browser_js']));
    watch(`${htmlDir}/**/*.html`,()=>gulp.start(['html']));
});
})();