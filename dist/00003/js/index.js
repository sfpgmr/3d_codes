(function () {
'use strict';

var time = 0;
const vertexShader = `
varying vec2 vUv;
void main()	{
		vUv = uv;
    gl_Position = vec4( position, 1.0 );
  }
`;

const fragmentShader  = `
#define PI 3.14159265359
uniform vec2 resolution;
uniform float time;
varying vec2 vUv;
void main()	{
  vec2 p;
  p.x = (-1.0 + 2.0 * gl_FragCoord.x / resolution.x) * resolution.x / resolution.y ;
  p.y = -1.0 + 2.0 * gl_FragCoord.y / resolution.y;
  p = p * 8.;
  float t = time / 1000.;
  // プラズマのコード
  // 参考:https://www.shadertoy.com/view/Md23DV
  float v1 = sin(p.x + t);
  float v2 = sin(p.y + t);
  float v3 = sin(p.x + p.y + t);
  float v4 = sin(sqrt(p.x*p.x + p.y*p.y) + 1.2 * t);
	float v = (v1+v2+v3+v4);

  gl_FragColor = vec4(sin(v), sin(v+0.5*PI), sin(v+1.0*PI),1.);
}`;

// メイン
window.addEventListener('load', function () {
  var WIDTH = window.innerWidth , HEIGHT = window.innerHeight;
  d3.select('#playbutton').style('font-size',+(WIDTH / 20) + 'px');

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
  d3.select('#playbutton').style('font-size',+(WIDTH / 20) + 'px');
    renderer.setSize(WIDTH,HEIGHT);
    if(!play)
    {
      render();
    }
  });
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

}());
