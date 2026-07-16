import pathlib
p = pathlib.Path('index.html')
s = p.read_text(encoding='utf-8')
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, f'esperava {n}, achei {s.count(old)}: {old[:80]!r}'
    s = s.replace(old, new)

BALL = '''
    <h3>🔮 Ball Chrome / HDRI</h3>
    <button class="panel-btn" id="ball-toggle">▶ Ball chrome</button>
    <div class="row"><label>Tamanho</label><input type="range" id="ball-size" min="0.02" max="0.5" step="0.005" value="0.12"><span class="val" id="v-ballsize">0.12</span></div>
    <div class="btn-pair">
      <button class="panel-btn" id="ball-update">🔄 Atualizar reflexo</button>
      <button class="panel-btn" id="ball-export">📤 Exportar 360</button>
    </div>
    <div id="ball-pal" style="display:flex; gap:6px; margin:8px 0; flex-wrap:wrap;"></div>
    <p class="note">Esfera espelhada no Anchor Point refletindo a cena. "Exportar 360" gera um PNG equiretangular 2048×1024 para usar como HDRI; a paleta traz as cores dominantes da luz (clique para copiar o hex).</p>'''

# move o Ball para a aba nova 🔮 VFX
rep('''    <p class="note">Relight aproximado (sem normais reais — usa direção radial).</p>
''' + BALL, '''    <p class="note">Relight aproximado (sem normais reais — usa direção radial).</p>''')
rep('    <button class="fx-tab" data-tab="tab-inter">🕹 Interativo</button>',
'''    <button class="fx-tab" data-tab="tab-inter">🕹 Interativo</button>
    <button class="fx-tab" data-tab="tab-vfx">🔮 VFX</button>''')
rep('''  <!-- ========== INTERATIVO ========== -->''',
'''  <!-- ========== VFX ========== -->
  <div class="tab-page" id="tab-vfx">
''' + BALL + '''
  </div>

  <!-- ========== INTERATIVO ========== -->''')

# posição + gizmo + visibilidade da ball
rep('''<div class="row"><label>Tamanho</label><input type="range" id="ball-size" min="0.02" max="0.5" step="0.005" value="0.12"><span class="val" id="v-ballsize">0.12</span></div>''',
'''<div class="row"><label>Tamanho</label><input type="range" id="ball-size" min="0.02" max="0.5" step="0.005" value="0.12"><span class="val" id="v-ballsize">0.12</span></div>
    <div class="row"><label>Pos X</label><input type="range" id="ball-x" min="-0.2" max="1.2" step="0.005" value="0.5"><span class="val" id="v-ballx">50%</span></div>
    <div class="row"><label>Pos Y</label><input type="range" id="ball-y" min="-0.2" max="1.2" step="0.005" value="0.5"><span class="val" id="v-bally">50%</span></div>
    <div class="row"><label>Pos Z</label><input type="range" id="ball-z" min="-0.2" max="1.2" step="0.005" value="0.5"><span class="val" id="v-ballz">50%</span></div>
    <button class="panel-btn" id="ball-gizmo">🕹 Gizmo da ball (arrastar)</button>''')
rep('''    ball.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 48, 32),
      new THREE.MeshBasicMaterial({ envMap: ball.cubeRT.texture, transparent: true, depthTest: false, depthWrite: false }));''',
'''    ball.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 48, 32),
      new THREE.MeshBasicMaterial({ color: 0xb8bcc6, transparent: true, depthTest: false, depthWrite: false }));''')
rep('''  m.visible = true;
  m.position.copy(getAnchor());
  const r = bxDiag() * parseFloat($('ball-size').value) * 0.5;
  m.scale.set(r, r, r);
}''',
'''  m.visible = true;
  if (!ballG.dragging) {
    m.position.set(
      bxMap01(0, parseFloat($('ball-x').value)),
      bxMap01(1, parseFloat($('ball-y').value)),
      bxMap01(2, parseFloat($('ball-z').value)));
  }
  const r = bxDiag() * parseFloat($('ball-size').value) * 0.5;
  m.scale.set(r, r, r);
  ballGizmoSync();
}
// gizmo para arrastar a ball
const ballG = { ctl: null, dragging: false, want: false };
function ballGizmoSync() {
  if (!TransformControls || !viewer?.camera || !viewer?.renderer || !ball.mesh) return;
  let g = ballG.ctl;
  if (g && g.camera !== viewer.camera) { try { g.detach(); g.dispose(); g.parent?.remove(g); } catch(e){} g = ballG.ctl = null; }
  const want = ball.on && ballG.want;
  if (!want) { if (g) { g.detach(); g.visible = false; } return; }
  if (!g) {
    g = ballG.ctl = new TransformControls(viewer.camera, viewer.renderer.domElement);
    g.setSize(0.7);
    g.setMode('translate');
    g.addEventListener('dragging-changed', e => {
      ballG.dragging = e.value;
      if (viewer?.controls) viewer.controls.enabled = !e.value && !anim.paintMode;
      if (!e.value) refreshBall(); // soltou → atualiza o reflexo na nova posição
    });
    g.addEventListener('objectChange', () => {
      const mn = bbox ? bbox.min : [-2.5, -2.5, -2.5];
      const ex = bbox
        ? [bbox.max[0]-bbox.min[0] || 1, bbox.max[1]-bbox.min[1] || 1, bbox.max[2]-bbox.min[2] || 1]
        : [5, 5, 5];
      const mk = ball.mesh;
      [['ball-x','v-ballx',0], ['ball-y','v-bally',1], ['ball-z','v-ballz',2]].forEach(([sid, vid, k]) => {
        const f = (mk.position.getComponent(k) - mn[k]) / ex[k];
        $(sid).value = f;
        $(vid).textContent = Math.round(f*100) + '%';
      });
    });
    viewer.threeScene.add(g);
  }
  if (g.parent !== viewer.threeScene) viewer.threeScene.add(g);
  if (g.object !== ball.mesh) g.attach(ball.mesh);
  g.visible = true; g.enabled = true;
}''')
rep("  ball.cubeCam.position.copy(anchorWorld());",
"""  ball.mesh.getWorldPosition(ball.cubeCam.position);""")
rep('''  buildBallPalette();
}''',
'''  // aplica o reflexo no material (antes disso a ball fica cinza-cromada visível)
  if (ball.faces.length === 6) {
    const mt = ball.mesh.material;
    if (!mt.envMap) { mt.envMap = ball.cubeRT.texture; mt.color.set(0xffffff); mt.needsUpdate = true; }
  }
  buildBallPalette();
}''')
rep("bindSlider('ball-size', 'v-ballsize', v => v.toFixed(2), () => updateBall());",
"""bindSlider('ball-size', 'v-ballsize', v => v.toFixed(2), () => updateBall());
bindSlider('ball-x', 'v-ballx', v => Math.round(v*100)+'%', () => updateBall());
bindSlider('ball-y', 'v-bally', v => Math.round(v*100)+'%', () => updateBall());
bindSlider('ball-z', 'v-ballz', v => Math.round(v*100)+'%', () => updateBall());
$('ball-gizmo').addEventListener('click', () => {
  ballG.want = !ballG.want;
  $('ball-gizmo').classList.toggle('on', ballG.want);
  if (ballG.want && !ball.on) $('ball-toggle').click(); // liga a ball junto
  else updateBall();
});""")
rep('<p class="note">Esfera espelhada no Anchor Point refletindo a cena.',
    '<p class="note">Esfera espelhada refletindo a cena — posicione pelos sliders ou pelo gizmo (ela nasce no centro; começa cinza e ganha o reflexo ao Atualizar).')

p.write_text(s, encoding='utf-8')
print('OK r10', len(s))
