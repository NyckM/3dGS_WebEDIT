import pathlib
p = pathlib.Path('index.html')
s = p.read_text(encoding='utf-8')
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, f'esperava {n}, achei {s.count(old)}: {old[:90]!r}'
    s = s.replace(old, new)

# ============ 1. iOS / mobile ============
rep("let viewer = null;",
"""// iOS/Safari tem limitações com SharedArrayBuffer nos workers e meia-precisão na GPU
const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const IS_MOBILE = IS_IOS || /Android/i.test(navigator.userAgent);
let viewer = null;""")
rep("const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });",
    "const renderer = new THREE.WebGLRenderer({ antialias: !IS_MOBILE, preserveDrawingBuffer: true });")
rep("renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));",
    "renderer.setPixelRatio(IS_MOBILE ? 1 : Math.min(window.devicePixelRatio || 1, 2));")
rep("""    sharedMemoryForWorkers: !!window.crossOriginIsolated,
    gpuAcceleratedSort: !!window.crossOriginIsolated,""",
"""    sharedMemoryForWorkers: !IS_IOS && !!window.crossOriginIsolated,
    gpuAcceleratedSort: !IS_IOS && !!window.crossOriginIsolated,""")
rep("    antialiased: true,",
"""    antialiased: !IS_MOBILE,
    halfPrecisionCovariancesOnGPU: !IS_IOS,  // iOS tem artefatos/erros com half precision""")
rep("    integerBasedSort: false,         // sort em float: menos \"estalos\" ao girar",
    "    integerBasedSort: IS_IOS,        // iOS: sort inteiro (mais compatível); desktop: float")
rep("""function handleFiles(files) {
  const arr = [...files];""",
"""function handleFiles(files) {
  const arr = [...files];
  if (IS_MOBILE) {
    const tot = arr.reduce((a, f) => a + (f.size || 0), 0);
    if (tot > 120e6) showError('Arquivo grande para celular (' + (tot/1e6).toFixed(0) + 'MB) — pode faltar memória. Se falhar, teste uma cena menor.');
  }""")

# ============ 2. Exemplos na tela inicial ============
rep('''<a class="btn ghost" href="criar.html">📖 Ver guia passo a passo</a>''',
'''<a class="btn ghost" href="criar.html">📖 Ver guia passo a passo</a>
            <button class="btn ghost" id="btn-ex0">🎁 Exemplo 1 — testar sem ter splat</button>
            <button class="btn ghost" id="btn-ex1">🎁 Exemplo 2 — testar sem ter splat</button>''')
rep("// ===== ?url= =====",
"""// ===== Cenas de exemplo =====
// EDITE AQUI: URLs das suas duas cenas (repo do GitHub se <100MB, ou Hugging Face:
// https://huggingface.co/<usuario>/<repo>/resolve/main/<arquivo>.splat )
const EXAMPLE_SCENES = [
  { id: 'btn-ex0', url: 'COLE_AQUI_A_URL_DA_CENA_1.splat' },
  { id: 'btn-ex1', url: 'COLE_AQUI_A_URL_DA_CENA_2.splat' }
];
async function loadExample(url) {
  if (!/^https?:\\/\\//.test(url)) { showError('Exemplo ainda não configurado — edite EXAMPLE_SCENES no index.html com as URLs das cenas.'); return; }
  try {
    dropzone.classList.add('hidden');
    loading.classList.add('visible');
    loadingText.textContent = 'Baixando cena de exemplo…';
    const r = await fetch(url);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const buf = await r.arrayBuffer();
    const name = (url.split('/').pop() || 'exemplo.splat').split('?')[0];
    handleFiles([new File([buf], name)]);
  } catch (e) {
    loading.classList.remove('visible');
    dropzone.classList.remove('hidden');
    showError('Não deu para baixar o exemplo: ' + (e.message || e));
  }
}
EXAMPLE_SCENES.forEach(ex => $(ex.id)?.addEventListener('click', () => loadExample(ex.url)));

// ===== ?url= =====""")

# ============ 3. Criar como overlay (sem sair da página) ============
rep("  /* ================= LOADING / ERRO ================= */",
"""  /* ===== overlay da página Criar ===== */
  #criar-overlay { position: fixed; inset: 0; z-index: 70; display: none; background: rgba(10,9,18,.97); }
  #criar-overlay.visible { display: block; }
  #criar-frame { width: 100%; height: 100%; border: 0; }
  #criar-close {
    position: absolute; top: 12px; right: 14px; z-index: 71;
    background: var(--roxo); color: #fff; border: 1px solid var(--roxo-claro);
    border-radius: 999px; padding: 8px 18px; cursor: pointer; font-size: .85rem;
  }

  /* ================= LOADING / ERRO ================= */""")
rep('<div id="hint">arrastar: orbitar · scroll: zoom · botão direito: pan</div>',
'''<div id="hint">arrastar: orbitar · scroll: zoom · botão direito: pan</div>
<div id="criar-overlay">
  <button id="criar-close">✕ Fechar</button>
  <iframe id="criar-frame" title="Criar meu splat"></iframe>
</div>''')
rep("// Os links do Colab agora vivem na página-guia criar.html (envelope amigável).",
"""// A página Criar abre como overlay dentro do viewer (sem sair da página).
document.querySelectorAll('a[href=\"criar.html\"]').forEach(function (a) {
  a.addEventListener('click', function (e) {
    e.preventDefault();
    document.getElementById('criar-frame').src = 'criar.html';
    document.getElementById('criar-overlay').classList.add('visible');
  });
});
document.getElementById('criar-close').addEventListener('click', function () {
  document.getElementById('criar-overlay').classList.remove('visible');
  document.getElementById('criar-frame').src = '';
});""")

# ============ 4. Ball Chrome / HDRI / paleta ============
rep('''    <p class="note">Relight aproximado (sem normais reais — usa direção radial).</p>''',
'''    <p class="note">Relight aproximado (sem normais reais — usa direção radial).</p>

    <h3>🔮 Ball Chrome / HDRI</h3>
    <button class="panel-btn" id="ball-toggle">▶ Ball chrome</button>
    <div class="row"><label>Tamanho</label><input type="range" id="ball-size" min="0.02" max="0.5" step="0.005" value="0.12"><span class="val" id="v-ballsize">0.12</span></div>
    <div class="btn-pair">
      <button class="panel-btn" id="ball-update">🔄 Atualizar reflexo</button>
      <button class="panel-btn" id="ball-export">📤 Exportar 360</button>
    </div>
    <div id="ball-pal" style="display:flex; gap:6px; margin:8px 0; flex-wrap:wrap;"></div>
    <p class="note">Esfera espelhada no Anchor Point refletindo a cena. "Exportar 360" gera um PNG equiretangular 2048×1024 para usar como HDRI; a paleta traz as cores dominantes da luz (clique para copiar o hex).</p>''')
rep('''// ============================================================
// EFEITOS DE TRANSIÇÃO (todos partem do Anchor Point)''',
'''// ============================================================
// 🔮 BALL CHROME — esfera espelhada + export 360 (HDRI) + paleta de luz
// ============================================================
const ball = { on: false, mesh: null, cubeRT: null, cubeCam: null, tmpScene: null, faces: null };
const BALL_FACE = 256;
function ensureBall() {
  if (!viewer?.splatMesh) return null;
  if (!ball.mesh) {
    ball.cubeRT = new THREE.WebGLCubeRenderTarget(BALL_FACE, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
    ball.cubeCam = new THREE.CubeCamera(0.01, 1000, ball.cubeRT);
    ball.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 48, 32),
      new THREE.MeshBasicMaterial({ envMap: ball.cubeRT.texture, transparent: true, depthTest: false, depthWrite: false }));
    ball.mesh.renderOrder = 9960;
    ball.tmpScene = new THREE.Scene();
  }
  if (ball.mesh.parent !== viewer.splatMesh) { try { ball.mesh.parent?.remove(ball.mesh); } catch(e){} viewer.splatMesh.add(ball.mesh); }
  return ball.mesh;
}
function updateBall() {
  if (!ball.on) { if (ball.mesh) ball.mesh.visible = false; return; }
  const m = ensureBall();
  if (!m) return;
  m.visible = true;
  m.position.copy(getAnchor());
  const r = bxDiag() * parseFloat($('ball-size').value) * 0.5;
  m.scale.set(r, r, r);
}
function refreshBall() {
  if (!viewer?.renderer || !viewer?.splatMesh || !ball.cubeCam) return;
  const sm = viewer.splatMesh;
  const m = ball.mesh;
  m.visible = false;
  const prevParent = sm.parent;
  ball.tmpScene.add(sm); // renderiza os splats numa cena temporária (6 faces do cubo)
  ball.cubeCam.position.copy(anchorWorld());
  try { ball.cubeCam.update(viewer.renderer, ball.tmpScene); }
  catch (e) { console.warn('ball chrome:', e); }
  if (prevParent) prevParent.add(sm); else ball.tmpScene.remove(sm);
  m.visible = ball.on;
  // captura os pixels das 6 faces (para o 360 e a paleta)
  const S = BALL_FACE;
  ball.faces = [];
  const buf = new Uint8Array(S * S * 4);
  for (let f = 0; f < 6; f++) {
    try { viewer.renderer.readRenderTargetPixels(ball.cubeRT, 0, 0, S, S, buf, f); } catch (e) { break; }
    ball.faces.push(Uint8Array.from(buf));
  }
  buildBallPalette();
}
function buildBallPalette() {
  const cont = $('ball-pal');
  if (!cont || !ball.faces || ball.faces.length < 6) return;
  const hist = new Map();
  for (const face of ball.faces) {
    for (let i = 0; i < face.length; i += 64) { // amostragem esparsa
      const r = face[i], g = face[i+1], b = face[i+2];
      if (r + g + b < 45) continue; // ignora quase-preto
      const key = ((r>>4)<<8) | ((g>>4)<<4) | (b>>4);
      const e = hist.get(key) || [0, 0, 0, 0];
      e[0]++; e[1]+=r; e[2]+=g; e[3]+=b;
      hist.set(key, e);
    }
  }
  const top = [...hist.values()].sort((a, b) => b[0] - a[0]).slice(0, 6);
  cont.innerHTML = '';
  for (const e of top) {
    const r = Math.round(e[1]/e[0]), g = Math.round(e[2]/e[0]), b = Math.round(e[3]/e[0]);
    const hex = '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
    const sw = document.createElement('div');
    sw.title = hex + ' (clique para copiar)';
    sw.style.cssText = `width:34px;height:26px;border-radius:6px;cursor:pointer;border:1px solid rgba(255,255,255,.25);background:${hex}`;
    sw.addEventListener('click', () => { try { navigator.clipboard.writeText(hex); showError('Copiado: ' + hex); } catch(e){} });
    cont.appendChild(sw);
  }
}
function exportBall360() {
  if (!ball.on || !ball.faces || ball.faces.length < 6) { showError('Ligue a Ball chrome e atualize o reflexo primeiro.'); return; }
  const S = BALL_FACE, W = 2048, H = 1024;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(W, H);
  const o = img.data;
  for (let y = 0; y < H; y++) {
    const lat = Math.PI / 2 - (y / H) * Math.PI;
    const cl = Math.cos(lat), sl = Math.sin(lat);
    for (let x = 0; x < W; x++) {
      const lon = (x / W) * 2 * Math.PI - Math.PI;
      const dx = cl * Math.sin(lon), dy = sl, dz = cl * Math.cos(lon);
      const ax = Math.abs(dx), ay = Math.abs(dy), az = Math.abs(dz);
      let f, sc, tc, ma;
      if (ax >= ay && ax >= az) { f = dx > 0 ? 0 : 1; ma = ax; sc = dx > 0 ? -dz : dz; tc = -dy; }
      else if (ay >= az)        { f = dy > 0 ? 2 : 3; ma = ay; sc = dx;             tc = dy > 0 ? dz : -dz; }
      else                      { f = dz > 0 ? 4 : 5; ma = az; sc = dz > 0 ? dx : -dx; tc = -dy; }
      const u = Math.min(S-1, Math.max(0, Math.round(((sc/ma + 1) / 2) * (S-1))));
      const v = Math.min(S-1, Math.max(0, Math.round(((tc/ma + 1) / 2) * (S-1))));
      const src = ((S - 1 - v) * S + u) * 4; // readPixels vem de baixo para cima
      const dst = (y * W + x) * 4;
      const face = ball.faces[f];
      o[dst] = face[src]; o[dst+1] = face[src+1]; o[dst+2] = face[src+2]; o[dst+3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  cv.toBlob(b => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = 'bruxos_hdri_360.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
}
bindSlider('ball-size', 'v-ballsize', v => v.toFixed(2), () => updateBall());
$('ball-toggle').addEventListener('click', () => {
  ball.on = !ball.on;
  $('ball-toggle').classList.toggle('on', ball.on);
  $('ball-toggle').textContent = ball.on ? '⏸ Ball chrome (ligada)' : '▶ Ball chrome';
  updateBall();
  if (ball.on) setTimeout(refreshBall, 100);
});
$('ball-update').addEventListener('click', () => { if (ball.on) refreshBall(); else showError('Ligue a Ball chrome primeiro.'); });
$('ball-export').addEventListener('click', () => { refreshBall(); exportBall360(); });

// ============================================================
// EFEITOS DE TRANSIÇÃO (todos partem do Anchor Point)''')
rep("""  else bxUpdateGizmo(null, null, -1);
  updateLightGizmo();
}""",
"""  else bxUpdateGizmo(null, null, -1);
  updateLightGizmo();
  updateBall();
}""")

p.write_text(s, encoding='utf-8')
print('OK r9', len(s))
