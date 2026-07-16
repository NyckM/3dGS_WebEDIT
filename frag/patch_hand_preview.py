#!/usr/bin/env python3
# Aplica o box de preview da webcam com esqueleto da mão no index (versão Design Claude).
# Uso: python3 patch_hand_preview.py <index_entrada> <index_saida>
import sys, pathlib

src, dst = sys.argv[1], sys.argv[2]
s = pathlib.Path(src).read_text(encoding='utf-8')
assert len(s) > 100000, f'arquivo de entrada suspeito ({len(s)} bytes) — não aplicando'

def rep(old, new, n=1):
    global s
    assert s.count(old) == n, f'esperava {n}, achei {s.count(old)}: {old[:80]!r}'
    s = s.replace(old, new)

# ===== CSS =====
rep('  #hint {',
'''  /* ===== preview da mão (webcam) ===== */
  #hand-preview {
    position: fixed; right: 14px; bottom: 44px; z-index: 24;
    width: 200px; display: none; border-radius: 12px; overflow: hidden;
    border: 1px solid rgba(150,201,61,.5); background: #000;
    box-shadow: 0 4px 18px rgba(0,0,0,.5);
  }
  #hand-preview.visible { display: block; }
  #hand-preview video { display: block; width: 100%; transform: scaleX(-1); }
  #hand-preview canvas { position: absolute; inset: 0; width: 100%; height: 100%; transform: scaleX(-1); pointer-events: none; }
  #hand-preview .hp-label {
    position: absolute; top: 6px; left: 8px; font-size: .62rem; color: var(--verde);
    background: rgba(13,10,18,.55); padding: 2px 8px; border-radius: 999px; pointer-events: none;
  }
  #hint {''')

# ===== HTML =====
rep('<div id="hint">arrastar: orbitar · scroll: zoom · botão direito: pan</div>',
'''<div id="hint">arrastar: orbitar · scroll: zoom · botão direito: pan</div>
<div id="hand-preview">
  <video id="hp-video" autoplay muted playsinline></video>
  <canvas id="hp-canvas"></canvas>
  <span class="hp-label">🖐 mão · pinça = agir</span>
</div>''')

# ===== JS: vídeo no box =====
rep('''    hand.video = document.createElement('video');
    hand.video.muted = true; hand.video.playsInline = true;
    hand.stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
    hand.video.srcObject = hand.stream;
    await hand.video.play();
    hand.on = true;''',
'''    hand.video = $('hp-video');
    hand.stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
    hand.video.srcObject = hand.stream;
    await hand.video.play();
    $('hand-preview').classList.add('visible');
    const hpc = $('hp-canvas');
    hpc.width = hand.video.videoWidth || 640;
    hpc.height = hand.video.videoHeight || 480;
    hand.on = true;''')
rep('''  hand.stream = null; hand.video = null;''',
'''  hand.stream = null; hand.video = null;
  $('hand-preview').classList.remove('visible');
  const hpc0 = $('hp-canvas');
  if (hpc0) hpc0.getContext('2d').clearRect(0, 0, hpc0.width, hpc0.height);''')

# ===== JS: esqueleto da mão =====
rep('function tickHand() {',
'''// esqueleto da mão no preview (roxo = solta, verde = pinçando)
const HP_CONN = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],
                 [9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
function drawHandPreview(lms, pinch) {
  const cv = $('hp-canvas');
  if (!cv || !cv.width) return;
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, cv.width, cv.height);
  if (!lms) return;
  const col = pinch ? '#96c93d' : '#b064c4';
  ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (const [a, b] of HP_CONN) {
    ctx.beginPath();
    ctx.moveTo(lms[a].x * cv.width, lms[a].y * cv.height);
    ctx.lineTo(lms[b].x * cv.width, lms[b].y * cv.height);
    ctx.stroke();
  }
  ctx.fillStyle = '#fff';
  for (const l of lms) { ctx.beginPath(); ctx.arc(l.x * cv.width, l.y * cv.height, 3.5, 0, 6.2832); ctx.fill(); }
  const t = lms[8], th = lms[4]; // linha indicador–polegar (a pinça)
  ctx.lineWidth = pinch ? 6 : 2;
  ctx.beginPath();
  ctx.moveTo(t.x * cv.width, t.y * cv.height);
  ctx.lineTo(th.x * cv.width, th.y * cv.height);
  ctx.stroke();
}
function tickHand() {''')
rep('''    if (uP) uP.value.set(1e9, 1e9, 1e9);
    if (hand.pinch) { hand.pinch = false; grabEnd(); }
    return;''',
'''    if (uP) uP.value.set(1e9, 1e9, 1e9);
    if (hand.pinch) { hand.pinch = false; grabEnd(); }
    drawHandPreview(null, false);
    return;''')
rep("  const pinch = Math.hypot(tip.x - th.x, tip.y - th.y) < 0.06;",
"""  const pinch = Math.hypot(tip.x - th.x, tip.y - th.y) < 0.06;
  drawHandPreview(lms, pinch);""")

pathlib.Path(dst).write_text(s, encoding='utf-8')
print('OK', dst, len(s), 'bytes')
