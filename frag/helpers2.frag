// wireframes dos boxes: overlay sempre visível (linhas grossas + preenchimento
// translúcido, por cima da cena) + gizmo 3D (mover/girar/escalar) via TransformControls
const bxHelpers = { crop: null, fx: null };
const bxLineMats = []; // LineMaterials que precisam de resolution atualizada no resize
function makeBoxHelper(color) {
  const grp = new THREE.Group();
  const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
  let lines;
  if (LineSegments2 && LineSegmentsGeometry && LineMaterial) {
    const g = new LineSegmentsGeometry().setPositions(Array.from(edges.attributes.position.array));
    const m = new LineMaterial({ color, linewidth: 3, transparent: true, opacity: 1, depthTest: false, depthWrite: false });
    m.resolution.set(window.innerWidth, window.innerHeight);
    bxLineMats.push(m);
    lines = new LineSegments2(g, m);
  } else {
    lines = new THREE.LineSegments(edges,
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 1, depthTest: false, depthWrite: false }));
  }
  lines.renderOrder = 9990;
  const fill = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.08, depthTest: false, depthWrite: false, side: THREE.DoubleSide }));
  fill.renderOrder = 9980;
  grp.add(fill);
  grp.add(lines);
  return grp;
}
// --- gizmo 3D compartilhado (um por vez: box de efeito em exibição > crop box ligado) ---
const bxGizmo = { ctl: null, dragging: false, mode: 'translate', state: null, fxIndex: -1 };
function bxUpdateGizmo(target, state, fxIndex) {
  if (!TransformControls || !viewer?.camera || !viewer?.renderer) return;
  let g = bxGizmo.ctl;
  if (g && g.camera !== viewer.camera) { // viewer novo → recria o gizmo
    try { g.detach(); g.dispose(); g.parent?.remove(g); } catch (e) {}
    g = bxGizmo.ctl = null;
  }
  if (!target) {
    if (g) { g.detach(); g.visible = false; }
    bxGizmo.state = null; bxGizmo.fxIndex = -1;
    return;
  }
  if (!g) {
    g = bxGizmo.ctl = new TransformControls(viewer.camera, viewer.renderer.domElement);
    g.setSize(0.9);
    g.addEventListener('dragging-changed', e => {
      bxGizmo.dragging = e.value;
      if (viewer?.controls) viewer.controls.enabled = !e.value && !anim.paintMode;
    });
    g.addEventListener('objectChange', bxGizmoChanged);
    viewer.threeScene.add(g);
  }
  if (g.parent !== viewer.threeScene) viewer.threeScene.add(g);
  g.setMode(bxGizmo.mode);
  if (g.object !== target) g.attach(target);
  g.visible = true; g.enabled = true;
  bxGizmo.state = state; bxGizmo.fxIndex = fxIndex;
}
// arrastou o gizmo → grava no estado do box, reflete nos sliders e re-sincroniza
function bxGizmoChanged() {
  const b = bxGizmo.state, h = bxGizmo.ctl?.object;
  if (!b || !h) return;
  const ex = bbox
    ? [bbox.max[0]-bbox.min[0] || 1, bbox.max[1]-bbox.min[1] || 1, bbox.max[2]-bbox.min[2] || 1]
    : [5, 5, 5];
  const mn = bbox ? bbox.min : [-2.5, -2.5, -2.5];
  b.px = (h.position.x - mn[0]) / ex[0];
  b.py = (h.position.y - mn[1]) / ex[1];
  b.pz = (h.position.z - mn[2]) / ex[2];
  b.rx = h.rotation.x * 180 / Math.PI;
  b.ry = h.rotation.y * 180 / Math.PI;
  b.rz = h.rotation.z * 180 / Math.PI;
  b.sx = Math.max(h.scale.x / ex[0], 0.02);
  b.sy = Math.max(h.scale.y / ex[1], 0.02);
  b.sz = Math.max(h.scale.z / ex[2], 0.02);
  bxGizmoSliders(b);
  syncFxUniforms();
}
function bxGizmoSliders(b) {
  const fx = bxGizmo.fxIndex >= 0 ? DFX[bxGizmo.fxIndex].id : null;
  const setS = (k, val, txt) => {
    const s = $(fx ? `${fx}-b${k}` : `cb-${k}`), v = $(fx ? `v-${fx}b${k}` : `v-cb${k}`);
    if (s) { s.value = val; v.textContent = txt; }
  };
  setS('px', b.px, Math.round(b.px*100)+'%');
  setS('py', b.py, Math.round(b.py*100)+'%');
  setS('pz', b.pz, Math.round(b.pz*100)+'%');
  setS('sx', b.sx, b.sx.toFixed(2));
  setS('sy', b.sy, b.sy.toFixed(2));
  setS('sz', b.sz, b.sz.toFixed(2));
  setS('rx', b.rx, b.rx.toFixed(0)+'°');
  setS('ry', b.ry, b.ry.toFixed(0)+'°');
  setS('rz', b.rz, b.rz.toFixed(0)+'°');
}
// botões Mover / Girar / Escala (valem para o gizmo ativo, crop ou efeito)
document.querySelectorAll('.gz-mode').forEach(bt => bt.addEventListener('click', () => {
  bxGizmo.mode = bt.dataset.mode;
  document.querySelectorAll('.gz-mode').forEach(b2 => b2.classList.toggle('on', b2.dataset.mode === bxGizmo.mode));
  if (bxGizmo.ctl) bxGizmo.ctl.setMode(bxGizmo.mode);
}));
function updateBoxHelpers() {
  const mesh = viewer?.splatMesh;
  if (!mesh) return;
  const place = (key, color, b, show) => {
    let h = bxHelpers[key];
    if (!h) h = bxHelpers[key] = makeBoxHelper(color);
    if (h.parent !== mesh) { try { h.parent?.remove(h); } catch(e){} mesh.add(h); }
    h.visible = !!(show && b);
    if (b && !(bxGizmo.dragging && bxGizmo.ctl && bxGizmo.ctl.object === h)) {
      const w = boxToWorld(b);
      h.position.copy(w.pos);
      h.rotation.copy(w.eul);
      h.scale.set(w.half.x*2, w.half.y*2, w.half.z*2);
    }
    return h;
  };
  const hCrop = place('crop', 0x96c93d, anim.cropBox, anim.cropBox.on);
  const iFx = dfxState.findIndex(s => s.showBox);
  const hFx = place('fx', 0xb064c4, iFx >= 0 ? dfxState[iFx].box : null, iFx >= 0);
  // gizmo: prioriza o box de efeito em exibição (👁); senão o crop box ligado
  if (iFx >= 0) bxUpdateGizmo(hFx, dfxState[iFx].box, iFx);
  else if (anim.cropBox.on) bxUpdateGizmo(hCrop, anim.cropBox, -1);
  else bxUpdateGizmo(null, null, -1);
}

