// ===== Painel / abas =====
$('btn-panel').addEventListener('click', () => {
  panel.classList.toggle('visible');
  $('btn-panel').classList.toggle('active');
});
document.querySelectorAll('.fx-tab').forEach(bt => bt.addEventListener('click', () => {
  document.querySelectorAll('.fx-tab').forEach(b => b.classList.toggle('active', b === bt));
  document.querySelectorAll('.tab-page').forEach(pg => pg.classList.toggle('visible', pg.id === bt.dataset.tab));
}));

function bindSlider(id, valId, fmt, cb) {
  const s = $(id), v = $(valId);
  s.addEventListener('input', () => { v.textContent = fmt(parseFloat(s.value)); cb(parseFloat(s.value)); });
}

// --- tamanho dos splats ---
bindSlider('p-splatscale', 'v-splatscale', v => v.toFixed(2), v => {
  anim.splatScale = v;
  if (viewer?.splatMesh && !anim.dissolve) viewer.splatMesh.setSplatScale(v);
});

// --- anchor / pivô (em coordenadas dos dados, mapeado no bounding box) ---
function getAnchor() {
  if (!bbox) return new THREE.Vector3(0, 0, 0);
  const m = (k, id) => bbox.min[k] + (bbox.max[k] - bbox.min[k]) * parseFloat($(id).value);
  return new THREE.Vector3(m(0, 'a-x'), m(1, 'a-y'), m(2, 'a-z'));
}

// --- posição / escala / rotação (em torno do pivô) ---
function applyTransforms() {
  if (!viewer?.splatMesh) return;
  const m = viewer.splatMesh;
  m.scale.set(anim.userScale.x, anim.userScale.y, anim.userScale.z);
  const twist = parseFloat($('p-twist').value) * Math.PI / 180;
  m.rotation.set(0, anim.rotY * Math.PI / 180, twist);
  // compensa a posição para girar/escalar em torno do pivô: pos = P - R*S*P (+ offset do usuário)
  const P = getAnchor();
  const v = new THREE.Vector3(P.x * m.scale.x, P.y * m.scale.y, P.z * m.scale.z).applyEuler(m.rotation);
  const ex = bbox
    ? [(bbox.max[0]-bbox.min[0])/2 || 1, (bbox.max[1]-bbox.min[1])/2 || 1, (bbox.max[2]-bbox.min[2])/2 || 1]
    : [2, 2, 2];
  m.position.set(
    P.x - v.x + anim.pos.x * ex[0],
    P.y - v.y + anim.pos.y * ex[1],
    P.z - v.z + anim.pos.z * ex[2]);
}
bindSlider('p-px', 'v-px', v => v.toFixed(2), v => { anim.pos.x = v; applyTransforms(); });
bindSlider('p-py', 'v-py', v => v.toFixed(2), v => { anim.pos.y = v; applyTransforms(); });
bindSlider('p-pz', 'v-pz', v => v.toFixed(2), v => { anim.pos.z = v; applyTransforms(); });
bindSlider('p-sx', 'v-sx', v => v.toFixed(2), v => { anim.userScale.x = v; applyTransforms(); });
bindSlider('p-sy', 'v-sy', v => v.toFixed(2), v => { anim.userScale.y = v; applyTransforms(); });
bindSlider('p-sz', 'v-sz', v => v.toFixed(2), v => { anim.userScale.z = v; applyTransforms(); });
bindSlider('p-ry', 'v-ry', v => v.toFixed(0) + '°', v => { anim.rotY = v; applyTransforms(); });
bindSlider('p-twist', 'v-twist', v => v.toFixed(0) + '°', () => applyTransforms());
$('p-reset-transform').addEventListener('click', () => {
  ['p-sx','p-sy','p-sz'].forEach(id => { $(id).value = 1; });
  ['v-sx','v-sy','v-sz'].forEach(id => { $(id).textContent = '1.00'; });
  ['p-px','p-py','p-pz'].forEach(id => { $(id).value = 0; });
  ['v-px','v-py','v-pz'].forEach(id => { $(id).textContent = '0.00'; });
  $('p-ry').value = 0; $('v-ry').textContent = '0°';
  $('p-twist').value = 0; $('v-twist').textContent = '0°';
  anim.userScale = {x:1,y:1,z:1}; anim.rotY = 0; anim.pos = {x:0,y:0,z:0};
  applyTransforms();
});

