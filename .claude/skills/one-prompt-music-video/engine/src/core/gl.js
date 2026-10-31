// Shared WebGL2 context: fullscreen shader passes, ping-pong sims, and the final post pass.
// The GL canvas is ALSO the output canvas (what gets captured), so scenes must draw their shader
// result into the 2D context right after calling G.shader() (G.draw does that for you).
import { W, H } from './lib.js';

const VERT = `#version 300 es
in vec2 p; out vec2 uv;
void main(){ uv = p*0.5+0.5; gl_Position = vec4(p,0.,1.); }`;
const HEAD = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o;
uniform vec2 uRes;
`;

export const G = {
  gl: null, canvas: null, progs: new Map(), texCache: new Map(),

  init(canvas) {
    const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false, alpha: false });
    if (!gl) throw new Error('WebGL2 unavailable');
    gl.getExtension('EXT_color_buffer_float'); gl.getExtension('OES_texture_float_linear');
    this.gl = gl; this.canvas = canvas;
    const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    this.vb = vb;
    this.initPost();
  },

  /** compile (cached) a fragment shader. `frag` gets HEAD prepended unless it starts with #version.
   *  In the shader: `uv` 0..1 (y up: uv.y=1 is the TOP of the image), write `o`. uRes = target size. */
  program(key, frag) {
    if (this.progs.has(key)) return this.progs.get(key);
    const gl = this.gl;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`shader ${key}: ${gl.getShaderInfoLog(s)}`); return s; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, frag.trimStart().startsWith('#version') ? frag : HEAD + frag));
    gl.bindAttribLocation(pr, 0, 'p'); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(`link ${key}: ${gl.getProgramInfoLog(pr)}`);
    const uni = {};
    const n = gl.getProgramParameter(pr, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const u = gl.getActiveUniform(pr, i); const name = u.name.replace(/\[0\]$/, ''); uni[name] = { loc: gl.getUniformLocation(pr, u.name), type: u.type, size: u.size }; }
    const P = { pr, uni }; this.progs.set(key, P); return P;
  },

  /** float or byte texture. opts: {float:true, linear:true, repeat:false} */
  texture(w, h, { float = false, linear = true, repeat = false, data = null } = {}) {
    const gl = this.gl, t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    if (float) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, data);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    const f = linear ? gl.LINEAR : gl.NEAREST, wr = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wr); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wr);
    t.w = w; t.h = h; return t;
  },
  fbo(tex) { const gl = this.gl, f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0); gl.bindFramebuffer(gl.FRAMEBUFFER, null); f.tex = tex; f.w = tex.w; f.h = tex.h; return f; },
  /** ping-pong pair for simulations: {read, write, swap()} each {tex, fbo} */
  pingpong(w, h, opts = { float: true }) {
    const a = this.texture(w, h, opts), b = this.texture(w, h, opts);
    const pp = { read: this.fbo(a), write: this.fbo(b), swap() { const t = pp.read; pp.read = pp.write; pp.write = t; } };
    return pp;
  },

  /** upload a canvas/image into a cached texture (by key). Canvas top = uv.y 1. */
  canvasTex(key, src, linear = true) {
    const gl = this.gl; let t = this.texCache.get(key);
    if (!t) { t = gl.createTexture(); this.texCache.set(key, t); gl.bindTexture(gl.TEXTURE_2D, t); const f = linear ? gl.LINEAR : gl.NEAREST; gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); }
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    t.w = src.width; t.h = src.height; return t;
  },

  /** run a program into target fbo (or the default framebuffer when null). uniforms: {name: number|array|texture} */
  pass(P, uniforms, target, w, h) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target || null);
    w = w ?? (target ? target.w : W); h = h ?? (target ? target.h : H);
    gl.viewport(0, 0, w, h); gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST);
    gl.useProgram(P.pr);
    let unit = 0;
    const all = { uRes: [w, h], ...uniforms };
    for (const [name, v] of Object.entries(all)) {
      const u = P.uni[name]; if (!u) continue;
      const T = gl;
      switch (u.type) {
        case T.FLOAT: if (u.size > 1) gl.uniform1fv(u.loc, v); else gl.uniform1f(u.loc, +v); break;
        case T.FLOAT_VEC2: gl.uniform2fv(u.loc, v); break;
        case T.FLOAT_VEC3: gl.uniform3fv(u.loc, v); break;
        case T.FLOAT_VEC4: gl.uniform4fv(u.loc, v); break;
        case T.INT: case T.BOOL: if (u.size > 1) gl.uniform1iv(u.loc, v); else gl.uniform1i(u.loc, +v); break;
        case T.FLOAT_MAT3: gl.uniformMatrix3fv(u.loc, false, v); break;
        case T.FLOAT_MAT4: gl.uniformMatrix4fv(u.loc, false, v); break;
        case T.SAMPLER_2D: { const tex = v && v.fbo ? v.fbo.tex : v && v.tex ? v.tex : v; gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(u.loc, unit); unit++; break; }
        default: break;
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vb); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  },

  /** render a fullscreen fragment shader to the GL canvas at w×h; returns a drawable result for G.draw */
  shader(key, frag, uniforms = {}, w = W, h = H) {
    const P = this.program(key, frag);
    this.pass(P, uniforms, null, w, h);
    return { img: this.canvas, sx: 0, sy: H - h, sw: w, sh: h };
  },
  /** show a texture/fbo on the GL canvas (for sims) and return a drawable */
  show(texOrFbo, w = W, h = H) {
    const P = this.program('__show', `uniform sampler2D t; void main(){ o = texture(t, uv); }`);
    this.pass(P, { t: texOrFbo }, null, w, h);
    return { img: this.canvas, sx: 0, sy: H - h, sw: w, sh: h };
  },
  /** draw a shader result into a 2D context */
  draw(ctx, r, dx = 0, dy = 0, dw = W, dh = H) { ctx.drawImage(r.img, r.sx, r.sy, r.sw, r.sh, dx, dy, dw, dh); },

  // ---------------- post ----------------
  initPost() {
    this.bloomA = this.fbo(this.texture(W / 4, H / 4, { float: true }));
    this.bloomB = this.fbo(this.texture(W / 4, H / 4, { float: true }));
  },
  /** final pass: main 2D canvas → output (GL canvas) with fx */
  post(src, fx, frame, hud) {
    const tex = this.canvasTex('__main', src);
    const htex = this.canvasTex('__hud', hud);
    if (fx.bloom > 0) {
      const th = this.program('__bth', `uniform sampler2D t; uniform float th; void main(){ vec3 c = texture(t, uv).rgb; float l = max(c.r, max(c.g, c.b)); o = vec4(c * smoothstep(th, th + .25, l), 1.); }`);
      this.pass(th, { t: tex, th: fx.bloomThreshold }, this.bloomA);
      const bl = this.program('__blur', `uniform sampler2D t; uniform vec2 d; void main(){ vec3 s = vec3(0.); float w[5] = float[](.227,.194,.121,.054,.016); s += texture(t, uv).rgb*w[0]; for(int i=1;i<5;i++){ s += texture(t, uv + d*float(i)).rgb*w[i]; s += texture(t, uv - d*float(i)).rgb*w[i]; } o = vec4(s,1.); }`);
      for (let k = 0; k < 2; k++) {
        this.pass(bl, { t: this.bloomA, d: [(1.5 + k) / (W / 4), 0] }, this.bloomB);
        this.pass(bl, { t: this.bloomB, d: [0, (1.5 + k) / (H / 4)] }, this.bloomA);
      }
    }
    const P = this.program('__post', POST);
    this.pass(P, {
      t: tex, hudT: htex, bloomT: this.bloomA, uFrame: frame, uRGB: fx.rgb, uGlitch: fx.glitch, uSeed: fx.glitchSeed, uFlash: fx.flash,
      uInvert: fx.invert, uZoom: fx.zoom, uVig: fx.vignette, uGrain: fx.grain, uBloom: fx.bloom, uWarp: fx.warp, uSat: fx.saturation, uScan: fx.scanlines,
      uMono: fx.mono, uTint: fx.tint, uBlur: fx.radialBlur, uCenter: fx.center, uOff: fx.off || [0, 0],
    }, null, W, H);
  },
};

const POST = `
uniform sampler2D t, bloomT, hudT;
uniform float uFrame, uRGB, uGlitch, uSeed, uInvert, uZoom, uVig, uGrain, uBloom, uWarp, uSat, uScan, uMono, uBlur;
uniform vec4 uFlash, uTint; uniform vec2 uCenter, uOff;
float h1(float n){ return fract(sin(n*127.1)*43758.5453); }
float h2(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
void main(){
  vec2 c = uCenter; vec2 p = uv;
  p = c + (p - c) / (1.0 + uZoom) + uOff;
  // barrel warp
  vec2 q = p - .5; p += q * dot(q,q) * uWarp;
  // glitch: horizontal slices shift
  if (uGlitch > 0.) {
    float band = floor(p.y * 24.0 + h1(uSeed) * 7.0);
    float r = h1(band * 3.1 + uSeed * 17.0);
    if (r < uGlitch * .7) p.x += (h1(band + uSeed) - .5) * .25 * uGlitch;
    float blk = h2(floor(p * vec2(16., 9.)) + uSeed);
    if (blk < uGlitch * .15) p += (vec2(h1(blk*9.), h1(blk*5.)) - .5) * .08;
  }
  vec2 dir = (p - .5); float rgb = uRGB / uRes.x;
  vec3 col;
  if (uBlur > 0.) {
    vec3 s = vec3(0.); for (int i = 0; i < 12; i++) { float k = float(i) / 11.; vec2 pp = c + (p - c) * (1. - uBlur * k * .15); s += texture(t, pp).rgb; } col = s / 12.;
  } else {
    col.r = texture(t, p + dir * rgb * 2.).r; col.g = texture(t, p).g; col.b = texture(t, p - dir * rgb * 2.).b;
  }
  if (uBloom > 0.) col += texture(bloomT, p).rgb * uBloom;
  float l = dot(col, vec3(.299,.587,.114));
  col = mix(vec3(l), col, uSat);
  col = mix(col, vec3(l) * uTint.rgb, uMono);
  if (uScan > 0.) col *= 1. - uScan * (.5 + .5 * sin(uv.y * uRes.y * 3.14159));
  col = mix(col, 1. - col, uInvert);
  float v = smoothstep(.95, .25, length((uv - .5) * vec2(1., .82)));
  col *= mix(1., v, uVig);
  col = mix(col, uFlash.rgb, uFlash.a);
  vec4 hc = texture(hudT, uv);
  col = mix(col, hc.rgb, hc.a);
  float g = h2(uv * uRes + vec2(uFrame * 13.1, uFrame * 7.7)) - .5;
  col += g * uGrain;
  o = vec4(clamp(col, 0., 1.), 1.);
}`;
