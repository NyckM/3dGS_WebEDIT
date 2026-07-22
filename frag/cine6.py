import pathlib
p = pathlib.Path('index.html')
s = p.read_text(encoding='utf-8')
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, f'esperava {n}, achei {s.count(old)}: {old[:70]!r}'
    s = s.replace(old, new)

# ===== shader: uniforms grainSize + glitch + datamosh =====
rep('uniform float uGlow, uPixel, uChromaAll, uDitherMod, uCrt;',
    'uniform float uGlow, uPixel, uChromaAll, uDitherMod, uCrt;\nuniform float uGrainSize, uGlitch, uMosh;')
# glitch/datamosh: desloca blocos de linhas antes de amostrar (afeta duv)
rep('''  vec2 duv = uv;
  // distorção horizontal (jitter de linha) — VHS''',
'''  vec2 duv = uv;
  // GLITCH (celular): blocos de linhas saltam horizontalmente + faixas de cor
  if (uGlitch > 0.001){
    float band = floor(uv.y * 24.0);
    float t = floor(uTime * 8.0);
    float jump = h21(vec2(band, t));
    if (jump > 1.0 - uGlitch*0.6) duv.x += (h21(vec2(band, t+1.0))-0.5) * uGlitch * 0.3;
  }
  // DATAMOSH (celular): arrasta a imagem na direção de um "movimento" pseudo-aleatório
  if (uMosh > 0.001){
    vec2 mv = vec2(h21(vec2(floor(uv.y*12.0), floor(uTime*2.0)))-0.5,
                   h21(vec2(floor(uv.x*12.0), floor(uTime*2.0)+9.0))-0.5);
    duv += mv * uMosh * 0.08 * (0.5 + 0.5*sin(uTime*3.0 + uv.y*10.0));
  }
  // distorção horizontal (jitter de linha) — VHS''')
# grão com tamanho controlável (usa uGrainSize para escalar a célula do ruído)
rep('''  // grão / ruído
  float n = h21(uv*uRes + uTime*60.0) - 0.5;
  col += n * (uNoise*0.18 + uGrain*0.5);''',
'''  // grão / ruído (com tamanho de grão ajustável)
  float gsz = max(uGrainSize, 0.5);
  float n = h21(floor(gl_FragCoord.xy/gsz) + uTime*60.0) - 0.5;
  col += n * (uNoise*0.18 + uGrain*0.5);''')
# faixa de cor deslocada no glitch (depois do sample RGB)
rep('''  // unsharp (realce)''',
'''  // GLITCH: faixa de cor saltada
  if (uGlitch > 0.001){
    float band2 = floor(uv.y*24.0);
    if (h21(vec2(band2, floor(uTime*8.0)+5.0)) > 1.0 - uGlitch*0.4)
      col.rgb = col.gbr; // rotaciona canais na faixa
  }
  // unsharp (realce)''')
# registros
rep("glow:U('uGlow'), pixel:U('uPixel'), chromaAll:U('uChromaAll'), ditherMod:U('uDitherMod'), crt:U('uCrt') };",
    "glow:U('uGlow'), pixel:U('uPixel'), chromaAll:U('uChromaAll'), ditherMod:U('uDitherMod'), crt:U('uCrt'),\n    grainSize:U('uGrainSize'), glitch:U('uGlitch'), mosh:U('uMosh') };")
# VHS: grão sem tamanho especial (1), sem glitch/mosh
rep('''    gl.uniform1f(CINE.u.crt, g('vhs-crt')*str);
    gl.uniform1f(CINE.u.mode, 1.0);''',
'''    gl.uniform1f(CINE.u.crt, g('vhs-crt')*str);
    gl.uniform1f(CINE.u.grainSize, 1.0);
    gl.uniform1f(CINE.u.glitch, 0.0);
    gl.uniform1f(CINE.u.mosh, 0.0);
    gl.uniform1f(CINE.u.mode, 1.0);''')
# Cinema: grão com tamanho (cin-grainsize)
rep('''    gl.uniform1f(CINE.u.crt, g('cin-crt')*str);
    gl.uniform1f(CINE.u.mode, 2.0);''',
'''    gl.uniform1f(CINE.u.crt, g('cin-crt')*str);
    gl.uniform1f(CINE.u.grainSize, g('cin-grainsize'));
    gl.uniform1f(CINE.u.glitch, 0.0);
    gl.uniform1f(CINE.u.mosh, 0.0);
    gl.uniform1f(CINE.u.mode, 2.0);''')
# phone: glitch + datamosh (usa os sliders phone-*), grão base
rep("""    ['noise','chroma','warp','unsharp','dither','scan','grain','halation','pixel','ditherMod','crt'].forEach(k => gl.uniform1f(CINE.u[k], 0.0));
    gl.uniform1f(CINE.u.mode, 3.0);
    gl.uniform1f(CINE.u.chromaAll, g('post-chroma'));
    gl.uniform1f(CINE.u.glow, g('post-glow'));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return;""",
"""    ['noise','chroma','warp','unsharp','dither','scan','grain','halation','pixel','ditherMod','crt'].forEach(k => gl.uniform1f(CINE.u[k], 0.0));
    gl.uniform1f(CINE.u.grainSize, 1.0);
    gl.uniform1f(CINE.u.glitch, g('phone-glitch'));
    gl.uniform1f(CINE.u.mosh, g('phone-mosh'));
    gl.uniform1f(CINE.u.mode, 3.0);
    gl.uniform1f(CINE.u.chromaAll, g('post-chroma'));
    gl.uniform1f(CINE.u.glow, g('post-glow'));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return;""")
# habilita o postfx no modo phone (antes ele saía do cinePostTick cedo? já corrigido antes). Garante visible:
# (cinePostTick já mostra o canvas para !off)

# ===== HTML: tamanho de grão no Cinema + box de Celular (glitch/datamosh) =====
rep('''      <div class="row"><label>Grão</label><input type="range" id="cin-grain" min="0" max="0.6" step="0.02" value="0.1"><span class="val" id="v-cingrain">0.10</span></div>''',
'''      <div class="row"><label>Grão</label><input type="range" id="cin-grain" min="0" max="0.6" step="0.02" value="0.1"><span class="val" id="v-cingrain">0.10</span></div>
      <div class="row"><label>Tam. grão</label><input type="range" id="cin-grainsize" min="0.5" max="6" step="0.1" value="1.5"><span class="val" id="v-cingrainsize">1.5</span></div>''')
rep('''    <div id="cine-cin-box" style="display:none">''',
'''    <div id="cine-phone-box" style="display:none">
      <h3>Celular FX</h3>
      <button class="panel-btn" id="phone-glitch-on">▶ Glitch</button>
      <div class="row"><label>Glitch</label><input type="range" id="phone-glitch" min="0" max="1" step="0.02" value="0.4"><span class="val" id="v-phoneglitch">0.40</span></div>
      <button class="panel-btn" id="phone-mosh-on">▶ Datamosh</button>
      <div class="row"><label>Datamosh</label><input type="range" id="phone-mosh" min="0" max="1" step="0.02" value="0.4"><span class="val" id="v-phonemosh">0.40</span></div>
      <p class="note">Glitch salta blocos de linhas e rotaciona cores; Datamosh arrasta a imagem como compressão quebrada.</p>
    </div>
    <div id="cine-cin-box" style="display:none">''')
# mostra/esconde o box do celular no cineFill
rep('''  $('cine-vhs-box').style.display = 'none';
  $('cine-cin-box').style.display = 'none';''',
'''  $('cine-vhs-box').style.display = 'none';
  $('cine-cin-box').style.display = 'none';
  $('cine-phone-box').style.display = 'none';''')
rep('''    fill('cine-zoom', CINE_BODIES.phone.zooms);
    $('cine-zoom-row').style.display = '';
  }''',
'''    fill('cine-zoom', CINE_BODIES.phone.zooms);
    $('cine-zoom-row').style.display = '';
    $('cine-phone-box').style.display = '';
  }''')
# bindings
rep("['vhs-dithermod','vhs-pixel','vhs-crt','cin-dithermod','cin-pixel','cin-crt'].forEach(id => bindSlider(id, 'v-'+id.replace('-',''), v => v.toFixed(2), () => {}));",
"""['vhs-dithermod','vhs-pixel','vhs-crt','cin-dithermod','cin-pixel','cin-crt'].forEach(id => bindSlider(id, 'v-'+id.replace('-',''), v => v.toFixed(2), () => {}));
bindSlider('cin-grainsize', 'v-cingrainsize', v => v.toFixed(1), () => {});
['phone-glitch','phone-mosh'].forEach(id => bindSlider(id, 'v-'+id.replace('-',''), v => v.toFixed(2), () => {}));
$('phone-glitch-on').addEventListener('click', () => { const on = $('phone-glitch').value>0; $('phone-glitch').value = on?0:0.4; $('v-phoneglitch').textContent=(on?0:0.4).toFixed(2); $('phone-glitch-on').classList.toggle('on',!on); });
$('phone-mosh-on').addEventListener('click', () => { const on = $('phone-mosh').value>0; $('phone-mosh').value = on?0:0.4; $('v-phonemosh').textContent=(on?0:0.4).toFixed(2); $('phone-mosh-on').classList.toggle('on',!on); });""")

p.write_text(s, encoding='utf-8')
print('OK cine6', len(s))
