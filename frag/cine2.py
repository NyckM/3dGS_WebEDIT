import pathlib
p = pathlib.Path('index.html')
s = p.read_text(encoding='utf-8')
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, f'esperava {n}, achei {s.count(old)}: {old[:70]!r}'
    s = s.replace(old, new)

# ===== 1. Cinema tab primeiro =====
rep('''    <button class="fx-tab" data-tab="tab-vfx">🔮 VFX</button>
    <button class="fx-tab" data-tab="tab-cine">🎬 Cinema</button>''',
'''    <button class="fx-tab" data-tab="tab-cine">🎬 Cinema</button>
    <button class="fx-tab" data-tab="tab-vfx">🔮 VFX</button>''')

# ===== 2. Shader: flip vertical + novos uniforms (glow, pixelate, chroma global, dither modulation) =====
rep('uniform float uNoise, uChroma, uWarp, uUnsharp, uDither, uScan, uGrain, uHalation, uMode;',
    'uniform float uNoise, uChroma, uWarp, uUnsharp, uDither, uScan, uGrain, uHalation, uMode;\nuniform float uGlow, uPixel, uChromaAll, uDitherMod;')
rep('''  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 duv = uv;''',
'''  vec2 uv = gl_FragCoord.xy / uRes;
  uv.y = 1.0 - uv.y;                       // canvas WebGL vem invertido → corrige
  // pixelate / queda de resolução (VHS): amostra em blocos
  if (uPixel > 0.001){
    vec2 px = mix(uRes, uRes * mix(1.0, 0.12, uPixel), 1.0);
    uv = (floor(uv * px) + 0.5) / px;
  }
  vec2 duv = uv;''')
# chroma total: soma a aberração global à do VHS
rep('  float ca = uChroma * 0.006;',
    '  float ca = uChroma * 0.006 + uChromaAll * 0.010;')
# glow (todos os modos): bloom das altas luzes, antes do output
rep('''  // vinheta suave
  float vig = smoothstep(1.15, 0.35, length(uv-0.5)*1.3);''',
'''  // glow / bloom (todos os modos): espalha as altas luzes
  if (uGlow > 0.001){
    vec2 px = 3.0/uRes;
    vec3 g2 = vec3(0.0);
    for (int i=-2;i<=2;i++) for (int j=-2;j<=2;j++)
      g2 += texture(uTex, duv + vec2(float(i),float(j))*px).rgb;
    g2 /= 25.0;
    float lum = max(max(g2.r,g2.g),g2.b);
    col += g2 * smoothstep(0.55,1.0,lum) * uGlow * 1.4;
  }
  // dither modulation (VHS): padrão de dither que oscila no tempo
  if (uDitherMod > 0.001){
    float bay = mod(floor(gl_FragCoord.x)+floor(gl_FragCoord.y)+floor(uTime*8.0), 2.0);
    col += (bay-0.5) * uDitherMod * 0.06;
    col = floor(col*24.0 + 0.5)/24.0;
  }
  // vinheta suave
  float vig = smoothstep(1.15, 0.35, length(uv-0.5)*1.3);''')

# ===== 3. cinePostTick: registra e alimenta os novos uniforms =====
rep("CINE.u = { tex:U('uTex'), res:U('uRes'), time:U('uTime'), noise:U('uNoise'),\n    chroma:U('uChroma'), warp:U('uWarp'), unsharp:U('uUnsharp'), dither:U('uDither'),\n    scan:U('uScan'), grain:U('uGrain'), halation:U('uHalation'), mode:U('uMode') };",
    "CINE.u = { tex:U('uTex'), res:U('uRes'), time:U('uTime'), noise:U('uNoise'),\n    chroma:U('uChroma'), warp:U('uWarp'), unsharp:U('uUnsharp'), dither:U('uDither'),\n    scan:U('uScan'), grain:U('uGrain'), halation:U('uHalation'), mode:U('uMode'),\n    glow:U('uGlow'), pixel:U('uPixel'), chromaAll:U('uChromaAll'), ditherMod:U('uDitherMod') };")
# some vhs branch: after setting uHalation, add pixel/dithermod; and global glow/chroma for both
rep('''    gl.uniform1f(CINE.u.grain, 0.0);
    gl.uniform1f(CINE.u.halation, 0.0);
    gl.uniform1f(CINE.u.mode, 1.0);
  } else { // cinema''',
'''    gl.uniform1f(CINE.u.grain, 0.0);
    gl.uniform1f(CINE.u.halation, 0.0);
    gl.uniform1f(CINE.u.pixel, g('vhs-pixel')*str);
    gl.uniform1f(CINE.u.ditherMod, g('vhs-dithermod')*str);
    gl.uniform1f(CINE.u.mode, 1.0);
  } else { // cinema''')
rep('''    gl.uniform1f(CINE.u.grain, g('cin-grain')*str);
    gl.uniform1f(CINE.u.halation, g('cin-halation')*str);
    gl.uniform1f(CINE.u.mode, 2.0);
  }
  gl.drawArrays(gl.TRIANGLES, 0, 3);''',
'''    gl.uniform1f(CINE.u.grain, g('cin-grain')*str);
    gl.uniform1f(CINE.u.halation, g('cin-halation')*str);
    gl.uniform1f(CINE.u.pixel, 0.0);
    gl.uniform1f(CINE.u.ditherMod, 0.0);
    gl.uniform1f(CINE.u.mode, 2.0);
  }
  // pós global (todos os modos): aberração cromática + glow
  gl.uniform1f(CINE.u.chromaAll, g('post-chroma'));
  gl.uniform1f(CINE.u.glow, g('post-glow'));
  gl.drawArrays(gl.TRIANGLES, 0, 3);''')
# habilita o pós global também no modo phone (que antes saía cedo)
rep("  if (CINE.mode === 'off' || CINE.mode === 'phone') { $('postfx-canvas').classList.remove('visible'); return; }",
    "  if (CINE.mode === 'off') { $('postfx-canvas').classList.remove('visible'); return; }")
# no modo phone, zera os efeitos específicos e usa só o pós global
rep("""  const g = id => $(id) ? parseFloat($(id).value) : 0;
  const str = g('cine-strength');
  if (CINE.mode === 'vhs') {""",
"""  const g = id => $(id) ? parseFloat($(id).value) : 0;
  const str = g('cine-strength');
  if (CINE.mode === 'phone') {
    ['noise','chroma','warp','unsharp','dither','scan','grain','halation','pixel','ditherMod'].forEach(k => gl.uniform1f(CINE.u[k], 0.0));
    gl.uniform1f(CINE.u.mode, 3.0);
    gl.uniform1f(CINE.u.chromaAll, g('post-chroma'));
    gl.uniform1f(CINE.u.glow, g('post-glow'));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return;
  }
  if (CINE.mode === 'vhs') {""")

p.write_text(s, encoding='utf-8')
print('OK cine2', len(s))
