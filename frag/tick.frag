function tickBody(now) {
  const dt = (now - lastTime) / 1000; lastTime = now;
  // efeitos de câmera (órbita XYZ, vertigo, dolly, truck, tilt, shake)
  tickCamera(dt);
  // dissolve por escala
  if (anim.dissolve && viewer?.splatMesh) {
    const d = anim.dissolve;
    let t = Math.min(1, (now - d.start) / d.dur);
    const ease = t*t*(3-2*t);
    const s = d.dir === 'out' ? (1 - ease) : ease;
    viewer.splatMesh.setSplatScale(anim.splatScale * Math.max(0.0001, s));
    if (t >= 1) anim.dissolve = null;
  }
  // tempo global dos efeitos GPU
  anim.fxTime += dt;
  const uT = bxU('uBxTime'); if (uT) uT.value = anim.fxTime;
  // animação da fumaça
  if (anim.smoke) {
    const s = anim.smoke;
    let t = Math.min(1, (now - s.start) / s.dur);
    const ease = t*t*(3-2*t);
    const target = s.dir === 'out' ? 1 : 0;
    anim.smokeVal = s.from + (target - s.from) * ease;
    if (t >= 1) anim.smoke = null;
  }
  const uS = bxU('uBxSmoke'); if (uS) uS.value = anim.smokeVal;
  // animação do dissolve (difusão a partir do pivô)
  if (anim.disAnim) {
    const s = anim.disAnim;
    let t = Math.min(1, (now - s.start) / s.dur);
    const ease = t*t*(3-2*t);
    const target = s.dir === 'out' ? 1 : 0;
    anim.disVal = s.from + (target - s.from) * ease;
    if (t >= 1) anim.disAnim = null;
  }
  const uD = bxU('uBxDisT'); if (uD) uD.value = anim.disVal;
  // animação do reveal (pivô → bordas)
  if (anim.reveal) {
    const r = anim.reveal;
    let t = Math.min(1, (now - r.start) / r.dur);
    const ease = t*t*(3-2*t);
    const target = r.dir === 'in' ? 1 : 0;
    anim.revealVal = r.from + (target - r.from) * ease;
    if (t >= 1) anim.reveal = null;
  }
  const uR = bxU('uBxReveal'); if (uR) uR.value = anim.revealVal;
  tickWeather(dt); // partículas de neve/chuva
  // playback da sequência 4DGS
  if (seq && seq.playing) {
    if (anim.timeSlice) {
      anim.sliceAnim += dt * seq.fps / seq.count;
      const uSh = bxU('uBxSliceShift');
      if (uSh) uSh.value = parseFloat($('ts-shift').value) + anim.sliceAnim;
    } else {
      seq.timer += dt;
      const spf = 1 / seq.fps;
      while (seq.timer > spf) { seq.timer -= spf; setSeqFrame(seq.current + 1); }
    }
  }
}
requestAnimationFrame(tick);
