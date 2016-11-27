"use strict";

//The MIT License (MIT)
//
//Copyright (c) 2016 Satoshi Fujiwara
//
//Permission is hereby granted, free of charge, to any person obtaining a copy
//of this software and associated documentation files (the "Software"), to deal
//in the Software without restriction, including without limitation the rights
//to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//copies of the Software, and to permit persons to whom the Software is
//furnished to do so, subject to the following conditions:
//
//The above copyright notice and this permission notice shall be included in
//all copies or substantial portions of the Software.
//
//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//THE SOFTWARE.

import Graphics from './graphics.js';

var time = 0;
const fps = 60;

// メイン
window.addEventListener('load', function () {

  let graphics = new Graphics(window);
  let play = false;
  let display = true;
  let isRender = false;

  function resize() {
    graphics.resize();
    d3.select('#playbutton').style('font-size',+(graphics.screenWidth / 20) + 'px');
  }

  window.addEventListener('resize',resize);

  resize();

  d3.select('#content').node().appendChild(graphics.renderer.domElement);

  let time = 0;
  let prevTime = 0;

  d3.select('#playbutton')
  .on('click',function(){

    if(display){
      play = !play;
      if(play){
        d3.select(this).attr('class','hidden');
        d3.select(this).html('<i class="fa fa-stop" aria-hidden="true"></i>');
        display = false;
        isRender = true;
        time = 0;
        prevTime = 0;
        render();
      } else {
        d3.select(this).attr('class','active');
        d3.select(this).html('<i class="fa fa-play" aria-hidden="true"></i>');
        isRender = false;
      }
    } else {
      d3.select(this).attr('class','active1');
      display = true;
    }
  });
  graphics.cls();
  graphics.print(0,0,'TEST',7,0);
  graphics.render();
  let c1 = {x:10,y:0}, c2 = {x:20,y:150},c3 = {x:200,y:100};
  function render(){
    let now = window.performance.now();
    time += now - prevTime;
    prevTime = now;
    graphics.cls();
    graphics.triangleFill(c1,c2,{x:200,y:(100 * Math.sin(time / 500) + 100) | 0},7);
    graphics.print(0,0,'TEST',2,0);
    graphics.render(time);
    if(isRender){
      requestAnimationFrame(render);
    }
  }
});



