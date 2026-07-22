import pathlib
p = pathlib.Path('index.html')
s = p.read_text(encoding='utf-8')
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, f'esperava {n}, achei {s.count(old)}: {old[:70]!r}'
    s = s.replace(old, new)

# ===== 1. novo uniform uBit + hash 3D para grão aleatório =====
rep('uniform float uGrainSize, uGlitch, uMosh;',
    'uniform float uGrainSize, uGlitch, uMosh, uBit;')
rep('float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }',
'''float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float h13(vec3 p){ p = fract(p*vec3(443.897,441.423,437.195)); p += dot(p, p.yzx+19.19); return fract((p.x+p.y)*p.z); }''')

# ===== 2. grão: ruído de verdade (aleatório por pixel, muda a cada frame) =====
rep('''  // grão / ruído (com tamanho de grão ajustável)
  float gsz = max(uGrainSize, 0.5);
  float n = h21(floor(gl_FragCoord.xy/gsz) + uTime*60.0) - 0.5;
  col += n * (uNoise*0.18 + uGrain*0.5);''',
'''  // grão / ruído — aleatório (hash 3D com semente de tempo), não padronizado
  float gsz = max(uGrainSize, 0.5);
  float n = h13(vec3(floor(gl_FragCoord.xy/gsz), fract(uTime)*971.0)) - 0.5;
  col += n * (uNoise*0.35 + uGrain*1.1);''')

# ===== 3. Modulation → linhas de VHS (bandas horizontais rolando) =====
rep('''  // dither modulation (VHS): padrão de dither que oscila no tempo
  if (uDitherMod > 0.001){
    float bay = mod(floor(gl_FragCoord.x)+floor(gl_FragCoord.y)+floor(uTime*8.0), 2.0);
    col += (bay-0.5) * uDitherMod * 0.06;
    col = floor(col*24.0 + 0.5)/24.0;
  }''',
'''  // modulação de linhas VHS: bandas horizontais claras/escuras que rolam pela tela
  if (uDitherMod > 0.001){
    float fine = sin(uv.y*uRes.y*0.5 - uTime*6.0);
    float band = sin(uv.y*16.0 + uTime*1.5);
    float drop = smoothstep(0.97, 1.0, h13(vec3(0.0, floor(uv.y*uRes.y*0.5), floor(uTime*10.0))));
    col *= 1.0 + uDitherMod * (fine*0.10 + band*0.07);
    col = mix(col, col*0.3, drop * uDitherMod);   // dropout ocasional de linha
  }''')

# ===== 4. 8-bit + dithering Bayer (todos os modos) — antes da vinheta =====
rep('''  // vinheta suave
  float vig = smoothstep(1.15, 0.35, length(uv-0.5)*1.3);''',
'''  // 8-bit: quantização com dithering ordenado (Bayer 4×4)
  if (uBit > 0.001){
    float levels = mix(64.0, 4.0, uBit);
    int bx = int(mod(gl_FragCoord.x, 4.0)), by = int(mod(gl_FragCoord.y, 4.0));
    float bayer[16] = float[16](0.,8.,2.,10., 12.,4.,14.,6., 3.,11.,1.,9., 15.,7.,13.,5.);
    float th = (bayer[by*4+bx]/16.0 - 0.5);
    col += th / levels;
    col = floor(col*levels + 0.5) / levels;
  }
  // vinheta suave
  float vig = smoothstep(1.15, 0.35, length(uv-0.5)*1.3);''')

# registro + defaults
rep("grainSize:U('uGrainSize'), glitch:U('uGlitch'), mosh:U('uMosh') };",
    "grainSize:U('uGrainSize'), glitch:U('uGlitch'), mosh:U('uMosh'), bit:U('uBit') };")
# feed uBit global (todos os modos) + phone-pixel
rep('''  // pós global (todos os modos): aberração cromática + glow
  gl.uniform1f(CINE.u.chromaAll, g('post-chroma'));
  gl.uniform1f(CINE.u.glow, g('post-glow'));
  gl.drawArrays(gl.TRIANGLES, 0, 3);''',
'''  // pós global (todos os modos): aberração cromática + glow + 8-bit
  gl.uniform1f(CINE.u.chromaAll, g('post-chroma'));
  gl.uniform1f(CINE.u.glow, g('post-glow'));
  gl.uniform1f(CINE.u.bit, g('post-bit'));
  gl.drawArrays(gl.TRIANGLES, 0, 3);''')
# phone branch: pixel + bit
rep('''    gl.uniform1f(CINE.u.glitch, g('phone-glitch'));
    gl.uniform1f(CINE.u.mosh, g('phone-mosh'));
    gl.uniform1f(CINE.u.mode, 3.0);
    gl.uniform1f(CINE.u.chromaAll, g('post-chroma'));
    gl.uniform1f(CINE.u.glow, g('post-glow'));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return;''',
'''    gl.uniform1f(CINE.u.glitch, g('phone-glitch'));
    gl.uniform1f(CINE.u.mosh, g('phone-mosh'));
    gl.uniform1f(CINE.u.pixel, g('phone-pixel'));
    gl.uniform1f(CINE.u.mode, 3.0);
    gl.uniform1f(CINE.u.chromaAll, g('post-chroma'));
    gl.uniform1f(CINE.u.glow, g('post-glow'));
    gl.uniform1f(CINE.u.bit, g('post-bit'));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return;''')

# ===== HTML: slider 8-bit no pós global + Pixel no box do celular =====
rep('''    <div class="row"><label>Glow</label><input type="range" id="post-glow" min="0" max="1" step="0.02" value="0.15"><span class="val" id="v-postglow">0.15</span></div>''',
'''    <div class="row"><label>Glow</label><input type="range" id="post-glow" min="0" max="1" step="0.02" value="0.15"><span class="val" id="v-postglow">0.15</span></div>
    <div class="row"><label>8-bit / dither</label><input type="range" id="post-bit" min="0" max="1" step="0.02" value="0"><span class="val" id="v-postbit">0.00</span></div>''')
rep('''      <div class="row"><label>Datamosh</label><input type="range" id="phone-mosh" min="0" max="1" step="0.02" value="0.4"><span class="val" id="v-phonemosh">0.40</span></div>''',
'''      <div class="row"><label>Datamosh</label><input type="range" id="phone-mosh" min="0" max="1" step="0.02" value="0.4"><span class="val" id="v-phonemosh">0.40</span></div>
      <div class="row"><label>Pixel</label><input type="range" id="phone-pixel" min="0" max="1" step="0.02" value="0"><span class="val" id="v-phonepixel">0.00</span></div>''')
# bindings
rep("['post-chroma','post-glow'].forEach(id => bindSlider(id, 'v-'+id.replace('-',''), v => v.toFixed(2), () => {}));",
    "['post-chroma','post-glow','post-bit'].forEach(id => bindSlider(id, 'v-'+id.replace('-',''), v => v.toFixed(2), () => {}));")
rep("['phone-glitch','phone-mosh'].forEach(id => bindSlider(id, 'v-'+id.replace('-',''), v => v.toFixed(2), () => {}));",
    "['phone-glitch','phone-mosh','phone-pixel'].forEach(id => bindSlider(id, 'v-'+id.replace('-',''), v => v.toFixed(2), () => {}));")

p.write_text(s, encoding='utf-8')
print('OK cine7', len(s))
