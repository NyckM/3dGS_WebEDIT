import pathlib
p = pathlib.Path('index.html')
s = p.read_text(encoding='utf-8')
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, f'esperava {n}, achei {s.count(old)}: {old[:70]!r}'
    s = s.replace(old, new)

# ===== CSS: dock lateral cinza quando Cinema ativo =====
rep('  #hint {',
'''  /* ===== modo Cinema: painel vira dock lateral em escala de cinza ===== */
  body.cine-dock #panel {
    left: 0; right: auto; top: 0; bottom: 0; max-height: 100vh; height: 100vh;
    width: 300px; border-radius: 0; border-left: none; border-top: none; border-bottom: none;
    border-right: 1px solid #333; background: #14151a;
    /* recolore os acentos verde/roxo para escala de cinza */
    --verde: #d0d2d6; --roxo: #3a3d45; --roxo-claro: #565a63;
  }
  body.cine-dock #panel h3 { color: #cfd2d7; border-bottom-color: rgba(255,255,255,.06); }
  body.cine-dock #panel h4 { color: #b6b9bf; }
  body.cine-dock #panel .panel-btn.on { background: #4a4d55; border-color: #6b6f79; color: #fff; }
  body.cine-dock #panel .ax-btn.on { background: #cfd2d7; border-color: #cfd2d7; color: #14151a; }
  body.cine-dock #panel input[type=range]::-webkit-slider-thumb { background: #cfd2d7; }
  body.cine-dock #panel input[type=range]::-moz-range-thumb { background: #cfd2d7; }
  body.cine-dock #panel .val { color: #cfd2d7; }
  body.cine-dock #panel .fx-tab.active { background: #4a4d55; border-color: #6b6f79; }
  /* só a aba Cinema visível no dock (as outras somem para separar viewfinder do menu) */
  body.cine-dock #panel .fx-tabs { display: none; }
  #hint {''')

# ===== JS: alterna o dock quando muda o modo (dentro de cineApply) =====
rep("""function cineApply() {
  const m = CINE.mode;
  $('cine-badge').classList.toggle('visible', m !== 'off');""",
"""function cineApply() {
  const m = CINE.mode;
  const active = m !== 'off';
  document.body.classList.toggle('cine-dock', active);
  if (active) {
    // garante o painel aberto e na aba Cinema
    panel.classList.add('visible'); $('btn-panel').classList.add('active');
    document.querySelectorAll('.fx-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === 'tab-cine'));
    document.querySelectorAll('.tab-page').forEach(pg => pg.classList.toggle('visible', pg.id === 'tab-cine'));
  }
  $('cine-badge').classList.toggle('visible', m !== 'off');""")

p.write_text(s, encoding='utf-8')
print('OK cine4', len(s))
