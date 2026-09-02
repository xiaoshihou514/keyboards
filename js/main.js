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
// Keep the neutral fill below the RGB emitters so the light reads as coming
// from the switches instead of being flattened by the room reflection.
scene.environmentIntensity = 0.36;

const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 200);
camera.position.set(0, 16.5, 15.5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.5, 1.2);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 6;
controls.maxDistance = 50;

// ---------- lights ----------
const key = new THREE.DirectionalLight(0xffffff, 1.25);
key.position.set(6, 14, 8);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = key.shadow.camera.bottom = -16;
key.shadow.camera.right = key.shadow.camera.top = 16;
key.shadow.bias = -0.0004;
scene.add(key);
scene.add(new THREE.HemisphereLight(0x9d8fd0, 0x0a0a12, 0.18));
const rim = new THREE.DirectionalLight(0x8855ff, 0.55);
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
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.74, 0.58, 0.5);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------- RGB underglow ----------
const RGB_MODES = [
  'static rainbow glow · wide',
  'rainbow wave · vivid',
  'static green blue',
  'glowing green blue',
];
let rgbMode = 0;
let underglowEnabled = true;
let underglowBrightness = 1.3;
const tmpColor = new THREE.Color();
const greenBlue = new THREE.Color(0x00e5d0);
function ledColor(kg, t) {
  const { waveX } = kg.userData;
  if (rgbMode === 0) {
    // A fixed, full-spectrum gradient spanning both halves of the board.
    // The hue positions stay still; effectIntensity supplies the breathing
    // glow without turning the gradient back into a traveling wave.
    const hue = waveX * 0.0048 + 0.62;
    return tmpColor.setHSL((hue % 1 + 1) % 1, 0.92, 0.58);
  }
  if (rgbMode === 1) {
    const hue = waveX * 0.008 - t * 0.18 + 0.62;
    return tmpColor.setHSL((hue % 1 + 1) % 1, 0.94, 0.58);
  }
  // One cyan-teal hue halfway between green and blue. The glowing variant
  // changes only brightness; it never splits the board into two colors.
  return tmpColor.copy(greenBlue);
}

function effectIntensity(t) {
  if (rgbMode === 0) return 0.18 + (Math.sin(t * 1.45) + 1) * 0.41;
  if (rgbMode === 3) return 0.35 + (Math.sin(t * 2.6) + 1) * 0.32;
  return 0.86;
}

function refreshUnderglowLabel() {
  const button = document.getElementById('rgb');
  button.textContent = `RGB: ${RGB_MODES[rgbMode]}`;
  button.classList.toggle('on', underglowEnabled);
  button.title = underglowEnabled
    ? 'Click to change the backlight effect'
    : 'Backlight is off; click to change the effect';
}

function cycleUnderglow(direction = 1) {
  rgbMode = (rgbMode + direction + RGB_MODES.length) % RGB_MODES.length;
  refreshUnderglowLabel();
}

function toggleUnderglow() {
  underglowEnabled = !underglowEnabled;
  refreshUnderglowLabel();
}

function adjustUnderglowBrightness(delta) {
  underglowBrightness = THREE.MathUtils.clamp(underglowBrightness + delta, 0.2, 2.0);
}

function performKeyAction(kg) {
  const [main, sub] = kg.userData.key.layers[currentLayer] || ['', ''];
  const layer = /^TO([0-2])$/i.exec(main.trim());
  if (layer) {
    setLayer(Number(layer[1]));
    return;
  }
  if (main === 'UG') {
    if (sub === 'Tog') toggleUnderglow();
    else if (sub === 'Next') cycleUnderglow(1);
    else if (sub === 'Prev') cycleUnderglow(-1);
    else if (sub === 'Bri+') adjustUnderglowBrightness(0.2);
    else if (sub === 'Bri-') adjustUnderglowBrightness(-0.2);
  }
}

// ---------- key press animation ----------
const active = new Set();
function press(kg, strong = 1, executeAction = true) {
  kg.userData.press = 1;
  active.add(kg);
  if (executeAction) performKeyAction(kg);
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
}
{
  const params = new URLSearchParams(location.search);
  const l = params.get('layer');
  if (l !== null) setLayer(Math.min(2, Math.max(0, +l || 0)));
  const r = params.get('rgb');
  if (r !== null) {
    rgbMode = Math.min(RGB_MODES.length - 1, Math.max(0, +r || 0));
    refreshUnderglowLabel();
  }
}

document.getElementById('rgb').addEventListener('click', e => {
  cycleUnderglow(1);
});
refreshUnderglowLabel();

// ---------- loop ----------
const clock = new THREE.Clock();
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = SHOT ? 3.7 : clock.elapsedTime;

  for (const kg of keys) {
    const ud = kg.userData;
    // press spring — choc travel ~3mm, animate a clearly visible 1.8mm dip
    if (ud.press > 0) {
      ud.press = Math.max(0, ud.press - dt * 7);
      const s = Math.sin(Math.min(ud.press, 1) * Math.PI);
      ud.cap.position.y = ud.restCapY - s * 1.8;
      ud.stem.position.y = ud.restStemY - s * 1.8;
      ud.legend.position.y = ud.restLegendY - s * 1.8;
      if (ud.press === 0) active.delete(kg);
    }
    // per-key RGB: the source is concentrated inside each switch, with only
    // a restrained hotspot and nearby pool escaping onto the plate.
    const led = ud.led, spill = ud.spill;
    const innerGlow = ud.innerGlow, capGlow = ud.capGlow;
    if (!underglowEnabled) {
      led.material.opacity = 0;
      spill.material.opacity = 0;
      innerGlow.material.opacity = 0;
      capGlow.material.opacity = 0;
    } else {
      const pulse = effectIntensity(t);
      const base = ledColor(kg, t);
      led.material.color.copy(base).multiplyScalar(
        underglowBrightness * (1.45 + pulse * 0.65),
      );
      led.material.opacity = THREE.MathUtils.clamp(
        underglowBrightness * (0.34 + pulse * 0.22), 0, 0.7,
      );
      spill.material.color.copy(base).multiplyScalar(
        underglowBrightness * (0.55 + pulse * 0.3),
      );
      spill.material.opacity = THREE.MathUtils.clamp(
        underglowBrightness * (0.075 + pulse * 0.085), 0, 0.4,
      );
      innerGlow.material.color.copy(base).multiplyScalar(
        underglowBrightness * (1.2 + pulse * 0.55),
      );
      innerGlow.material.opacity = THREE.MathUtils.clamp(
        underglowBrightness * (0.11 + pulse * 0.1), 0, 0.3,
      );
      capGlow.material.color.copy(base).multiplyScalar(
        underglowBrightness * (1.0 + pulse * 0.25),
      );
      capGlow.material.opacity = THREE.MathUtils.clamp(
        underglowBrightness * (0.36 + pulse * 0.2), 0, 0.82,
      );
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
