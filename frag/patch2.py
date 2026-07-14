#!/usr/bin/env python3
import pathlib, sys

OUT = pathlib.Path('/sessions/nice-friendly-galileo/mnt/outputs')
FRAG = OUT / 'frag'
s = (OUT / 'index.html').read_text(encoding='utf-8')
frag = lambda n: (FRAG / n).read_text(encoding='utf-8')

def rep(old, new, n=1):
    global s
    assert s.count(old) == n, f'esperava {n}, achei {s.count(old)}: {old[:70]!r}'
    s = s.replace(old, new)

# 1. imports dos módulos extra (gizmo + linhas grossas), com fallback
rep("""import * as THREE from 'three';
""", """import * as THREE from 'three';

// módulos extras (gizmo 3D + linhas grossas dos boxes) — com fallback se o CDN falhar
const THREE_EX = 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/';
let TransformControls = null, LineSegments2 = null, LineSegmentsGeometry = null, LineMaterial = null;
try { ({ TransformControls } = await import(THREE_EX + 'controls/TransformControls.js')); }
catch (e) { console.warn('Bruxos: gizmo indisponível:', e); }
try {
  ({ LineSegments2 } = await import(THREE_EX + 'lines/LineSegments2.js'));
  ({ LineSegmentsGeometry } = await import(THREE_EX + 'lines/LineSegmentsGeometry.js'));
  ({ LineMaterial } = await import(THREE_EX + 'lines/LineMaterial.js'));
} catch (e) { console.warn('Bruxos: linhas grossas indisponíveis, usando linhas simples:', e); }
""")

# 2. move o DoF da aba Luz/Cor para a aba Câmera
DOF = """    <h3>Desfoque de fundo (DoF)</h3>
    <button class="panel-btn" id="d-toggle">▶ Desfoque</button>
    <div class="row"><label>Foco (dist.)</label><input type="range" id="d-dist" min="0.1" max="20" step="0.1" value="3"><span class="val" id="v-ddist">3.0</span></div>
    <div class="row"><label>Faixa nítida</label><input type="range" id="d-range" min="0.1" max="10" step="0.1" value="1.5"><span class="val" id="v-drange">1.5</span></div>
    <div class="row"><label>Intensidade</label><input type="range" id="d-blur" min="0.5" max="12" step="0.5" value="6"><span class="val" id="v-dblur">6.0</span></div>
"""
rep('\n' + DOF, '\n')  # remove da aba Luz/Cor
rep("""<span class="val" id="v-hhfreq">2.0</span></div>
  </div>

  <!-- ========== ILUMINAÇÃO / COR ========== -->""",
    """<span class="val" id="v-hhfreq">2.0</span></div>

""" + DOF + """  </div>

  <!-- ========== ILUMINAÇÃO / COR ========== -->""")

GZROW = """    <div class="axis-row"><span class="lbl">Gizmo</span>
      <button class="ax-btn gz-mode on" data-mode="translate">Mover</button>
      <button class="ax-btn gz-mode" data-mode="rotate">Girar</button>
      <button class="ax-btn gz-mode" data-mode="scale">Escala</button>
    </div>
"""
# 3. gizmo: linha de modos no crop box
rep("""<button class="panel-btn" id="cb-toggle">▶ Crop box (ao vivo)</button>
""", """<button class="panel-btn" id="cb-toggle">▶ Crop box (ao vivo)</button>
""" + GZROW + """    <p class="note">Com o box ligado, arraste o gizmo 3D na cena (Mover/Girar/Escala) ou use os sliders.</p>
""")
# 4. gizmo: linha de modos na aba Distorção
rep("""    <div id="dist-container"></div>""", GZROW + """    <p class="note">O gizmo age no box em exibição (👁).</p>
    <div id="dist-container"></div>""")

# 5. helpers/gizmo novos (substitui bloco antigo de wireframes + updateBoxHelpers)
i = s.find('// wireframes: verde = crop box')
j = s.find('// sincroniza sliders do painel')
assert 0 < i < j, 'anchors dos helpers não encontrados'
s = s[:i] + frag('helpers2.frag') + s[j:]

# 6. resize: atualiza resolution das linhas grossas
rep("""window.addEventListener('resize', () => {
  if (!viewer?.renderer) return;""",
    """window.addEventListener('resize', () => {
  bxLineMats.forEach(m => m.resolution.set(window.innerWidth, window.innerHeight));
  if (!viewer?.renderer) return;""")

# 7. pincel bem menor (range e curva)
rep('<input type="range" id="pt-r" min="0.05" max="1" step="0.01" value="0.25"><span class="val" id="v-ptr">25%</span>',
    '<input type="range" id="pt-r" min="0.01" max="1" step="0.01" value="0.1"><span class="val" id="v-ptr">10%</span>')
rep("const r = bxDiag() * 0.12 * parseFloat($('pt-r').value);",
    "const r = bxDiag() * 0.06 * Math.pow(parseFloat($('pt-r').value), 1.35);")

(OUT / 'index.html').write_text(s, encoding='utf-8')
print('OK', len(s), 'bytes')
