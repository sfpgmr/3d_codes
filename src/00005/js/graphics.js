'use strict';

import { fontData } from './mz700fon.js';
import { charCodes, canaCodes } from './charCodes.js';
const vertexShader = `
precision mediump float;
varying vec2 vtexture_coord;
 
void main(void) {
    gl_Position = vec4(position,1.);
    vtexture_coord = uv;
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
  //  return texture2D(pallet_color,vec2((ccr + ccg + ccb) / 8.0 ,0.5));
  } 
  // ビットが立っていないときは背景色を設定
 // return texture2D(pallet_color,vec2((bgr + bgg + bgb) / 8.0 ,0.5));
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

// ビットのMSBとLSBを入れ替えるメソッド
function rev(x) {
  x = x & 0xff;
  // 0bitと1bit、2bitと3bit、4bitと5bit、6bitと7ビットの反転
  x = ((x & 0x55) << 1) | ((x >>> 1) & 0x55);
  // 0-1bitと2-3bit、4-5bitと6-7bitの反転
  x = ((x & 0x33) << 2) | ((x >>> 2) & 0x33);
  // 0-3bit、4-7bitの反転
  x = ((x & 0x0F) << 4) | ((x >>> 4) & 0x0F);
  return x;
}

export default class Graphics {
  constructor(window, vwidth = 320, vheight = 200) {
    this.window = window;
    this.VWIDTH = vwidth;
    this.VHEIGHT = vheight;
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;
    this.renderer = new THREE.WebGLRenderer({ antialias: false });

    this.renderer.setSize(this.screenWidth, this.screenHeight);
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.domElement.id = 'console';
    this.renderer.domElement.className = 'console';
    this.renderer.domElement.style.zIndex = 0;
    // 仮想画面
    this.renderTarget = new THREE.WebGLRenderTarget(this.VWIDTH, this.VHEIGHT,
      {
        magFilter: THREE.NearestFilter,
        minFilter: THREE.NearestFilter,
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
        needsUpdate:true
      });
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
    this.textureB = new THREE.DataTexture(this.bufferB, this.bufferXSize, this.bufferHeight, THREE.LuminanceFormat, THREE.UnsignedByteType);
    this.textureB.needsUpdate = true;
    this.textureG = new THREE.DataTexture(this.bufferG, this.bufferXSize, this.bufferHeight, THREE.LuminanceFormat, THREE.UnsignedByteType);
    this.textureG.needsUpdate = true;
    this.textureR = new THREE.DataTexture(this.bufferR, this.bufferXSize, this.bufferHeight, THREE.LuminanceFormat, THREE.UnsignedByteType);
    this.textureR.needsUpdate = true;

    this.palletColors = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]);
    this.texturePallet = new THREE.DataTexture(this.palletColors, this.palletColors.length, 1, THREE.LuminanceFormat, THREE.UnsignedByteType);
    this.texturePallet.needsUpdate = true;


    let charCodeBufferSize = this.charCodeBufferWidth * this.charCodeBufferHeight;
    this.charCodeBuffer = new Uint8Array(charCodeBufferSize);
    this.charAttrBuffer = new Uint8Array(charCodeBufferSize);
    this.fontBuffer = new Uint8Array(this.fontTexWidth * this.fontTexHeight);

    this.texCharCodeBuffer = new THREE.DataTexture(this.charCodeBuffer, this.charCodeBufferWidth, this.charCodeBufferHeight, THREE.LuminanceFormat, THREE.UnsignedByteType);
    this.texCharCodeBuffer.needsUpdate = true;
    this.texCharAttrBuffer = new THREE.DataTexture(this.charAttrBuffer, this.charCodeBufferWidth, this.charCodeBufferHeight, THREE.LuminanceFormat, THREE.UnsignedByteType);
    this.texCharAttrBuffer.needsUpdate = true;
    this.texFontBuffer = new THREE.DataTexture(this.fontBuffer, this.fontTexWidth, this.fontTexHeight, THREE.LuminanceFormat, THREE.UnsignedByteType);
    this.texFontBuffer.needsUpdate = true;
    // フォントデータの読み込み
    {
      let idx = 0;
      let offset = 0;
      fontData.forEach((d, i) => {
        offset = ((i / 256) | 0) * 8;
        idx = i % 256;
        d.forEach((byteChar, iy) => {
          let byte = parseInt(byteChar, 2);
          this.fontBuffer[idx + (iy + offset) * 256] = rev(byte);
        });
      });
    }

    //var camera = new THREE.PerspectiveCamera(90, VWIDTH / VHEIGHT, 0.1, 1000);
    //camera.position.z = screenHeight / 2;
    this.time = 0;
    this.prevTime = this.window.performance.now();
    this.vscene = new THREE.Scene();

    this.uniforms = {
      textureB: { value: this.textureB },
      textureG: { value: this.textureG },
      textureR: { value: this.textureR },
      pallet_color: { value: this.texturePallet },
      textureFont: { value: this.texFontBuffer },
      textureCharCode: { value: this.texCharCodeBuffer },
      textureCharAttr: { value: this.texCharAttrBuffer },
      time: { value: 0.0 }
    };

    this.vmaterial = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader
    });
    {
      let g = new THREE.Geometry();
      g.vertices.push(new THREE.Vector3(-1.0,1.0,0.0));
      g.vertices.push(new THREE.Vector3(1.0,1.0,0.0));
      g.vertices.push(new THREE.Vector3(-1.0,-1.0,0.0));
      g.vertices.push(new THREE.Vector3(1.0,-1.0,0.0));
      g.faces.push(new THREE.Face3(0, 2, 1));
      g.faces.push(new THREE.Face3(2, 3, 1));      
	// 0.0, 0.0,
	//  	virtualWidth / bufferWidth , 0.0,
	//  	0.0, virtualHeight / bufferHeight,
	//  	virtualWidth / bufferWidth, virtualHeight / bufferHeight

      g.faceVertexUvs[0].push([
        new THREE.Vector2(0.0,0.0),
        new THREE.Vector2(0.0,this.VHEIGHT / this.bufferHeight),
        new THREE.Vector2(this.VWIDTH / this.bufferWidth,0.0),
      ]);
      g.faceVertexUvs[0].push([
        new THREE.Vector2(0.0,this.VHEIGHT / this.bufferHeight),
        new THREE.Vector2(this.VWIDTH / this.bufferWidth,this.VHEIGHT / this.bufferHeight),
        new THREE.Vector2(this.VWIDTH / this.bufferWidth,0.0)
      ]);      
      this.vquad = new THREE.Mesh(g, this.vmaterial);

    }
    this.vcamera = new THREE.OrthographicCamera(- 1, 1, 1, - 1, 0, 1);
    this.vscene.add(this.vquad);

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(- 1, 1, 1, - 1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2,2),new THREE.MeshBasicMaterial({map:this.renderTarget.texture}));
    this.scene.add(this.quad);

    this.renderer.clear();

    this.prevTime = window.performance.now();
    this.isRender = false;
    for (let x = 0; x < 320; ++x) {
      for (let y = 0; y < 200; ++y) {
        this.pset(x, y, y % 8);
      }
    }


    this.render();

  }

  render() {
    let now = this.window.performance.now();
    this.time += now - this.prevTime;
    this.prevTime = now;
    this.uniforms.time.value = this.time;//time / 1000;
    for(let i = 0;i < 8;++i){
      this.palletColors[i] = (this.time / 50 + i) % 8;
    }

    this.print(0,0,'TEST',7,0);
    this.texturePallet.needsUpdate = true;
    this.texCharCodeBuffer.needsUpdate = true;
    this.texCharAttrBuffer.needsUpdate = true;
    // this.textureB.needsUpdate = true;
    // this.textureG.needsUpdate = true;
    // this.textureR.needsUpdate = true;
    // this.texturePallet.needsUpdate = true;
    this.renderer.render(this.vscene, this.vcamera,this.renderTarget);
    this.renderer.render(this.scene,this.camera);
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

  // グラフィックのメソッドたち

  pset(x, y, color) {
    let offset = (y * this.bufferXSize + x / 8) | 0;
    let bitpos = x % 8;


    let b = (color & 1) << bitpos;
    let m = ~(1 << bitpos) & 0xff;
    let g = ((color >>> 1) & 1) << bitpos;
    let r = ((color >>> 2) & 1) << bitpos;

    this.bufferB[offset] = (this.bufferB[offset] & m) | b;
    this.bufferG[offset] = (this.bufferG[offset] & m) | g;
    this.bufferR[offset] = (this.bufferR[offset] & m) | r;
  }

  preset(x, y) {
    let offset = (y * this.bufferXSize + x / 8) | 0;
    let bit = ~(1 << (x % 8));
    this.bufferB[offset] &= bit;
    this.bufferG[offset] &= bit;
    this.bufferR[offset] &= bit;
  }

  cls() {
    for (var i = 0, e = this.bufferXSize * this.bufferHeight; i < e; ++i) {
      this.bufferB[i] = 0;
      this.bufferG[i] = 0;
      this.bufferR[i] = 0;
    }

    for (var i = 0, e = this.charCodeBufferWidth * this.charCodeBufferHeight; i < e; ++i) {
      this.charCodeBuffer[i] = 0;
      this.charAttrBuffer[i] = 0;
    }
  }


  print(x, y, str, color, bgcolor, hirakana = false) {
    let offset = x + y * this.charCodeBufferWidth;
    for (let i = 0, e = str.length; i < e; ++i) {
      let code = str.charCodeAt(i);
      if (code >= 0xff60 && code < 0xffa0) {
        code -= 0xff60;
        this.charCodeBuffer[offset] = canaCodes[code][0];
        this.charAttrBuffer[offset] = (color << 4) | bgcolor | canaCodes[code][1];
        if (hirakana) this.charAttrBuffer[offset] |= 0x80;
        offset += 1;
      } else if (code < 0x80) {
        this.charCodeBuffer[offset] = charCodes[code][0];
        this.charAttrBuffer[offset] = (color << 4) | bgcolor | charCodes[code][1];
        if (hirakana) charAttrBuffer[offset] |= 0x80;
        offset += 1;
      } else if (code <= 0xff) {
        this.charCodeBuffer[offset] = code;
        this.charAttrBuffer[offset] = (color << 4) | bgcolor;
        if (hirakana) this.charAttrBuffer[offset] |= 0x80;
        offset += 1;
      } else {
        offset += 1;
      }
    }
  }

  printDirect(x, y, str, color, bgcolor, charset = 0) {
    let offset = x + y * this.charCodeBufferWidth;
    for (let i = 0, e = str.length; i < e; ++i) {
      let code = str.charCodeAt(i);
      this.charCodeBuffer[offset] = code;
      this.charAttrBuffer[offset] = (color << 4) | bgcolor;
      this.charAttrBuffer[offset] |= (charset << 7);
      offset += 1;
    }
  }


  setColor(x, y, color, bgcolor) {
    let offset = x + y * this.charCodeBufferWidth;
    this.charAttrBuffer[offset] = (color << 4) | bgcolor | (this.charAttrBuffer[offset] & 0x80);
  }

}