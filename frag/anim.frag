// estado de animação / efeitos
const anim = {
  dissolve: null, splatScale: 1, userScale: {x:1,y:1,z:1}, rotY: 0, pos: {x:0,y:0,z:0},
  relight: false, light2: false, plight: false, smoke: null, smokeVal: 0, fxTime: 0,
  dof: false, reveal: null, revealVal: 1, pb: false, depthCol: false, anchorCrop: false,
  timeSlice: false, sliceInvert: false, sliceAnim: 0,
  grade: false, fog: false, weather: null, paintMode: false,
  disVal: 0, disAnim: null, recOrbit: false,
  cropBox: { on:false, px:.5, py:.5, pz:.5, sx:1, sy:1, sz:1, rx:0, ry:0, rz:0 },
  cam: { orbit:false, vertigo:false, vertigoK:1, dolly:false, truck:false, tilt:false, shake:false,
         shakePrev: new THREE.Vector3() }
};
let lastTime = performance.now();
