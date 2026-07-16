import pathlib
p = pathlib.Path('index.html')
s = p.read_text(encoding='utf-8')
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, f'esperava {n}, achei {s.count(old)}: {old[:80]!r}'
    s = s.replace(old, new)

# ===== HTML: gerador de texto 3D na aba VFX =====
rep('''    <p class="note">Esfera espelhada refletindo a cena — posicione pelos sliders ou pelo gizmo (ela nasce no centro; começa cinza e ganha o reflexo ao Atualizar). "Exportar 360" gera um PNG equiretangular 2048×1024 para usar como HDRI; a paleta traz as cores dominantes da luz (clique para copiar o hex).</p>''',
'''    <p class="note">Esfera espelhada refletindo a cena — posicione pelos sliders ou pelo gizmo (ela nasce no centro; começa cinza e ganha o reflexo ao Atualizar). "Exportar 360" gera um PNG equiretangular 2048×1024 para usar como HDRI; a paleta traz as cores dominantes da luz (clique para copiar o hex).</p>

    <h3>🔤 Texto 3D (splats)</h3>
    <div class="row"><label>Texto</label><input type="text" id="t3-text" value="BRUXOS" maxlength="40" style="flex:1; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.15); color:#eee; border-radius:6px; padding:6px 8px; font-size:.85rem;"></div>
    <div class="row"><label>Fonte</label><select class="au-sel" id="t3-font">
      <option value="Impact" selected>Impact (bold)</option>
      <option value="Arial">Arial</option>
      <option value="Georgia">Georgia (serifada)</option>
      <option value="'Courier New'">Courier (mono)</option>
      <option value="'Brush Script MT'">Script (sistema)</option>
      <option value="Bangers">Bangers ★</option>
      <option value="Monoton">Monoton ★</option>
      <option value="Pacifico">Pacifico ★</option>
      <option value="'Press Start 2P'">Press Start 2P ★</option>
      <option value="Poppins">Poppins ★</option>
    </select></div>
    <div class="row"><label>Estilo</label><select class="au-sel" id="t3-style">
      <option value="solid">Sólido</option>
      <option value="outline">Contorno (oco)</option>
    </select></div>
    <div class="row"><label>Profundidade</label><input type="range" id="t3-depth" min="0.02" max="0.8" step="0.01" value="0.22"><span class="val" id="v-t3depth">0.22</span></div>
    <div class="row"><label>Densidade</label><input type="range" id="t3-dens" min="0.3" max="1" step="0.05" value="0.6"><span class="val" id="v-t3dens">0.60</span></div>
    <div class="row"><label>Cor A (topo)</label><input type="color" id="t3-c1" value="#96c93d" style="flex:1; height:26px; background:none; border:none; cursor:pointer;"></div>
    <div class="row"><label>Cor B (base)</label><input type="color" id="t3-c2" value="#7b2d8e" style="flex:1; height:26px; background:none; border:none; cursor:pointer;"></div>
    <div class="btn-pair">
      <button class="panel-btn" id="t3-make">✨ Gerar texto 3D</button>
      <button class="panel-btn" id="t3-save">💾 Baixar .splat</button>
    </div>
    <p class="note">Gera o texto como splats de verdade (fontes ★ baixam do Google Fonts). Abre como cena nova — todos os efeitos, áudio e gravação funcionam nele. O .splat baixado pode ser reaberto ou combinado depois.</p>''')

# ===== JS: gerador =====
rep('''// ============================================================
// EFEITOS DE TRANSIÇÃO (todos partem do Anchor Point)''',
'''// ============================================================
// 🔤 TEXTO 3D — gera um .splat procedural a partir de texto + fonte
// ============================================================
const t3Loaded = new Set();
const T3_GFONTS = { 'Bangers':'Bangers', 'Monoton':'Monoton', 'Pacifico':'Pacifico',
                    'Press Start 2P':'Press+Start+2P', 'Poppins':'Poppins:wght@700' };
let t3LastBuffer = null;
async function t3EnsureFont(fontSel) {
  const name = fontSel.replace(/['"]/g, '').split(',')[0].trim();
  if (T3_GFONTS[name] && !t3Loaded.has(name)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=' + T3_GFONTS[name] + '&display=swap';
    document.head.appendChild(link);
    try { await document.fonts.load("700 200px '" + name + "'", 'ABgq'); } catch (e) {}
    t3Loaded.add(name);
  }
}
async function t3Generate() {
  const text = ($('t3-text').value || 'BRUXOS').slice(0, 40);
  const font = $('t3-font').value;
  const outline = $('t3-style').value === 'outline';
  const depth = parseFloat($('t3-depth').value);
  const dens = parseFloat($('t3-dens').value);
  await t3EnsureFont(font);
  // desenha o texto num canvas
  const FS = 220;
  const cv = document.createElement('canvas');
  let ctx = cv.getContext('2d');
  ctx.font = '700 ' + FS + 'px ' + font;
  const tw = Math.ceil(ctx.measureText(text).width);
  cv.width = Math.min(tw + 80, 4000);
  cv.height = FS + 120;
  ctx = cv.getContext('2d');
  ctx.font = '700 ' + FS + 'px ' + font;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#fff';
  if (outline) { ctx.lineWidth = Math.max(6, FS * 0.05); ctx.strokeText(text, 40, cv.height / 2); }
  else ctx.fillText(text, 40, cv.height / 2);
  const img = ctx.getImageData(0, 0, cv.width, cv.height).data;
  const W = cv.width, H = cv.height;
  const at = (x, y) => (x >= 0 && y >= 0 && x < W && y < H) ? img[(y * W + x) * 4 + 3] : 0;
  // amostragem: passo menor = mais denso
  const step = Math.max(2, Math.round(7 - dens * 5));
  const wpp = 2.0 / H;                       // altura do texto ≈ 2 unidades de mundo
  const depthW = depth * 2.0;                // profundidade em unidades de mundo
  const layers = Math.max(2, Math.round(depthW / (wpp * step)));
  const c1 = new THREE.Color($('t3-c1').value), c2 = new THREE.Color($('t3-c2').value);
  const pts = [];
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      if (at(x, y) < 128) continue;
      // borda? (vizinho vazio) → coluna inteira; interior → só frente e trás (casca: bem mais leve)
      const edge = at(x - step, y) < 128 || at(x + step, y) < 128 || at(x, y - step) < 128 || at(x, y + step) < 128;
      const t = y / H;
      const r = Math.round((c1.r + (c2.r - c1.r) * t) * 255);
      const g = Math.round((c1.g + (c2.g - c1.g) * t) * 255);
      const b = Math.round((c1.b + (c2.b - c1.b) * t) * 255);
      for (let L = 0; L < layers; L++) {
        if (!edge && L > 0 && L < layers - 1) continue;
        const z = (L / Math.max(layers - 1, 1) - 0.5) * depthW;
        const shade = 1 - Math.abs(z) / Math.max(depthW, 0.001) * 0.25; // leve sombreado na lateral
        pts.push([
          (x - W / 2) * wpp + (Math.random() - 0.5) * wpp * step * 0.3,
          (y - H / 2) * wpp + (Math.random() - 0.5) * wpp * step * 0.3,
          z + (Math.random() - 0.5) * wpp * step * 0.3,
          Math.min(255, r * shade), Math.min(255, g * shade), Math.min(255, b * shade)
        ]);
        if (pts.length > 900000) break;
      }
    }
  }
  if (pts.length < 10) { showError('Não deu para gerar — texto vazio ou fonte não carregou.'); return null; }
  // escreve o buffer .splat (32 bytes por splat)
  const buf = new ArrayBuffer(pts.length * 32);
  const f32 = new Float32Array(buf), u8 = new Uint8Array(buf);
  const sc = wpp * step * 0.75;
  for (let i = 0; i < pts.length; i++) {
    const o = i * 8, ob = i * 32, pt = pts[i];
    f32[o] = pt[0]; f32[o + 1] = pt[1]; f32[o + 2] = pt[2];
    f32[o + 3] = sc; f32[o + 4] = sc; f32[o + 5] = sc;
    u8[ob + 24] = pt[3]; u8[ob + 25] = pt[4]; u8[ob + 26] = pt[5]; u8[ob + 27] = 255;
    u8[ob + 28] = 255; u8[ob + 29] = 128; u8[ob + 30] = 128; u8[ob + 31] = 128; // rotação identidade
  }
  return buf;
}
$('t3-make').addEventListener('click', async () => {
  $('t3-make').textContent = '⏳ Gerando…';
  try {
    const buf = await t3Generate();
    if (buf) {
      t3LastBuffer = buf;
      showError(`Texto 3D gerado: ${(buf.byteLength / 32 / 1000).toFixed(0)}k splats — carregando…`);
      seq = null;
      $('seqbar').classList.remove('visible');
      await loadFile(new File([buf], 'texto3d.splat'));
    }
  } catch (e) { showError('Erro ao gerar texto: ' + (e.message || e)); }
  $('t3-make').textContent = '✨ Gerar texto 3D';
});
$('t3-save').addEventListener('click', () => {
  if (!t3LastBuffer) { showError('Gere um texto primeiro.'); return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([t3LastBuffer]));
  a.download = 'bruxos_texto3d.splat';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
});
bindSlider('t3-depth', 'v-t3depth', v => v.toFixed(2), () => {});
bindSlider('t3-dens', 'v-t3dens', v => v.toFixed(2), () => {});

// ============================================================
// EFEITOS DE TRANSIÇÃO (todos partem do Anchor Point)''')

p.write_text(s, encoding='utf-8')
print('OK r11', len(s))
