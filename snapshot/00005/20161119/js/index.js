(function () {
'use strict';

const vertexShader = `
precision mediump float;
varying vec2 vtexture_coord;
 
void main(void) {
    gl_Position = vec4(position,0.0,1.0);
    vtexture_coord = texture_coord;
}
`;

const fragmentShader =
  `precision mediump float;
uniform sampler2D textureB;
uniform sampler2D textureG;
uniform sampler2D textureR;
uniform sampler2D pallet_color;
uniform sampler2D textureFont;
uniform sampler2D textureCharCode;
uniform sampler2D textureCharAttr;
uniform float time;
varying vec2 vtexture_coord;
// グラフィック表示
vec4 graphicPlane(void)
{
  //テクスチャ座標よりビット位置を求め、そのビットが立った2進数値を得る。
  float t = exp2(floor(mod(vtexture_coord.x * 512.0,8.0)));
  // RGB各プレーンの現在座標のバイトデータを読み込む
  vec4 rt = texture2D(textureR, vtexture_coord);
  vec4 gt = texture2D(textureG, vtexture_coord);
  vec4 bt = texture2D(textureB, vtexture_coord);
  
  // バイトデータの中でビットが立っているかどうかを調べる
  // Rプレーン
  float r = floor(mod(min(rt.x * 256.0,255.0) / t,2.0)) * 4.0;
  // Gプレーン
  float g = floor(mod(min(gt.x * 256.0,255.0) / t,2.0)) * 2.0;
  // Bプレーン
  float b = floor(mod(min(bt.x * 256.0,255.0) / t,2.0));
  // 各色の値を足して正規化を行い、パレットインデックスから実際の色を得る 
  vec4 p = texture2D(pallet_color,vec2((r + g + b) / 8.0 ,0.5));
  float i = min(p.x * 256.0,255.0);
  float ar = floor(mod(i * 0.5,2.0)); // bit3
  float ag = floor(mod(i * 0.25,2.0));  // bit2
  float ab = floor(mod(i,2.0)); // bit1
  return vec4(ar,ag,ab,1.0);
}
// 文字表示
vec4 textPlane(void){
  // キャラクタコードを読み出し
  vec4 cct = texture2D(textureCharCode, vtexture_coord);
  float cc = min(cct.x * 256.0,255.0);// キャラクターコード
  // アトリビュートを読み出し
  vec4 attrt = texture2D(textureCharAttr, vtexture_coord);
  
  // 表示対象の文字のビット位置を求める
  float x = exp2(floor(mod(vtexture_coord.x * 512.0,8.0)));
  // 表示対象の文字のY位置を求める
  float y = floor(mod(vtexture_coord.y * 256.0,8.0));
  
  // アトリビュートの評価 
  float i = min(attrt.x * 256.0,255.0);// アトリビュートデータ
  
  // キャラクタセット(0.0 .. セット0, 1.0 .. セット1 )
  float att = floor(mod(i / 128.0,2.0)) * 8.0;// bit 7
  // 文字色
  float ccg = floor(mod(i / 64.0,2.0));// bit 6
  float ccr = floor(mod(i / 32.0,2.0));// bit 5
  float ccb = floor(mod(i / 16.0,2.0));// bit 4
  // 背景色
  float bgg = floor(mod(i / 4.0,2.0));// bit 2
  float bgr = floor(mod(i / 2.0,2.0));// bit 1
  float bgb = floor(mod(i ,2.0));// bit 0
  
  // フォント読み出し位置
  vec2 fontpos = vec2(cc / 256.0,(y + att) / 16.0);
  // フォントデータの読み出し
  vec4 pixByte = texture2D(textureFont,fontpos);
  // 指定位置のビットが立っているかチェック
  float pixBit = floor(mod(min(pixByte.x * 256.0,255.0) / x,2.0));
  
  if(pixBit == 1.0){
    // ビットが立っているときは、文字色を設定
    return vec4(ccr,ccg,ccb,1.0);
  } 
  // ビットが立っていないときは背景色を設定
  return vec4(bgr,bgg,bgb,1.0);
}
void main(void){
  vec4 textColor = textPlane();
  if((textColor.r + textColor.g + textColor.b) > 0.0){
    gl_FragColor = textColor;  
  } else {
    vec4 color = graphicPlane();
    gl_FragColor = color;
  }
}
`;

class Graphics {
  constructor(window, vwidth = 320, vheight = 200) {
    this.window = window;
    this.VWIDTH = vwidth;
    this.VHEIGHT = vheight;
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;

    // バッファー
    this.bufferWidth = Math.pow(2, Math.ceil(Math.log2(this.VWIDTH)));
    this.bufferHeight = Math.pow(2, Math.ceil(Math.log2(this.VHEIGHT)));
    this.bufferXSize = this.bufferWidth / 8;
    this.charCodeBufferWidth = 512 / 8;
    this.charCodeBufferHeight = 32;
    this.consoleWidth = 40;
    this.consoleHeight = 25;
    this.fontTexWidth = 256;
    this.fontTexHeight = 16;//8 * 16 * 2;

    let bufferSize = this.bufferXSize * this.bufferHeight;
    this.bufferB = new Uint8Array(bufferSize);
    this.bufferG = new Uint8Array(bufferSize);
    this.bufferR = new Uint8Array(bufferSize);
    
    this.palletColors = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]);

    let charCodeBufferSize = this.charCodeBufferWidth * this.charCodeBufferHeight;
    this.charCodeBuffer = new Uint8Array(charCodeBufferSize);
    this.charAttrBuffer = new Uint8Array(charCodeBufferSize);
    this.fontBuffer = new Uint8Array(this.fontTexWidth * this.fontTexHeight);

    this.renderer = new THREE.WebGLRenderer({ antialias: false, sortObjects: true });

    this.renderer.setSize(this.screenWidth, this.screenHeight);
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.domElement.id = 'console';
    this.renderer.domElement.className = 'console';
    this.renderer.domElement.style.zIndex = 0;
    this.camera = new THREE.OrthographicCamera(- 1, 1, 1, - 1, 0, 1);
    //var camera = new THREE.PerspectiveCamera(90, VWIDTH / VHEIGHT, 0.1, 1000);
    //camera.position.z = screenHeight / 2;
    this.scene = new THREE.Scene();
    this.prevTime = this.window.performance.now();

    this.uniforms = {
      textureB: { value: null },
      textureG: { value: null },
      textureR: { value: null },
      pallet_color: { value: null },
      textureCharCode: { value: null },
      textureCharAttr: { value: null },
      time: { value: 0.0 }
    };

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader
    });

    this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), this.material);
    this.scene.add(this.quad);


    this.renderer.clear();

    this.prevTime = window.performance.now();
    this.isRender = false;


    this.render();

  }

  render() {
    let now = this.window.performance.now();
    this.time += now - this.prevTime;
    this.prevTime = now;
    this.uniforms.time.value = time;//time / 1000;
    this.renderer.render(scene, camera);
    if (this.isRender)
      requestAnimationFrame(this.render.bind(this));
  }

  resize() {
    this.screenWidth = this.window.innerWidth;
    this.screenHeight = this.window.innerHeight;
    if (this.screenWidth > (this.screenHeight * (this.VWIDTH / this.VHEIGHT))) {
      this.screenWidth = this.screenHeight * this.VWIDTH / this.VHEIGHT;
    } else {
      this.screenHeight = this.screenWidth * this.VHEIGHT / this.VWIDTH;
    }
    this.renderer.setSize(this.screenWidth, this.screenHeight);
    if (!this.isRender) {
      this.render();
    }
  }

  renderStart() {
    this.isRender = true;
    this.prevTime = this.window.performance.now();
    this.render();
  }

  renderStop() {
    this.isRender = false;
  }

}

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

// メイン
window.addEventListener('load', function () {

  let graphics = new Graphics(window);
  let play = false;
  let display = true;

  function resize() {
    graphics.resize();
    d3.select('#playbutton').style('font-size',+(screenWidth / 20) + 'px');
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
  graphics.render();
});

}());
