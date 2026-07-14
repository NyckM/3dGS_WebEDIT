const BX_UNIFORMS_GLSL = `
uniform float uBxTime;
uniform vec3 uBxAnchor;
uniform float uBxCropR;
// --- distorções (0 wobble, 1 ripple, 2 waves, 3 twist, 4 bend, 5 taper, 6 bulge) ---
uniform float uBxDOn[7];
uniform vec3  uBxDAxis[7];
uniform float uBxDAmp[7];
uniform float uBxDFreq[7];
uniform float uBxDSpeed[7];
uniform float uBxDRadius[7];
uniform float uBxDBoxOn[7];
uniform vec3  uBxDBoxPos[7];
uniform vec3  uBxDBoxInvHalf[7];
uniform mat3  uBxDBoxRot[7];
// --- crop box (ao vivo) ---
uniform float uBxCropBoxOn;
uniform vec3  uBxCropBoxPos;
uniform vec3  uBxCropBoxInvHalf;
uniform mat3  uBxCropBoxRot;
// --- fumaça / dissolve ---
uniform float uBxSmoke;
uniform float uBxSmokeDist;
uniform float uBxDisT;
uniform float uBxDisMax;
// --- relight ---
uniform float uBxLightOn;
uniform vec3 uBxLightDir;
uniform float uBxLightStrength;
uniform float uBxAmbient;
uniform vec3 uBxLightColor;
uniform float uBxLight2On;
uniform vec3 uBxLight2Dir;
uniform float uBxLight2Strength;
uniform vec3 uBxLight2Color;
uniform float uBxShadowHard;
// --- luz pontual ---
uniform float uBxPLOn;
uniform vec3 uBxPLPos;
uniform vec3 uBxPLColor;
uniform float uBxPLStr;
uniform float uBxPLRadius;
// --- DoF ---
uniform float uBxDofOn;
uniform float uBxFocusDist;
uniform float uBxFocusRange;
uniform float uBxBlurMax;
// --- reveal ---
uniform float uBxReveal;
uniform vec3 uBxRevealCenter;
uniform float uBxRevealMax;
// --- grading ---
uniform float uBxGradeOn;
uniform float uBxExposure;
uniform float uBxContrast;
uniform float uBxSaturation;
uniform float uBxTemp;
uniform float uBxTint;
// --- paint (pincel: até 64 esferas) ---
uniform float uBxPaintN;
uniform vec4 uBxPaintPosR[64];
uniform vec3 uBxPaintCol[64];
uniform float uBxPaintStrength;
// --- fog / profundidade / P&B ---
uniform float uBxFogOn;
uniform vec3 uBxFogColor;
uniform float uBxFogNear;
uniform float uBxFogFar;
uniform float uBxDepthOn;
uniform vec3 uBxDepthNearCol;
uniform vec3 uBxDepthFarCol;
uniform float uBxDepthNear;
uniform float uBxDepthFar;
uniform float uBxMono;
// --- bbox / time slice ---
uniform vec3 uBxBBMin;
uniform vec3 uBxBBMax;
uniform float uBxTimeSliceOn;
uniform float uBxSliceAxis;
uniform float uBxSliceInvert;
uniform float uBxSliceShift;
float bxFade = 1.0;
float bxHash(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7)))*43758.5453); }
vec3 bxRotAx(vec3 v, vec3 n, float a){ float c=cos(a), s=sin(a); return v*c + cross(n,v)*s + n*dot(n,v)*(1.0-c); }
vec3 bxAxisN(vec3 a){ return dot(a,a) < 0.25 ? vec3(0.0,1.0,0.0) : normalize(a); }
// máscara por efeito: esfera de raio no pivô × box orientado (bordas suaves)
float bxDMask(int i, vec3 p){
  float m = 1.0;
  float r = uBxDRadius[i];
  if (r > 0.0) m *= 1.0 - smoothstep(r*0.7, r, length(p - uBxAnchor));
  if (uBxDBoxOn[i] > 0.5) {
    vec3 q = abs(uBxDBoxRot[i] * (p - uBxDBoxPos[i])) * uBxDBoxInvHalf[i];
    m *= 1.0 - smoothstep(0.85, 1.0, max(q.x, max(q.y, q.z)));
  }
  return m;
}
vec3 bruxosPos(vec3 p){
  // 0 — WOBBLE: oscilação de escala nos eixos escolhidos
  if (uBxDOn[0] > 0.5) {
    float m = bxDMask(0, p);
    float o = sin(uBxTime * max(uBxDSpeed[0], 0.001) * 3.0 + dot(p - uBxAnchor, vec3(1.0)) * uBxDFreq[0] * 0.3);
    p += (p - uBxAnchor) * uBxDAxis[0] * (uBxDAmp[0] * 0.5 * o * m);
  }
  // 1 — RIPPLE: ondas radiais a partir do pivô, deslocando ao longo do eixo
  if (uBxDOn[1] > 0.5) {
    float m = bxDMask(1, p);
    vec3 n = bxAxisN(uBxDAxis[1]);
    vec3 rel = p - uBxAnchor;
    float d = length(rel - n * dot(rel, n));
    p += n * (uBxDAmp[1] * sin(d * uBxDFreq[1] - uBxTime * uBxDSpeed[1] * 3.0) * m);
  }
  // 2 — WAVES: distorção ondulante nos eixos escolhidos
  if (uBxDOn[2] > 0.5) {
    float m = bxDMask(2, p);
    float t2 = uBxTime * uBxDSpeed[2];
    p += m * uBxDAmp[2] * uBxDAxis[2] * vec3(
      sin(p.y * uBxDFreq[2] + t2),
      sin(p.z * uBxDFreq[2] * 0.8 + t2 * 1.13),
      sin(p.x * uBxDFreq[2] * 1.31 + t2 * 0.87));
  }
  // 3 — TWIST: torção em torno do eixo escolhido, no pivô
  if (uBxDOn[3] > 0.5) {
    float m = bxDMask(3, p);
    vec3 n = bxAxisN(uBxDAxis[3]);
    vec3 rel = p - uBxAnchor;
    float osc = uBxDSpeed[3] > 0.001 ? sin(uBxTime * uBxDSpeed[3]) : 1.0;
    float ang = uBxDAmp[3] * uBxDFreq[3] * dot(rel, n) * osc * m;
    p = uBxAnchor + bxRotAx(rel, n, ang);
  }
  // 4 — BEND: curvatura ao longo do eixo escolhido
  if (uBxDOn[4] > 0.5) {
    float m = bxDMask(4, p);
    vec3 n = bxAxisN(uBxDAxis[4]);
    vec3 h = abs(n.y) > 0.9 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
    vec3 b = normalize(cross(n, h));
    vec3 rel = p - uBxAnchor;
    float osc = uBxDSpeed[4] > 0.001 ? sin(uBxTime * uBxDSpeed[4]) : 1.0;
    float ang = uBxDAmp[4] * uBxDFreq[4] * dot(rel, n) * osc * m;
    p = uBxAnchor + bxRotAx(rel, b, ang);
  }
  // 5 — TAPER: afunila perpendicular ao eixo escolhido
  if (uBxDOn[5] > 0.5) {
    float m = bxDMask(5, p);
    vec3 n = bxAxisN(uBxDAxis[5]);
    vec3 rel = p - uBxAnchor;
    float span = dot(abs(n), max(uBxBBMax - uBxBBMin, vec3(0.0001)));
    float tt = clamp(dot(rel, n) * uBxDFreq[5] / span + 0.5, 0.0, 1.0);
    float amp5 = uBxDSpeed[5] > 0.001 ? mix(1.0, uBxDAmp[5], 0.5 + 0.5 * sin(uBxTime * uBxDSpeed[5])) : uBxDAmp[5];
    float f = mix(1.0, amp5, tt * m);
    vec3 along = n * dot(rel, n);
    p = uBxAnchor + along + (rel - along) * f;
  }
  // 6 — BULGE: inflar/encolher radial no pivô (gaussiano)
  if (uBxDOn[6] > 0.5) {
    float m = bxDMask(6, p);
    vec3 rel = p - uBxAnchor;
    float d = length(rel) + 0.0001;
    float r6 = uBxDRadius[6] > 0.0 ? uBxDRadius[6] : uBxRevealMax * 0.3;
    float osc = uBxDSpeed[6] > 0.001 ? sin(uBxTime * uBxDSpeed[6]) : 1.0;
    float f = uBxDAmp[6] * exp(-(d*d) / (r6*r6*0.35)) * osc * m;
    p += (rel * uBxDAxis[6]) / d * (f * r6 * 0.5);
  }
  // fumaça (difusão global do centro para fora)
  if (uBxSmoke > 0.001) {
    vec3 d = p - sceneCenter;
    float r = length(d) + 0.0001;
    vec3 dir = d / r;
    float n1 = bxHash(p*13.7);
    vec3 turb = vec3(bxHash(p*7.1)-0.5, bxHash(p*9.3)-0.5, bxHash(p*11.9)-0.5)*2.0;
    float s = uBxSmoke*uBxSmoke;
    p += dir * s * uBxSmokeDist * (0.5 + n1) + turb * s * uBxSmokeDist * 0.35;
    p.y -= s * uBxSmokeDist * 0.5 * n1;
  }
  // dissolve (transição): raio cresce do pivô, splats difundem e somem
  if (uBxDisT > 0.001) {
    vec3 rel = p - uBxAnchor;
    float d = length(rel) + 0.0001;
    float edge = uBxDisT * uBxDisMax;
    float k = 1.0 - smoothstep(edge * 0.55, edge, d);
    if (k > 0.001) {
      vec3 turb = vec3(bxHash(p*7.1)-0.5, bxHash(p*9.3)-0.5, bxHash(p*11.9)-0.5) * 2.0;
      p += (rel / d + turb * 0.8) * (k * uBxDisT * uBxDisMax * 0.3);
      bxFade *= 1.0 - k * clamp(uBxDisT * 1.5, 0.0, 1.0);
    }
  }
  return p;
}
`;
const BX_COLOR_GLSL = `
if (uBxLightOn > 0.5) {
  vec3 bxN = normalize(splatCenter - sceneCenter);
  float bxLam1 = pow(max(dot(bxN, -normalize(uBxLightDir)), 0.0), uBxShadowHard);
  vec3 bxLight = vec3(uBxAmbient) + bxLam1 * uBxLightStrength * uBxLightColor;
  if (uBxLight2On > 0.5) {
    float bxLam2 = pow(max(dot(bxN, -normalize(uBxLight2Dir)), 0.0), uBxShadowHard);
    bxLight += bxLam2 * uBxLight2Strength * uBxLight2Color;
  }
  vColor.rgb *= bxLight;
}
// Luz pontual: posição no volume da cena, com atenuação por distância
if (uBxPLOn > 0.5) {
  vec3 bxN2 = normalize(splatCenter - sceneCenter);
  vec3 bxLd = uBxPLPos - splatCenter;
  float bxDist = length(bxLd);
  float bxAtt = clamp(1.0 - bxDist / max(uBxPLRadius, 0.001), 0.0, 1.0);
  float bxLam = pow(max(dot(bxN2, bxLd / max(bxDist, 0.001)), 0.0), uBxShadowHard);
  vColor.rgb *= vec3(uBxAmbient) + bxLam * bxAtt * uBxPLStr * uBxPLColor;
}
// Paint (pincel): esferas pintadas acumuladas
if (uBxPaintN > 0.5) {
  for (int bi = 0; bi < 64; bi++) {
    if (float(bi) >= uBxPaintN) break;
    vec4 bs = uBxPaintPosR[bi];
    float bpd = length(splatCenter - bs.xyz);
    float bpm = 1.0 - smoothstep(bs.w * 0.7, bs.w, bpd);
    vColor.rgb = mix(vColor.rgb, uBxPaintCol[bi], bpm * uBxPaintStrength);
  }
}
// Pontos por profundidade: perto = verde, longe = roxo (ajustável)
if (uBxDepthOn > 0.5) {
  float bxDz = -viewCenter.z;
  float bxDt = clamp((bxDz - uBxDepthNear) / max(uBxDepthFar - uBxDepthNear, 0.001), 0.0, 1.0);
  vColor.rgb = mix(uBxDepthNearCol, uBxDepthFarCol, bxDt);
}
// Color grading (estilo LUT)
if (uBxGradeOn > 0.5) {
  vec3 c = vColor.rgb * uBxExposure;
  c.r *= (1.0 + uBxTemp); c.b *= (1.0 - uBxTemp);
  c.g *= (1.0 + uBxTint);
  c = (c - 0.5) * uBxContrast + 0.5;
  float lg = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(lg), c, uBxSaturation);
  vColor.rgb = clamp(c, 0.0, 1.0);
}
// Weather: névoa atmosférica por profundidade
if (uBxFogOn > 0.5) {
  float fz = -viewCenter.z;
  float ff = clamp((fz - uBxFogNear) / max(uBxFogFar - uBxFogNear, 0.001), 0.0, 1.0);
  vColor.rgb = mix(vColor.rgb, uBxFogColor, ff);
}
if (uBxMono > 0.5) {
  vColor.rgb = vec3(dot(vColor.rgb, vec3(0.299, 0.587, 0.114)));
}
if (uBxSmoke > 0.001) {
  vColor.a *= (1.0 - uBxSmoke);
  vColor.rgb = mix(vColor.rgb, vec3(dot(vColor.rgb, vec3(0.3333))), uBxSmoke*0.6);
}
vColor.a *= bxFade;
`;
const BX_DOF_GLSL = `
if (uBxDofOn > 0.5) {
  float bxDepth = -viewCenter.z;
  float bxCoc = clamp(abs(bxDepth - uBxFocusDist) / max(uBxFocusRange, 0.001) - 1.0, 0.0, uBxBlurMax);
  basisVector1 *= (1.0 + bxCoc);
  basisVector2 *= (1.0 + bxCoc);
  vColor.a /= (1.0 + bxCoc * bxCoc);
}
`;
const BX_REVEAL_GLSL = `
// Time Slice (4D): cada fatia do espaço mostra um frame diferente da sequência
if (uBxTimeSliceOn > 0.5 && sceneCount > 1) {
  vec3 bxSpan = max(uBxBBMax - uBxBBMin, vec3(0.0001));
  vec3 bxT3 = (splatCenter - uBxBBMin) / bxSpan;
  float bxTs = uBxSliceAxis < 0.5 ? bxT3.x : (uBxSliceAxis < 1.5 ? bxT3.y : bxT3.z);
  if (uBxSliceInvert > 0.5) bxTs = 1.0 - bxTs;
  float bxFIdx = fract(bxTs + uBxSliceShift) * float(sceneCount);
  int bxFrame = int(clamp(bxFIdx, 0.0, float(sceneCount) - 1.0));
  if (int(sceneIndex) != bxFrame) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); return; }
}
// Crop box (ao vivo): descarta o que fica fora da caixa orientada
if (uBxCropBoxOn > 0.5) {
  vec3 bxQc = abs(uBxCropBoxRot * (splatCenter - uBxCropBoxPos)) * uBxCropBoxInvHalf;
  if (max(bxQc.x, max(bxQc.y, bxQc.z)) > 1.0) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); return; }
}
// Crop radial (esfera no pivô)
if (uBxCropR > 0.0 && length(splatCenter - uBxAnchor) > uBxCropR) {
  gl_Position = vec4(0.0, 0.0, 2.0, 1.0); return;
}
splatCenter = bruxosPos(splatCenter);
if (uBxReveal < 0.999) {
  float bxRd = length(splatCenter - uBxRevealCenter);
  float bxEdge = uBxReveal * uBxRevealMax;
  if (bxRd > bxEdge) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); return; }
  bxFade = 1.0 - smoothstep(bxEdge * 0.85, bxEdge, bxRd) * 0.7;
}
            `;

function bxPatchShader(mesh) {
  const mat = mesh.material;
  if (!mat || !mat.vertexShader) return false;
  if (mat.vertexShader.includes('uBxTime')) return true; // já aplicado
  const aMain  = 'void main () {';
  const aView  = 'vec4 viewCenter = transformModelViewMatrix * vec4(splatCenter, 1.0);';
  const aColor = 'vColor = uintToRGBAVec(sampledCenterColor.r);';
  let vs = mat.vertexShader;
  if (!vs.includes(aMain) || !vs.includes(aView) || !vs.includes(aColor)) {
    console.warn('Bruxos FX: anchors não encontrados nesta versão da lib');
    return false;
  }
  const originalVS = mat.vertexShader; // guarda para reverter se o patch não compilar
  vs = vs.replace(aMain, BX_UNIFORMS_GLSL + '\n' + aMain);
  vs = vs.replace(aView, BX_REVEAL_GLSL + aView);
  vs = vs.replace(aColor, aColor + '\n' + BX_COLOR_GLSL);
  // DoF: escala os vetores de base pela distância ao plano de foco
  const aBasis = 'vec2 ndcOffset = vec2(vPosition.x * basisVector1 + vPosition.y * basisVector2)';
  if (vs.includes(aBasis)) vs = vs.replace(aBasis, BX_DOF_GLSL + '\n            ' + aBasis);
  mat.vertexShader = vs;
  const v3 = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
  Object.assign(mat.uniforms, {
    uBxTime:          { value: 0 },
    uBxAnchor:        { value: v3() },
    uBxCropR:         { value: 0 },
    // distorções (arrays de 7)
    uBxDOn:        { value: new Array(7).fill(0) },
    uBxDAxis:      { value: Array.from({length:7}, () => v3(0,1,0)) },
    uBxDAmp:       { value: new Array(7).fill(0) },
    uBxDFreq:      { value: new Array(7).fill(1) },
    uBxDSpeed:     { value: new Array(7).fill(0) },
    uBxDRadius:    { value: new Array(7).fill(0) },
    uBxDBoxOn:     { value: new Array(7).fill(0) },
    uBxDBoxPos:    { value: Array.from({length:7}, () => v3()) },
    uBxDBoxInvHalf:{ value: Array.from({length:7}, () => v3(1,1,1)) },
    uBxDBoxRot:    { value: Array.from({length:7}, () => new THREE.Matrix3()) },
    // crop box
    uBxCropBoxOn:      { value: 0 },
    uBxCropBoxPos:     { value: v3() },
    uBxCropBoxInvHalf: { value: v3(1,1,1) },
    uBxCropBoxRot:     { value: new THREE.Matrix3() },
    // fumaça / dissolve
    uBxSmoke:         { value: 0 },
    uBxSmokeDist:     { value: 3.0 },
    uBxDisT:          { value: 0 },
    uBxDisMax:        { value: 10.0 },
    // relight
    uBxLightOn:       { value: 0 },
    uBxLightDir:      { value: v3(-0.5, -0.5, -0.7).normalize() },
    uBxLightStrength: { value: 1.2 },
    uBxAmbient:       { value: 0.35 },
    uBxLightColor:    { value: new THREE.Color(1, 1, 1) },
    uBxLight2On:      { value: 0 },
    uBxLight2Dir:     { value: v3(0.5, -0.5, 0.7).normalize() },
    uBxLight2Strength:{ value: 0.8 },
    uBxLight2Color:   { value: new THREE.Color(1, 1, 1) },
    uBxShadowHard:    { value: 1.0 },
    // luz pontual
    uBxPLOn:          { value: 0 },
    uBxPLPos:         { value: v3() },
    uBxPLColor:       { value: new THREE.Color(1, 0.85, 0.63) },
    uBxPLStr:         { value: 1.5 },
    uBxPLRadius:      { value: 5.0 },
    // DoF
    uBxDofOn:         { value: 0 },
    uBxFocusDist:     { value: 3.0 },
    uBxFocusRange:    { value: 1.5 },
    uBxBlurMax:       { value: 6.0 },
    // reveal
    uBxReveal:        { value: 1.0 },
    uBxRevealCenter:  { value: v3() },
    uBxRevealMax:     { value: 10.0 },
    // grading
    uBxGradeOn:       { value: 0 },
    uBxExposure:      { value: 1.0 },
    uBxContrast:      { value: 1.0 },
    uBxSaturation:    { value: 1.0 },
    uBxTemp:          { value: 0.0 },
    uBxTint:          { value: 0.0 },
    // paint (pincel)
    uBxPaintN:        { value: 0 },
    uBxPaintPosR:     { value: Array.from({length:64}, () => new THREE.Vector4(0,0,0,0)) },
    uBxPaintCol:      { value: Array.from({length:64}, () => new THREE.Color(1,1,1)) },
    uBxPaintStrength: { value: 0.8 },
    // fog / profundidade / P&B
    uBxFogOn:         { value: 0 },
    uBxFogColor:      { value: new THREE.Color(0.7, 0.75, 0.85) },
    uBxFogNear:       { value: 2.0 },
    uBxFogFar:        { value: 12.0 },
    uBxDepthOn:       { value: 0 },
    uBxDepthNearCol:  { value: new THREE.Color(0x96c93d) },
    uBxDepthFarCol:   { value: new THREE.Color(0x7b2d8e) },
    uBxDepthNear:     { value: 1.0 },
    uBxDepthFar:      { value: 8.0 },
    uBxMono:          { value: 0 },
    // bbox / time slice
    uBxBBMin:         { value: v3(-1, -1, -1) },
    uBxBBMax:         { value: v3(1, 1, 1) },
    uBxTimeSliceOn:   { value: 0 },
    uBxSliceAxis:     { value: 0 },
    uBxSliceInvert:   { value: 0 },
    uBxSliceShift:    { value: 0 }
  });
  mat.needsUpdate = true;
  // testa a compilação; se os efeitos quebrarem o shader, reverte (nunca deixa tela preta)
  try {
    window.__bxShaderErr = '';
    if (viewer?.renderer && viewer?.threeScene && viewer?.camera)
      viewer.renderer.compile(viewer.threeScene, viewer.camera);
    if (window.__bxShaderErr) throw new Error(window.__bxShaderErr);
  } catch (e) {
    console.error('Bruxos FX: shader não compilou, revertendo para render normal:', e);
    showError('Efeitos desativados (shader): ' + String(e.message || e).slice(0, 140));
    mat.vertexShader = originalVS;
    mat.needsUpdate = true;
    return false;
  }
  return true;
}
