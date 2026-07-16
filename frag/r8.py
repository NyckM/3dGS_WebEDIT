import pathlib
p = pathlib.Path('index.html')
s = p.read_text(encoding='utf-8')
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, f'esperava {n}, achei {s.count(old)}: {old[:90]!r}'
    s = s.replace(old, new)

# ===== aba Interativo =====
rep('    <button class="fx-tab" data-tab="tab-misc">🧪 Diversos</button>',
'''    <button class="fx-tab" data-tab="tab-misc">🧪 Diversos</button>
    <button class="fx-tab" data-tab="tab-inter">🕹 Interativo</button>''')
rep('''  <h3>Gravação</h3>''',
'''  <!-- ========== INTERATIVO ========== -->
  <div class="tab-page" id="tab-inter">
    <h3>🖱 Mouse como força</h3>
    <div class="axis-row"><span class="lbl">Modo</span>
      <button class="ax-btn on" id="mf-off">Off</button>
      <button class="ax-btn" id="mf-rep">Repele</button>
      <button class="ax-btn" id="mf-att">Atrai</button>
      <button class="ax-btn" id="mf-rip">Ripple</button>
      <button class="ax-btn" id="mf-grab">Puxar</button>
    </div>
    <div class="row"><label>Raio</label><input type="range" id="mf-r" min="0.02" max="1" step="0.01" value="0.3"><span class="val" id="v-mfr">30%</span></div>
    <div class="row"><label>Força</label><input type="range" id="mf-str" min="0" max="1" step="0.005" value="0.3"><span class="val" id="v-mfstr">0.090</span></div>
    <p class="note">Os Gaussians reagem ao cursor sobre a cena. No modo <b>Puxar</b>, clique e arraste — ao soltar, voltam com mola/wiggle.</p>

    <h3>〰 LFO 1</h3>
    <button class="panel-btn" id="lfo0-on">▶ LFO 1</button>
    <div class="row"><label>Alvo</label><select class="au-sel it-target" id="lfo0-target"></select></div>
    <div class="row"><label>Onda</label><select class="au-sel" id="lfo0-wave">
      <option value="sin">Seno</option><option value="tri">Triângulo</option><option value="noise">Noise suave</option>
    </select></div>
    <div class="row"><label>Rate (Hz)</label><input type="range" id="lfo0-rate" min="0.05" max="8" step="0.05" value="0.5"><span class="val" id="v-lfo0rate">0.50</span></div>
    <div class="row"><label>Profund.</label><input type="range" id="lfo0-depth" min="0" max="1" step="0.01" value="0.3"><span class="val" id="v-lfo0depth">0.30</span></div>

    <h3>〰 LFO 2</h3>
    <button class="panel-btn" id="lfo1-on">▶ LFO 2</button>
    <div class="row"><label>Alvo</label><select class="au-sel it-target" id="lfo1-target"></select></div>
    <div class="row"><label>Onda</label><select class="au-sel" id="lfo1-wave">
      <option value="sin">Seno</option><option value="tri">Triângulo</option><option value="noise">Noise suave</option>
    </select></div>
    <div class="row"><label>Rate (Hz)</label><input type="range" id="lfo1-rate" min="0.05" max="8" step="0.05" value="1"><span class="val" id="v-lfo1rate">1.00</span></div>
    <div class="row"><label>Profund.</label><input type="range" id="lfo1-depth" min="0" max="1" step="0.01" value="0.3"><span class="val" id="v-lfo1depth">0.30</span></div>
    <p class="note">O LFO oscila o slider alvo em volta do valor atual dele (o valor volta quando desligar).</p>

    <h3>🎹 MIDI</h3>
    <button class="panel-btn" id="midi-on">🎹 Ativar MIDI</button>
    <div class="row"><label>Alvo</label><select class="au-sel it-target" id="midi-target"></select></div>
    <div class="btn-pair">
      <button class="panel-btn" id="midi-learn">Mapear (mexa um knob)</button>
      <button class="panel-btn" id="midi-clear">Limpar</button>
    </div>
    <p class="note" id="midi-status">Conecte um controlador MIDI e clique em Ativar (Chrome/Edge, https).</p>

    <h3>🖐 Mão (webcam)</h3>
    <button class="panel-btn" id="hand-on">🖐 Controlar com a mão</button>
    <p class="note" id="hand-status">MediaPipe Hands: a ponta do indicador move a força do mouse (escolha o modo acima) e a <b>pinça</b> (indicador + polegar) aplica/solta a força. No modo Puxar, pince para agarrar e solte para ver a mola.</p>
  </div>

  <h3>Gravação</h3>''')

# ===== GLSL: mouse + grab =====
rep('uniform float uBxCAAmt;', '''uniform float uBxCAAmt;
uniform float uBxMouseOn;
uniform vec3 uBxMousePos;
uniform float uBxMouseR;
uniform float uBxMouseStr;
uniform vec3 uBxGrabA;
uniform vec3 uBxGrabD;
uniform float uBxGrabR;''')
rep('  // fumaça (difusão global do centro para fora)',
'''  // MOUSE como força: repele / atrai / ripple no ponto do cursor
  if (uBxMouseOn > 0.5) {
    vec3 mrel = p - uBxMousePos;
    float md = length(mrel) + 0.0001;
    float mfall = 1.0 - smoothstep(0.0, max(uBxMouseR, 0.0001), md);
    if (mfall > 0.001) {
      if (uBxMouseOn < 1.5)      p += (mrel/md) * (mfall * uBxMouseStr);
      else if (uBxMouseOn < 2.5) p -= (mrel/md) * (mfall * uBxMouseStr);
      else if (uBxMouseOn < 3.5) p += (mrel/md) * (sin(md * 10.0 / max(uBxMouseR, 0.001) - bxTT * 7.0) * mfall * uBxMouseStr);
    }
  }
  // PUXAR: arrasto elástico a partir do ponto agarrado (solta com wiggle de mola)
  if (dot(uBxGrabD, uBxGrabD) > 0.000001) {
    float gdd = length(p - uBxGrabA);
    float gf = 1.0 - smoothstep(0.0, max(uBxGrabR, 0.0001), gdd);
    p += uBxGrabD * gf;
  }
  // fumaça (difusão global do centro para fora)''')
rep("    uBxCAAmt:      { value: 0.06 },",
"""    uBxCAAmt:      { value: 0.06 },
    uBxMouseOn:    { value: 0 },
    uBxMousePos:   { value: new THREE.Vector3(1e9, 1e9, 1e9) },
    uBxMouseR:     { value: 1 },
    uBxMouseStr:   { value: 0.1 },
    uBxGrabA:      { value: new THREE.Vector3() },
    uBxGrabD:      { value: new THREE.Vector3() },
    uBxGrabR:      { value: 1 },""")
rep("  set('uBxDLow', parseFloat($('tur-low') ? $('tur-low').value : 1));",
"""  set('uBxMouseOn', anim.mouseFx);
  set('uBxMouseR', diag * 0.4 * parseFloat($('mf-r').value));
  set('uBxMouseStr', diag * 0.15 * Math.pow(parseFloat($('mf-str').value), 2));
  set('uBxGrabR', diag * 0.4 * parseFloat($('mf-r').value));
  set('uBxDLow', parseFloat($('tur-low') ? $('tur-low').value : 1));""")
rep("  disVal: 0, disAnim: null, recOrbit: false,",
    "  disVal: 0, disAnim: null, recOrbit: false, mouseFx: 0,")

# ===== JS: interativo completo =====
rep('''// ============================================================
// EFEITOS DE CÂMERA (aplicados no tick)''',
'''// ============================================================
// 🕹 INTERATIVO — mouse como força, puxar, LFOs, MIDI e mão (TouchDesigner-style)
// ============================================================
const MF_MODES = [['mf-off',0],['mf-rep',1],['mf-att',2],['mf-rip',3],['mf-grab',4]];
MF_MODES.forEach(([id, mode]) => {
  $(id).addEventListener('click', () => {
    anim.mouseFx = mode;
    MF_MODES.forEach(([id2, m2]) => $(id2).classList.toggle('on', m2 === anim.mouseFx));
    syncFxUniforms();
  });
});
bindSlider('mf-r', 'v-mfr', v => Math.round(v*100)+'%', () => syncFxUniforms());
bindSlider('mf-str', 'v-mfstr', v => Math.pow(v, 2).toFixed(3), () => syncFxUniforms());
function bxScreenToModel(e) {
  if (!viewer?.camera || !viewer?.controls || !viewer?.splatMesh) return null;
  const rect = $('viewer-container').getBoundingClientRect();
  const ndc = new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -(((e.clientY - rect.top) / rect.height) * 2 - 1));
  const ray = new THREE.Raycaster();
  ray.setFromCamera(ndc, viewer.camera);
  const n = new THREE.Vector3();
  viewer.camera.getWorldDirection(n);
  const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(n, viewer.controls.target);
  const pt = new THREE.Vector3();
  if (!ray.ray.intersectPlane(plane, pt)) return null;
  return viewer.splatMesh.worldToLocal(pt);
}
$('viewer-container').addEventListener('pointermove', e => {
  if (!anim.mouseFx) return;
  const pt = bxScreenToModel(e);
  const u = bxU('uBxMousePos');
  if (pt && u) u.value.copy(pt);
});
$('viewer-container').addEventListener('pointerleave', () => {
  const u = bxU('uBxMousePos');
  if (u) u.value.set(1e9, 1e9, 1e9);
});

// --- modo PUXAR: agarra com o clique, arrasta, e ao soltar volta com mola/wiggle ---
const grab = { active: false, start: null, spring: null };
function grabBegin(pt) {
  if (!pt) return;
  grab.active = true; grab.spring = null;
  grab.start = pt.clone();
  const a = bxU('uBxGrabA'), d = bxU('uBxGrabD');
  if (a) a.value.copy(pt);
  if (d) d.value.set(0, 0, 0);
}
function grabMove(pt) {
  if (!grab.active || !pt || !grab.start) return;
  const d = bxU('uBxGrabD');
  if (d) d.value.set(pt.x - grab.start.x, pt.y - grab.start.y, pt.z - grab.start.z);
}
function grabEnd() {
  if (!grab.active) return;
  grab.active = false;
  const d = bxU('uBxGrabD');
  if (d && d.value.lengthSq() > 1e-8) grab.spring = { D0: d.value.clone(), t0: anim.fxTime };
}
$('viewer-container').addEventListener('pointerdown', e => {
  if (anim.mouseFx !== 4 || anim.paintMode) return;
  if (viewer?.controls) viewer.controls.enabled = false; // pausa a órbita durante o puxão
  grabBegin(bxScreenToModel(e));
});
$('viewer-container').addEventListener('pointermove', e => {
  if (grab.active) grabMove(bxScreenToModel(e));
});
window.addEventListener('pointerup', () => {
  if (anim.mouseFx === 4 && viewer?.controls && !anim.paintMode) viewer.controls.enabled = true;
  grabEnd();
});

// --- alvos moduláveis (LFO e MIDI) ---
const IT_TARGETS = [
  ['p-splatscale', 'Tamanho do splat'],
  ['wob-amp', 'Wobble · amplitude'], ['rip-amp', 'Ripple · amplitude'], ['wav-amp', 'Waves · amplitude'],
  ['twi-amp', 'Twist · amplitude'], ['ben-amp', 'Bend · amplitude'], ['tap-amp', 'Taper · amplitude'],
  ['bul-amp', 'Bulge · amplitude'], ['tur-amp', 'Turbulent · amplitude'],
  ['cam-fov', 'FOV (lente)'], ['pl-str', 'Luz pontual · intensidade'],
  ['cg-exp', 'Exposição'], ['d-dist', 'DoF · foco'], ['a-orbitspeed', 'Órbita · vel. Y'],
  ['tr-amt', 'Rastro'], ['mf-str', 'Mouse · força']
];
document.querySelectorAll('.it-target').forEach(sel => {
  sel.innerHTML = IT_TARGETS.map(([id, nm]) => `<option value="${id}">${nm}</option>`).join('');
});
function itSetSlider(id, val) {
  const el = $(id);
  if (!el) return;
  const mn = parseFloat(el.min), mx = parseFloat(el.max);
  el.value = Math.min(mx, Math.max(mn, val));
  el.dispatchEvent(new Event('input'));
}

// --- LFOs ---
const lfos = [
  { on:false, base:null, target:null, phase: Math.random() },
  { on:false, base:null, target:null, phase: Math.random() }
];
function lfoRestore(L) {
  if (L.target !== null && L.base !== null) itSetSlider(L.target, L.base);
  L.base = null; L.target = null;
}
[0, 1].forEach(i => {
  const L = lfos[i];
  bindSlider(`lfo${i}-rate`, `v-lfo${i}rate`, v => v.toFixed(2), () => {});
  bindSlider(`lfo${i}-depth`, `v-lfo${i}depth`, v => v.toFixed(2), () => {});
  $(`lfo${i}-on`).addEventListener('click', () => {
    L.on = !L.on;
    $(`lfo${i}-on`).classList.toggle('on', L.on);
    $(`lfo${i}-on`).textContent = L.on ? `⏸ LFO ${i+1} (ligado)` : `▶ LFO ${i+1}`;
    if (L.on) { L.target = $(`lfo${i}-target`).value; L.base = parseFloat($(L.target).value); }
    else lfoRestore(L);
  });
  $(`lfo${i}-target`).addEventListener('change', () => {
    if (!L.on) return;
    lfoRestore(L);
    L.target = $(`lfo${i}-target`).value;
    L.base = parseFloat($(L.target).value);
  });
});
function lfoWave(kind, t) {
  if (kind === 'sin') return Math.sin(t * Math.PI * 2);
  if (kind === 'tri') { const f = t - Math.floor(t); return 4 * Math.abs(f - 0.5) - 1; }
  return Math.sin(t*6.28)*0.5 + Math.sin(t*13.7+1.3)*0.3 + Math.sin(t*29.1+4.1)*0.2; // noise suave
}
function tickInteractive() {
  // mola do modo Puxar: volta ao lugar oscilando (wiggle amortecido)
  if (grab.spring) {
    const te = anim.fxTime - grab.spring.t0;
    const env = Math.exp(-3.5 * te);
    const d = bxU('uBxGrabD');
    if (d) {
      if (env < 0.02) { d.value.set(0, 0, 0); grab.spring = null; }
      else d.value.copy(grab.spring.D0).multiplyScalar(env * Math.cos(14 * te));
    }
  }
  tickHand();
  for (let i = 0; i < 2; i++) {
    const L = lfos[i];
    if (!L.on || L.base === null) continue;
    const el = $(L.target);
    if (!el) continue;
    const rate = parseFloat($(`lfo${i}-rate`).value);
    const depth = parseFloat($(`lfo${i}-depth`).value);
    const w = lfoWave($(`lfo${i}-wave`).value, anim.fxTime * rate + L.phase);
    const half = (parseFloat(el.max) - parseFloat(el.min)) / 2;
    itSetSlider(L.target, L.base + w * depth * half);
  }
}

// --- MIDI (Web MIDI API) ---
const midi = { access: null, learn: false, maps: [] };
function midiStatus(msg) { $('midi-status').innerHTML = msg; }
function midiMsg(e) {
  const [st, d1, d2] = e.data;
  if ((st & 0xf0) !== 0xB0) return; // só Control Change
  if (midi.learn) {
    const target = $('midi-target').value;
    midi.maps = midi.maps.filter(m => m.cc !== d1); // um alvo por knob
    midi.maps.push({ cc: d1, target });
    midi.learn = false;
    $('midi-learn').classList.remove('on');
    midiStatus(`CC ${d1} → <b>${IT_TARGETS.find(t => t[0] === target)?.[1] || target}</b> · ${midi.maps.length} mapeamento(s)`);
    return;
  }
  for (const m of midi.maps) {
    if (m.cc !== d1) continue;
    const el = $(m.target);
    if (!el) continue;
    const mn = parseFloat(el.min), mx = parseFloat(el.max);
    itSetSlider(m.target, mn + (d2 / 127) * (mx - mn));
  }
}
$('midi-on').addEventListener('click', async () => {
  if (!navigator.requestMIDIAccess) { showError('Web MIDI não suportado neste navegador.'); return; }
  try {
    midi.access = await navigator.requestMIDIAccess({ sysex: false });
    const hook = () => { for (const inp of midi.access.inputs.values()) inp.onmidimessage = midiMsg; };
    hook();
    midi.access.onstatechange = hook;
    $('midi-on').classList.add('on');
    const n = [...midi.access.inputs.values()].length;
    midiStatus(n ? `${n} dispositivo(s) MIDI conectado(s). Escolha o alvo e clique em Mapear.` : 'MIDI ativo — conecte um controlador.');
  } catch (e) {
    showError('Permissão MIDI negada. Clique no cadeado 🔒 na barra de endereço → Permissões do site → MIDI → Permitir, e recarregue a página. Precisa ser https no Chrome/Edge.');
    midiStatus('Permissão negada — libere MIDI no cadeado 🔒 do site e recarregue.');
  }
});
$('midi-learn').addEventListener('click', () => {
  if (!midi.access) { showError('Ative o MIDI primeiro.'); return; }
  midi.learn = !midi.learn;
  $('midi-learn').classList.toggle('on', midi.learn);
  if (midi.learn) midiStatus('Aguardando… mexa um knob/fader do controlador.');
});
$('midi-clear').addEventListener('click', () => {
  midi.maps = [];
  midiStatus('Mapeamentos limpos.');
});

// --- mão na webcam (MediaPipe Hands) controla a força do mouse ---
const hand = { on: false, lm: null, video: null, stream: null, last: 0, pinch: false };
function stopHand() {
  hand.on = false;
  try { hand.stream?.getTracks().forEach(t => t.stop()); } catch (e) {}
  hand.stream = null; hand.video = null;
  $('hand-on').classList.remove('on');
  $('hand-on').textContent = '🖐 Controlar com a mão';
  const u = bxU('uBxMousePos'); if (u) u.value.set(1e9, 1e9, 1e9);
  grabEnd();
  syncFxUniforms();
}
$('hand-on').addEventListener('click', async () => {
  if (hand.on) { stopHand(); return; }
  try {
    $('hand-status').textContent = 'Carregando modelo de mãos…';
    const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs');
    const fileset = await vision.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
    hand.lm = await vision.HandLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU'
      },
      runningMode: 'VIDEO', numHands: 1
    });
    hand.video = document.createElement('video');
    hand.video.muted = true; hand.video.playsInline = true;
    hand.stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
    hand.video.srcObject = hand.stream;
    await hand.video.play();
    hand.on = true;
    $('hand-on').classList.add('on');
    $('hand-on').textContent = '🖐 Mão (ligada)';
    $('hand-status').textContent = 'Mostre a mão para a webcam — indicador move, pinça aplica.';
    if (!anim.mouseFx) $('mf-rep').click(); // liga um modo padrão
  } catch (e) {
    showError('Webcam/modelo indisponível: ' + (e.message || e));
    stopHand();
  }
});
function tickHand() {
  if (!hand.on || !hand.lm || !hand.video || hand.video.readyState < 2) return;
  const now = performance.now();
  if (now - hand.last < 33) return; // ~30 fps de detecção
  hand.last = now;
  let res;
  try { res = hand.lm.detectForVideo(hand.video, now); } catch (e) { return; }
  const lms = res.landmarks && res.landmarks[0];
  const uP = bxU('uBxMousePos'), uS = bxU('uBxMouseStr');
  if (!lms) {
    if (uP) uP.value.set(1e9, 1e9, 1e9);
    if (hand.pinch) { hand.pinch = false; grabEnd(); }
    return;
  }
  const tip = lms[8], th = lms[4];
  const rect = $('viewer-container').getBoundingClientRect();
  const fake = {
    clientX: rect.left + (1 - tip.x) * rect.width,  // espelhado (webcam)
    clientY: rect.top + tip.y * rect.height
  };
  const pt = bxScreenToModel(fake);
  const pinch = Math.hypot(tip.x - th.x, tip.y - th.y) < 0.06;
  if (anim.mouseFx === 4) {
    // Puxar por pinça: pinçou = agarra, soltou = mola
    if (pinch && !hand.pinch) grabBegin(pt);
    else if (pinch && hand.pinch) grabMove(pt);
    else if (!pinch && hand.pinch) grabEnd();
  } else {
    if (pt && uP) uP.value.copy(pt);
    // sem pinça, força zero; com pinça, força do slider
    if (uS) uS.value = pinch ? bxDiag() * 0.15 * Math.pow(parseFloat($('mf-str').value), 2) : 0;
  }
  hand.pinch = pinch;
}

// ============================================================
// EFEITOS DE CÂMERA (aplicados no tick)''')
rep("  tickAudio(); // 🎵 modulação por áudio (graves/médios/agudos)",
"""  tickAudio(); // 🎵 modulação por áudio (graves/médios/agudos)
  tickInteractive(); // 🕹 LFOs, mola do Puxar e mão""")

# ===== splash: botão único para a página Criar =====
rep('''    <a class="btn ghost" id="btn-colab" href="#" target="_blank" rel="noopener">🎬 Criar splat a partir de um vídeo</a>
    <a class="btn ghost" id="btn-sharp" href="#" target="_blank" rel="noopener">🖼️ Criar splat a partir de uma foto</a>
    <a class="btn ghost" id="btn-4dgs" href="#" target="_blank" rel="noopener">🎞️ Criar sequência 4D a partir de um vídeo</a>''',
'''    <a class="btn ghost" id="btn-criar" href="criar.html">✨ Criar meu splat (foto, vídeo, 4D) — guia passo a passo</a>''')
rep('''const COLAB_URL = "https://colab.research.google.com/github/nyckm/3dGS_WebEDIT/blob/main/Bruxos_VFX_3DGS.ipynb";
const SHARP_COLAB_URL = "https://colab.research.google.com/github/nyckm/3dGS_WebEDIT/blob/main/Bruxos_VFX_SHARP.ipynb";
const SHARP_4DGS_URL = "https://colab.research.google.com/github/nyckm/3dGS_WebEDIT/blob/main/Bruxos_VFX_4DGS.ipynb";
document.getElementById('btn-colab').href = COLAB_URL;
document.getElementById('btn-sharp').href = SHARP_COLAB_URL;
document.getElementById('btn-4dgs').href = SHARP_4DGS_URL;''',
'''// Os links do Colab agora vivem na página-guia criar.html (envelope amigável).''')

p.write_text(s, encoding='utf-8')
print('OK r8', len(s))
