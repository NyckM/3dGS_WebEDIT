import pathlib
p = pathlib.Path('index.html')
s = p.read_text(encoding='utf-8')
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, f'esperava {n}, achei {s.count(old)}: {old[:90]!r}'
    s = s.replace(old, new)

for u in ['uBxDOn','uBxDAmp','uBxDFreq','uBxDSpeed','uBxDRadius','uBxDBoxOn']:
    rep(f'uniform float {u}[7];', f'uniform float {u}[8];')
for u in ['uBxDAxis','uBxDBoxPos','uBxDBoxInvHalf']:
    rep(f'uniform vec3  {u}[7];', f'uniform vec3  {u}[8];')
rep('uniform mat3  uBxDBoxRot[7];', '''uniform mat3  uBxDBoxRot[8];
uniform float uBxDLow;
uniform float uBxDHigh;
uniform float uBxTrail;
uniform float uBxCAOn;
uniform float uBxCAAmt;''')
assert s.count('new Array(7).fill') == 6
s = s.replace('new Array(7).fill', 'new Array(8).fill')
assert s.count('Array.from({length:7}') == 4
s = s.replace('Array.from({length:7}', 'Array.from({length:8}')
rep('''    for (let i = 0; i < 7; i++) {
      const s = dfxState[i];''', '''    for (let i = 0; i < 8; i++) {
      const s = dfxState[i];''')
rep('float bxHash(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7)))*43758.5453); }',
'''float bxHash(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7)))*43758.5453); }
float bxVN(vec3 p){
  vec3 i = floor(p), f = fract(p);
  f = f*f*(3.0-2.0*f);
  return mix(
    mix(mix(bxHash(i), bxHash(i+vec3(1.,0.,0.)), f.x),
        mix(bxHash(i+vec3(0.,1.,0.)), bxHash(i+vec3(1.,1.,0.)), f.x), f.y),
    mix(mix(bxHash(i+vec3(0.,0.,1.)), bxHash(i+vec3(1.,0.,1.)), f.x),
        mix(bxHash(i+vec3(0.,1.,1.)), bxHash(i+vec3(1.,1.,1.)), f.x), f.y), f.z);
}''')
i0 = s.find('vec3 bruxosPos(vec3 p){')
i1 = s.find('return p;\n}\n`;', i0)
assert 0 < i0 < i1
body = s[i0:i1].replace('uBxTime', 'bxTT')
body = body.replace('vec3 bruxosPos(vec3 p){',
'''vec3 bruxosPos(vec3 p){
  // rastro: cada splat responde com um atraso aleatório (eco no movimento)
  float bxTT = uBxTime - (uBxTrail > 0.001 ? bxHash(p*3.17) * uBxTrail : 0.0);''')
s = s[:i0] + body + s[i1:]
rep('''  // fumaça (difusão global do centro para fora)''',
'''  // 7 — TURBULÊNCIA (turbulent displace): ruído suave com contraste de baixas/altas
  if (uBxDOn[7] > 0.5) {
    float m = bxDMask(7, p);
    vec3 q = p * uBxDFreq[7] + vec3(bxTT * uBxDSpeed[7] * 0.4, bxTT * uBxDSpeed[7] * 0.27, bxTT * uBxDSpeed[7] * 0.19);
    vec3 nl = vec3(bxVN(q), bxVN(q + 31.7), bxVN(q + 71.3)) - 0.5;
    vec3 q2 = q * 3.7;
    vec3 nh = vec3(bxVN(q2 + 13.1), bxVN(q2 + 47.9), bxVN(q2 + 91.4)) - 0.5;
    p += (nl * uBxDLow + nh * uBxDHigh) * uBxDAxis[7] * (uBxDAmp[7] * 1.5 * m);
  }
  // fumaça (difusão global do centro para fora)''')
rep('''// Crop box (ao vivo): descarta o que fica fora da caixa orientada''',
'''// Aberração cromática: dispersão radial por cor (R para fora, B para dentro)
if (uBxCAOn > 0.5) {
  vec4 bxCol0 = uintToRGBAVec(sampledCenterColor.r);
  float bxW = bxCol0.r - bxCol0.b;
  if (abs(bxW) > 0.01) {
    vec4 bxVC0 = transformModelViewMatrix * vec4(splatCenter, 1.0);
    float bxRL = length(bxVC0.xy);
    if (bxRL > 0.0001) {
      vec3 bxShiftV = vec3(bxVC0.xy / bxRL * (bxW * uBxCAAmt * bxRL * 0.15), 0.0);
      splatCenter += inverse(mat3(transformModelViewMatrix)) * bxShiftV;
    }
  }
}
// Crop box (ao vivo): descarta o que fica fora da caixa orientada''')
rep("    uBxDBoxRot:    { value: Array.from({length:8}, () => new THREE.Matrix3()) },",
"""    uBxDBoxRot:    { value: Array.from({length:8}, () => new THREE.Matrix3()) },
    uBxDLow:       { value: 1.0 },
    uBxDHigh:      { value: 0.5 },
    uBxTrail:      { value: 0 },
    uBxCAOn:       { value: 0 },
    uBxCAAmt:      { value: 0.06 },""")
rep("  { id:'bul', name:'Bulge',  multi:true,  amp:0.5,  ampMin:-2, ampMax:2, freq:1, freqMax:5,  speed:0,   ax:[1,1,1] },",
"""  { id:'bul', name:'Bulge',  multi:true,  amp:0.5,  ampMin:-2, ampMax:2, freq:1, freqMax:5,  speed:0,   ax:[1,1,1] },
  { id:'tur', name:'Turbulent Displace', multi:true, amp:0.3, ampMin:0, ampMax:2, freq:1.5, freqMax:10, speed:1, ax:[1,1,1] },""")
rep("""const dfxState = DFX.map(d => ({
  on:false, ax:[...d.ax], amp:d.amp, freq:d.freq, speed:d.speed, radius:1,""",
"""// amplitude efetiva com curva fina: início do slider = valores sutis (milésimos)
function dfxAmpEff(i) {
  const a = dfxState[i].amp, mx = Math.max(Math.abs(DFX[i].ampMax), 1e-4);
  return Math.sign(a) * Math.pow(Math.abs(a) / mx, 2.5) * mx;
}
const dfxState = DFX.map(d => ({
  on:false, ax:[...d.ax], amp:d.amp, freq:d.freq, speed:d.speed, radius:1, auBand:-1, auGain:1,""")
rep('id="${p}-amp" min="${d.ampMin}" max="${d.ampMax}" step="0.01"',
    'id="${p}-amp" min="${d.ampMin}" max="${d.ampMax}" step="0.001"')
rep('''      <div class="row"><label>Raio</label><input type="range" id="${p}-rad" min="0.05" max="1" step="0.01" value="1"><span class="val" id="v-${p}rad">livre</span></div>
      <button class="panel-btn" id="${p}-boxon">▶ Limitar por box</button>''',
'''      <div class="row"><label>Raio</label><input type="range" id="${p}-rad" min="0.005" max="1" step="0.001" value="1"><span class="val" id="v-${p}rad">livre</span></div>
      ${d.id === 'tur' ? '<div class="row"><label>Baixas</label><input type="range" id="tur-low" min="0" max="2" step="0.05" value="1"><span class="val" id="v-turlow">1.00</span></div><div class="row"><label>Altas</label><input type="range" id="tur-high" min="0" max="2" step="0.05" value="0.5"><span class="val" id="v-turhigh">0.50</span></div>' : ''}
      <div class="axis-row"><span class="lbl">🎧 Áudio</span>
        <button class="ax-btn on" id="${p}-auoff">—</button>
        <button class="ax-btn" id="${p}-aub0">G</button>
        <button class="ax-btn" id="${p}-aub1">M</button>
        <button class="ax-btn" id="${p}-aub2">A</button>
      </div>
      <div class="row"><label>Reação</label><input type="range" id="${p}-aug" min="0" max="3" step="0.05" value="1"><span class="val" id="v-${p}aug">1.00</span></div>
      <button class="panel-btn" id="${p}-boxon">▶ Limitar por box</button>''')
rep("bindSlider(`${p}-rad`, `v-${p}rad`, v => v >= 0.99 ? 'livre' : Math.round(v*100)+'%', v => { st.radius = v; syncFxUniforms(); });",
    "bindSlider(`${p}-rad`, `v-${p}rad`, v => v >= 0.99 ? 'livre' : (Math.pow(v, 2.5)*100).toFixed(3)+'%', v => { st.radius = v; syncFxUniforms(); });")
rep("bindSlider(`${p}-amp`, `v-${p}amp`, v => v.toFixed(2), v => { st.amp = v; syncFxUniforms(); });",
"""const ampFmt = v => {
      const mx = Math.max(Math.abs(d.ampMax), 1e-4);
      return (Math.sign(v) * Math.pow(Math.abs(v) / mx, 2.5) * mx).toFixed(4);
    };
    bindSlider(`${p}-amp`, `v-${p}amp`, ampFmt, v => { st.amp = v; syncFxUniforms(); });
    $(`v-${p}amp`).textContent = ampFmt(d.amp);""")
rep("""    ['rx','ry','rz'].forEach(k => bindSlider(`${p}-b${k}`, `v-${p}b${k}`, v => v.toFixed(0)+'°', v => { st.box[k] = v; syncFxUniforms(); }));""",
"""    ['rx','ry','rz'].forEach(k => bindSlider(`${p}-b${k}`, `v-${p}b${k}`, v => v.toFixed(0)+'°', v => { st.box[k] = v; syncFxUniforms(); }));
    const auBtns = ['auoff','aub0','aub1','aub2'];
    auBtns.forEach((bk, bi) => $(`${p}-${bk}`).addEventListener('click', () => {
      st.auBand = bi - 1;
      auBtns.forEach((bk2, bj) => $(`${p}-${bk2}`).classList.toggle('on', bj - 1 === st.auBand));
    }));
    bindSlider(`${p}-aug`, `v-${p}aug`, v => v.toFixed(2), v => { st.auGain = v; });""")
rep('''// ============================================================
// EFEITOS DE CÂMERA (aplicados no tick)''',
'''bindSlider('tur-low', 'v-turlow', v => v.toFixed(2), () => syncFxUniforms());
bindSlider('tur-high', 'v-turhigh', v => v.toFixed(2), () => syncFxUniforms());
bindSlider('tr-amt', 'v-tramt', v => v.toFixed(2) + 's', () => syncFxUniforms());

// ============================================================
// EFEITOS DE CÂMERA (aplicados no tick)''')
rep("  // --- crop box (ao vivo) ---",
"""  set('uBxDLow', parseFloat($('tur-low') ? $('tur-low').value : 1));
  set('uBxDHigh', parseFloat($('tur-high') ? $('tur-high').value : 0.5));
  set('uBxTrail', parseFloat($('tr-amt').value));
  set('uBxCAOn', anim.ca ? 1 : 0);
  set('uBxCAAmt', parseFloat($('ca-amt').value));
  // --- crop box (ao vivo) ---""")
rep("      dAmp.value[i] = s.amp;", "      dAmp.value[i] = dfxAmpEff(i);")
rep("dRad.value[i] = s.radius >= 0.99 ? 0 : diag * 0.6 * s.radius;",
    "dRad.value[i] = s.radius >= 0.99 ? 0 : diag * 0.6 * Math.pow(s.radius, 2.5);")
rep("  dof: false, reveal: null, revealVal: 1, pb: false, depthCol: false, anchorCrop: false,",
    "  dof: false, ca: false, reveal: null, revealVal: 1, pb: false, depthCol: false, anchorCrop: false,")
rep('''    <p class="note">O gizmo age no box em exibição (👁).</p>
    <div id="dist-container"></div>''',
'''    <p class="note">O gizmo age no box em exibição (👁).</p>
    <h3>Rastro (atraso por partícula)</h3>
    <div class="row"><label>Atraso</label><input type="range" id="tr-amt" min="0" max="2" step="0.02" value="0"><span class="val" id="v-tramt">0.00s</span></div>
    <p class="note">Cada splat responde às distorções com um atraso aleatório — cria rastro/eco no movimento.</p>
    <div id="dist-container"></div>''')
rep('''<span class="val" id="v-dblur">6.0</span></div>
  </div>

  <!-- ========== ILUMINAÇÃO / COR ========== -->''',
'''<span class="val" id="v-dblur">6.0</span></div>

    <h3>Aberração cromática</h3>
    <button class="panel-btn" id="ca-toggle">▶ Aberração cromática</button>
    <div class="row"><label>Intensidade</label><input type="range" id="ca-amt" min="0" max="0.3" step="0.005" value="0.06"><span class="val" id="v-caamt">0.060</span></div>
    <p class="note">Dispersão por cor: tons quentes deslocam para fora e frios para dentro, crescendo nas bordas do quadro.</p>
  </div>

  <!-- ========== ILUMINAÇÃO / COR ========== -->''')
rep('''<div class="row"><label>Tamanho</label><input type="range" id="p-splatscale" min="0.05" max="3" step="0.05" value="1"><span class="val" id="v-splatscale">1.00</span></div>''',
'''<div class="row"><label>Tamanho</label><input type="range" id="p-splatscale" min="0.05" max="3" step="0.05" value="1"><span class="val" id="v-splatscale">1.00</span></div>
    <div class="axis-row"><span class="lbl">🎧 Áudio</span>
      <button class="ax-btn on" id="spl-auoff">—</button>
      <button class="ax-btn" id="spl-aub0">G</button>
      <button class="ax-btn" id="spl-aub1">M</button>
      <button class="ax-btn" id="spl-aub2">A</button>
    </div>
    <div class="row"><label>Reação</label><input type="range" id="spl-aug" min="0" max="3" step="0.05" value="0.8"><span class="val" id="v-splaug">0.80</span></div>''')
rep('''<div class="row"><label>Cor</label><input type="color" id="pl-color" value="#ffd9a0" style="flex:1; height:26px; background:none; border:none; cursor:pointer;"></div>''',
'''<div class="row"><label>Cor</label><input type="color" id="pl-color" value="#ffd9a0" style="flex:1; height:26px; background:none; border:none; cursor:pointer;"></div>
    <div class="axis-row"><span class="lbl">🎧 Áudio</span>
      <button class="ax-btn on" id="pl-auoff">—</button>
      <button class="ax-btn" id="pl-aub0">G</button>
      <button class="ax-btn" id="pl-aub1">M</button>
      <button class="ax-btn" id="pl-aub2">A</button>
    </div>
    <div class="row"><label>Reação</label><input type="range" id="pl-aug" min="0" max="3" step="0.05" value="1"><span class="val" id="v-plaug">1.00</span></div>''')
rep("""$('d-toggle').addEventListener('click', () => {
  anim.dof = !anim.dof;
  $('d-toggle').classList.toggle('on', anim.dof);
  $('d-toggle').textContent = anim.dof ? '⏸ Desfoque (ligado)' : '▶ Desfoque';
  syncFxUniforms();
});""",
"""$('d-toggle').addEventListener('click', () => {
  anim.dof = !anim.dof;
  $('d-toggle').classList.toggle('on', anim.dof);
  $('d-toggle').textContent = anim.dof ? '⏸ Desfoque (ligado)' : '▶ Desfoque';
  syncFxUniforms();
});
bindSlider('ca-amt', 'v-caamt', v => v.toFixed(3), () => syncFxUniforms());
$('ca-toggle').addEventListener('click', () => {
  anim.ca = !anim.ca;
  $('ca-toggle').classList.toggle('on', anim.ca);
  $('ca-toggle').textContent = anim.ca ? '⏸ Aberração (ligada)' : '▶ Aberração cromática';
  syncFxUniforms();
});""")
rep('''  <h3>Gravação</h3>
  <div class="row"><label>Duração</label>''',
'''  <h3>Gravação</h3>
  <div class="row"><label>Resolução</label><select class="au-sel" id="rec-res">
    <option value="win">Janela</option>
    <option value="720">720p</option>
    <option value="1080" selected>1080p (Full HD)</option>
  </select></div>
  <div class="row"><label>Duração</label>''')
rep('let recorder = null;', 'let recorder = null;\nlet recRestore = null;')
rep('''function pickMime() {
  const c = ['video/mp4;codecs=avc1.640033',   // H264 High profile
             'video/mp4;codecs=avc1',
             'video/mp4',
             'video/webm;codecs=vp9',
             'video/webm'];
  for (const m of c) if (MediaRecorder.isTypeSupported(m)) return m;
  return '';
}''',
'''function pickMime(withAudio) {
  const c = withAudio
    ? ['video/mp4;codecs=avc1.640033,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4',
       'video/webm;codecs=vp9,opus', 'video/webm']
    : ['video/mp4;codecs=avc1.640033', 'video/mp4;codecs=avc1', 'video/mp4',
       'video/webm;codecs=vp9', 'video/webm'];
  for (const m of c) if (MediaRecorder.isTypeSupported(m)) return m;
  return '';
}''')
rep('''  const mime = pickMime();
  const ext = mime.includes('mp4') ? 'mp4' : 'webm';
  const stream = canvas.captureStream(60);''',
'''  // resolução de saída: 720p/1080p renderizam o canvas no tamanho exato do vídeo
  const resSel = $('rec-res') ? $('rec-res').value : 'win';
  if (resSel !== 'win' && viewer?.renderer && viewer?.camera) {
    const W = resSel === '1080' ? 1920 : 1280, H = resSel === '1080' ? 1080 : 720;
    recRestore = { pr: viewer.renderer.getPixelRatio() };
    viewer.renderer.setPixelRatio(1);
    viewer.renderer.setSize(W, H, false); // buffer no tamanho do vídeo, tela continua igual
    viewer.camera.aspect = W / H;
    viewer.camera.updateProjectionMatrix();
  }
  const wantAudio = !!(audioFx.ctx && audioFx.analyser && audioFx.active);
  const mime = pickMime(wantAudio);
  const ext = mime.includes('mp4') ? 'mp4' : 'webm';
  const stream = canvas.captureStream(60);
  // injeta a trilha de áudio (arquivo ou microfone) na gravação
  if (wantAudio) {
    try {
      if (!audioFx.recDest) audioFx.recDest = audioFx.ctx.createMediaStreamDestination();
      audioFx.analyser.connect(audioFx.recDest);
      const tr = audioFx.recDest.stream.getAudioTracks()[0];
      if (tr) stream.addTrack(tr);
    } catch (e) { console.warn('não deu para incluir o áudio na gravação:', e); }
  }''')
rep('''    recorder = null;
    $('btn-rec').classList.remove('recording');''',
'''    recorder = null;
    // restaura o tamanho da janela e desconecta o áudio da gravação
    if (recRestore && viewer?.renderer && viewer?.camera) {
      viewer.renderer.setPixelRatio(recRestore.pr);
      viewer.renderer.setSize(window.innerWidth, window.innerHeight);
      viewer.camera.aspect = window.innerWidth / window.innerHeight;
      viewer.camera.updateProjectionMatrix();
      recRestore = null;
    }
    try { if (audioFx.recDest) audioFx.analyser.disconnect(audioFx.recDest); } catch(e){}
    $('btn-rec').classList.remove('recording');''')
rep('id="pt-r" min="0.01" max="1" step="0.01" value="0.1"><span class="val" id="v-ptr">10%</span>',
    'id="pt-r" min="0.005" max="1" step="0.002" value="0.15"><span class="val" id="v-ptr">0.871%</span>')
rep("const r = bxDiag() * 0.06 * Math.pow(parseFloat($('pt-r').value), 1.35);",
    "const r = bxDiag() * 0.06 * Math.pow(parseFloat($('pt-r').value), 2.5);")
rep("bindSlider('pt-r', 'v-ptr', v => Math.round(v*100)+'%', () => {});",
    "bindSlider('pt-r', 'v-ptr', v => (Math.pow(v, 2.5)*100).toFixed(3)+'%', () => {});")
p.write_text(s, encoding='utf-8')
print('OK r7', len(s))
