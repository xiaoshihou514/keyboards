import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const params = new URLSearchParams(location.search);
const EMBED = params.has('embed');
const SHOT = params.has('shot');
const FLAT = params.has('flat');
const STRIPPED = params.has('stripped');
let rgbEnabled = params.get('rgb') !== '0';

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, EMBED ? 1.2 : 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.82;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.domElement.setAttribute('aria-label', '可交互的 MECHANIKE K500 键盘三维模型');
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(FLAT ? 0xe8e9e6 : 0x07090d);
scene.fog = FLAT ? null : new THREE.Fog(0x07090d, 25, 58);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.035).texture;
scene.environmentIntensity = 0.34;

const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 110);
camera.position.set(0, 11.8, 13.7);
if (params.get('view') === 'top') camera.position.set(0.01, 15.8, 0.45);
if (params.get('view') === 'side') camera.position.set(17.5, 4.9, 7.5);
if (params.get('view') === 'front') camera.position.set(0.01, 3.9, 13.8);
if (params.get('view') === 'rear') camera.position.set(-0.01, 3.9, -13.8);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.28, 0.12);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.minDistance = 7.5;
controls.maxDistance = 34;
controls.maxPolarAngle = Math.PI * 0.495;

const keyLight = new THREE.DirectionalLight(0xfff8eb, 1.3);
keyLight.position.set(-7, 14, 10);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(EMBED ? 768 : 1536, EMBED ? 768 : 1536);
keyLight.shadow.camera.left = keyLight.shadow.camera.bottom = -14;
keyLight.shadow.camera.right = keyLight.shadow.camera.top = 14;
keyLight.shadow.bias = -0.0004;
scene.add(keyLight);
scene.add(new THREE.HemisphereLight(0xdbe6ff, 0x19151a, 0.38));
const rimLight = new THREE.DirectionalLight(0x8eb4ff, 0.4);
rimLight.position.set(9, 5, -10);
scene.add(rimLight);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(46, 72),
  new THREE.MeshStandardMaterial({ color: FLAT ? 0xe8e9e6 : 0x0b0d13, roughness: 0.88, metalness: 0.08 }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.78;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(80, 80, 0x26314a, 0x151b27);
grid.position.y = -0.765;
grid.material.transparent = true;
grid.material.opacity = 0.24;
grid.visible = !FLAT;
scene.add(grid);

function microTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const g = canvas.getContext('2d');
  g.fillStyle = '#ecece8';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1300; i += 1) {
    const light = 220 + Math.floor(Math.random() * 25);
    g.fillStyle = `rgba(${light},${light},${light - 2},${0.035 + Math.random() * 0.05})`;
    const size = Math.random() > 0.88 ? 2 : 1;
    g.fillRect(Math.random() * 256, Math.random() * 256, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 2);
  return texture;
}

function radialGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 96;
  const g = canvas.getContext('2d');
  const gradient = g.createRadialGradient(48, 48, 3, 48, 48, 47);
  gradient.addColorStop(0, 'rgba(255,255,255,.82)');
  gradient.addColorStop(0.22, 'rgba(255,255,255,.48)');
  gradient.addColorStop(0.6, 'rgba(255,255,255,.17)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gradient;
  g.fillRect(0, 0, 96, 96);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

const caseMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xe8e9e5,
  roughness: 0.68,
  metalness: 0.02,
  clearcoat: 0.06,
  clearcoatRoughness: 0.76,
  map: microTexture(),
});
const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0xd8d9d5, roughness: 0.7, metalness: 0.02 });
const deckMaterial = new THREE.MeshStandardMaterial({ color: 0xd6d8d5, roughness: 0.74, metalness: 0.02 });
const socketMaterial = new THREE.MeshStandardMaterial({ color: 0xc5c3bd, roughness: 0.72, metalness: 0.01 });
const stemMaterial = new THREE.MeshStandardMaterial({ color: 0xe2d1dc, roughness: 0.58, metalness: 0 });
const capMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xf1f0eb,
  roughness: 0.56,
  metalness: 0,
  clearcoat: 0.035,
  clearcoatRoughness: 0.72,
});
const accentCapMaterial = capMaterial.clone();
accentCapMaterial.color.setHex(0xe9e8e3);

if (STRIPPED) {
  [caseMaterial, edgeMaterial, deckMaterial, socketMaterial, stemMaterial, capMaterial, accentCapMaterial].forEach((material) => {
    material.map = null;
    material.color.setHex(0x9c9c9c);
    material.metalness = 0;
    material.roughness = 1;
    material.needsUpdate = true;
  });
}

const keyboard = new THREE.Group();
keyboard.name = 'k500-root';
scene.add(keyboard);

const WIDTH = 16.16;
const DEPTH = 6.04;
const FRONT_TOP = 0.16;
const REAR_TOP = 0.64;
const PITCH = 0.98;
const ROW_Z = [-2.47, -1.49, -0.51, 0.47, 1.45, 2.43];
const RGB_ROW_HUES = [0.55, 0.78, 0.34, 0.075, 0.98, 0.025];
const keyGroups = [];
const glowMaterials = [];
const legendMaterials = [];
const legendCache = new Map();

function wedgeGeometry(width, depth, frontBottom, frontTop, rearBottom, rearTop) {
  const x0 = -width / 2;
  const x1 = width / 2;
  const z0 = -depth / 2;
  const z1 = depth / 2;
  const positions = new Float32Array([
    x0, frontBottom, z1, x1, frontBottom, z1, x1, frontTop, z1, x0, frontTop, z1,
    x1, rearBottom, z0, x0, rearBottom, z0, x0, rearTop, z0, x1, rearTop, z0,
    x0, frontBottom, z1, x0, frontTop, z1, x0, rearTop, z0, x0, rearBottom, z0,
    x1, frontBottom, z1, x1, rearBottom, z0, x1, rearTop, z0, x1, frontTop, z1,
    x0, frontTop, z1, x1, frontTop, z1, x1, rearTop, z0, x0, rearTop, z0,
    x0, frontBottom, z1, x0, rearBottom, z0, x1, rearBottom, z0, x1, frontBottom, z1,
  ]);
  const indices = [];
  for (let face = 0; face < 6; face += 1) {
    const offset = face * 4;
    indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

const lowerCase = new THREE.Mesh(wedgeGeometry(WIDTH, DEPTH, -0.67, FRONT_TOP, -0.67, REAR_TOP), caseMaterial);
lowerCase.name = 'wedge-case-shell';
lowerCase.castShadow = true;
lowerCase.receiveShadow = true;
keyboard.add(lowerCase);

const lowerLip = new THREE.Mesh(new RoundedBoxGeometry(WIDTH - 0.1, 0.16, DEPTH - 0.08, 2, 0.045), edgeMaterial);
lowerLip.name = 'lower-case-lip';
lowerLip.position.y = -0.58;
lowerLip.castShadow = true;
lowerLip.receiveShadow = true;
keyboard.add(lowerLip);

const deck = new THREE.Mesh(new RoundedBoxGeometry(WIDTH - 0.16, 0.1, DEPTH - 0.14, 2, 0.035), deckMaterial);
deck.name = 'recessed-key-deck';
deck.rotation.x = THREE.MathUtils.degToRad(4.35);
deck.position.y = 0.39;
deck.castShadow = true;
deck.receiveShadow = true;
keyboard.add(deck);

function rearBrandTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 160;
  const g = canvas.getContext('2d');
  g.clearRect(0, 0, canvas.width, canvas.height);
  g.save();
  g.translate(275, 0);
  g.fillStyle = '#1f2021';
  g.font = '600 30px Arial, sans-serif';
  g.fillText('MECHANIKE', 88, 62);
  g.font = '600 18px Arial, sans-serif';
  g.fillText('AS COOL AS YOU ARE', 90, 91);
  g.fillRect(360, 29, 10, 77);
  g.font = '900 82px Impact, Arial Black, sans-serif';
  g.fillText('K500', 386, 102);
  for (let i = 0; i < 8; i += 1) {
    g.save();
    g.translate(90 + i * 35, 120);
    g.rotate(-0.72);
    g.fillRect(0, 0, 9, 39);
    g.restore();
  }
  g.fillRect(386, 123, 358, 11);
  g.restore();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

const brand = new THREE.Mesh(
  new THREE.PlaneGeometry(7.5, 1.18),
  new THREE.MeshBasicMaterial({ map: rearBrandTexture(), transparent: true, depthWrite: false, toneMapped: false }),
);
brand.name = 'rear-k500-branding';
brand.position.set(-4.25, -0.22, -DEPTH / 2 - 0.012);
brand.rotation.y = Math.PI;
keyboard.add(brand);

function frontBrandTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 144;
  const g = canvas.getContext('2d');
  g.clearRect(0, 0, canvas.width, canvas.height);
  g.fillStyle = '#242526';
  for (let i = 0; i < 3; i += 1) {
    g.save();
    g.translate(34 + i * 30, 37);
    g.rotate(0.72);
    g.fillRect(0, 0, 12, 64);
    g.restore();
  }
  g.font = '700 33px Arial, sans-serif';
  g.fillText('MECHANIKE K500', 142, 58);
  g.font = '700 26px Arial, sans-serif';
  g.fillText('MECHANICAL KEYBOARD', 142, 100);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

const frontBrand = new THREE.Mesh(
  new THREE.PlaneGeometry(4.35, 0.82),
  new THREE.MeshBasicMaterial({ map: frontBrandTexture(), transparent: true, depthWrite: false, toneMapped: false }),
);
frontBrand.name = 'front-left-mechanike-branding';
frontBrand.position.set(-5.67, -0.28, DEPTH / 2 + 0.013);
keyboard.add(frontBrand);

function deckHeight(z) {
  const t = THREE.MathUtils.clamp((DEPTH / 2 - z) / DEPTH, 0, 1);
  return THREE.MathUtils.lerp(FRONT_TOP, REAR_TOP, t) + 0.04;
}

function taperedRoundedGeometry(width, height, depth) {
  const geometry = new RoundedBoxGeometry(width, height, depth, 2, 0.018);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i += 1) {
    const y = positions.getY(i);
    const t = THREE.MathUtils.clamp(y / height + 0.5, 0, 1);
    const x = positions.getX(i);
    const sideInset = 0.085 * t;
    positions.setX(i, Math.sign(x) * Math.max(0, Math.abs(x) - sideInset));
    positions.setZ(i, positions.getZ(i) * THREE.MathUtils.lerp(1, 0.84, t));
    if (t > 0.86) {
      const nx = Math.abs(positions.getX(i)) / (width * 0.41);
      const nz = Math.abs(positions.getZ(i)) / (depth * 0.42);
      const centerWeight = Math.max(0, 1 - Math.max(nx, nz));
      positions.setY(i, positions.getY(i) - centerWeight * 0.03);
    }
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function legendTexture(primary, secondary = '', corner = '') {
  const key = `${primary}|${secondary}|${corner}`;
  if (legendCache.has(key)) return legendCache.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const g = canvas.getContext('2d');
  g.clearRect(0, 0, 256, 256);
  g.fillStyle = '#ffffff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  if (secondary || corner) {
    g.font = '700 48px Arial, sans-serif';
    if (secondary) g.fillText(secondary, 128, 58);
    g.font = `700 ${primary.length > 3 ? 50 : 66}px Arial, sans-serif`;
    g.fillText(primary, 128, corner ? 132 : 166);
    if (corner) {
      g.strokeStyle = '#ffffff';
      g.lineWidth = 4;
      g.strokeRect(96, 174, 64, 43);
      g.font = '700 27px Arial, sans-serif';
      g.fillText(corner, 128, 196);
    }
  } else {
    const size = primary.length > 5 ? 44 : primary.length > 3 ? 52 : 72;
    g.font = `700 ${size}px Arial, sans-serif`;
    g.fillText(primary, 128, 128);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  legendCache.set(key, texture);
  return texture;
}

const glowTexture = radialGlowTexture();

function createKey({ primary, secondary = '', corner = '', width = 1 }, x, z, row, column) {
  const group = new THREE.Group();
  group.name = `key-${primary || secondary}-${row}-${column}`;
  group.position.set(x, deckHeight(z), z);

  const socketWidth = width * PITCH - 0.07;
  const socket = new THREE.Mesh(new RoundedBoxGeometry(socketWidth, 0.16, 0.78, 2, 0.035), socketMaterial);
  socket.name = 'switch-housing';
  socket.position.y = 0.08;
  socket.castShadow = true;
  group.add(socket);

  const stem = new THREE.Mesh(new RoundedBoxGeometry(0.26, 0.18, 0.26, 2, 0.025), stemMaterial);
  stem.name = 'short-switch-stem';
  stem.position.y = 0.19;
  group.add(stem);

  const capWidth = width * PITCH - 0.035;
  const cap = new THREE.Mesh(
    taperedRoundedGeometry(capWidth, 0.7, 0.93),
    row === 0 || width > 1.2 ? accentCapMaterial : capMaterial,
  );
  cap.name = 'traditional-trapezoid-keycap';
  cap.position.y = 0.48;
  cap.castShadow = true;
  cap.receiveShadow = true;
  group.add(cap);

  const legendMaterial = new THREE.MeshBasicMaterial({
    map: legendTexture(primary, secondary, corner),
    color: rgbEnabled ? new THREE.Color().setHSL(RGB_ROW_HUES[row], 1, 0.5) : new THREE.Color(0x363a3d),
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(Math.min(capWidth * 0.76, 1.42), 0.62),
    legendMaterial,
  );
  label.name = 'printed-key-legend';
  label.rotation.x = -Math.PI / 2;
  label.position.y = 0.837;
  group.add(label);

  const hue = THREE.MathUtils.euclideanModulo(RGB_ROW_HUES[row] + (x / WIDTH) * 0.035, 1);
  const color = new THREE.Color().setHSL(hue, 1, 0.5);
  const glowMaterial = new THREE.MeshBasicMaterial({
    map: glowTexture,
    color,
    transparent: true,
    opacity: rgbEnabled ? 0.94 : 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(1.3, socketWidth * 1.04), 1.27), glowMaterial);
  glow.name = 'soft-switch-rgb';
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.205;
  group.add(glow);

  group.userData.restY = group.position.y;
  group.userData.press = 0;
  cap.userData.keyGroup = group;
  label.userData.keyGroup = group;
  keyGroups.push(group);
  glowMaterials.push(glowMaterial);
  legendMaterials.push({ material: legendMaterial, row });
  keyboard.add(group);
}

const rows = [
  [
    ['Esc'], ['▣', 'F1'], ['⌕', 'F2'], ['▤', 'F3'], ['⌨', 'F4'], ['|◀', 'F5'], ['▶|', 'F6'], ['▶Ⅱ', 'F7'], ['■', 'F8'], ['◖×', 'F9'], ['◖−', 'F10'], ['◖+', 'F11'], ['▣', 'F12'], ['PrtSc'], ['Pause'], ['Del'],
  ],
  [
    ['`', '~'], ['1', '!', 1, 'L1'], ['2', '@', 1, 'L2'], ['3', '#', 1, 'L3'], ['4', '$', 1, 'L4'], ['5', '%', 1, 'L5'], ['6', '^', 1, 'L6'], ['7', '&', 1, 'L7'], ['8', '*', 1, 'L8'], ['9', '(', 1, 'LR1'], ['0', ')', 1, 'LR2'], ['-', '_'], ['=', '+'], ['←', '', 2], ['Home', '', 1, 'LR'],
  ],
  [
    ['Tab', '', 1.5], ['Q'], ['W'], ['E'], ['R'], ['T'], ['Y'], ['U'], ['I'], ['O'], ['P'], ['[', '{', 1, 'Ins'], [']', '}', 1, 'ScrLk'], ['\\', '|', 1.5], ['End', '', 1, 'S'],
  ],
  [
    ['CapsLk', '', 1.75], ['A'], ['S'], ['D'], ['F'], ['G'], ['H'], ['J'], ['K'], ['L'], [';', ':'], ["'", '"'], ['↵', '', 2.25], ['PgUp'],
  ],
  [
    ['Shift', '', 2.25], ['Z'], ['X'], ['C'], ['V'], ['B'], ['N'], ['M'], [',', '<'], ['.', '>'], ['/', '?'], ['Shift', '', 1.75], ['↑'], ['PgDn'],
  ],
  [
    ['Ctrl', '', 1.25], ['Win', '', 1.25], ['Alt', '', 1.25], ['▬', '', 6.25], ['Alt'], ['FN'], ['Ctrl'], ['←'], ['↓'], ['→'],
  ],
].map((row) => row.map(([primary, secondary = '', width = 1, corner = '']) => ({ primary, secondary, width, corner })));

rows.forEach((row, rowIndex) => {
  const units = row.reduce((sum, key) => sum + key.width, 0);
  let cursor = -(units * PITCH) / 2;
  row.forEach((key, columnIndex) => {
    const x = cursor + (key.width * PITCH) / 2;
    createKey(key, x, ROW_Z[rowIndex], rowIndex, columnIndex);
    cursor += key.width * PITCH;
  });
});

const rgbLights = [];
const rgbStripMaterials = [];
ROW_Z.forEach((z, row) => {
  const light = new THREE.RectAreaLight(
    new THREE.Color().setHSL(RGB_ROW_HUES[row], 1, 0.56),
    rgbEnabled ? 7 : 0,
    WIDTH - 0.7,
    0.34,
  );
  light.position.set(0, deckHeight(z) + 0.19, z);
  light.rotation.x = Math.PI / 2;
  keyboard.add(light);
  rgbLights.push(light);
});

for (let row = 1; row < ROW_Z.length; row += 1) {
  const z = (ROW_Z[row - 1] + ROW_Z[row]) / 2;
  const stripMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color().setHSL(RGB_ROW_HUES[row], 1, 0.5),
    transparent: true,
    opacity: rgbEnabled ? 0.94 : 0,
    depthWrite: false,
    toneMapped: false,
  });
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(WIDTH - 0.18, 0.1), stripMaterial);
  strip.name = `rgb-row-slot-${row}`;
  strip.rotation.x = -Math.PI / 2;
  strip.position.set(0, deckHeight(z) + 0.235, z);
  keyboard.add(strip);
  rgbStripMaterials.push(stripMaterial);
}

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), EMBED ? 0.16 : 0.22, 0.44, 1.2);
composer.addPass(bloom);
composer.addPass(new OutputPass());

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerDown = null;

renderer.domElement.addEventListener('pointerdown', (event) => {
  pointerDown = { x: event.clientX, y: event.clientY };
});

renderer.domElement.addEventListener('pointerup', (event) => {
  if (!pointerDown || Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 5) return;
  pointer.x = (event.clientX / innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(keyboard.children, true).find((entry) => entry.object.userData.keyGroup);
  if (hit) hit.object.userData.keyGroup.userData.press = 1;
});

keyboard.userData.sculptRuntime = {
  parts: { lowerCase, lowerLip, deck, rearBrand: brand, frontBrand },
  keys: keyGroups,
  setRgb(enabled) { rgbEnabled = Boolean(enabled); },
  setExploded(amount = 0) {
    const spread = THREE.MathUtils.clamp(amount, 0, 1);
    lowerCase.position.y = -0.2 * spread;
    lowerLip.position.y = -0.58 - 0.34 * spread;
    deck.position.y = 0.39 + 0.16 * spread;
    brand.position.y = -0.22 - 0.2 * spread;
    frontBrand.position.y = -0.28 - 0.2 * spread;
    keyGroups.forEach((group) => {
      group.userData.restY = deckHeight(group.position.z) + 0.6 * spread;
    });
  },
};

const clock = new THREE.Clock();
function animate() {
  const elapsed = clock.getElapsedTime();
  const breathe = 0.87 + Math.sin(elapsed * 1.25) * 0.13;
  glowMaterials.forEach((material) => { material.opacity = rgbEnabled ? 0.94 * breathe : 0; });
  rgbStripMaterials.forEach((material) => { material.opacity = rgbEnabled ? 0.94 * breathe : 0; });
  rgbLights.forEach((light) => { light.intensity = rgbEnabled ? 7 * breathe : 0; });
  legendMaterials.forEach(({ material, row }) => {
    if (rgbEnabled) {
      material.color.setHSL(RGB_ROW_HUES[row], 1, 0.5);
      material.opacity = 0.8 + 0.2 * breathe;
    } else {
      material.color.setHex(0x363a3d);
      material.opacity = 1;
    }
  });
  keyGroups.forEach((group) => {
    group.userData.press *= 0.78;
    group.position.y = group.userData.restY - group.userData.press * 0.13;
  });
  controls.update();
  composer.render();
  requestAnimationFrame(animate);
}
animate();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});

if (SHOT) {
  controls.enableRotate = false;
  controls.enableZoom = false;
  controls.enablePan = false;
}
