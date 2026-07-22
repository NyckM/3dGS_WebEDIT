
// ============================================================
// 🌐 Idioma PT-BR / EN — troca os rótulos visíveis por dicionário
// ============================================================
const I18N = {
  // topbar / splash
  '✦ Editar':'✦ Edit', '⏺ Gravar MP4':'⏺ Record MP4', 'Importar outro':'Import another',
  'Importar Gaussians':'Import Gaussians',
  // abas
  '✂️ Editar':'✂️ Edit','🌀 Distorção':'🌀 Distortion','🎥 Câmera':'🎥 Camera',
  '💡 Luz/Cor':'💡 Light/Color','✨ Transição':'✨ Transition','🧪 Diversos':'🧪 Misc',
  '🕹 Interativo':'🕹 Interactive','🔮 VFX':'🔮 VFX','🎬 Cinema':'🎬 Cinema',
  // seções comuns (h3/h4)
  'Tamanho do splat':'Splat size','Posição dos Gaussians':'Gaussian position',
  'Escala / Rotação (no pivô)':'Scale / Rotation (pivot)','Anchor Point (pivô)':'Anchor Point (pivot)',
  'Crop (box 3D)':'Crop (3D box)','Lente':'Lens','Órbita X / Y / Z':'Orbit X / Y / Z',
  'Vertigo (dolly zoom)':'Vertigo (dolly zoom)','Dolly':'Dolly','Tilt':'Tilt',
  'Handheld (shake)':'Handheld (shake)','Aberração cromática':'Chromatic aberration',
  'Correção de cor / LUT':'Color grading / LUT','Luz pontual (point light)':'Point light',
  'Relight (2 luzes + sombra)':'Relight (2 lights + shadow)','Desfoque de fundo (DoF)':'Background blur (DoF)',
  'Dissolve (difusão)':'Dissolve (diffuse)','Reveal':'Reveal','Fumaça (difusão global)':'Smoke (global diffuse)',
  'Dissolve (escala)':'Dissolve (scale)','Weather (clima)':'Weather','Pontos P&B':'B&W points',
  'Pontos por profundidade':'Points by depth','Paint (pincel)':'Paint (brush)','Time Slice (4D)':'Time Slice (4D)',
  '🎵 Audio reactive':'🎵 Audio reactive','Rastro (atraso por partícula)':'Trail (per-particle delay)',
  '🔮 Ball Chrome / HDRI':'🔮 Chrome Ball / HDRI','🔤 Texto 3D (splats)':'🔤 3D Text (splats)',
  '🖱 Mouse como força':'🖱 Mouse as force','🎹 MIDI':'🎹 MIDI','🖐 Mão (webcam)':'🖐 Hand (webcam)',
  'Gravação':'Recording','Look':'Look','Pós VHS':'VHS post','Cinema':'Cinema',
  // labels frequentes
  'Tamanho':'Size','Pos X':'Pos X','Pos Y':'Pos Y','Pos Z':'Pos Z',
  'Escala X':'Scale X','Escala Y':'Scale Y','Escala Z':'Scale Z',
  'Rotação Y':'Rotation Y','Rotação Z':'Rotation Z','Rot X':'Rot X','Rot Y':'Rot Y','Rot Z':'Rot Z',
  'Pivô X':'Pivot X','Pivô Y':'Pivot Y','Pivô Z':'Pivot Z','Raio':'Radius',
  'Amplitude':'Amplitude','Freq.':'Freq.','Velocidade':'Speed','Frequência':'Frequency',
  'Intensidade':'Intensity','Duração':'Duration','Cor':'Color','Foco (dist.)':'Focus (dist.)',
  'Faixa nítida':'Sharp range','Exposição':'Exposure','Contraste':'Contrast','Saturação':'Saturation',
  'Temperatura':'Temperature','Tint':'Tint','Ambiente':'Ambient','Sombra':'Shadow','Azimute':'Azimuth',
  'Altura':'Height','Alcance':'Range','Início':'Start','Fim':'End','Quantidade':'Amount','Reação':'Reaction',
  'Graves':'Bass','Médios':'Mids','Agudos':'Treble','Trim início':'Trim start','Trim fim':'Trim end',
  'Resolução':'Resolution','Bitrate':'Bitrate','Eixos':'Axes','Eixo':'Axis','Modo':'Mode',
  'Câmera':'Camera','Modelo':'Model','Aspecto':'Aspect','Zoom':'Zoom','LUT / cor':'LUT / color',
  'Ruído':'Noise','Chroma':'Chroma','Distorção':'Distortion','Unsharp':'Unsharp','Dither':'Dither',
  'Scanlines':'Scanlines','Vel. zoom':'Zoom speed','Desfoque de lente':'Lens blur','Abertura':'Aperture',
  'Grão':'Grain','Halation':'Halation','Curvatura':'Curvature','Afunilar':'Taper','Vel X':'Speed X',
  'Vel Y':'Speed Y','Vel Z':'Speed Z','Texto':'Text','Fonte':'Font','Estilo':'Style','Profundidade':'Depth',
  'Densidade':'Density','Baixas':'Lows','Altas':'Highs','Atraso':'Delay','Rate (Hz)':'Rate (Hz)',
  'Profund.':'Depth','Onda':'Wave','Alvo':'Target','Força':'Force','Cor perto':'Near color','Cor longe':'Far color',
  'Deslocar':'Shift','FOV':'FOV',
  // botões comuns
  'Resetar transformações':'Reset transforms','▶ Crop radial no pivô':'▶ Radial crop at pivot',
  '🎯 Resetar câmera (posição inicial)':'🎯 Reset camera (initial)','Off':'Off',
  'Aplicar (permanente)':'Apply (permanent)','Resetar':'Reset','🎬 Cine':'🎬 Cine',
  '🕹 Gizmo da luz (arrastar)':'🕹 Light gizmo (drag)','🕹 Gizmo da ball (arrastar)':'🕹 Ball gizmo (drag)',
  '🔄 Atualizar reflexo':'🔄 Update reflection','📤 Exportar 360':'📤 Export 360',
  '✨ Gerar texto 3D':'✨ Generate 3D text','💾 Baixar .splat':'💾 Download .splat',
  'Limpar pinceladas':'Clear strokes','🖌 Modo pincel':'🖌 Brush mode','Repele':'Repel','Atrai':'Attract',
  'Puxar':'Pull','Ativar MIDI':'Enable MIDI','🎹 Ativar MIDI':'🎹 Enable MIDI','Mapear (mexa um knob)':'Map (turn a knob)',
  'Limpar':'Clear','🖐 Controlar com a mão':'🖐 Control with hand','Zoom automático (VHS)':'Auto zoom (VHS)',
  '▶ Zoom automático (VHS)':'▶ Auto zoom (VHS)','▶ Desfoque de lente':'▶ Lens blur',
  'Janela':'Window'
};
const I18N_REV = Object.fromEntries(Object.entries(I18N).map(([k,v]) => [v,k]));
let bxLang = 'pt';
function bxTranslateNode(root, dict) {
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let n; while ((n = walk.nextNode())) nodes.push(n);
  for (const t of nodes) {
    const raw = t.nodeValue, key = raw.trim();
    if (!key) continue;
    if (dict[key]) t.nodeValue = raw.replace(key, dict[key]);
  }
  // também traduz <option> e placeholders/valores dinâmicos são recriados no toggle das abas
  root.querySelectorAll('option').forEach(o => { if (dict[o.textContent.trim()]) o.textContent = dict[o.textContent.trim()]; });
}
function bxSetLang(lang) {
  if (lang === bxLang) return;
  const dict = lang === 'en' ? I18N : I18N_REV;
  ['topbar','panel','dropzone','seqbar'].forEach(id => { const el = $(id); if (el) bxTranslateNode(el, dict); });
  bxLang = lang;
  $('btn-lang').textContent = lang === 'en' ? '🌐 PT' : '🌐 EN';
}
