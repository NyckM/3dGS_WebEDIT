
// ============================================================
// 🎬 MODO CINEMA — corpos de câmera (VHS / Cinema / Celular)
// com pós-processo WebGL real (grão, chroma, unsharp, dither, scanlines),
// letterbox, LUTs (grading) e zoom animado.
// ============================================================
const CINE = {
  mode: 'off', // off | vhs | cin | phone
  vhsZoom: false, vhsZoomT: 0,
  cinDof: false,
  gl: null, prog: null, tex: null, u: {}, raf: false
};
// --- catálogos ---
const CINE_BODIES = {
  vhs: {
    models: [
      { id:'jvc43', name:'JVC GR (4:3)', aspect:'4:3' },
      { id:'sonyhi8', name:'Sony Hi8', aspect:'4:3' },
      { id:'panvhsc', name:'Panasonic VHS-C', aspect:'4:3' },
      { id:'betamax', name:'Betamax', aspect:'4:3' }
    ],
    aspects: ['4:3','16:9'],
    luts: [
      { id:'vhs', name:'VHS clássico' },
      { id:'vhsworn', name:'VHS gasto (quente)' },
      { id:'camcorder', name:'Camcorder frio' }
    ]
  },
  cin: {
    lenses: [
      { id:'l18', name:'18mm ultra-wide', mm:18 },
      { id:'l25', name:'25mm wide', mm:25 },
      { id:'l35', name:'35mm', mm:35 },
      { id:'l50', name:'50mm normal', mm:50 },
      { id:'l85', name:'85mm retrato', mm:85 },
      { id:'l135', name:'135mm tele', mm:135 }
    ],
    aspects: ['2.39:1','2:1','16:9'],
    luts: [
      { id:'arri_to', name:'ARRI Teal & Orange' },
      { id:'arri_log', name:'LogC → visual (ACES-ish)' },
      { id:'arri_natural', name:'ARRI Natural' },
      { id:'bleach', name:'Bleach Bypass' }
    ]
  },
  phone: {
    zooms: [
      { id:'z05', name:'0.5× ultra-wide', mm:14 },
      { id:'z1',  name:'1× principal', mm:26 },
      { id:'z2',  name:'2× tele', mm:52 },
      { id:'z5',  name:'5× tele', mm:120 }
    ],
    aspects: ['4:3','16:9','9:16'],
    luts: [ { id:'none', name:'Sem LUT (natural)' } ]
  }
};
// LUTs → parâmetros do grading (exp, con, sat, temp, tint)
const CINE_LUTS = {
  none:        [1.00, 1.00, 1.00, 0.00, 0.00],
  vhs:         [1.05, 0.92, 0.80, 0.06, 0.04],
  vhsworn:     [1.10, 0.88, 0.72, 0.14,-0.02],
  camcorder:   [1.00, 1.05, 0.85,-0.10, 0.04],
  arri_to:     [1.03, 1.18, 0.92, 0.10,-0.04],
  arri_log:    [1.00, 0.82, 0.78, 0.02, 0.00],
  arri_natural:[1.02, 1.05, 1.00, 0.01, 0.00],
  bleach:      [1.08, 1.30, 0.55, 0.00, 0.00]
};
function cineParseAspect(a) { const [w,h] = a.split(':').map(Number); return w / h; }

// --- pós-processo WebGL2 (lê o canvas do viewer como textura e reprocessa) ---
const POSTFX_FS = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform float uTime;
uniform float uNoise, uChroma, uWarp, uUnsharp, uDither, uScan, uGrain, uHalation, uMode;
out vec4 frag;
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 duv = uv;
  // distorção horizontal (jitter de linha) — VHS
  if (uWarp > 0.001){
    float line = h21(vec2(floor(uv.y*uRes.y*0.5), floor(uTime*12.0)));
    duv.x += (line-0.5) * uWarp * 0.012;
    duv.x += sin(uv.y*40.0 + uTime*4.0) * uWarp * 0.002;
  }
  // aberração cromática lateral
  float ca = uChroma * 0.006;
  vec3 col;
  col.r = texture(uTex, duv + vec2(ca,0.0)).r;
  col.g = texture(uTex, duv).g;
  col.b = texture(uTex, duv - vec2(ca,0.0)).b;
  // unsharp (realce): center + amt*(center - blur dos vizinhos)
  if (uUnsharp > 0.001){
    vec2 px = 1.0/uRes;
    vec3 blur = (
      texture(uTex, duv+vec2(px.x,0)).rgb + texture(uTex, duv-vec2(px.x,0)).rgb +
      texture(uTex, duv+vec2(0,px.y)).rgb + texture(uTex, duv-vec2(0,px.y)).rgb) * 0.25;
    col += (col - blur) * uUnsharp;
  }
  // halation (cinema): brilho vaza nas altas luzes
  if (uHalation > 0.001){
    vec2 px = 2.5/uRes;
    vec3 g = (texture(uTex,duv+px).rgb + texture(uTex,duv-px).rgb +
              texture(uTex,duv+vec2(px.x,-px.y)).rgb + texture(uTex,duv+vec2(-px.x,px.y)).rgb)*0.25;
    float lum = max(max(g.r,g.g),g.b);
    col += g * smoothstep(0.6,1.0,lum) * uHalation * vec3(1.0,0.6,0.4);
  }
  // scanlines + rolagem (VHS)
  if (uScan > 0.001){
    float s = 0.5 + 0.5*sin(uv.y*uRes.y*3.14159);
    col *= mix(1.0, 0.75 + 0.25*s, uScan);
    float roll = smoothstep(0.0,0.06, abs(fract(uv.y + uTime*0.05)-0.5)-0.44);
    col *= mix(1.0, 0.85+0.15*roll, uScan*0.6);
  }
  // grão / ruído
  float n = h21(uv*uRes + uTime*60.0) - 0.5;
  col += n * (uNoise*0.18 + uGrain*0.5);
  // dither ordenado (reduz banding, dá textura de vídeo)
  if (uDither > 0.001){
    float b = h21(floor(gl_FragCoord.xy) + uTime);
    col += (b-0.5) * uDither * (1.0/64.0);
    col = floor(col * 64.0 + 0.5) / 64.0;
  }
  // vinheta suave
  float vig = smoothstep(1.15, 0.35, length(uv-0.5)*1.3);
  col *= mix(1.0, vig, 0.35 + uScan*0.2);
  frag = vec4(clamp(col,0.0,1.0), 1.0);
}`;
const POSTFX_VS = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p,0.0,1.0); }`;
function cineInitGL(){
  if (CINE.gl) return CINE.gl;
  const cv = $('postfx-canvas');
  const gl = cv.getContext('webgl2', { premultipliedAlpha:false });
  if (!gl) { showError('WebGL2 indisponível — pós-processo Cinema desativado.'); return null; }
  const mk = (t,src)=>{ const sh=gl.createShader(t); gl.shaderSource(sh,src); gl.compileShader(sh);
    if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(sh)); return sh; };
  const prog = gl.createProgram();
  gl.attachShader(prog, mk(gl.VERTEX_SHADER, POSTFX_VS));
  gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, POSTFX_FS));
  gl.bindAttribLocation(prog, 0, 'p');
  gl.linkProgram(prog);
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const U = n => gl.getUniformLocation(prog, n);
  CINE.u = { tex:U('uTex'), res:U('uRes'), time:U('uTime'), noise:U('uNoise'),
    chroma:U('uChroma'), warp:U('uWarp'), unsharp:U('uUnsharp'), dither:U('uDither'),
    scan:U('uScan'), grain:U('uGrain'), halation:U('uHalation'), mode:U('uMode') };
  CINE.gl = gl; CINE.prog = prog; CINE.tex = tex;
  return gl;
}
function cinePostTick(){
  if (CINE.mode === 'off' || CINE.mode === 'phone') { $('postfx-canvas').classList.remove('visible'); return; }
  const gl = cineInitGL();
  const src = $('viewer-container').querySelector('canvas');
  if (!gl || !src) return;
  const cv = $('postfx-canvas');
  const w = src.width, h = src.height;
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  cv.classList.add('visible');
  gl.viewport(0,0,w,h);
  gl.useProgram(CINE.prog);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, CINE.tex);
  try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src); } catch(e){ return; }
  gl.uniform1i(CINE.u.tex, 0);
  gl.uniform2f(CINE.u.res, w, h);
  gl.uniform1f(CINE.u.time, anim.fxTime);
  const g = id => $(id) ? parseFloat($(id).value) : 0;
  const str = g('cine-strength');
  if (CINE.mode === 'vhs') {
    gl.uniform1f(CINE.u.noise, g('vhs-noise')*str);
    gl.uniform1f(CINE.u.chroma, g('vhs-chroma')*str);
    gl.uniform1f(CINE.u.warp, g('vhs-warp')*str);
    gl.uniform1f(CINE.u.unsharp, g('vhs-unsharp')*str);
    gl.uniform1f(CINE.u.dither, g('vhs-dither')*str);
    gl.uniform1f(CINE.u.scan, g('vhs-scan')*str);
    gl.uniform1f(CINE.u.grain, 0.0);
    gl.uniform1f(CINE.u.halation, 0.0);
    gl.uniform1f(CINE.u.mode, 1.0);
  } else { // cinema
    gl.uniform1f(CINE.u.noise, 0.0);
    gl.uniform1f(CINE.u.chroma, 0.05*str);
    gl.uniform1f(CINE.u.warp, 0.0);
    gl.uniform1f(CINE.u.unsharp, 0.15*str);
    gl.uniform1f(CINE.u.dither, 0.0);
    gl.uniform1f(CINE.u.scan, 0.0);
    gl.uniform1f(CINE.u.grain, g('cin-grain')*str);
    gl.uniform1f(CINE.u.halation, g('cin-halation')*str);
    gl.uniform1f(CINE.u.mode, 2.0);
  }
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// --- letterbox (barras pretas conforme aspect ratio) ---
function cineApplyLetterbox(aspectStr) {
  const lb = $('letterbox');
  if (!aspectStr || CINE.mode === 'off') { lb.classList.remove('visible'); return; }
  const target = cineParseAspect(aspectStr);
  const W = window.innerWidth, H = window.innerHeight, cur = W / H;
  let barV = 0, barH = 0;
  if (target > cur) barV = (H - W / target) / 2;   // mais largo → barras em cima/baixo
  else barH = (W - H * target) / 2;                // mais alto → barras laterais
  lb.querySelector('.top').style.height = barV + 'px';
  lb.querySelector('.bot').style.height = barV + 'px';
  lb.querySelector('.lft').style.width = barH + 'px';
  lb.querySelector('.rgt').style.width = barH + 'px';
  lb.classList.add('visible');
}
window.addEventListener('resize', () => { if (CINE.mode !== 'off') cineApplyLetterbox($('cine-aspect').value); });

// --- aplica LUT (grading) e lente (FOV) ---
function cineApplyLut(id) {
  const p = CINE_LUTS[id] || CINE_LUTS.none;
  const str = parseFloat($('cine-strength').value);
  const mix1 = (base, v) => base + (v - base) * str; // interpola do neutro conforme intensidade
  $('cg-exp').value = mix1(1, p[0]); $('cg-con').value = mix1(1, p[1]);
  $('cg-sat').value = mix1(1, p[2]); $('cg-temp').value = mix1(0, p[3]); $('cg-tint').value = mix1(0, p[4]);
  ['cg-exp','cg-con','cg-sat','cg-temp','cg-tint'].forEach(i => $('v-'+i.replace('-','')).textContent = parseFloat($(i).value).toFixed(2));
  const on = id !== 'none' && str > 0.01;
  anim.grade = on; $('cg-toggle').classList.toggle('on', on);
  $('cg-toggle').textContent = on ? '⏸ Grading (ligado)' : '▶ Grading';
  syncFxUniforms();
}
function cineSetFovFromMM(mm) {
  const fov = 2 * Math.atan(21.6 / (2 * mm)) * 180 / Math.PI; // sensor ~36mm horizontal
  const c = Math.max(15, Math.min(120, fov));
  $('cam-fov').value = c; applyFov();
}

// --- popula selects conforme o corpo escolhido ---
function cineFill(mode) {
  const fill = (sel, arr, label='name') => { $(sel).innerHTML = arr.map(o => `<option value="${o.id||o}">${o[label]||o}</option>`).join(''); };
  $('cine-lens-row').style.display = 'none';
  $('cine-zoom-row').style.display = 'none';
  $('cine-vhs-box').style.display = 'none';
  $('cine-cin-box').style.display = 'none';
  if (mode === 'vhs') {
    fill('cine-model', CINE_BODIES.vhs.models);
    fill('cine-aspect', CINE_BODIES.vhs.aspects);
    fill('cine-lut', CINE_BODIES.vhs.luts);
    $('cine-vhs-box').style.display = '';
  } else if (mode === 'cin') {
    fill('cine-model', [{id:'alexa',name:'ARRI Alexa'},{id:'mini',name:'Alexa Mini'},{id:'venice',name:'Sony Venice'}]);
    fill('cine-aspect', CINE_BODIES.cin.aspects);
    fill('cine-lut', CINE_BODIES.cin.luts);
    fill('cine-lens', CINE_BODIES.cin.lenses);
    $('cine-lens-row').style.display = '';
    $('cine-cin-box').style.display = '';
  } else if (mode === 'phone') {
    fill('cine-model', [{id:'ph',name:'Smartphone'}]);
    fill('cine-aspect', CINE_BODIES.phone.aspects);
    fill('cine-lut', CINE_BODIES.phone.luts);
    fill('cine-zoom', CINE_BODIES.phone.zooms);
    $('cine-zoom-row').style.display = '';
  }
}
function cineApply() {
  const m = CINE.mode;
  $('cine-badge').classList.toggle('visible', m !== 'off');
  if (m === 'off') {
    $('postfx-canvas').classList.remove('visible');
    $('letterbox').classList.remove('visible');
    cineApplyLut('none');
    return;
  }
  cineApplyLut($('cine-lut').value);
  cineApplyLetterbox($('cine-aspect').value);
  if (m === 'cin') cineSetFovFromMM(CINE_BODIES.cin.lenses.find(l => l.id === $('cine-lens').value)?.mm || 50);
  if (m === 'phone') cineSetFovFromMM(CINE_BODIES.phone.zooms.find(z => z.id === $('cine-zoom').value)?.mm || 26);
  // badge
  const model = $('cine-model').selectedOptions[0]?.textContent || '';
  $('cine-badge').textContent = model + ' · ' + $('cine-aspect').value;
}
[['cine-off','off'],['cine-vhs','vhs'],['cine-cin','cin'],['cine-phone','phone']].forEach(([id, mode]) => {
  $(id).addEventListener('click', () => {
    CINE.mode = mode;
    [['cine-off','off'],['cine-vhs','vhs'],['cine-cin','cin'],['cine-phone','phone']].forEach(([i,m]) => $(i).classList.toggle('on', m === CINE.mode));
    if (mode !== 'off') cineFill(mode);
    cineApply();
  });
});
['cine-model','cine-aspect','cine-lens','cine-zoom','cine-lut'].forEach(id => $(id).addEventListener('change', cineApply));
bindSlider('cine-strength', 'v-cinestrength', v => v.toFixed(2), () => cineApply());
['vhs-noise','vhs-chroma','vhs-warp','vhs-unsharp','vhs-dither','vhs-scan'].forEach(id =>
  bindSlider(id, 'v-'+id.replace('-',''), v => v.toFixed(2), () => {}));
['cin-grain','cin-halation'].forEach(id => bindSlider(id, 'v-'+id.replace('-',''), v => v.toFixed(2), () => {}));
bindSlider('vhs-zoomspd', 'v-vhszoomspd', v => v.toFixed(2), () => {});
$('vhs-zoom').addEventListener('click', () => {
  CINE.vhsZoom = !CINE.vhsZoom;
  $('vhs-zoom').classList.toggle('on', CINE.vhsZoom);
  $('vhs-zoom').textContent = CINE.vhsZoom ? '⏸ Zoom automático (ligado)' : '▶ Zoom automático (VHS)';
});
// Cinema: desfoque de lente + foco/abertura mapeiam no DoF
bindSlider('cin-focus', 'v-cinfocus', v => v.toFixed(1), v => { $('d-dist').value = v; if (anim.dof) syncFxUniforms(); });
bindSlider('cin-aperture', 'v-cinaperture', v => v.toFixed(1), v => { $('d-blur').value = v; if (anim.dof) syncFxUniforms(); });
$('cin-dof').addEventListener('click', () => {
  CINE.cinDof = !CINE.cinDof;
  anim.dof = CINE.cinDof;
  $('cin-dof').classList.toggle('on', CINE.cinDof);
  $('cin-dof').textContent = CINE.cinDof ? '⏸ Desfoque de lente (ligado)' : '▶ Desfoque de lente';
  $('d-toggle').classList.toggle('on', CINE.cinDof);
  $('d-dist').value = parseFloat($('cin-focus').value);
  $('d-blur').value = parseFloat($('cin-aperture').value);
  syncFxUniforms();
});

// tick do modo Cinema (pós-processo + zoom VHS)
function cineTick(dt) {
  if (CINE.mode === 'off') return;
  // zoom automático estilo VHS (dolly suave para dentro)
  if (CINE.vhsZoom && viewer?.camera && viewer?.controls) {
    const fwd = new THREE.Vector3(); viewer.camera.getWorldDirection(fwd);
    const s = parseFloat($('vhs-zoomspd').value) * dt * bxDiag() * 0.03;
    viewer.camera.position.addScaledVector(fwd, s);
    viewer.controls.target.addScaledVector(fwd, s);
  }
  cinePostTick();
}
