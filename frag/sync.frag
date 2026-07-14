// ===== helpers de geometria (bbox, boxes, wireframes) =====
function bxDiag() {
  if (!bbox) return 10;
  const dx = bbox.max[0]-bbox.min[0], dy = bbox.max[1]-bbox.min[1], dz = bbox.max[2]-bbox.min[2];
  return Math.sqrt(dx*dx + dy*dy + dz*dz);
}
function bxMap01(k, t) {
  return bbox ? bbox.min[k] + (bbox.max[k] - bbox.min[k]) * t : (t - 0.5) * 10;
}
// converte o estado de um box (frações do bbox + graus) para posição/meia-medida/euler no espaço da cena
function boxToWorld(b) {
  const ex = bbox ? [bbox.max[0]-bbox.min[0], bbox.max[1]-bbox.min[1], bbox.max[2]-bbox.min[2]] : [5,5,5];
  return {
    pos: new THREE.Vector3(bxMap01(0, b.px), bxMap01(1, b.py), bxMap01(2, b.pz)),
    half: new THREE.Vector3(
      Math.max(ex[0]*b.sx, 1e-4)/2, Math.max(ex[1]*b.sy, 1e-4)/2, Math.max(ex[2]*b.sz, 1e-4)/2),
    eul: new THREE.Euler(b.rx*Math.PI/180, b.ry*Math.PI/180, b.rz*Math.PI/180)
  };
}
// wireframes: verde = crop box, roxo = box do efeito de distorção em edição
const bxHelpers = { crop: null, fx: null };
function makeBoxHelper(color) {
  const g = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
  return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9, depthTest: false }));
}
function updateBoxHelpers() {
  const mesh = viewer?.splatMesh;
  if (!mesh) return;
  const place = (key, color, b, show) => {
    let h = bxHelpers[key];
    if (!h) h = bxHelpers[key] = makeBoxHelper(color);
    if (h.parent !== mesh) { try { h.parent?.remove(h); } catch(e){} mesh.add(h); }
    h.visible = !!(show && b);
    if (b) {
      const w = boxToWorld(b);
      h.position.copy(w.pos);
      h.rotation.copy(w.eul);
      h.scale.set(w.half.x*2, w.half.y*2, w.half.z*2);
    }
  };
  place('crop', 0x96c93d, anim.cropBox, anim.cropBox.on);
  const iFx = dfxState.findIndex(s => s.showBox);
  place('fx', 0xb064c4, iFx >= 0 ? dfxState[iFx].box : null, iFx >= 0);
}

// sincroniza sliders do painel → uniforms do shader
function syncFxUniforms() {
  const set = (n, v) => { const u = bxU(n); if (u) u.value = v; };
  const diag = bxDiag();
  // --- distorções ---
  const dOn = bxU('uBxDOn');
  if (dOn) {
    const dAxis = bxU('uBxDAxis'), dAmp = bxU('uBxDAmp'), dFreq = bxU('uBxDFreq'),
          dSpd = bxU('uBxDSpeed'), dRad = bxU('uBxDRadius'), dbOn = bxU('uBxDBoxOn'),
          dbPos = bxU('uBxDBoxPos'), dbInv = bxU('uBxDBoxInvHalf'), dbRot = bxU('uBxDBoxRot');
    for (let i = 0; i < 7; i++) {
      const s = dfxState[i];
      dOn.value[i] = s.on ? 1 : 0;
      dAxis.value[i].set(s.ax[0], s.ax[1], s.ax[2]);
      dAmp.value[i] = s.amp;
      dFreq.value[i] = s.freq;
      dSpd.value[i] = s.speed;
      dRad.value[i] = s.radius >= 0.99 ? 0 : diag * 0.6 * s.radius;
      dbOn.value[i] = s.boxOn ? 1 : 0;
      const w = boxToWorld(s.box);
      dbPos.value[i].copy(w.pos);
      dbInv.value[i].set(1/w.half.x, 1/w.half.y, 1/w.half.z);
      dbRot.value[i].setFromMatrix4(new THREE.Matrix4().makeRotationFromEuler(w.eul)).transpose();
    }
  }
  // --- crop box (ao vivo) ---
  set('uBxCropBoxOn', anim.cropBox.on ? 1 : 0);
  {
    const w = boxToWorld(anim.cropBox);
    const cp = bxU('uBxCropBoxPos'), ci = bxU('uBxCropBoxInvHalf'), cr = bxU('uBxCropBoxRot');
    if (cp) cp.value.copy(w.pos);
    if (ci) ci.value.set(1/w.half.x, 1/w.half.y, 1/w.half.z);
    if (cr) cr.value.setFromMatrix4(new THREE.Matrix4().makeRotationFromEuler(w.eul)).transpose();
  }
  // --- fumaça / dissolve ---
  set('uBxSmokeDist', parseFloat($('s-dist').value));
  set('uBxDisMax', diag * 0.75);
  // --- relight ---
  set('uBxLightOn', anim.relight ? 1 : 0);
  set('uBxLightStrength', parseFloat($('l-str').value));
  set('uBxAmbient', parseFloat($('l-amb').value));
  const lc = bxU('uBxLightColor'); if (lc) lc.value.set($('l-color').value);
  const setDir = (uName, azId, elId) => {
    const u = bxU(uName);
    if (!u) return;
    const az = parseFloat($(azId).value) * Math.PI / 180;
    const el = parseFloat($(elId).value) * Math.PI / 180;
    u.value.set(-Math.cos(el) * Math.sin(az), Math.sin(el), -Math.cos(el) * Math.cos(az)).normalize();
  };
  setDir('uBxLightDir', 'l-az', 'l-el');
  setDir('uBxLight2Dir', 'l2-az', 'l2-el');
  set('uBxShadowHard', parseFloat($('l-shadow').value));
  set('uBxLight2On', anim.light2 ? 1 : 0);
  set('uBxLight2Strength', parseFloat($('l2-str').value));
  const l2c = bxU('uBxLight2Color'); if (l2c) l2c.value.set($('l2-color').value);
  // --- luz pontual ---
  set('uBxPLOn', anim.plight ? 1 : 0);
  const plp = bxU('uBxPLPos');
  if (plp) plp.value.set(bxMap01(0, parseFloat($('pl-x').value)), bxMap01(1, parseFloat($('pl-y').value)), bxMap01(2, parseFloat($('pl-z').value)));
  set('uBxPLStr', parseFloat($('pl-str').value));
  set('uBxPLRadius', diag * parseFloat($('pl-radius').value));
  const plc = bxU('uBxPLColor'); if (plc) plc.value.set($('pl-color').value);
  // --- DoF ---
  set('uBxDofOn', anim.dof ? 1 : 0);
  set('uBxFocusDist', parseFloat($('d-dist').value));
  set('uBxFocusRange', parseFloat($('d-range').value));
  set('uBxBlurMax', parseFloat($('d-blur').value));
  // --- reveal (epicentro = pivô) ---
  const rc = bxU('uBxRevealCenter'), rm = bxU('uBxRevealMax');
  if (rc && rm) {
    rc.value.copy(getAnchor());
    rm.value = diag * 1.05 || 15;
  }
  set('uBxReveal', anim.revealVal);
  // --- anchor / crop radial ---
  const ua = bxU('uBxAnchor');
  if (ua) ua.value.copy(getAnchor());
  set('uBxCropR', (anim.anchorCrop && bbox) ? diag * 0.6 * parseFloat($('a-r').value) : 0);
  // --- bbox ---
  if (bbox) {
    const bmin = bxU('uBxBBMin'), bmax = bxU('uBxBBMax');
    if (bmin) bmin.value.set(bbox.min[0], bbox.min[1], bbox.min[2]);
    if (bmax) bmax.value.set(bbox.max[0], bbox.max[1], bbox.max[2]);
  }
  // --- time slice (4D) ---
  set('uBxTimeSliceOn', (anim.timeSlice && seq) ? 1 : 0);
  set('uBxSliceAxis', parseFloat($('ts-axis').value));
  set('uBxSliceInvert', anim.sliceInvert ? 1 : 0);
  set('uBxSliceShift', parseFloat($('ts-shift').value) + anim.sliceAnim);
  // --- color grading ---
  set('uBxGradeOn', anim.grade ? 1 : 0);
  set('uBxExposure', parseFloat($('cg-exp').value));
  set('uBxContrast', parseFloat($('cg-con').value));
  set('uBxSaturation', parseFloat($('cg-sat').value));
  set('uBxTemp', parseFloat($('cg-temp').value));
  set('uBxTint', parseFloat($('cg-tint').value));
  // --- paint (pincel) ---
  set('uBxPaintN', Math.min(paintStrokes.length, 64));
  const pp = bxU('uBxPaintPosR'), pcArr = bxU('uBxPaintCol');
  if (pp) for (let i = 0; i < paintStrokes.length && i < 64; i++) {
    const st = paintStrokes[i];
    pp.value[i].set(st.p.x, st.p.y, st.p.z, st.r);
    pcArr.value[i].copy(st.c);
  }
  set('uBxPaintStrength', parseFloat($('pt-str').value));
  // --- fog ---
  set('uBxFogOn', anim.fog ? 1 : 0);
  const fc = bxU('uBxFogColor'); if (fc) fc.value.set($('fog-color').value);
  set('uBxFogNear', parseFloat($('fog-near').value));
  set('uBxFogFar', parseFloat($('fog-far').value));
  // --- profundidade (perto/longe) ---
  set('uBxDepthOn', anim.depthCol ? 1 : 0);
  const dcn = bxU('uBxDepthNearCol'); if (dcn) dcn.value.set($('dc-cnear').value);
  const dcf = bxU('uBxDepthFarCol'); if (dcf) dcf.value.set($('dc-cfar').value);
  set('uBxDepthNear', parseFloat($('dc-n').value));
  set('uBxDepthFar', parseFloat($('dc-f').value));
  // --- pontos P&B / point cloud ---
  set('uBxMono', anim.pb ? 1 : 0);
  const pc = viewer?.splatMesh?.material?.uniforms?.pointCloudModeEnabled;
  if (pc) pc.value = (anim.pb || anim.depthCol) ? 1 : 0;
  // wireframes dos boxes
  updateBoxHelpers();
}
