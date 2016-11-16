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
varying vec2 vUv;
uniform vec2 resolution;
uniform float time;
 
vec3 trans(vec3 p)
{
  return mod(p, 8.0)-4.0;
}
 
float lengthN(vec3 v, float n)
{
  vec3 tmp = pow(abs(v), vec3(n));
  return pow(tmp.x+tmp.y+tmp.z, 1.0/n);
}
 
float distanceFunction(vec3 pos)
{
  return lengthN(trans(pos), 4.0) - 1.0;
}
 
vec3 getNormal(vec3 p)
{
  const float d = 0.0001;
  return
    normalize
    (
      vec3
      (
        distanceFunction(p+vec3(d,0.0,0.0))-distanceFunction(p+vec3(-d,0.0,0.0)),
        distanceFunction(p+vec3(0.0,d,0.0))-distanceFunction(p+vec3(0.0,-d,0.0)),
        distanceFunction(p+vec3(0.0,0.0,d))-distanceFunction(p+vec3(0.0,0.0,-d))
      )
    );
}
 
void main() {
  vec2 pos = (gl_FragCoord.xy*2.0 -resolution) / resolution.y;
 
  vec3 camPos = vec3(0.0, 0.0, 3.0-time/100.);
  vec3 camDir = vec3(0.0, 0.0, -1.0);
  vec3 camUp = vec3(0.0, 1.0, 0.0);
  vec3 camSide = cross(camDir, camUp);
  float focus = 1.8;
 
  vec3 rayDir = normalize(camSide*pos.x + camUp*pos.y + camDir*focus);
 
  float t = 0.0, d;
  vec3 posOnRay = camPos;
 
  for(int i=0; i<64; ++i)
  {
    d = distanceFunction(posOnRay);
    t += d;
    posOnRay = camPos + t*rayDir;
  }
 
  vec3 normal = getNormal(posOnRay);
  if(abs(d) < 0.001)
  {
    gl_FragColor = vec4(normal, 1.0);
  }else
  {
    gl_FragColor = vec4(0.0);
  }
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
