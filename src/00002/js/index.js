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

"use strict";

var time = 0;
const fps = 60;

const vertexShader = `
varying vec2 vUv;
void main()	{
		vUv = uv;
    gl_Position = vec4( position, 1.0 );
  }
`;

const fragmentShader  = `
uniform vec2 resolution;
uniform float time;
varying vec2 vUv;
void main()	{
  vec2 p;
  p.x = (-1.0 + 2.0 * gl_FragCoord.x / resolution.x) * resolution.x / resolution.y ;
  p.y = -1.0 + 2.0 * gl_FragCoord.y / resolution.y;

  float c = cos(atan(p.y,p.x) * 36.0  + time / 100.) + sin(length(p) * 36.0 + time / 100.) ;
  c = smoothstep(0.8, 0., abs(c - 0.5) ); 
  gl_FragColor = vec4(c,0.,0.,c);
}`;

// メイン
window.addEventListener('load', function () {
  var WIDTH = window.innerWidth , HEIGHT = window.innerHeight;
  var renderer = new THREE.WebGLRenderer({ antialias: false, sortObjects: true });

  renderer.setSize(WIDTH, HEIGHT);
  renderer.setClearColor(0x000000, 1);
  renderer.domElement.id = 'console';
  renderer.domElement.className = 'console';
  renderer.domElement.style.zIndex = 0;
	var camera = new THREE.OrthographicCamera(- 1, 1, 1, - 1, 0, 1 );
	var scene  = new THREE.Scene();


	var uniforms = {
      tDiffuse: { value: null },
      resolution: { value: new THREE.Vector2() },
			time:       { value: 0.0 }
    };

  let material = new THREE.ShaderMaterial( {
			uniforms: uniforms,
			vertexShader: vertexShader,
			fragmentShader: fragmentShader
		} );

	var quad = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), material );
  scene.add( quad );
  

  d3.select('#content').node().appendChild(renderer.domElement);
  renderer.clear();

  let prevTime = window.performance.now();
  let play = false;
  let display = true;

  window.addEventListener( 'resize', ()=>{
    WIDTH = window.innerWidth;
    HEIGHT = window.innerHeight;
    renderer.setSize(WIDTH,HEIGHT);
    if(!play)
    {
      render();
    }
  }
  , false );
  d3.select('#playbutton')
  .on('click',function(){

    if(display){
      play = !play;
      if(play){
        d3.select(this).attr('class','hidden');
        d3.select(this).html('<i class="fa fa-stop" aria-hidden="true"></i>');
        display = false;
        render();
      } else {
        d3.select(this).attr('class','active');
        d3.select(this).html('<i class="fa fa-play" aria-hidden="true"></i>');
      }
    } else {
      d3.select(this).attr('class','active1');
      display = true;
    }
  });

  function render() {
    let now = window.performance.now();
    time += now - prevTime;
    prevTime = now;
    uniforms.resolution.value.x = WIDTH;
    uniforms.resolution.value.y = HEIGHT;
    uniforms.time.value = time;//time / 1000;
    renderer.render(scene,camera);
    if(play)
      requestAnimationFrame(render);
  }
  render();
});


