// --- câmera / lente (FOV) ---
function applyFov() {
  const fov = parseFloat($('cam-fov').value);
  $('v-fov').textContent = fov.toFixed(0) + '°';
  const mm = Math.round(12 / Math.tan(fov * Math.PI / 360));
  $('v-mm').textContent = `Equivalente a ~${mm}mm (full frame)`;
  if (viewer?.camera) {
    viewer.camera.fov = fov;
    viewer.camera.updateProjectionMatrix();
  }
}
$('cam-fov').addEventListener('input', applyFov);

// --- anchor / pivô ---
bindSlider('a-x', 'v-ax', v => Math.round(v*100)+'%', () => { applyTransforms(); syncFxUniforms(); });
bindSlider('a-y', 'v-ay', v => Math.round(v*100)+'%', () => { applyTransforms(); syncFxUniforms(); });
bindSlider('a-z', 'v-az2', v => Math.round(v*100)+'%', () => { applyTransforms(); syncFxUniforms(); });
bindSlider('a-r', 'v-ar', v => Math.round(v*100)+'%', () => syncFxUniforms());
$('ac-toggle').addEventListener('click', () => {
  anim.anchorCrop = !anim.anchorCrop;
  $('ac-toggle').classList.toggle('on', anim.anchorCrop);
  $('ac-toggle').textContent = anim.anchorCrop ? '⏸ Crop radial (ligado)' : '▶ Crop radial no pivô';
  syncFxUniforms();
});

// ============================================================
// EFEITOS DE DISTORÇÃO — 7 efeitos gerados programaticamente.
// Cada um: eixos X/Y/Z, amplitude, freq., velocidade, raio (esfera
// no pivô) e box de máscara com posição/escala/rotação.
// ============================================================
const DFX = [
  { id:'wob', name:'Wobble', multi:true,  amp:0.15, ampMin:0,  ampMax:1, freq:2, freqMax:10, speed:2,   ax:[0,1,0] },
  { id:'rip', name:'Ripple', multi:false, amp:0.10, ampMin:0,  ampMax:1, freq:6, freqMax:30, speed:2,   ax:[0,1,0] },
  { id:'wav', name:'Waves',  multi:true,  amp:0.08, ampMin:0,  ampMax:1, freq:3, freqMax:15, speed:1.5, ax:[1,1,1] },
  { id:'twi', name:'Twist',  multi:false, amp:0.5,  ampMin:-3, ampMax:3, freq:1, freqMax:5,  speed:0,   ax:[0,1,0] },
  { id:'ben', name:'Bend',   multi:false, amp:0.3,  ampMin:-2, ampMax:2, freq:1, freqMax:5,  speed:0,   ax:[0,1,0] },
  { id:'tap', name:'Taper',  multi:false, amp:0.5,  ampMin:0,  ampMax:2, freq:1, freqMax:5,  speed:0,   ax:[0,1,0] },
  { id:'bul', name:'Bulge',  multi:true,  amp:0.5,  ampMin:-2, ampMax:2, freq:1, freqMax:5,  speed:0,   ax:[1,1,1] },
];
const dfxState = DFX.map(d => ({
  on:false, ax:[...d.ax], amp:d.amp, freq:d.freq, speed:d.speed, radius:1,
  boxOn:false, showBox:false, box:{ px:.5, py:.5, pz:.5, sx:.5, sy:.5, sz:.5, rx:0, ry:0, rz:0 }
}));
(function buildDistortUI(){
  const cont = $('dist-container');
  DFX.forEach((d, i) => {
    const st = dfxState[i], p = d.id;
    const sec = document.createElement('div');
    sec.className = 'fxsec';
    const boxRow = (k, lbl, min, max, step, val, disp) =>
      `<div class="row"><label>${lbl}</label><input type="range" id="${p}-b${k}" min="${min}" max="${max}" step="${step}" value="${val}"><span class="val" id="v-${p}b${k}">${disp}</span></div>`;
    sec.innerHTML = `
      <h4>${d.name}</h4>
      <button class="panel-btn" id="${p}-on">▶ ${d.name}</button>
      <div class="axis-row"><span class="lbl">Eixos</span>
        <button class="ax-btn" id="${p}-aX">X</button>
        <button class="ax-btn" id="${p}-aY">Y</button>
        <button class="ax-btn" id="${p}-aZ">Z</button>
      </div>
      <div class="row"><label>Amplitude</label><input type="range" id="${p}-amp" min="${d.ampMin}" max="${d.ampMax}" step="0.01" value="${d.amp}"><span class="val" id="v-${p}amp">${d.amp.toFixed(2)}</span></div>
      <div class="row"><label>Freq.</label><input type="range" id="${p}-freq" min="0" max="${d.freqMax}" step="0.1" value="${d.freq}"><span class="val" id="v-${p}freq">${d.freq.toFixed(1)}</span></div>
      <div class="row"><label>Velocidade</label><input type="range" id="${p}-spd" min="0" max="8" step="0.1" value="${d.speed}"><span class="val" id="v-${p}spd">${d.speed.toFixed(1)}</span></div>
      <div class="row"><label>Raio</label><input type="range" id="${p}-rad" min="0.05" max="1" step="0.01" value="1"><span class="val" id="v-${p}rad">livre</span></div>
      <button class="panel-btn" id="${p}-boxon">▶ Limitar por box</button>
      <div class="sub" id="${p}-boxui" style="display:none">
        <button class="panel-btn" id="${p}-boxshow">👁 Mostrar box</button>
        ${boxRow('px','Pos X',0,1,0.01,0.5,'50%')}${boxRow('py','Pos Y',0,1,0.01,0.5,'50%')}${boxRow('pz','Pos Z',0,1,0.01,0.5,'50%')}
        ${boxRow('sx','Escala X',0.02,1.2,0.01,0.5,'0.50')}${boxRow('sy','Escala Y',0.02,1.2,0.01,0.5,'0.50')}${boxRow('sz','Escala Z',0.02,1.2,0.01,0.5,'0.50')}
        ${boxRow('rx','Rot X',-180,180,1,0,'0°')}${boxRow('ry','Rot Y',-180,180,1,0,'0°')}${boxRow('rz','Rot Z',-180,180,1,0,'0°')}
      </div>`;
    cont.appendChild(sec);
    $(`${p}-on`).addEventListener('click', () => {
      st.on = !st.on;
      $(`${p}-on`).classList.toggle('on', st.on);
      $(`${p}-on`).textContent = st.on ? `⏸ ${d.name} (ligado)` : `▶ ${d.name}`;
      syncFxUniforms();
    });
    ['X','Y','Z'].forEach((k, j) => {
      const bt = $(`${p}-a${k}`);
      bt.classList.toggle('on', !!st.ax[j]);
      bt.addEventListener('click', () => {
        if (d.multi) st.ax[j] = st.ax[j] ? 0 : 1;
        else { st.ax = [0,0,0]; st.ax[j] = 1; }
        ['X','Y','Z'].forEach((kk, jj) => $(`${p}-a${kk}`).classList.toggle('on', !!st.ax[jj]));
        syncFxUniforms();
      });
    });
    bindSlider(`${p}-amp`, `v-${p}amp`, v => v.toFixed(2), v => { st.amp = v; syncFxUniforms(); });
    bindSlider(`${p}-freq`, `v-${p}freq`, v => v.toFixed(1), v => { st.freq = v; syncFxUniforms(); });
    bindSlider(`${p}-spd`, `v-${p}spd`, v => v.toFixed(1), v => { st.speed = v; syncFxUniforms(); });
    bindSlider(`${p}-rad`, `v-${p}rad`, v => v >= 0.99 ? 'livre' : Math.round(v*100)+'%', v => { st.radius = v; syncFxUniforms(); });
    $(`${p}-boxon`).addEventListener('click', () => {
      st.boxOn = !st.boxOn;
      $(`${p}-boxon`).classList.toggle('on', st.boxOn);
      $(`${p}-boxon`).textContent = st.boxOn ? '⏸ Box (ligado)' : '▶ Limitar por box';
      $(`${p}-boxui`).style.display = st.boxOn ? 'block' : 'none';
      if (!st.boxOn) { st.showBox = false; $(`${p}-boxshow`).classList.remove('on'); }
      syncFxUniforms();
    });
    $(`${p}-boxshow`).addEventListener('click', () => {
      const turnOn = !st.showBox;
      dfxState.forEach(o => o.showBox = false);
      st.showBox = turnOn;
      DFX.forEach((dd, k) => $(`${dd.id}-boxshow`).classList.toggle('on', dfxState[k].showBox));
      syncFxUniforms();
    });
    ['px','py','pz'].forEach(k => bindSlider(`${p}-b${k}`, `v-${p}b${k}`, v => Math.round(v*100)+'%', v => { st.box[k] = v; syncFxUniforms(); }));
    ['sx','sy','sz'].forEach(k => bindSlider(`${p}-b${k}`, `v-${p}b${k}`, v => v.toFixed(2), v => { st.box[k] = v; syncFxUniforms(); }));
    ['rx','ry','rz'].forEach(k => bindSlider(`${p}-b${k}`, `v-${p}b${k}`, v => v.toFixed(0)+'°', v => { st.box[k] = v; syncFxUniforms(); }));
  });
})();

// ============================================================
// EFEITOS DE CÂMERA (aplicados no tick)
// ============================================================
function anchorWorld() {
  const a = getAnchor().clone();
  if (viewer?.splatMesh) viewer.splatMesh.localToWorld(a);
  else if (viewer?.controls) a.copy(viewer.controls.target);
  return a;
}
function camToggle(btnId, key, labelOn, labelOff, onStart) {
  $(btnId).addEventListener('click', () => {
    anim.cam[key] = !anim.cam[key];
    $(btnId).classList.toggle('on', anim.cam[key]);
    $(btnId).textContent = anim.cam[key] ? labelOn : labelOff;
    if (anim.cam[key] && onStart) onStart();
  });
}
bindSlider('a-orbitspeed', 'v-orbitspeed', v => v.toFixed(1), () => {});
bindSlider('co-sx', 'v-cosx', v => v.toFixed(1), () => {});
bindSlider('co-sz', 'v-cosz', v => v.toFixed(1), () => {});
camToggle('co-toggle', 'orbit', '⏸ Órbita (ligada)', '▶ Órbita');
bindSlider('vt-speed', 'v-vtspeed', v => v.toFixed(1), () => {});
camToggle('vt-toggle', 'vertigo', '⏸ Vertigo (ligado)', '▶ Vertigo', () => {
  if (!viewer?.camera) return;
  const dist = viewer.camera.position.distanceTo(anchorWorld());
  anim.cam.vertigoK = Math.max(dist, 0.05) * Math.tan(viewer.camera.fov * Math.PI / 360);
});
bindSlider('dl-speed', 'v-dlspeed', v => v.toFixed(1), () => {});
camToggle('dl-toggle', 'dolly', '⏸ Dolly In/Out (ligado)', '▶ Dolly In/Out');
bindSlider('tk-speed', 'v-tkspeed', v => v.toFixed(1), () => {});
camToggle('tk-toggle', 'truck', '⏸ Dolly Left/Right (ligado)', '▶ Dolly Left/Right');
bindSlider('tl-speed', 'v-tlspeed', v => v.toFixed(1), () => {});
camToggle('tl-toggle', 'tilt', '⏸ Tilt (ligado)', '▶ Tilt Up/Down');
bindSlider('hh-amp', 'v-hhamp', v => v.toFixed(2), () => {});
bindSlider('hh-freq', 'v-hhfreq', v => v.toFixed(1), () => {});
camToggle('hh-toggle', 'shake', '⏸ Camera shake (ligado)', '▶ Camera shake');

// executa os efeitos de câmera ativos (chamado no tick)
function tickCamera(dt) {
  if (!viewer?.camera || !viewer?.controls) return;
  const cam = viewer.camera, ctr = viewer.controls;
  const ext = bxDiag();
  const C = anim.cam;
  if (C.orbit || anim.recOrbit) {
    let sy = parseFloat($('a-orbitspeed').value);
    if (anim.recOrbit && !C.orbit && Math.abs(sy) < 0.01) sy = 2;
    const applyAxis = (ax, ay, az, s) => {
      if (Math.abs(s) < 0.01) return;
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(ax, ay, az), s * dt * 0.25);
      cam.position.sub(ctr.target).applyQuaternion(q).add(ctr.target);
      cam.up.applyQuaternion(q);
    };
    applyAxis(1, 0, 0, parseFloat($('co-sx').value));
    applyAxis(0, 1, 0, sy);
    applyAxis(0, 0, 1, parseFloat($('co-sz').value));
    cam.lookAt(ctr.target);
  }
  if (C.vertigo) {
    const A = anchorWorld();
    const dir = new THREE.Vector3().subVectors(A, cam.position);
    const dist = dir.length();
    if (dist > 0.05) {
      dir.normalize();
      cam.position.addScaledVector(dir, parseFloat($('vt-speed').value) * dt * dist * 0.4);
      const nd = Math.max(cam.position.distanceTo(A), 0.05);
      const fov = Math.max(12, Math.min(125, 2 * Math.atan(C.vertigoK / nd) * 180 / Math.PI));
      cam.fov = fov; cam.updateProjectionMatrix();
      $('cam-fov').value = fov; $('v-fov').textContent = fov.toFixed(0) + '°';
    }
  }
  const fwd = new THREE.Vector3(); cam.getWorldDirection(fwd);
  if (C.dolly) {
    const s = parseFloat($('dl-speed').value) * dt * ext * 0.08;
    cam.position.addScaledVector(fwd, s); ctr.target.addScaledVector(fwd, s);
  }
  if (C.truck) {
    const right = new THREE.Vector3().crossVectors(fwd, cam.up).normalize();
    const s = parseFloat($('tk-speed').value) * dt * ext * 0.08;
    cam.position.addScaledVector(right, s); ctr.target.addScaledVector(right, s);
  }
  if (C.tilt) {
    const right = new THREE.Vector3().crossVectors(fwd, cam.up).normalize();
    const rel = new THREE.Vector3().subVectors(ctr.target, cam.position)
      .applyAxisAngle(right, parseFloat($('tl-speed').value) * dt * 0.15);
    ctr.target.copy(cam.position).add(rel);
  }
  if (C.shake) {
    const amp = parseFloat($('hh-amp').value) * ext * 0.012;
    const f = parseFloat($('hh-freq').value);
    const t = anim.fxTime * f;
    const n = (a, b, c) => Math.sin(t*1.1+a)*0.5 + Math.sin(t*2.3+b)*0.35 + Math.sin(t*4.7+c)*0.15;
    const off = new THREE.Vector3(n(1.7,4.2,9.1), n(2.9,0.6,5.3), n(7.7,3.1,1.9)).multiplyScalar(amp);
    const d = new THREE.Vector3().subVectors(off, C.shakePrev);
    cam.position.add(d); ctr.target.add(d);
    C.shakePrev.copy(off);
  } else if (C.shakePrev.lengthSq() > 0) {
    cam.position.sub(C.shakePrev); ctr.target.sub(C.shakePrev); C.shakePrev.set(0, 0, 0);
  }
}

// ============================================================
// ILUMINAÇÃO / COR
// ============================================================
// --- relight ---
['l-az','l-el','l-str','l-amb'].forEach((id, i) => {
  const vids = ['v-laz','v-lel','v-lstr','v-lamb'];
  const fmts = [v => v.toFixed(0)+'°', v => v.toFixed(0)+'°', v => v.toFixed(2), v => v.toFixed(2)];
  bindSlider(id, vids[i], fmts[i], () => syncFxUniforms());
});
$('l-color').addEventListener('input', () => syncFxUniforms());
$('l-toggle').addEventListener('click', () => {
  anim.relight = !anim.relight;
  $('l-toggle').classList.toggle('on', anim.relight);
  $('l-toggle').textContent = anim.relight ? '⏸ Relight (ligado)' : '▶ Relight';
  syncFxUniforms();
});
bindSlider('l-shadow', 'v-lshadow', v => v.toFixed(1), () => syncFxUniforms());
// --- luz 2 ---
['l2-az','l2-el','l2-str'].forEach((id, i) => {
  const vids = ['v-l2az','v-l2el','v-l2str'];
  const fmts = [v => v.toFixed(0)+'°', v => v.toFixed(0)+'°', v => v.toFixed(2)];
  bindSlider(id, vids[i], fmts[i], () => syncFxUniforms());
});
$('l2-color').addEventListener('input', () => syncFxUniforms());
$('l2-toggle').addEventListener('click', () => {
  anim.light2 = !anim.light2;
  $('l2-toggle').classList.toggle('on', anim.light2);
  $('l2-toggle').textContent = anim.light2 ? '− Luz 2 (ligada)' : '+ Luz 2 (desligada)';
  syncFxUniforms();
});
// --- luz pontual ---
bindSlider('pl-x', 'v-plx', v => Math.round(v*100)+'%', () => syncFxUniforms());
bindSlider('pl-y', 'v-ply', v => Math.round(v*100)+'%', () => syncFxUniforms());
bindSlider('pl-z', 'v-plz', v => Math.round(v*100)+'%', () => syncFxUniforms());
bindSlider('pl-str', 'v-plstr', v => v.toFixed(2), () => syncFxUniforms());
bindSlider('pl-radius', 'v-plradius', v => v.toFixed(2), () => syncFxUniforms());
$('pl-color').addEventListener('input', () => syncFxUniforms());
$('pl-toggle').addEventListener('click', () => {
  anim.plight = !anim.plight;
  $('pl-toggle').classList.toggle('on', anim.plight);
  $('pl-toggle').textContent = anim.plight ? '⏸ Luz pontual (ligada)' : '▶ Luz pontual';
  syncFxUniforms();
});
// --- desfoque de fundo (DoF) ---
bindSlider('d-dist', 'v-ddist', v => v.toFixed(1), () => syncFxUniforms());
bindSlider('d-range', 'v-drange', v => v.toFixed(1), () => syncFxUniforms());
bindSlider('d-blur', 'v-dblur', v => v.toFixed(1), () => syncFxUniforms());
$('d-toggle').addEventListener('click', () => {
  anim.dof = !anim.dof;
  $('d-toggle').classList.toggle('on', anim.dof);
  $('d-toggle').textContent = anim.dof ? '⏸ Desfoque (ligado)' : '▶ Desfoque';
  syncFxUniforms();
});
// --- color grading ---
['cg-exp','cg-con','cg-sat','cg-temp','cg-tint'].forEach((id, i) => {
  const vids = ['v-cgexp','v-cgcon','v-cgsat','v-cgtemp','v-cgtint'];
  bindSlider(id, vids[i], v => v.toFixed(2), () => syncFxUniforms());
});
$('cg-toggle').addEventListener('click', () => {
  anim.grade = !anim.grade;
  $('cg-toggle').classList.toggle('on', anim.grade);
  $('cg-toggle').textContent = anim.grade ? '⏸ Grading (ligado)' : '▶ Grading';
  syncFxUniforms();
});
$('cg-cine').addEventListener('click', () => {
  $('cg-exp').value = 1.05; $('cg-con').value = 1.2; $('cg-sat').value = 0.85;
  $('cg-temp').value = 0.08; $('cg-tint').value = -0.03;
  ['v-cgexp','v-cgcon','v-cgsat','v-cgtemp','v-cgtint'].forEach((v, i) =>
    $(v).textContent = [1.05,1.2,0.85,0.08,-0.03][i].toFixed(2));
  if (!anim.grade) $('cg-toggle').click(); else syncFxUniforms();
});
$('cg-reset').addEventListener('click', () => {
  const d = { 'cg-exp':1,'cg-con':1,'cg-sat':1,'cg-temp':0,'cg-tint':0 };
  const vv = { 'v-cgexp':1,'v-cgcon':1,'v-cgsat':1,'v-cgtemp':0,'v-cgtint':0 };
  for (const k in d) $(k).value = d[k];
  for (const k in vv) $(k).textContent = vv[k].toFixed(2);
  syncFxUniforms();
});

// ============================================================
// EFEITOS DE TRANSIÇÃO (todos partem do Anchor Point)
// ============================================================
// --- dissolve (difusão a partir do pivô) ---
bindSlider('dis-dur', 'v-disdur', v => v.toFixed(1) + 's', () => {});
function startDisTransition(dir) {
  anim.disAnim = { dir, start: performance.now(), dur: parseFloat($('dis-dur').value) * 1000, from: anim.disVal };
}
$('dis-out').addEventListener('click', () => startDisTransition('out'));
$('dis-in').addEventListener('click', () => startDisTransition('in'));
// --- reveal (epicentro = pivô) ---
bindSlider('r-dur', 'v-rdur', v => v.toFixed(1) + 's', () => {});
function startReveal(dir) {
  if (dir === 'in' && anim.revealVal >= 0.999) anim.revealVal = 0; // revelar do zero
  anim.reveal = { dir, start: performance.now(), dur: parseFloat($('r-dur').value) * 1000, from: anim.revealVal };
}
$('r-play').addEventListener('click', () => startReveal('in'));
$('r-hide').addEventListener('click', () => startReveal('out'));
// --- fumaça (difusão global) ---
bindSlider('s-dist', 'v-sdist', v => v.toFixed(1), () => syncFxUniforms());
bindSlider('s-dur', 'v-sdur', v => v.toFixed(1) + 's', () => {});
function startSmoke(dir) {
  anim.smoke = { dir, start: performance.now(), dur: parseFloat($('s-dur').value) * 1000, from: anim.smokeVal };
}
$('s-out').addEventListener('click', () => startSmoke('out'));
$('s-in').addEventListener('click', () => startSmoke('in'));
// --- dissolve por escala ---
bindSlider('fx-dur', 'v-fxdur', v => v.toFixed(1) + 's', () => {});
function startDissolve(dir) {
  const dur = parseFloat($('fx-dur').value) * 1000;
  anim.dissolve = { dir, start: performance.now(), dur };
}
$('fx-dissolve-out').addEventListener('click', () => startDissolve('out'));
$('fx-dissolve-in').addEventListener('click', () => startDissolve('in'));

// ============================================================
// PAINT — pincel de verdade: clique e arraste sobre a cena
// ============================================================
const paintStrokes = [];
let bxPainting = false, bxLastStroke = null;
$('pt-toggle').addEventListener('click', () => {
  anim.paintMode = !anim.paintMode;
  $('pt-toggle').classList.toggle('on', anim.paintMode);
  $('pt-toggle').textContent = anim.paintMode ? '🖌 Pincel (ligado)' : '🖌 Modo pincel';
  if (viewer?.controls) viewer.controls.enabled = !anim.paintMode;
  $('viewer-container').style.cursor = anim.paintMode ? 'crosshair' : '';
});
bindSlider('pt-r', 'v-ptr', v => Math.round(v*100)+'%', () => {});
bindSlider('pt-str', 'v-ptstr', v => v.toFixed(2), () => syncFxUniforms());
$('pt-color').addEventListener('input', () => {});
$('pt-clear').addEventListener('click', () => {
  paintStrokes.length = 0; bxLastStroke = null;
  syncFxUniforms();
});
function bxAddStroke(e) {
  if (!viewer?.camera || !viewer?.controls || !viewer?.splatMesh) return;
  if (paintStrokes.length >= 64) { showError('Limite de 64 pinceladas — use "Limpar pinceladas".'); return; }
  const vc = $('viewer-container');
  const rect = vc.getBoundingClientRect();
  const ndc = new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -(((e.clientY - rect.top) / rect.height) * 2 - 1));
  const ray = new THREE.Raycaster();
  ray.setFromCamera(ndc, viewer.camera);
  const n = new THREE.Vector3();
  viewer.camera.getWorldDirection(n);
  const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(n, viewer.controls.target);
  const pt = new THREE.Vector3();
  if (!ray.ray.intersectPlane(plane, pt)) return;
  viewer.splatMesh.worldToLocal(pt); // pinta no espaço dos dados (acompanha escala/rotação)
  const r = bxDiag() * 0.12 * parseFloat($('pt-r').value);
  if (bxLastStroke && bxLastStroke.distanceTo(pt) < r * 0.35) return;
  paintStrokes.push({ p: pt.clone(), r, c: new THREE.Color($('pt-color').value) });
  bxLastStroke = pt.clone();
  syncFxUniforms();
}
$('viewer-container').addEventListener('pointerdown', e => {
  if (!anim.paintMode) return;
  bxPainting = true; bxLastStroke = null; bxAddStroke(e);
});
$('viewer-container').addEventListener('pointermove', e => {
  if (bxPainting && anim.paintMode) bxAddStroke(e);
});
window.addEventListener('pointerup', () => { bxPainting = false; });

// ============================================================
// EFEITOS DIVERSOS
// ============================================================
// --- weather: névoa ---
bindSlider('fog-near', 'v-fognear', v => v.toFixed(1), () => syncFxUniforms());
bindSlider('fog-far', 'v-fogfar', v => v.toFixed(0), () => syncFxUniforms());
$('fog-color').addEventListener('input', () => syncFxUniforms());
$('fog-toggle').addEventListener('click', () => {
  anim.fog = !anim.fog;
  $('fog-toggle').classList.toggle('on', anim.fog);
  $('fog-toggle').textContent = anim.fog ? '⏸ Névoa (ligada)' : '▶ Névoa';
  syncFxUniforms();
});
// --- weather: partículas (neve/chuva) ---
let weatherPts = null;
bindSlider('wx-amt', 'v-wxamt', v => (v/1000)+'k', () => { if (anim.weather) startWeather(anim.weather); });
bindSlider('wx-size', 'v-wxsize', v => v.toFixed(1), () => { if (anim.weather) startWeather(anim.weather); });
function clearWeather() {
  if (weatherPts && viewer?.threeScene) viewer.threeScene.remove(weatherPts);
  if (weatherPts) { weatherPts.geometry.dispose(); weatherPts.material.dispose(); }
  weatherPts = null;
}
function startWeather(kind) {
  clearWeather();
  anim.weather = kind;
  if (!viewer) return;
  const scene = viewer.threeScene || viewer.scene;
  if (!scene) return;
  const N = parseInt($('wx-amt').value);
  let ext = 8, cx = 0, cy = 0, cz = 0;
  if (bbox) {
    ext = Math.max(bbox.max[0]-bbox.min[0], bbox.max[1]-bbox.min[1], bbox.max[2]-bbox.min[2]) * 1.3 || 8;
    cx = (bbox.min[0]+bbox.max[0])/2; cy = (bbox.min[1]+bbox.max[1])/2; cz = (bbox.min[2]+bbox.max[2])/2;
  }
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i*3]   = cx + (Math.random()-0.5) * ext;
    pos[i*3+1] = cy + (Math.random()-0.5) * ext;
    pos[i*3+2] = cz + (Math.random()-0.5) * ext;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const snow = kind === 'snow';
  const szMul = parseFloat($('wx-size').value);
  const mat = new THREE.PointsMaterial({
    color: snow ? 0xffffff : 0x99bbdd,
    size: (snow ? ext*0.006 : ext*0.004) * szMul,
    transparent: true, opacity: snow ? 0.9 : 0.5, depthWrite: false
  });
  weatherPts = new THREE.Points(geo, mat);
  weatherPts.userData = { ext, cx, cy, cz, snow, speed: snow ? 0.4 : 2.2 };
  scene.add(weatherPts);
}
function tickWeather(dt) {
  if (!weatherPts) return;
  const u = weatherPts.userData;
  const p = weatherPts.geometry.attributes.position.array;
  const drop = u.speed * dt * (u.ext * 0.15);
  for (let i = 0; i < p.length; i += 3) {
    p[i+1] += drop; // cameraUp = -Y, então +Y "cai" na tela
    if (u.snow) p[i] += Math.sin((p[i+1]+i) * 2) * u.ext * 0.0006;
    if (p[i+1] > u.cy + u.ext/2) p[i+1] = u.cy - u.ext/2;
  }
  weatherPts.geometry.attributes.position.needsUpdate = true;
}
$('wx-snow').addEventListener('click', () => {
  const on = anim.weather === 'snow';
  if (on) { clearWeather(); anim.weather = null; $('wx-snow').classList.remove('on'); $('wx-snow').textContent = '❄ Neve'; }
  else { startWeather('snow'); $('wx-snow').classList.add('on'); $('wx-rain').classList.remove('on');
         $('wx-snow').textContent = '❄ Neve (ligada)'; $('wx-rain').textContent = '🌧 Chuva'; }
});
$('wx-rain').addEventListener('click', () => {
  const on = anim.weather === 'rain';
  if (on) { clearWeather(); anim.weather = null; $('wx-rain').classList.remove('on'); $('wx-rain').textContent = '🌧 Chuva'; }
  else { startWeather('rain'); $('wx-rain').classList.add('on'); $('wx-snow').classList.remove('on');
         $('wx-rain').textContent = '🌧 Chuva (ligada)'; $('wx-snow').textContent = '❄ Neve'; }
});
// --- pontos P&B ---
$('pb-toggle').addEventListener('click', () => {
  anim.pb = !anim.pb;
  $('pb-toggle').classList.toggle('on', anim.pb);
  $('pb-toggle').textContent = anim.pb ? '⏸ Modo pontos P&B (ligado)' : '▶ Modo pontos P&B';
  syncFxUniforms();
});
// --- pontos por profundidade (perto verde / longe roxo) ---
bindSlider('dc-n', 'v-dcn', v => v.toFixed(1), () => syncFxUniforms());
bindSlider('dc-f', 'v-dcf', v => v.toFixed(1), () => syncFxUniforms());
$('dc-cnear').addEventListener('input', () => syncFxUniforms());
$('dc-cfar').addEventListener('input', () => syncFxUniforms());
$('dc-toggle').addEventListener('click', () => {
  anim.depthCol = !anim.depthCol;
  $('dc-toggle').classList.toggle('on', anim.depthCol);
  $('dc-toggle').textContent = anim.depthCol ? '⏸ Perto/Longe (ligado)' : '▶ Perto/Longe';
  syncFxUniforms();
});
// --- time slice (4D) ---
bindSlider('ts-axis', 'v-tsaxis', v => 'XYZ'[Math.round(v)], () => syncFxUniforms());
bindSlider('ts-shift', 'v-tsshift', v => Math.round(v*100)+'%', () => syncFxUniforms());
$('ts-invert').addEventListener('click', () => {
  anim.sliceInvert = !anim.sliceInvert;
  $('ts-invert').classList.toggle('on', anim.sliceInvert);
  syncFxUniforms();
});
$('ts-toggle').addEventListener('click', () => {
  if (!seq) { showError('Time Slice só funciona com uma sequência 4D carregada.'); return; }
  anim.timeSlice = !anim.timeSlice;
  $('ts-toggle').classList.toggle('on', anim.timeSlice);
  $('ts-toggle').textContent = anim.timeSlice ? '⏸ Time Slice (ligado)' : '▶ Time Slice';
  anim.sliceAnim = 0;
  setSeqFrame(seq.current);
  syncFxUniforms();
});

