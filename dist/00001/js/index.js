(function () {
'use strict';

var time;
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

  float c = sin(length(p) * 100.);
  gl_FragColor = vec4(c,c,c,c);
  //gl_FragColor = smoothstep(10./50., 0., abs(c - 0.25) ) * vec4(1.,0.,0.,1.);
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

  window.addEventListener( 'resize', ()=>{
        WIDTH = window.innerWidth;
        HEIGHT = window.innerHeight;
				renderer.setSize(WIDTH,HEIGHT);
  }
  , false );
  let prevTime = window.performance.now();
  function render() {
    let now = window.performance.now();
    time += now - prevTime;
    prevTime = now;
    uniforms.resolution.value.x = WIDTH;
    uniforms.resolution.value.y = HEIGHT;
    uniforms.time.value += 0.1;//time / 1000;
    renderer.render(scene,camera);
    requestAnimationFrame(render);
  }
  render();
});

}());
