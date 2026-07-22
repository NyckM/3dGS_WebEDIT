import pathlib
p = pathlib.Path('index.html')
s = p.read_text(encoding='utf-8')
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, f'esperava {n}, achei {s.count(old)}: {old[:70]!r}'
    s = s.replace(old, new)

# ===== HTML: seção Pós (todos os modos) com aberração + glow, VHS resolução + dither modulation =====
rep('''    <div id="cine-vhs-box">
      <h3>Pós VHS</h3>''',
'''    <h3>Pós (todos os modos)</h3>
    <div class="row"><label>Aberração</label><input type="range" id="post-chroma" min="0" max="1" step="0.02" value="0.2"><span class="val" id="v-postchroma">0.20</span></div>
    <div class="row"><label>Glow</label><input type="range" id="post-glow" min="0" max="1" step="0.02" value="0.15"><span class="val" id="v-postglow">0.15</span></div>

    <div id="cine-vhs-box">
      <h3>Pós VHS (NTSC)</h3>''')
rep('''      <div class="row"><label>Scanlines</label><input type="range" id="vhs-scan" min="0" max="1" step="0.02" value="0.5"><span class="val" id="v-vhsscan">0.50</span></div>
      <button class="panel-btn" id="vhs-zoom">▶ Zoom automático (VHS)</button>''',
'''      <div class="row"><label>Scanlines</label><input type="range" id="vhs-scan" min="0" max="1" step="0.02" value="0.5"><span class="val" id="v-vhsscan">0.50</span></div>
      <div class="row"><label>Dither modul.</label><input type="range" id="vhs-dithermod" min="0" max="1" step="0.02" value="0.4"><span class="val" id="v-vhsdithermod">0.40</span></div>
      <div class="row"><label>Resolução ↓</label><input type="range" id="vhs-pixel" min="0" max="1" step="0.02" value="0.4"><span class="val" id="v-vhspixel">0.40</span></div>
      <button class="panel-btn" id="vhs-zoom">▶ Zoom automático (VHS)</button>''')

# ===== JS: LUT distinta por modelo de câmera =====
# adiciona campo lut em cada modelo VHS + mapa de tint por modelo
rep("""      { id:'jvc43', name:'JVC GR (4:3)', aspect:'4:3' },
      { id:'sonyhi8', name:'Sony Hi8', aspect:'4:3' },
      { id:'panvhsc', name:'Panasonic VHS-C', aspect:'4:3' },
      { id:'betamax', name:'Betamax', aspect:'4:3' }""",
"""      { id:'jvc43', name:'JVC GR (4:3)', aspect:'4:3', lut:'vhs' },
      { id:'sonyhi8', name:'Sony Hi8', aspect:'4:3', lut:'camcorder' },
      { id:'panvhsc', name:'Panasonic VHS-C', aspect:'4:3', lut:'vhsworn' },
      { id:'betamax', name:'Betamax', aspect:'4:3', lut:'beta' }""")
# LUT beta nova
rep("  bleach:      [1.08, 1.30, 0.55, 0.00, 0.00]\n};",
    "  bleach:      [1.08, 1.30, 0.55, 0.00, 0.00],\n  beta:        [0.98, 1.02, 0.90,-0.06, 0.06],\n  alexa_to:    [1.03, 1.18, 0.92, 0.10,-0.04]\n};")
# modelos cinema também com lut própria
rep("""    fill('cine-model', [{id:'alexa',name:'ARRI Alexa'},{id:'mini',name:'Alexa Mini'},{id:'venice',name:'Sony Venice'}]);""",
"""    fill('cine-model', [{id:'alexa',name:'ARRI Alexa',lut:'arri_to'},{id:'mini',name:'Alexa Mini',lut:'arri_natural'},{id:'venice',name:'Sony Venice',lut:'arri_log'}]);""")
# ao trocar de modelo, aplica a LUT padrão dele (mas o usuário ainda pode mudar manualmente)
rep("['cine-model','cine-aspect','cine-lens','cine-zoom','cine-lut'].forEach(id => $(id).addEventListener('change', cineApply));",
"""$('cine-model').addEventListener('change', () => {
  // cada câmera tem sua LUT característica
  const list = CINE.mode === 'vhs' ? CINE_BODIES.vhs.models
             : CINE.mode === 'cin' ? [{id:'alexa',lut:'arri_to'},{id:'mini',lut:'arri_natural'},{id:'venice',lut:'arri_log'}] : [];
  const md = list.find(m => m.id === $('cine-model').value);
  if (md && md.lut && $('cine-lut').querySelector(`option[value="${md.lut}"]`)) $('cine-lut').value = md.lut;
  cineApply();
});
['cine-aspect','cine-lens','cine-zoom','cine-lut'].forEach(id => $(id).addEventListener('change', cineApply));""")
# adiciona a LUT 'beta' à lista de LUTs VHS para poder ser selecionada
rep("""      { id:'vhs', name:'VHS clássico' },
      { id:'vhsworn', name:'VHS gasto (quente)' },
      { id:'camcorder', name:'Camcorder frio' }""",
"""      { id:'vhs', name:'VHS clássico' },
      { id:'vhsworn', name:'VHS gasto (quente)' },
      { id:'camcorder', name:'Camcorder frio' },
      { id:'beta', name:'Betamax (frio)' }""")
# bindings dos novos sliders
rep("bindSlider('vhs-zoomspd', 'v-vhszoomspd', v => v.toFixed(2), () => {});",
"""bindSlider('vhs-zoomspd', 'v-vhszoomspd', v => v.toFixed(2), () => {});
['vhs-dithermod','vhs-pixel'].forEach(id => bindSlider(id, 'v-'+id.replace('-',''), v => v.toFixed(2), () => {}));
['post-chroma','post-glow'].forEach(id => bindSlider(id, 'v-'+id.replace('-',''), v => v.toFixed(2), () => {}));""")

p.write_text(s, encoding='utf-8')
print('OK cine3', len(s))
