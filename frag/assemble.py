#!/usr/bin/env python3
import re, sys, pathlib

UP = pathlib.Path('/sessions/nice-friendly-galileo/mnt/uploads')
OUT = pathlib.Path('/sessions/nice-friendly-galileo/mnt/outputs')
FRAG = OUT / 'frag'

src = (UP / 'index.html').read_text(encoding='utf-8')
frag = lambda n: (FRAG / n).read_text(encoding='utf-8')

def replace_between(s, start, end, new, keep_start=False, keep_end=True):
    i = s.find(start)
    assert i >= 0, f'anchor start não encontrado: {start[:60]!r}'
    assert s.find(start, i+1) < 0, f'anchor start duplicado: {start[:60]!r}'
    j = s.find(end, i + len(start))
    assert j >= 0, f'anchor end não encontrado: {end[:60]!r}'
    pre = s[:i] + (start if keep_start else '')
    post = (end if keep_end else '') + s[j + len(end):]
    return pre + new + post

def replace_once(s, old, new):
    assert s.count(old) == 1, f'esperava 1 ocorrência, achei {s.count(old)}: {old[:60]!r}'
    return s.replace(old, new)

# 1. CSS novo antes do bloco LOADING
s = src
s = replace_once(s, '  /* ================= LOADING / ERRO ================= */',
                 frag('css.frag') + '  /* ================= LOADING / ERRO ================= */')

# 2. painel largura
s = replace_once(s, 'width: 290px; max-height:', 'width: 322px; max-height:')

# 3. painel HTML
s = replace_between(s, '<!-- ===== PAINEL ===== -->', '<!-- ===== LOADING / ERRO / HINT ===== -->',
                    '\n' + frag('panel.frag') + '\n', keep_start=False, keep_end=True)

# 4. GLSL + bxPatchShader
s = replace_between(s, 'const BX_UNIFORMS_GLSL = `', 'function bxU(name) {',
                    frag('glsl.frag'), keep_start=False, keep_end=True)

# 5. estado de animação
s = replace_between(s, '// estado de animação', 'let lastTime = performance.now();',
                    frag('anim.frag'), keep_start=False, keep_end=False)

# 6. syncFxUniforms
s = replace_between(s, '// sincroniza sliders do painel → uniforms do shader', 'async function loadFile(file) {',
                    frag('sync.frag') + '\n', keep_start=False, keep_end=True)

# 7. painel/transform bindings
s = replace_between(s, '// ===== Painel =====', '// --- crop: suporta .splat (32 bytes/splat) e .ply binário (3DGS padrão) ---',
                    frag('bind1.frag'), keep_start=False, keep_end=True)

# 8. crop UI
s = replace_between(s, "['xmin','xmax','ymin','ymax','zmin','zmax'].forEach(k => {", '// --- câmera / lente (FOV) ---',
                    frag('crop.frag'), keep_start=False, keep_end=True)

# 9. bindings principais (câmera → weather → pb)
s = replace_between(s, '// --- câmera / lente (FOV) ---', '// --- loop de animação próprio (wobble + dissolve + efeitos GPU) ---',
                    frag('bind2.frag') + '\n', keep_start=False, keep_end=False)
s = s.replace(frag('bind2.frag') + '\n' + 'function tick(now) {',
              frag('bind2.frag') + '\n// --- loop de animação (efeitos GPU + câmera) ---\nfunction tick(now) {')

# 10. tickBody + fim do loop
s = replace_between(s, 'function tickBody(now) {', 'requestAnimationFrame(tick);',
                    frag('tick.frag'), keep_start=False, keep_end=False)

# 11. record(): órbita via anim.recOrbit
s = replace_once(s, """  if (withOrbit && viewer?.controls) {
    viewer.controls.autoRotate = true;
    viewer.controls.autoRotateSpeed = parseFloat($('a-orbitspeed').value);
  }""", "  if (withOrbit) anim.recOrbit = true;")
s = replace_once(s, "    if (withOrbit && !anim.orbit && viewer?.controls) viewer.controls.autoRotate = false;",
                 "    if (withOrbit) anim.recOrbit = false;")

# 12. notas de crop
s = replace_once(s, "'Ajuste os limites e clique em <b>Aplicar crop</b>.'",
                 "'Ajuste o box 3D (verde) e aplique ao vivo ou permanente.'")
s = replace_once(s, "'Crop indisponível no modo sequência.'",
                 "'Crop permanente indisponível em sequência — use o Crop box ao vivo (GPU).'")

(OUT / 'index.html').write_text(s, encoding='utf-8')
print('OK, escrito', OUT / 'index.html', len(s), 'bytes')

# ===== VERIFICAÇÃO =====
# a) todos os $('id') e getElementById existem no HTML (fora os gerados dinamicamente)
html_ids = set(re.findall(r'id="([^"]+)"', s))
dyn_prefixes = tuple(f'{p}-' for p in ['wob','rip','wav','twi','ben','tap','bul'])
missing = []
for m in re.findall(r"\$\('([^']+)'\)", s) + re.findall(r"getElementById\('([^']+)'\)", s):
    if m in html_ids: continue
    if m.startswith(dyn_prefixes) or m.startswith('v-'): continue
    missing.append(m)
if missing:
    print('IDs FALTANDO:', sorted(set(missing))); sys.exit(1)
print('IDs ok')

# b) uniforms usados no GLSL estão declarados e registrados
glsl = frag('glsl.frag')
used = set(re.findall(r'uBx\w+', glsl))
decl = set(re.findall(r'uniform\s+\w+\s+(uBx\w+)', glsl))
reg = set(re.findall(r'(uBx\w+):\s*\{', glsl))
und = {u for u in used if u not in decl}
if und: print('uniforms usados sem declaração:', sorted(und)); sys.exit(1)
nreg = decl - reg
if nreg: print('uniforms declarados sem registro JS:', sorted(nreg)); sys.exit(1)
print('uniforms ok:', len(decl), 'declarados')
