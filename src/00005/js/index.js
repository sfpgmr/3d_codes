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

  function resize() {
    graphics.resize();
    d3.select('#playbutton').style('font-size',+(graphics.screenWidth / 20) + 'px');
  }

  window.addEventListener('resize',resize);

  resize();

  d3.select('#content').node().appendChild(graphics.renderer.domElement);

  d3.select('#playbutton')
  .on('click',function(){

    if(display){
      play = !play;
      if(play){
        d3.select(this).attr('class','hidden');
        d3.select(this).html('<i class="fa fa-stop" aria-hidden="true"></i>');
        display = false;
        graphics.renderStart();
      } else {
        d3.select(this).attr('class','active');
        d3.select(this).html('<i class="fa fa-play" aria-hidden="true"></i>');
        graphics.renderStop();
      }
    } else {
      d3.select(this).attr('class','active1');
      display = true;
    }
  });
  graphics.cls();
  graphics.print(0,0,'TEST',7,0);
  graphics.render();
});


