import pathlib
p = pathlib.Path('index.html')
s = p.read_text(encoding='utf-8')
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, f'esperava {n}, achei {s.count(old)}: {old[:70]!r}'
    s = s.replace(old, new)

# ===== shader: uniform uCrt + curvatura/máscara CRT =====
rep('uniform float uGlow, uPixel, uChromaAll, uDitherMod;',
    'uniform float uGlow, uPixel, uChromaAll, uDitherMod, uCrt;')
rep('''  uv.y = 1.0 - uv.y;                       // canvas WebGL vem invertido → corrige
  // pixelate / queda de resolução (VHS): amostra em blocos''',
'''  uv.y = 1.0 - uv.y;                       // canvas WebGL vem invertido → corrige
  // CRT: curvatura de tela (barrel) — encurva a imagem como um tubo
  float crtEdge = 1.0;
  if (uCrt > 0.001){
    vec2 cc = uv*2.0 - 1.0;
    float r2 = dot(cc,cc);
    cc *= 1.0 + uCrt*0.18*r2;
    uv = cc*0.5 + 0.5;
    crtEdge = (uv.x<0.0||uv.x>1.0||uv.y<0.0||uv.y>1.0) ? 0.0 : 1.0;
    uv = clamp(uv, 0.0, 1.0);
  }
  // pixelate / queda de resolução (VHS): amostra em blocos''')
rep('''  // vinheta suave
  float vig = smoothstep(1.15, 0.35, length(uv-0.5)*1.3);''',
'''  // CRT: máscara de abertura (faixas RGB) + scanline forte + cantos escuros
  if (uCrt > 0.001){
    float mx = mod(gl_FragCoord.x, 3.0);
    vec3 mask = mx < 1.0 ? vec3(1.0,0.7,0.7) : (mx < 2.0 ? vec3(0.7,1.0,0.7) : vec3(0.7,0.7,1.0));
    col *= mix(vec3(1.0), mask, uCrt*0.6);
    col *= mix(1.0, 0.6 + 0.4*sin(uv.y*uRes.y*3.14159*0.5), uCrt*0.5);
    col *= crtEdge;
  }
  // vinheta suave
  float vig = smoothstep(1.15, 0.35, length(uv-0.5)*1.3);''')
# registro do uniform
rep("glow:U('uGlow'), pixel:U('uPixel'), chromaAll:U('uChromaAll'), ditherMod:U('uDitherMod') };",
    "glow:U('uGlow'), pixel:U('uPixel'), chromaAll:U('uChromaAll'), ditherMod:U('uDitherMod'), crt:U('uCrt') };")
# VHS: também tem seu próprio CRT (do slider vhs-crt, opcional) — default 0
rep('''    gl.uniform1f(CINE.u.pixel, g('vhs-pixel')*str);
    gl.uniform1f(CINE.u.ditherMod, g('vhs-dithermod')*str);
    gl.uniform1f(CINE.u.mode, 1.0);''',
'''    gl.uniform1f(CINE.u.pixel, g('vhs-pixel')*str);
    gl.uniform1f(CINE.u.ditherMod, g('vhs-dithermod')*str);
    gl.uniform1f(CINE.u.crt, g('vhs-crt')*str);
    gl.uniform1f(CINE.u.mode, 1.0);''')
# Cinema: agora recebe pixel, dither modulation e CRT
rep('''    gl.uniform1f(CINE.u.pixel, 0.0);
    gl.uniform1f(CINE.u.ditherMod, 0.0);
    gl.uniform1f(CINE.u.mode, 2.0);
  }
  // pós global''',
'''    gl.uniform1f(CINE.u.pixel, g('cin-pixel')*str);
    gl.uniform1f(CINE.u.ditherMod, g('cin-dithermod')*str);
    gl.uniform1f(CINE.u.crt, g('cin-crt')*str);
    gl.uniform1f(CINE.u.mode, 2.0);
  }
  // pós global''')
# phone: zera crt também
rep("['noise','chroma','warp','unsharp','dither','scan','grain','halation','pixel','ditherMod'].forEach(k => gl.uniform1f(CINE.u[k], 0.0));",
    "['noise','chroma','warp','unsharp','dither','scan','grain','halation','pixel','ditherMod','crt'].forEach(k => gl.uniform1f(CINE.u[k], 0.0));")

# ===== HTML: CRT no VHS + Pixel/Dither modul/CRT no Cinema =====
rep('''      <div class="row"><label>Resolução ↓</label><input type="range" id="vhs-pixel" min="0" max="1" step="0.02" value="0.4"><span class="val" id="v-vhspixel">0.40</span></div>
      <button class="panel-btn" id="vhs-zoom">▶ Zoom automático (VHS)</button>''',
'''      <div class="row"><label>Resolução ↓</label><input type="range" id="vhs-pixel" min="0" max="1" step="0.02" value="0.4"><span class="val" id="v-vhspixel">0.40</span></div>
      <div class="row"><label>CRT</label><input type="range" id="vhs-crt" min="0" max="1" step="0.02" value="0"><span class="val" id="v-vhscrt">0.00</span></div>
      <button class="panel-btn" id="vhs-zoom">▶ Zoom automático (VHS)</button>''')
rep('''      <div class="row"><label>Halation</label><input type="range" id="cin-halation" min="0" max="1" step="0.02" value="0.25"><span class="val" id="v-cinhalation">0.25</span></div>
    </div>''',
'''      <div class="row"><label>Halation</label><input type="range" id="cin-halation" min="0" max="1" step="0.02" value="0.25"><span class="val" id="v-cinhalation">0.25</span></div>
      <div class="row"><label>Dither modul.</label><input type="range" id="cin-dithermod" min="0" max="1" step="0.02" value="0"><span class="val" id="v-cindithermod">0.00</span></div>
      <div class="row"><label>Pixel</label><input type="range" id="cin-pixel" min="0" max="1" step="0.02" value="0"><span class="val" id="v-cinpixel">0.00</span></div>
      <div class="row"><label>CRT</label><input type="range" id="cin-crt" min="0" max="1" step="0.02" value="0"><span class="val" id="v-cincrt">0.00</span></div>
    </div>''')
# bindings novos
rep("['vhs-dithermod','vhs-pixel'].forEach(id => bindSlider(id, 'v-'+id.replace('-',''), v => v.toFixed(2), () => {}));",
    "['vhs-dithermod','vhs-pixel','vhs-crt','cin-dithermod','cin-pixel','cin-crt'].forEach(id => bindSlider(id, 'v-'+id.replace('-',''), v => v.toFixed(2), () => {}));")

p.write_text(s, encoding='utf-8')
print('OK cine5', len(s))
