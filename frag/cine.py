import pathlib
p = pathlib.Path('index.html')
s = p.read_text(encoding='utf-8')
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, f'esperava {n}, achei {s.count(old)}: {old[:70]!r}'
    s = s.replace(old, new)

# ===== CSS: canvas de pós-processo + barras de letterbox =====
rep('  #hint {',
'''  /* ===== modo Cinema: pós-processo + letterbox ===== */
  #postfx-canvas {
    position: fixed; inset: 0; z-index: 6; pointer-events: none; display: none;
    width: 100%; height: 100%;
  }
  #postfx-canvas.visible { display: block; }
  #letterbox { position: fixed; inset: 0; z-index: 7; pointer-events: none; display: none; }
  #letterbox.visible { display: block; }
  #letterbox .bar { position: absolute; left: 0; right: 0; background: #000; }
  #letterbox .bar.top { top: 0; } #letterbox .bar.bot { bottom: 0; }
  #letterbox .bar.lft { top: 0; bottom: 0; left: 0; } #letterbox .bar.rgt { top: 0; bottom: 0; right: 0; }
  #cine-badge {
    position: fixed; left: 14px; top: 12px; z-index: 8; display: none;
    font-family: 'Courier New', monospace; font-size: .72rem; color: #eee;
    background: rgba(0,0,0,.35); padding: 3px 10px; border-radius: 4px; pointer-events: none;
    letter-spacing: 1px;
  }
  #cine-badge.visible { display: block; }
  #cine-badge.rec::before { content: '● REC '; color: #f44; }
  #hint {''')

# ===== HTML: aba + overlays =====
rep('    <button class="fx-tab" data-tab="tab-vfx">🔮 VFX</button>',
'''    <button class="fx-tab" data-tab="tab-vfx">🔮 VFX</button>
    <button class="fx-tab" data-tab="tab-cine">🎬 Cinema</button>''')
rep('<div id="hint">arrastar: orbitar · scroll: zoom · botão direito: pan</div>',
'''<div id="hint">arrastar: orbitar · scroll: zoom · botão direito: pan</div>
<canvas id="postfx-canvas"></canvas>
<div id="letterbox"><div class="bar top"></div><div class="bar bot"></div><div class="bar lft"></div><div class="bar rgt"></div></div>
<div id="cine-badge"></div>''')

# painel da aba Cinema (inserido antes do bloco Gravação, que fica global no rodapé)
rep('  <h3>Gravação</h3>',
'''  <!-- ========== CINEMA ========== -->
  <div class="tab-page" id="tab-cine">
    <div class="axis-row"><span class="lbl">Câmera</span>
      <button class="ax-btn" id="cine-off">Off</button>
      <button class="ax-btn" id="cine-vhs">VHS</button>
      <button class="ax-btn" id="cine-cin">Cinema</button>
      <button class="ax-btn" id="cine-phone">Celular</button>
    </div>
    <div class="row"><label>Modelo</label><select class="au-sel" id="cine-model"></select></div>
    <div class="row"><label>Aspecto</label><select class="au-sel" id="cine-aspect"></select></div>

    <div id="cine-lens-row" class="row" style="display:none"><label>Lente</label><select class="au-sel" id="cine-lens"></select></div>
    <div id="cine-zoom-row" class="row" style="display:none"><label>Zoom</label><select class="au-sel" id="cine-zoom"></select></div>

    <h3 id="cine-look-h">Look</h3>
    <div class="row"><label>LUT / cor</label><select class="au-sel" id="cine-lut"></select></div>
    <div class="row"><label>Intensidade</label><input type="range" id="cine-strength" min="0" max="1.5" step="0.05" value="1"><span class="val" id="v-cinestrength">1.00</span></div>

    <div id="cine-vhs-box">
      <h3>Pós VHS</h3>
      <div class="row"><label>Ruído</label><input type="range" id="vhs-noise" min="0" max="1" step="0.02" value="0.35"><span class="val" id="v-vhsnoise">0.35</span></div>
      <div class="row"><label>Chroma</label><input type="range" id="vhs-chroma" min="0" max="1" step="0.02" value="0.4"><span class="val" id="v-vhschroma">0.40</span></div>
      <div class="row"><label>Distorção</label><input type="range" id="vhs-warp" min="0" max="1" step="0.02" value="0.3"><span class="val" id="v-vhswarp">0.30</span></div>
      <div class="row"><label>Unsharp</label><input type="range" id="vhs-unsharp" min="0" max="2" step="0.05" value="0.8"><span class="val" id="v-vhsunsharp">0.80</span></div>
      <div class="row"><label>Dither</label><input type="range" id="vhs-dither" min="0" max="1" step="0.02" value="0.5"><span class="val" id="v-vhsdither">0.50</span></div>
      <div class="row"><label>Scanlines</label><input type="range" id="vhs-scan" min="0" max="1" step="0.02" value="0.5"><span class="val" id="v-vhsscan">0.50</span></div>
      <button class="panel-btn" id="vhs-zoom">▶ Zoom automático (VHS)</button>
      <div class="row"><label>Vel. zoom</label><input type="range" id="vhs-zoomspd" min="-1" max="1" step="0.02" value="0.15"><span class="val" id="v-vhszoomspd">0.15</span></div>
    </div>

    <div id="cine-cin-box" style="display:none">
      <h3>Cinema</h3>
      <button class="panel-btn" id="cin-dof">▶ Desfoque de lente</button>
      <div class="row"><label>Foco (dist.)</label><input type="range" id="cin-focus" min="0.1" max="20" step="0.1" value="3"><span class="val" id="v-cinfocus">3.0</span></div>
      <div class="row"><label>Abertura</label><input type="range" id="cin-aperture" min="0.5" max="12" step="0.5" value="6"><span class="val" id="v-cinaperture">6.0</span></div>
      <div class="row"><label>Grão</label><input type="range" id="cin-grain" min="0" max="0.6" step="0.02" value="0.1"><span class="val" id="v-cingrain">0.10</span></div>
      <div class="row"><label>Halation</label><input type="range" id="cin-halation" min="0" max="1" step="0.02" value="0.25"><span class="val" id="v-cinhalation">0.25</span></div>
    </div>

    <p class="note" id="cine-note">Escolha um corpo de câmera para trocar a cara do splat ao vivo. A gravação MP4 captura o look aplicado.</p>
  </div>

  <h3>Gravação</h3>''')

p.write_text(s, encoding='utf-8')
print('OK cine html/css', len(s))
