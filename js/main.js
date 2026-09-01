import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildLayout } from './layout.js';
import { buildKeyboard, legendTexture } from './keyboard.js';

const SHOT = new URLSearchParams(location.search).has('shot');

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07070b);
scene.fog = new THREE.Fog(0x07070b, 30, 90);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;

const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 200);
camera.position.set(0, 16.5, 15.5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.5, 1.2);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 6;
controls.maxDistance = 50;
controls.autoRotate = !SHOT;
controls.autoRotateSpeed = 0.7;

// ---------- lights ----------
const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(6, 14, 8);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = key.shadow.camera.bottom = -16;
key.shadow.camera.right = key.shadow.camera.top = 16;
key.shadow.bias = -0.0004;
scene.add(key);
scene.add(new THREE.HemisphereLight(0x9d8fd0, 0x0a0a12, 0.5));
const rim = new THREE.DirectionalLight(0x8855ff, 0.9);
rim.position.set(-8, 6, -10);
scene.add(rim);

// ---------- ground ----------
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(60, 64),
  new THREE.MeshStandardMaterial({ color: 0x0b0b12, roughness: 0.85, metalness: 0.2 }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1.35;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(120, 120, 0x2a1f4a, 0x161226);
grid.position.y = -1.34;
grid.material.transparent = true;
grid.material.opacity = 0.35;
scene.add(grid);

// ---------- keyboard ----------
const layout = buildLayout();
const { halves, keys } = buildKeyboard(layout);
const board = new THREE.Group();
const [hl, hr] = halves;
// center each half on its own bbox, then splay like the real photo
for (const h of halves) {
  const bb = new THREE.Box3().setFromObject(h);
  const c = bb.getCenter(new THREE.Vector3());
  h.userData.center = c;
  h.position.sub(c);
  const wrap = new THREE.Group();
  wrap.add(h);
  h.userData.wrap = wrap;
  board.add(wrap);
}
hl.parent.rotation.y = THREE.MathUtils.degToRad(-6);
hr.parent.rotation.y = THREE.MathUtils.degToRad(6);
hl.parent.position.set(-92, 0, -4); // board-local units are mm (board scaled 0.1)
hr.parent.position.set(92, 0, -4);
board.rotation.x = THREE.MathUtils.degToRad(-4); // gentle back slope like the side photo
board.scale.setScalar(0.1); // mm -> cm-ish scene units
scene.add(board);

// pressable lookup
const byCode = new Map();
for (const kg of keys) if (kg.userData.key.code) byCode.set(kg.userData.key.code, kg);

// ---------- bloom ----------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.55, 0.7, 0.6);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------- RGB underglow ----------
const RGB_MODES = ['wave', 'reactive', 'static', 'off'];
let rgbMode = 0;
const tmpColor = new THREE.Color();
function ledColor(kg, t) {
  const { wx, wz } = kg.userData;
  const hue = (t * 0.045 + wx * 0.004 + wz * 0.006) % 1;
  return tmpColor.setHSL((hue + 1) % 1, 0.85, 0.55);
}

// ---------- key press animation ----------
const active = new Set();
function press(kg, strong = 1) {
  kg.userData.press = 1;
  kg.userData.flash = strong;
  active.add(kg);
  ripple(kg);
}
function ripple(src) {
  const { wx, wz } = src.userData;
  for (const kg of keys) {
    if (kg === src) continue;
    const d = Math.hypot(kg.userData.wx - wx, kg.userData.wz - wz);
    const delay = d * 0.004;
    const amp = Math.max(0, 1 - d / 90) * 0.7;
    if (amp <= 0.02) continue;
    setTimeout(() => {
      kg.userData.flash = Math.max(kg.userData.flash, amp);
      active.add(kg);
    }, delay * 1000);
  }
}

// auto typing demo
let autoType = !SHOT;
let typeTimer = 0;
function autoTypeStep(dt) {
  typeTimer -= dt;
  if (typeTimer <= 0) {
    typeTimer = 0.14 + Math.random() * 0.5;
    press(keys[(Math.random() * keys.length) | 0], 1);
  }
}

// physical keyboard -> 3D
addEventListener('keydown', e => {
  const kg = byCode.get(e.code);
  if (kg) { press(kg, 1.2); }
});

// click / tap on 3D keys
const ray = new THREE.Raycaster();
const ptr = new THREE.Vector2();
let downAt = null;
renderer.domElement.addEventListener('pointerdown', e => (downAt = [e.clientX, e.clientY]));
renderer.domElement.addEventListener('pointerup', e => {
  if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return;
  ptr.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ptr, camera);
  const caps = keys.map(k => k.userData.cap);
  const hit = ray.intersectObjects(caps, false)[0];
  if (hit) {
    const kg = keys.find(k => k.userData.cap === hit.object);
    if (kg) press(kg, 1.2);
  }
});

// ---------- HUD ----------
let currentLayer = 0;
function setLayer(i) {
  currentLayer = i;
  for (const kg of keys) {
    const [main, sub] = kg.userData.key.layers[i];
    const m = kg.userData.legend.material;
    m.map = legendTexture(main, sub);
    m.needsUpdate = true;
  }
  document.querySelectorAll('#layers button').forEach((b, j) =>
    b.classList.toggle('on', j === i));
}
document.querySelectorAll('#layers button').forEach((b, i) =>
  b.addEventListener('click', () => setLayer(i)));
{
  const l = new URLSearchParams(location.search).get('layer');
  if (l !== null) setLayer(Math.min(2, Math.max(0, +l || 0)));
}

document.getElementById('rgb').addEventListener('click', e => {
  rgbMode = (rgbMode + 1) % RGB_MODES.length;
  e.target.textContent = `RGB: ${RGB_MODES[rgbMode]}`;
});
document.getElementById('spin').addEventListener('click', e => {
  controls.autoRotate = !controls.autoRotate;
  e.target.classList.toggle('on', controls.autoRotate);
});
document.getElementById('demo').addEventListener('click', e => {
  autoType = !autoType;
  e.target.classList.toggle('on', autoType);
});
document.getElementById('spin').classList.toggle('on', controls.autoRotate);
document.getElementById('demo').classList.toggle('on', autoType);

// ---------- loop ----------
const clock = new THREE.Clock();
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = SHOT ? 3.7 : clock.elapsedTime;

  if (autoType) autoTypeStep(dt);

  for (const kg of keys) {
    const ud = kg.userData;
    // press spring — choc travel ~3mm, animate a clearly visible 1.8mm dip
    if (ud.press > 0) {
      ud.press = Math.max(0, ud.press - dt * 7);
      const s = Math.sin(Math.min(ud.press, 1) * Math.PI);
      ud.cap.position.y = ud.restCapY - s * 1.8;
      ud.legend.position.y = ud.restLegendY - s * 1.8;
    }
    // flash decay
    if (ud.flash > 0) {
      ud.flash = Math.max(0, ud.flash - dt * 2.2);
      if (ud.flash === 0 && ud.press === 0) active.delete(kg);
    }
    // LED
    const led = ud.led;
    if (rgbMode === 3) {
      led.material.opacity = 0;
    } else {
      const base = rgbMode === 0 ? ledColor(kg, t) : tmpColor.set(0x9933ff);
      const boost = rgbMode === 1 ? 0.12 : 0.38; // reactive mode glows only on press
      led.material.color.copy(base).multiplyScalar(boost + ud.flash * 2.2);
      led.material.opacity = 0.3 + ud.flash * 0.55;
    }
    ud.legend.material.opacity = 0.95;
  }

  controls.update();
  composer.render();
  requestAnimationFrame(tick);
}
tick();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});

// expose for headless screenshots
window.__ready = true;
