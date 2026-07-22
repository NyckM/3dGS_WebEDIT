
// ============================================================
// 🎞 TIMELINE — keyframes para qualquer slider (efeitos + câmera)
// ============================================================
const TL = { keys: {}, time: 0, dur: 8, playing: false, rec: false, last: 0, layersOpen: false };
const tlNames = {
  'p-splatscale':'Tamanho splat','p-px':'Pos X','p-py':'Pos Y','p-pz':'Pos Z',
  'p-sx':'Escala X','p-sy':'Escala Y','p-sz':'Escala Z','p-ry':'Rotação Y','p-twist':'Rotação Z',
  'a-x':'Pivô X','a-y':'Pivô Y','a-z':'Pivô Z','cam-fov':'FOV',
  'wob-amp':'Wobble','rip-amp':'Ripple','wav-amp':'Waves','twi-amp':'Twist','ben-amp':'Bend',
  'tap-amp':'Taper','bul-amp':'Bulge','tur-amp':'Turbulência','tr-amt':'Rastro',
  'pl-str':'Luz pontual','cg-exp':'Exposição','cg-con':'Contraste','cg-sat':'Saturação',
  'd-dist':'DoF foco','d-blur':'DoF força','a-orbitspeed':'Órbita Y','cine-strength':'Cinema força',
  'post-bloom':'Bloom','post-vig':'Vinheta','post-tilt':'Tilt-shift','pmix':'Pontos Mix',
  'ball-size':'Ball tam.','mf-str':'Mouse força','vhs-noise':'VHS ruído','fog-near':'Névoa início'
};
const tlLabel = id => tlNames[id] || id;
function tlSetSlider(id, v){ const el=$(id); if(!el) return; el.value=v; el.dispatchEvent(new Event('input')); }
function tlKey(id, t, v){
  const arr = TL.keys[id] || (TL.keys[id]=[]);
  const i = arr.findIndex(k => Math.abs(k.t - t) < 0.02);
  if (i>=0) arr[i].v = v; else arr.push({t, v});
  arr.sort((a,b)=>a.t-b.t);
}
function tlValAt(id, t){
  const arr = TL.keys[id]; if(!arr||!arr.length) return null;
  if (t<=arr[0].t) return arr[0].v;
  if (t>=arr[arr.length-1].t) return arr[arr.length-1].v;
  for (let i=0;i<arr.length-1;i++){ if(t>=arr[i].t&&t<=arr[i+1].t){ const f=(t-arr[i].t)/((arr[i+1].t-arr[i].t)||1); return arr[i].v+(arr[i+1].v-arr[i].v)*f; } }
  return arr[arr.length-1].v;
}
function tlApply(t){ for(const id in TL.keys){ const v=tlValAt(id,t); if(v!==null) tlSetSlider(id,v); } }
document.addEventListener('input', e => {
  if (!TL.rec) return;
  const el = e.target;
  if (el && el.tagName==='INPUT' && el.type==='range' && el.id && el.id!=='tl-dur' && el.id.indexOf('tl-')!==0 && el.id.indexOf('rec-')!==0 && el.id!=='sq-fps') {
    tlKey(el.id, TL.time, parseFloat(el.value));
    tlRenderTrack();
  }
}, true);
function tlRenderTrack(){
  const track = $('tl-track');
  [...track.querySelectorAll('.tl-key')].forEach(k=>k.remove());
  const times = {};
  for (const id in TL.keys) for (const k of TL.keys[id]) times[Math.round(k.t*20)] = k.t;
  for (const key in times){ const t=times[key]; const d=document.createElement('div'); d.className='tl-key'; d.style.left=(t/TL.dur*100)+'%'; track.appendChild(d); }
  if (TL.layersOpen) tlRenderLayers();
}
function tlRenderLayers(){
  const box = $('tl-layers'); box.innerHTML='';
  for (const id in TL.keys){
    if (!TL.keys[id].length) continue;
    const row=document.createElement('div'); row.className='tl-layer';
    row.innerHTML = `<span class="nm">${tlLabel(id)}</span><div class="lane"></div><span class="del">✕</span>`;
    const lane = row.querySelector('.lane');
    TL.keys[id].forEach((k)=>{
      const dot=document.createElement('div'); dot.className='lk'; dot.style.left=(k.t/TL.dur*100)+'%';
      dot.addEventListener('pointerdown', ev=>{ ev.preventDefault(); const r=lane.getBoundingClientRect();
        const mv=e2=>{ let nt=Math.max(0,Math.min(TL.dur,(e2.clientX-r.left)/r.width*TL.dur)); k.t=nt; TL.keys[id].sort((a,b)=>a.t-b.t); dot.style.left=(nt/TL.dur*100)+'%'; tlRenderTrack(); };
        const up=()=>{ window.removeEventListener('pointermove',mv); window.removeEventListener('pointerup',up); };
        window.addEventListener('pointermove',mv); window.addEventListener('pointerup',up); });
      lane.appendChild(dot);
    });
    row.querySelector('.del').addEventListener('click', ()=>{ delete TL.keys[id]; tlRenderTrack(); tlRenderLayers(); });
    box.appendChild(row);
  }
}
function tlTick(now){
  if (TL.playing){
    const dt=(now-TL.last)/1000; TL.time+=dt;
    if (TL.time>=TL.dur){ TL.time=TL.dur; TL.playing=false; $('tl-play').textContent='▶'; }
    tlApply(TL.time);
  }
  TL.last=now;
  $('tl-play-head').style.left=(TL.time/TL.dur*100)+'%';
  $('tl-time').textContent = TL.time.toFixed(1)+' / '+TL.dur.toFixed(1)+'s';
  requestAnimationFrame(tlTick);
}
requestAnimationFrame(tlTick);
$('btn-timeline').addEventListener('click', ()=>{ $('timeline').classList.toggle('visible'); $('btn-timeline').classList.toggle('active'); });
$('tl-play').addEventListener('click', ()=>{ if(TL.time>=TL.dur) TL.time=0; TL.playing=!TL.playing; $('tl-play').textContent=TL.playing?'⏸':'▶'; });
$('tl-stop').addEventListener('click', ()=>{ TL.playing=false; TL.time=0; $('tl-play').textContent='▶'; tlApply(0); });
$('tl-rec').addEventListener('click', ()=>{ TL.rec=!TL.rec; $('tl-rec').classList.toggle('on',TL.rec); });
$('tl-dur').addEventListener('input', ()=>{ TL.dur=parseFloat($('tl-dur').value); tlRenderTrack(); });
$('tl-layers-btn').addEventListener('click', ()=>{ TL.layersOpen=!TL.layersOpen; $('tl-layers').classList.toggle('visible',TL.layersOpen); $('tl-layers-btn').classList.toggle('on',TL.layersOpen); if(TL.layersOpen) tlRenderLayers(); });
$('tl-clear').addEventListener('click', ()=>{ if(confirm('Apagar todos os keyframes?')){ TL.keys={}; tlRenderTrack(); tlRenderLayers(); } });
$('tl-track').addEventListener('pointerdown', e=>{ const r=$('tl-track').getBoundingClientRect();
  const scrub=ev=>{ TL.time=Math.max(0,Math.min(TL.dur,(ev.clientX-r.left)/r.width*TL.dur)); tlApply(TL.time); };
  scrub(e); const up=()=>{ window.removeEventListener('pointermove',scrub); window.removeEventListener('pointerup',up); };
  window.addEventListener('pointermove',scrub); window.addEventListener('pointerup',up); });
