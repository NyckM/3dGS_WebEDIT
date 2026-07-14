// --- crop box: ao vivo (GPU, qualquer formato) + permanente (regrava o buffer) ---
function cropGeomBox(buf, g, w, invRot) {
  const dv = new DataView(buf);
  const u8 = new Uint8Array(buf);
  const keep = [];
  const e = invRot.elements; // column-major
  for (let i = 0; i < g.count; i++) {
    const base = g.dataStart + i * g.stride;
    const x = dv.getFloat32(base + g.posOff[0], true) - w.pos.x;
    const y = dv.getFloat32(base + g.posOff[1], true) - w.pos.y;
    const z = dv.getFloat32(base + g.posOff[2], true) - w.pos.z;
    const qx = e[0]*x + e[3]*y + e[6]*z;
    const qy = e[1]*x + e[4]*y + e[7]*z;
    const qz = e[2]*x + e[5]*y + e[8]*z;
    if (Math.abs(qx) <= w.half.x && Math.abs(qy) <= w.half.y && Math.abs(qz) <= w.half.z) keep.push(i);
  }
  if (keep.length === 0) return null;
  let headerBytes = new Uint8Array(0);
  if (g.type === 'ply') {
    const newHeader = g.header.replace(/element\s+vertex\s+\d+/, 'element vertex ' + keep.length);
    headerBytes = new TextEncoder().encode(newHeader);
  }
  const out = new Uint8Array(headerBytes.length + keep.length * g.stride);
  out.set(headerBytes, 0);
  keep.forEach((idx, j) => {
    const src = g.dataStart + idx * g.stride;
    out.set(u8.subarray(src, src + g.stride), headerBytes.length + j * g.stride);
  });
  return { buffer: out.buffer, kept: keep.length };
}
{
  const CB = anim.cropBox;
  const cbFmtPct = v => Math.round(v*100) + '%';
  bindSlider('cb-px', 'v-cbpx', cbFmtPct, v => { CB.px = v; syncFxUniforms(); });
  bindSlider('cb-py', 'v-cbpy', cbFmtPct, v => { CB.py = v; syncFxUniforms(); });
  bindSlider('cb-pz', 'v-cbpz', cbFmtPct, v => { CB.pz = v; syncFxUniforms(); });
  bindSlider('cb-sx', 'v-cbsx', v => v.toFixed(2), v => { CB.sx = v; syncFxUniforms(); });
  bindSlider('cb-sy', 'v-cbsy', v => v.toFixed(2), v => { CB.sy = v; syncFxUniforms(); });
  bindSlider('cb-sz', 'v-cbsz', v => v.toFixed(2), v => { CB.sz = v; syncFxUniforms(); });
  bindSlider('cb-rx', 'v-cbrx', v => v.toFixed(0) + '°', v => { CB.rx = v; syncFxUniforms(); });
  bindSlider('cb-ry', 'v-cbry', v => v.toFixed(0) + '°', v => { CB.ry = v; syncFxUniforms(); });
  bindSlider('cb-rz', 'v-cbrz', v => v.toFixed(0) + '°', v => { CB.rz = v; syncFxUniforms(); });
  $('cb-toggle').addEventListener('click', () => {
    CB.on = !CB.on;
    $('cb-toggle').classList.toggle('on', CB.on);
    $('cb-toggle').textContent = CB.on ? '⏸ Crop box (ligado)' : '▶ Crop box (ao vivo)';
    syncFxUniforms();
  });
  $('c-apply').addEventListener('click', async () => {
    const g = currentBuffer ? analyzeGeom(currentBuffer, currentFormat) : null;
    if (!g || !bbox) { showError('Crop permanente disponível só para .splat e .ply binário (cena única). Use o crop ao vivo (▶) para os demais.'); return; }
    const w = boxToWorld(CB);
    const invRot = new THREE.Matrix3()
      .setFromMatrix4(new THREE.Matrix4().makeRotationFromEuler(w.eul)).transpose();
    const result = cropGeomBox(currentBuffer, g, w, invRot);
    if (!result) { showError('Crop removeria todos os splats.'); return; }
    loading.classList.add('visible');
    loadingText.textContent = `Aplicando crop (${result.kept.toLocaleString()} splats)…`;
    CB.on = false;
    $('cb-toggle').classList.remove('on');
    $('cb-toggle').textContent = '▶ Crop box (ao vivo)';
    try { await loadScene(result.buffer, currentFormat, currentName); }
    catch(e) { showError('Erro no crop: ' + (e.message || e)); }
    loading.classList.remove('visible');
  });
  $('c-reset').addEventListener('click', async () => {
    Object.assign(CB, { on:false, px:.5, py:.5, pz:.5, sx:1, sy:1, sz:1, rx:0, ry:0, rz:0 });
    [['cb-px',.5],['cb-py',.5],['cb-pz',.5],['cb-sx',1],['cb-sy',1],['cb-sz',1],['cb-rx',0],['cb-ry',0],['cb-rz',0]]
      .forEach(([id, v]) => { $(id).value = v; });
    ['v-cbpx','v-cbpy','v-cbpz'].forEach(id => $(id).textContent = '50%');
    ['v-cbsx','v-cbsy','v-cbsz'].forEach(id => $(id).textContent = '1.00');
    ['v-cbrx','v-cbry','v-cbrz'].forEach(id => $(id).textContent = '0°');
    $('cb-toggle').classList.remove('on');
    $('cb-toggle').textContent = '▶ Crop box (ao vivo)';
    syncFxUniforms();
    if (currentBuffer && !seq) {
      loading.classList.add('visible'); loadingText.textContent = 'Restaurando…';
      try { await loadScene(currentBuffer, currentFormat, currentName); } catch(e){ showError(String(e)); }
      loading.classList.remove('visible');
    }
  });
}

