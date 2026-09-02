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
const RGB_ENABLED = params.get('rgb') === '1';
const keymapResponse = await fetch('./real/keymap.vil');
if (!keymapResponse.ok) throw new Error(`Unable to load real/keymap.vil (${keymapResponse.status})`);
const vialKeymap = await keymapResponse.json();
const baseLayer = vialKeymap.layout?.[0];
if (!Array.isArray(baseLayer) || baseLayer.length !== 12) {
  throw new Error('real/keymap.vil must provide the Q11 12-row base matrix');
}
const leftMatrix = baseLayer.slice(0, 6);
const rightMatrix = baseLayer.slice(6, 12);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, EMBED ? 1.25 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.domElement.setAttribute('aria-label', '可交互的 Q11 分体键盘三维模型');
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(FLAT ? 0xf1f1ee : 0x07090d);
scene.fog = FLAT ? null : new THREE.Fog(0x07090d, 25, 62);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.52;

const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 120);
camera.position.set(0, 16.5, 12.5);
if (params.get('view') === 'side') camera.position.set(17.5, 7.4, 3.2);
if (params.get('view') === 'top') camera.position.set(0.01, 21.5, 0.8);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.45, 0.2);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.minDistance = 8;
controls.maxDistance = 36;
controls.maxPolarAngle = Math.PI * 0.49;

const keyLight = new THREE.DirectionalLight(0xfff8ee, 3.25);
keyLight.position.set(-7, 15, 10);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(EMBED ? 1024 : 2048, EMBED ? 1024 : 2048);
keyLight.shadow.camera.left = keyLight.shadow.camera.bottom = -18;
keyLight.shadow.camera.right = keyLight.shadow.camera.top = 18;
keyLight.shadow.bias = -0.00045;
scene.add(keyLight);
scene.add(new THREE.HemisphereLight(0xb7c5ff, 0x111017, 0.5));
const rimLight = new THREE.DirectionalLight(0x7395ff, 1.35);
rimLight.position.set(10, 6, -11);
scene.add(rimLight);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(50, 96),
  new THREE.MeshStandardMaterial({ color: 0x0b0d13, roughness: 0.86, metalness: 0.14 }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.86;
ground.receiveShadow = true;
scene.add(ground);
if (FLAT) ground.material.color.setHex(0xf1f1ee);

const grid = new THREE.GridHelper(90, 90, 0x26314a, 0x141a27);
grid.position.y = -0.845;
grid.material.transparent = true;
grid.material.opacity = 0.28;
grid.visible = !FLAT;
scene.add(grid);

function microTexture(base, fleck, line) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const g = canvas.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 7) {
    g.fillStyle = line;
    g.fillRect(0, y, 256, 1);
  }
  g.fillStyle = fleck;
  for (let i = 0; i < 760; i++) g.fillRect(Math.random() * 256, Math.random() * 256, 1, 1);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

const caseMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x1a1e22,
  metalness: 0.68,
  roughness: 0.46,
  clearcoat: 0.12,
  clearcoatRoughness: 0.58,
  map: microTexture('#1b1f23', 'rgba(96,102,110,.065)', 'rgba(255,255,255,.014)'),
});
const bevelMaterial = new THREE.MeshStandardMaterial({ color: 0x111419, metalness: 0.5, roughness: 0.52 });
const deckMaterial = new THREE.MeshStandardMaterial({ color: 0x0d1014, metalness: 0.42, roughness: 0.62 });
const switchMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xded9cf,
  roughness: 0.4,
  transmission: 0.08,
  thickness: 0.4,
  transparent: true,
  opacity: 0.62,
});
const switchSocketMaterial = new THREE.MeshStandardMaterial({
  color: 0x080a0d,
  metalness: 0.08,
  roughness: 0.72,
});
const knobMaterial = new THREE.MeshStandardMaterial({ color: 0x15171c, metalness: 0.92, roughness: 0.28 });
const encoderPostMaterial = new THREE.MeshStandardMaterial({ color: 0x596068, metalness: 0.86, roughness: 0.3 });
const alphaMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x203445,
  roughness: 0.69,
  metalness: 0,
  transmission: 0.015,
  thickness: 0.7,
  transparent: false,
  opacity: 1,
});
const modifierMaterial = alphaMaterial.clone();
modifierMaterial.color.setHex(0x171d25);
const coralMaterial = alphaMaterial.clone();
coralMaterial.color.setHex(0xb92f2f);

const board = new THREE.Group();
board.name = 'q11-root';
board.rotation.x = THREE.MathUtils.degToRad(-3.2);
scene.add(board);

const CASE_D = 6.75;
const CASE_WIDTH = { left: 8.4, right: 9.2 };
const HALF_POSITION_X = { left: -5.5, right: 5.4 };
const HALF_POSITION_Z = { left: 0.15, right: -0.2 };
const HALF_ROTATION_Y = { left: 10.5, right: -10.5 };
const LEFT_ROW_STARTS = [-3.08, -3.9, -3.9, -3.9, -3.9, -3.9];
const RIGHT_ARROW_CLUSTER_START = 1.9;
const RIGHT_ROW_STARTS = [-4.05, -4.4, -4.6, -4.2, -3.85, -4.05];
const keyGroups = [];
const glowSources = [];
const legendCache = new Map();

function roundedMesh(width, height, depth, radius, material, name) {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(width, height, depth, 4, radius), material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function steppedCaseOutline(side, width, depth) {
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const rowBreakA = -depth * 0.15;
  const rowBreakB = 0;
  const rowBreakC = depth * 0.15;

  if (side === 'left') {
    return [
      [-halfWidth, -halfDepth],
      [halfWidth - 0.8, -halfDepth],
      [halfWidth - 0.8, rowBreakA],
      [halfWidth - 1.25, rowBreakA],
      [halfWidth - 1.25, rowBreakB],
      [halfWidth - 1.05, rowBreakB],
      [halfWidth - 1.05, rowBreakC],
      [halfWidth - 0.1, rowBreakC],
      [halfWidth - 0.1, halfDepth],
      [-halfWidth, halfDepth],
    ];
  }

  return [
    [-halfWidth + 0.45, -halfDepth],
    [halfWidth, -halfDepth],
    [halfWidth, halfDepth],
    [-halfWidth + 0.65, halfDepth],
    [-halfWidth + 0.65, rowBreakC],
    [-halfWidth + 0.3, rowBreakC],
    [-halfWidth + 0.3, rowBreakB],
    [-halfWidth, rowBreakB],
    [-halfWidth, rowBreakA],
    [-halfWidth + 0.45, rowBreakA],
  ];
}

function steppedCaseMesh(side, width, height, depth, material, name) {
  const outline = steppedCaseOutline(side, width, depth);
  const shape = new THREE.Shape();
  shape.moveTo(outline[0][0], outline[0][1]);
  for (let index = 1; index < outline.length; index++) shape.lineTo(outline[index][0], outline[index][1]);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelThickness: 0.045,
    bevelSize: 0.045,
    curveSegments: 1,
  });
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, height / 2, 0);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function keycapGeometry(width) {
  const height = 0.72;
  const geometry = new RoundedBoxGeometry(width, height, 0.84, 5, 0.085);
  const positions = geometry.attributes.position;
  for (let index = 0; index < positions.count; index++) {
    const y = positions.getY(index);
    const heightRatio = THREE.MathUtils.clamp((y + height / 2) / height, 0, 1);
    positions.setX(index, positions.getX(index) * THREE.MathUtils.lerp(1, 0.82, heightRatio));
    positions.setZ(index, positions.getZ(index) * THREE.MathUtils.lerp(1, 0.86, heightRatio));
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function drawQ11Symbol(g, name, cx, cy, size) {
  const half = size / 2;
  g.strokeStyle = g.fillStyle = '#f7f3e9';
  g.lineWidth = size * 0.13;
  g.lineCap = g.lineJoin = 'round';

  const triangle = direction => {
    g.beginPath();
    g.moveTo(cx + direction * half * 0.68, cy);
    g.lineTo(cx - direction * half * 0.42, cy - half * 0.62);
    g.lineTo(cx - direction * half * 0.42, cy + half * 0.62);
    g.closePath();
    g.fill();
  };
  const arrow = (dx, dy, scale = 1) => {
    const length = half * 0.78 * scale;
    const head = half * 0.42 * scale;
    const endX = cx + dx * length;
    const endY = cy + dy * length;
    const sideX = -dy;
    const sideY = dx;
    g.beginPath();
    g.moveTo(cx - dx * length, cy - dy * length);
    g.lineTo(endX, endY);
    g.lineTo(endX - dx * head + sideX * head * 0.58, endY - dy * head + sideY * head * 0.58);
    g.moveTo(endX, endY);
    g.lineTo(endX - dx * head - sideX * head * 0.58, endY - dy * head - sideY * head * 0.58);
    g.stroke();
  };
  const plusMinus = (x, sign) => {
    g.beginPath();
    g.moveTo(x - half * 0.25, cy);
    g.lineTo(x + half * 0.25, cy);
    if (sign > 0) {
      g.moveTo(x, cy - half * 0.25);
      g.lineTo(x, cy + half * 0.25);
    }
    g.stroke();
  };
  const speaker = () => {
    g.beginPath();
    g.moveTo(cx - half * 0.86, cy - half * 0.24);
    g.lineTo(cx - half * 0.52, cy - half * 0.24);
    g.lineTo(cx - half * 0.16, cy - half * 0.6);
    g.lineTo(cx - half * 0.16, cy + half * 0.6);
    g.lineTo(cx - half * 0.52, cy + half * 0.24);
    g.lineTo(cx - half * 0.86, cy + half * 0.24);
    g.closePath();
    g.fill();
  };

  const directions = {
    up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0],
    mouseUp: [0, -1], mouseDown: [0, 1], mouseLeftMove: [-1, 0], mouseRightMove: [1, 0],
  };
  if (directions[name]) {
    arrow(...directions[name]);
    return;
  }

  if (name === 'tab') {
    g.beginPath();
    g.moveTo(cx - half * 0.92, cy - half * 0.48);
    g.lineTo(cx + half * 0.54, cy - half * 0.48);
    g.lineTo(cx + half * 0.2, cy - half * 0.76);
    g.moveTo(cx + half * 0.92, cy + half * 0.48);
    g.lineTo(cx - half * 0.54, cy + half * 0.48);
    g.lineTo(cx - half * 0.2, cy + half * 0.76);
    g.moveTo(cx - half * 0.92, cy - half * 0.8);
    g.lineTo(cx - half * 0.92, cy - half * 0.16);
    g.moveTo(cx + half * 0.92, cy + half * 0.16);
    g.lineTo(cx + half * 0.92, cy + half * 0.8);
    g.stroke();
    return;
  }

  if (name === 'escape') {
    g.beginPath();
    g.arc(cx, cy, half * 0.72, -Math.PI * 0.18, Math.PI * 1.48);
    g.stroke();
    g.beginPath();
    g.moveTo(cx + half * 0.16, cy + half * 0.12);
    g.lineTo(cx - half * 0.58, cy - half * 0.58);
    g.lineTo(cx - half * 0.14, cy - half * 0.52);
    g.moveTo(cx - half * 0.58, cy - half * 0.58);
    g.lineTo(cx - half * 0.54, cy - half * 0.14);
    g.stroke();
    return;
  }

  if (name === 'backspace' || name === 'delete') {
    const direction = name === 'backspace' ? -1 : 1;
    g.beginPath();
    g.moveTo(cx - direction * half * 0.9, cy);
    g.lineTo(cx - direction * half * 0.46, cy - half * 0.62);
    g.lineTo(cx + direction * half * 0.88, cy - half * 0.62);
    g.lineTo(cx + direction * half * 0.88, cy + half * 0.62);
    g.lineTo(cx - direction * half * 0.46, cy + half * 0.62);
    g.closePath();
    g.stroke();
    g.beginPath();
    g.moveTo(cx - half * 0.18, cy - half * 0.25);
    g.lineTo(cx + half * 0.34, cy + half * 0.25);
    g.moveTo(cx + half * 0.34, cy - half * 0.25);
    g.lineTo(cx - half * 0.18, cy + half * 0.25);
    g.stroke();
    return;
  }

  if (name === 'return') {
    g.beginPath();
    g.moveTo(cx + half * 0.74, cy - half * 0.72);
    g.lineTo(cx + half * 0.74, cy + half * 0.12);
    g.quadraticCurveTo(cx + half * 0.74, cy + half * 0.55, cx + half * 0.3, cy + half * 0.55);
    g.lineTo(cx - half * 0.72, cy + half * 0.55);
    g.lineTo(cx - half * 0.35, cy + half * 0.22);
    g.moveTo(cx - half * 0.72, cy + half * 0.55);
    g.lineTo(cx - half * 0.35, cy + half * 0.88);
    g.stroke();
    return;
  }

  if (name === 'shift') {
    g.beginPath();
    g.moveTo(cx, cy - half * 0.92);
    g.lineTo(cx + half * 0.78, cy - half * 0.02);
    g.lineTo(cx + half * 0.34, cy - half * 0.02);
    g.lineTo(cx + half * 0.34, cy + half * 0.86);
    g.lineTo(cx - half * 0.34, cy + half * 0.86);
    g.lineTo(cx - half * 0.34, cy - half * 0.02);
    g.lineTo(cx - half * 0.78, cy - half * 0.02);
    g.closePath();
    g.fill();
    return;
  }

  if (name === 'control') {
    g.beginPath();
    g.moveTo(cx - half * 0.72, cy + half * 0.34);
    g.lineTo(cx, cy - half * 0.42);
    g.lineTo(cx + half * 0.72, cy + half * 0.34);
    g.stroke();
    return;
  }

  if (name === 'home') {
    g.beginPath();
    g.moveTo(cx - half * 0.82, cy - half * 0.05);
    g.lineTo(cx, cy - half * 0.76);
    g.lineTo(cx + half * 0.82, cy - half * 0.05);
    g.moveTo(cx - half * 0.58, cy - half * 0.15);
    g.lineTo(cx - half * 0.58, cy + half * 0.75);
    g.lineTo(cx + half * 0.58, cy + half * 0.75);
    g.lineTo(cx + half * 0.58, cy - half * 0.15);
    g.stroke();
    return;
  }

  if (name === 'end') {
    arrow(1, 0, 0.78);
    g.beginPath();
    g.moveTo(cx + half * 0.9, cy - half * 0.78);
    g.lineTo(cx + half * 0.9, cy + half * 0.78);
    g.stroke();
    return;
  }

  if (name === 'pageUp' || name === 'pageDown') {
    g.strokeRect(cx - half * 0.68, cy - half * 0.82, half * 1.36, half * 1.64);
    arrow(0, name === 'pageUp' ? -1 : 1, 0.48);
    return;
  }

  if (name === 'space') {
    g.beginPath();
    g.moveTo(cx - half * 0.8, cy + half * 0.16);
    g.lineTo(cx - half * 0.8, cy + half * 0.48);
    g.lineTo(cx + half * 0.8, cy + half * 0.48);
    g.lineTo(cx + half * 0.8, cy + half * 0.16);
    g.stroke();
    return;
  }

  if (name === 'mouseLeft' || name === 'mouseRight') {
    const mouseX = cx;
    g.save();
    g.beginPath();
    g.ellipse(mouseX, cy, half * 0.62, half * 0.92, 0, 0, Math.PI * 2);
    g.clip();
    g.fillRect(
      name === 'mouseLeft' ? mouseX - half * 0.62 : mouseX,
      cy - half * 0.92,
      half * 0.62,
      half * 0.8,
    );
    g.restore();
    g.beginPath();
    g.ellipse(mouseX, cy, half * 0.62, half * 0.92, 0, 0, Math.PI * 2);
    g.moveTo(mouseX, cy - half * 0.92);
    g.lineTo(mouseX, cy - half * 0.12);
    g.moveTo(mouseX - half * 0.62, cy - half * 0.12);
    g.lineTo(mouseX + half * 0.62, cy - half * 0.12);
    g.stroke();
    const direction = name === 'mouseLeft' ? -1 : 1;
    const arrowX = mouseX + direction * half * 0.1;
    const arrowY = cy + half * 0.42;
    g.beginPath();
    g.moveTo(arrowX + direction * half * 0.34, arrowY);
    g.lineTo(arrowX - direction * half * 0.18, arrowY - half * 0.28);
    g.lineTo(arrowX - direction * half * 0.18, arrowY + half * 0.28);
    g.closePath();
    g.fill();
    return;
  }

  if (name === 'wheelUp' || name === 'wheelDown') {
    const mouseX = cx - half * 0.25;
    g.beginPath();
    g.ellipse(mouseX, cy, half * 0.54, half * 0.88, 0, 0, Math.PI * 2);
    g.moveTo(mouseX, cy - half * 0.88);
    g.lineTo(mouseX, cy - half * 0.16);
    g.stroke();
    g.beginPath();
    g.roundRect(mouseX - half * 0.1, cy - half * 0.7, half * 0.2, half * 0.3, half * 0.08);
    g.fill();
    const direction = name === 'wheelUp' ? -1 : 1;
    const arrowX = cx + half * 0.62;
    const arrowEndY = cy + direction * half * 0.56;
    g.beginPath();
    g.moveTo(arrowX, cy - direction * half * 0.45);
    g.lineTo(arrowX, arrowEndY);
    g.lineTo(arrowX - half * 0.23, arrowEndY - direction * half * 0.25);
    g.moveTo(arrowX, arrowEndY);
    g.lineTo(arrowX + half * 0.23, arrowEndY - direction * half * 0.25);
    g.stroke();
    return;
  }

  if (name === 'copy' || name === 'pastePlain') {
    if (name === 'copy') {
      g.strokeRect(cx - half * 0.72, cy - half * 0.72, half * 1.05, half * 1.05);
      g.strokeRect(cx - half * 0.28, cy - half * 0.28, half * 1.05, half * 1.05);
    } else {
      g.strokeRect(cx - half * 0.62, cy - half * 0.55, half * 1.24, half * 1.36);
      g.beginPath();
      g.moveTo(cx - half * 0.28, cy - half * 0.72);
      g.lineTo(cx + half * 0.28, cy - half * 0.72);
      g.lineTo(cx + half * 0.28, cy - half * 0.38);
      g.lineTo(cx - half * 0.28, cy - half * 0.38);
      g.closePath();
      g.stroke();
      g.font = `800 ${size * 0.62}px Inter, Arial, sans-serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('T', cx, cy + half * 0.2);
    }
    return;
  }

  if (name === 'ctrlTab' || name === 'ctrlBackspace' || name === 'ctrlLeft' || name === 'ctrlRight') {
    const mainName = name === 'ctrlTab' ? 'tab' : name === 'ctrlBackspace' ? 'backspace' : name === 'ctrlLeft' ? 'left' : 'right';
    drawQ11Symbol(g, mainName, cx, cy - half * 0.22, size * 0.68);
    drawQ11Symbol(g, 'control', cx, cy + half * 0.62, size * 0.42);
    return;
  }

  if (name === 'ctrlShiftTab') {
    drawQ11Symbol(g, 'tab', cx, cy - half * 0.3, size * 0.58);
    drawQ11Symbol(g, 'control', cx - half * 0.35, cy + half * 0.58, size * 0.38);
    drawQ11Symbol(g, 'shift', cx + half * 0.35, cy + half * 0.58, size * 0.34);
    return;
  }

  if (name === 'shiftSpace' || name === 'spaceLayer1') {
    drawQ11Symbol(g, name === 'shiftSpace' ? 'shift' : 'space', cx, cy - half * 0.28, size * 0.62);
    drawQ11Symbol(g, name === 'shiftSpace' ? 'space' : 'layer1', cx, cy + half * 0.58, size * 0.34);
    return;
  }

  const layerMatch = /^layer(\d)(Hold)?$/.exec(name);
  if (layerMatch) {
    g.lineWidth = size * 0.11;
    g.beginPath();
    for (const offset of [-0.52, 0, 0.52]) {
      g.moveTo(cx - half * 0.82, cy + half * offset);
      g.lineTo(cx - half * 0.22, cy + half * offset);
    }
    g.stroke();
    g.font = `900 ${size * 0.98}px Inter, Arial, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(layerMatch[1], cx + half * 0.38, cy + half * 0.04);
    if (layerMatch[2]) {
      g.beginPath();
      g.arc(cx + half * 0.8, cy + half * 0.72, half * 0.12, 0, Math.PI * 2);
      g.fill();
    }
    return;
  }

  if (name === 'bulbMinus' || name === 'bulbPlus') {
    const bulbX = cx - half * 0.22;
    g.beginPath();
    g.moveTo(bulbX, cy - half * 0.72);
    g.bezierCurveTo(bulbX - half * 0.52, cy - half * 0.72, bulbX - half * 0.58, cy, bulbX - half * 0.22, cy + half * 0.3);
    g.lineTo(bulbX - half * 0.22, cy + half * 0.48);
    g.lineTo(bulbX + half * 0.22, cy + half * 0.48);
    g.lineTo(bulbX + half * 0.22, cy + half * 0.3);
    g.bezierCurveTo(bulbX + half * 0.58, cy, bulbX + half * 0.52, cy - half * 0.72, bulbX, cy - half * 0.72);
    g.stroke();
    plusMinus(cx + half * 0.58, name === 'bulbPlus' ? 1 : -1);
    return;
  }

  if (name === 'powerOn' || name === 'powerOff') {
    g.beginPath();
    g.moveTo(cx, cy - half * 0.9);
    g.lineTo(cx, cy - half * 0.14);
    g.stroke();
    g.beginPath();
    g.arc(cx, cy + half * 0.08, half * 0.68, -Math.PI * 0.25, Math.PI * 1.25);
    g.stroke();
    if (name === 'powerOff') {
      g.beginPath();
      g.moveTo(cx - half * 0.78, cy - half * 0.72);
      g.lineTo(cx + half * 0.78, cy + half * 0.72);
      g.stroke();
    }
    return;
  }

  if (name === 'modePrev' || name === 'modeNext') {
    const direction = name === 'modeNext' ? 1 : -1;
    g.beginPath();
    g.arc(cx, cy, half * 0.68, direction > 0 ? Math.PI * 0.3 : Math.PI * 0.7, direction > 0 ? Math.PI * 1.72 : -Math.PI * 0.72, direction < 0);
    g.stroke();
    const tipX = cx + direction * half * 0.66;
    const tipY = cy - half * 0.34;
    g.beginPath();
    g.moveTo(tipX, tipY);
    g.lineTo(tipX - direction * half * 0.42, tipY - half * 0.08);
    g.moveTo(tipX, tipY);
    g.lineTo(tipX - direction * half * 0.18, tipY + half * 0.38);
    g.stroke();
    return;
  }

  if (name === 'prev' || name === 'next') {
    const direction = name === 'next' ? 1 : -1;
    g.fillRect(cx - direction * half * 0.58 - size * 0.055, cy - half * 0.6, size * 0.11, half * 1.2);
    triangle(direction);
    return;
  }
  if (name === 'playPause') {
    triangle(1);
    g.fillRect(cx + half * 0.25, cy - half * 0.58, size * 0.1, half * 1.16);
    g.fillRect(cx + half * 0.58, cy - half * 0.58, size * 0.1, half * 1.16);
    return;
  }
  if (name === 'mute' || name === 'volumeDown' || name === 'volumeUp') {
    speaker();
    if (name === 'mute') {
      g.beginPath();
      g.moveTo(cx + half * 0.24, cy - half * 0.34);
      g.lineTo(cx + half * 0.76, cy + half * 0.34);
      g.moveTo(cx + half * 0.76, cy - half * 0.34);
      g.lineTo(cx + half * 0.24, cy + half * 0.34);
      g.stroke();
    } else {
      plusMinus(cx + half * 0.5, name === 'volumeUp' ? 1 : -1);
    }
  }
}

function legendTexture(primary, secondary = '') {
  const cacheKey = `${primary}|${secondary}`;
  if (legendCache.has(cacheKey)) return legendCache.get(cacheKey);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const g = canvas.getContext('2d');
  g.clearRect(0, 0, 256, 256);
  g.fillStyle = '#f7f3e9';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const primarySize = primary.length > 7 ? 48 : primary.length > 4 ? 60 : 88;
  if (primary.startsWith('@')) {
    drawQ11Symbol(g, primary.slice(1), 128, secondary ? 102 : 128, secondary ? 82 : 106);
    if (secondary) {
      if (secondary.startsWith('@')) drawQ11Symbol(g, secondary.slice(1), 128, 198, 48);
      else {
        g.font = '700 50px Inter, Arial, sans-serif';
        g.fillText(secondary, 128, 198);
      }
    }
  } else if (secondary.startsWith('@')) {
    drawQ11Symbol(g, secondary.slice(1), 128, 69, 72);
    g.font = `700 ${primarySize}px Inter, Arial, sans-serif`;
    g.fillText(primary, 128, 164);
  } else if (secondary) {
    const secondarySize = secondary.length > 5 ? 50 : 68;
    g.font = `700 ${secondarySize}px Inter, Arial, sans-serif`;
    g.fillText(secondary, 128, 69);
    g.font = `700 ${primarySize}px Inter, Arial, sans-serif`;
    g.fillText(primary, 128, 164);
  } else {
    g.font = `700 ${primarySize}px Inter, Arial, sans-serif`;
    g.fillText(primary, 128, 130);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  legendCache.set(cacheKey, texture);
  return texture;
}

function capMaterial(label, tone) {
  if (tone === 'accent') return coralMaterial;
  if (tone === 'modifier') return modifierMaterial;
  return alphaMaterial;
}

function makeKey(parent, x, z, baseCode, layerCodes, primary, secondary = '', width = 0.78, tone = 'alpha', rowIndex = 0) {
  const group = new THREE.Group();
  group.name = `key-${baseCode || 'blank'}`;
  group.position.set(x, 0, z);
  parent.add(group);

  const ledMaterial = new THREE.MeshBasicMaterial({
    color: RGB_ENABLED ? 0xffffff : 0x101217,
    toneMapped: false,
  });
  const led = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.34, 0.08, 18), ledMaterial);
  led.position.y = 0.6;
  group.add(led);

  // Keep the deck pad shallow, then carry the switch on a narrower stem. The
  // two pieces overlap each other and the deck so there is no visual gap.
  const socket = roundedMesh(width * 0.66, 0.08, 0.49, 0.025, switchSocketMaterial, `${group.name}-socket`);
  socket.position.y = 0.42;
  group.add(socket);

  const stem = roundedMesh(Math.min(width * 0.34, 0.3), 0.08, 0.27, 0.025, switchMaterial.clone(), `${group.name}-stem`);
  stem.position.y = 0.5;
  group.add(stem);

  const housing = roundedMesh(width * 0.76, 0.16, 0.57, 0.05, switchMaterial.clone(), `${group.name}-switch`);
  housing.position.y = 0.62;
  group.add(housing);

  const cap = new THREE.Mesh(keycapGeometry(width), capMaterial(primary, tone).clone());
  cap.name = `${group.name}-cap`;
  cap.castShadow = true;
  cap.receiveShadow = true;
  const rowProfile = [
    { y: 1.07, tilt: -6 },
    { y: 1.05, tilt: -4 },
    { y: 1.03, tilt: -2 },
    { y: 1.02, tilt: 0 },
    { y: 1.02, tilt: 3 },
    { y: 1.03, tilt: 5 },
  ][rowIndex] || { y: 1.02, tilt: 0 };
  cap.position.y = rowProfile.y;
  cap.rotation.x = THREE.MathUtils.degToRad(rowProfile.tilt);
  group.add(cap);

  const legend = new THREE.Mesh(
    new THREE.PlaneGeometry(Math.min(width * 0.78, 1.5), 0.58),
    new THREE.MeshBasicMaterial({ map: legendTexture(primary, secondary), transparent: true, depthWrite: false, toneMapped: false }),
  );
  legend.rotation.x = -Math.PI / 2;
  legend.position.y = 0.374;
  cap.add(legend);

  group.userData = {
    cap,
    led,
    legend,
    socket,
    stem,
    baseCode,
    layerCodes,
    restY: cap.position.y,
    phase: x * 0.22 + z * 0.05,
    press: 0,
  };
  keyGroups.push(group);
  glowSources.push({ led, housing, cap, worldXHint: parent.position.x + x });
  return group;
}

const KEY_LABELS = new Map([
  ['KC_ESCAPE', '@escape'], ['KC_GESC', '@escape'], ['KC_GRAVE', '`'],
  ['KC_TAB', '@tab'], ['KC_LCTRL', '@control'], ['KC_RCTRL', '@control'],
  ['KC_LALT', '⌥'], ['KC_RALT', '⌥'], ['KC_BSPACE', '@backspace'],
  ['KC_ENTER', '@return'], ['KC_RSHIFT', '@shift'], ['KC_SPACE', '@space'],
  ['KC_DELETE', '@delete'], ['KC_HOME', '@home'], ['KC_END', '@end'],
  ['KC_PGUP', '@pageUp'], ['KC_PGDOWN', '@pageDown'],
  ['KC_UP', '@up'], ['KC_DOWN', '@down'], ['KC_LEFT', '@left'], ['KC_RIGHT', '@right'],
  ['KC_MS_U', '@mouseUp'], ['KC_MS_D', '@mouseDown'], ['KC_MS_L', '@mouseLeftMove'], ['KC_MS_R', '@mouseRightMove'],
  ['KC_WH_U', '@wheelUp'], ['KC_WH_D', '@wheelDown'],
  ['KC_BTN1', '@mouseLeft'], ['KC_BTN2', '@mouseRight'], ['USER04', 'M4'],
  ['KC_MINUS', '-'], ['KC_EQUAL', '='], ['KC_LBRACKET', '['],
  ['KC_RBRACKET', ']'], ['KC_BSLASH', '\\'], ['KC_SCOLON', ';'],
  ['KC_QUOTE', "'"], ['KC_COMMA', ','], ['KC_DOT', '.'], ['KC_SLASH', '/'],
]);

const SHIFTED_LABELS = new Map([
  ['KC_GRAVE', '~'], ['KC_1', '!'], ['KC_2', '@'], ['KC_3', '#'],
  ['KC_4', '$'], ['KC_5', '%'], ['KC_6', '^'], ['KC_7', '&'],
  ['KC_8', '*'], ['KC_9', '('], ['KC_0', ')'], ['KC_MINUS', '_'],
  ['KC_EQUAL', '+'], ['KC_LBRACKET', '{'], ['KC_RBRACKET', '}'],
  ['KC_BSLASH', '|'], ['KC_SCOLON', ':'], ['KC_QUOTE', '"'],
  ['KC_COMMA', '<'], ['KC_DOT', '>'], ['KC_SLASH', '?'],
]);

const LAYER_LABELS = new Map([
  ['KC_MPRV', '@prev'], ['KC_MPLY', '@playPause'], ['KC_MNXT', '@next'],
  ['KC_MUTE', '@mute'], ['KC_VOLD', '@volumeDown'], ['KC_VOLU', '@volumeUp'],
  ['KC_BRID', '@bulbMinus'], ['KC_BRIU', '@bulbPlus'], ['RM_ON', '@powerOn'],
  ['RM_OFF', '@powerOff'], ['RGB_RMOD', '@modePrev'], ['RGB_MOD', '@modeNext'],
]);

function keyLabel(code) {
  if (code === -1 || code === 'KC_NO' || !code) return '';
  if (LAYER_LABELS.has(code)) return LAYER_LABELS.get(code);
  if (KEY_LABELS.has(code)) return KEY_LABELS.get(code);
  let match = /^KC_([A-Z0-9]+)$/.exec(code);
  if (match) return match[1];
  match = /^LGUI\(KC_([1-4])\)$/.exec(code);
  if (match) return `⌘${match[1]}`;
  if (code === 'LGUI(KC_PGUP)') return '@pageUp';
  if (code === 'LGUI(KC_PGDOWN)') return '@pageDown';
  if (code === 'LSFT_T(KC_SPACE)') return '⇧␣';
  if (code === 'LT1(KC_SPACE)') return '␣1';
  if (code === 'LCTL(KC_TAB)') return '⌃⇥';
  if (code === 'C_S(KC_TAB)') return '⌃⇧⇥';
  if (code === 'LCTL(KC_BSPACE)') return '⌃⌫';
  if (code === 'LCTL(KC_LEFT)') return '⌃←';
  if (code === 'LCTL(KC_RIGHT)') return '⌃→';
  if (code === 'C_S(KC_C)') return '@copy';
  if (code === 'C_S(KC_V)') return '@pastePlain';
  match = /^MO\((\d)\)$/.exec(code);
  if (match) return `M${match[1]}`;
  match = /^DF\((\d)\)$/.exec(code);
  if (match) return `@layer${match[1]}`;
  return code.replace(/^KC_/, '').replace(/[()]/g, '');
}

function keyTone(code) {
  if (code === 'KC_ESCAPE' || code === 'KC_ENTER') return 'accent';
  if (/^KC_F\d+$/.test(code)) return 'modifier';
  if (/CTRL|ALT|SHIFT|SPACE|TAB|BSPACE|DELETE|HOME|END|PGUP|PGDOWN|LGUI|BTN|USER|MO\(|DF\(|LT1|LSFT_T/.test(code)) return 'modifier';
  return 'alpha';
}

function keyWidth(code) {
  if (code === 'KC_SPACE') return 1.25;
  if (code === 'LSFT_T(KC_SPACE)') return 2.75;
  if (code === 'LT1(KC_SPACE)') return 2.75;
  if (code === 'KC_TAB') return 1.5;
  if (code === 'KC_GESC') return 2.25;
  if (code === 'KC_LCTRL') return 1.75;
  if (code === 'KC_RCTRL') return 1.25;
  if (code === 'KC_BSPACE') return 2;
  if (code === 'KC_ENTER') return 2.25;
  if (code === 'KC_RSHIFT') return 2.25;
  if (['KC_LALT', 'KC_BTN2', 'USER04', 'MO(2)', 'DF(1)'].includes(code)) return 1.25;
  return 1;
}

function secondaryLabel(code, layerCode) {
  if (/^KC_F\d+$/.test(code) && typeof layerCode === 'string' && layerCode !== 'KC_NO') {
    return LAYER_LABELS.get(layerCode) || keyLabel(layerCode);
  }
  return SHIFTED_LABELS.get(code) || '';
}

function keyPresentation(layerCodes, layerIndex) {
  const code = layerCodes[layerIndex] ?? 'KC_NO';
  if (code === -1 || code === 'KC_NO') return ['', ''];
  const secondary = layerIndex === 0
    ? secondaryLabel(code, layerCodes[1])
    : SHIFTED_LABELS.get(code) || '';
  return [keyLabel(code), secondary];
}

function placeSequence(parent, items, startEdge, z, side, rowIndex) {
  const unit = 0.82;
  const gap = 0.07;
  let cursor = startEdge;
  for (const item of items) {
    const widthUnits = keyWidth(item.code);
    const width = unit * widthUnits + gap * (widthUnits - 1);
    const [primary, secondary] = keyPresentation(item.layerCodes, 0);
    makeKey(
      parent,
      cursor + width / 2,
      z,
      item.code,
      item.layerCodes,
      primary,
      secondary,
      width,
      keyTone(item.code),
      rowIndex,
    );
    cursor += width + gap;
  }
}

function placeMatrix(parent, rows, side) {
  const matrixOffset = side === 'left' ? 0 : 6;
  const layerRows = vialKeymap.layout.map(layer => layer?.slice(matrixOffset, matrixOffset + 6) || []);
  rows.forEach((row, rowIndex) => {
    const entries = row.map((code, columnIndex) => ({
      code,
      columnIndex,
      layerCodes: layerRows.map(rowsForLayer => rowsForLayer[rowIndex]?.[columnIndex] ?? 'KC_NO'),
    })).filter(item => item.code !== -1 && item.code !== 'KC_MUTE');

    const z = -2.55 + rowIndex * 1.02;
    if (side === 'left') {
      placeSequence(parent, entries, LEFT_ROW_STARTS[rowIndex], z, side, rowIndex);
      return;
    }

    const navCodes = new Set(['LGUI(KC_PGUP)', 'LGUI(KC_PGDOWN)', 'KC_HOME']);
    const arrowCodes = new Set(['KC_LEFT', 'KC_DOWN', 'KC_RIGHT']);
    const arrowUp = entries.find(item => item.code === 'KC_UP');
    const navigation = entries.find(item => navCodes.has(item.code));
    const bottomArrows = entries.filter(item => arrowCodes.has(item.code));
    const mainEntries = entries.filter(
      item => item !== navigation && item !== arrowUp && !arrowCodes.has(item.code),
    );
    placeSequence(parent, mainEntries, RIGHT_ROW_STARTS[rowIndex], z, side, rowIndex);
    if (navigation) placeSequence(parent, [navigation], 3.61, z, side, rowIndex);
    if (bottomArrows.length) {
      placeSequence(parent, bottomArrows, RIGHT_ARROW_CLUSTER_START, z, side, rowIndex);
    }
    if (arrowUp) {
      placeSequence(parent, [arrowUp], RIGHT_ARROW_CLUSTER_START + 0.89, z, side, rowIndex);
    }
  });
}

function makeHalf(side) {
  const group = new THREE.Group();
  group.name = side === 'left' ? 'left-half' : 'right-half';
  group.position.x = HALF_POSITION_X[side];
  group.position.z = HALF_POSITION_Z[side];
  group.rotation.y = THREE.MathUtils.degToRad(HALF_ROTATION_Y[side]);
  board.add(group);

  const caseWidth = CASE_WIDTH[side];
  const caseBody = steppedCaseMesh(
    side,
    caseWidth,
    0.6,
    CASE_D,
    caseMaterial,
    `${side}-case`,
  );
  caseBody.position.y = -0.1;
  group.add(caseBody);

  const chamfer = steppedCaseMesh(
    side,
    caseWidth - 0.04,
    0.08,
    CASE_D - 0.04,
    bevelMaterial,
    `${side}-perimeter-chamfer`,
  );
  chamfer.position.y = 0.24;
  group.add(chamfer);

  const deck = steppedCaseMesh(
    side,
    caseWidth - 0.18,
    0.12,
    CASE_D - 0.18,
    deckMaterial,
    `${side}-deck`,
  );
  deck.position.y = 0.32;
  group.add(deck);

  placeMatrix(group, side === 'left' ? leftMatrix : rightMatrix, side);

  const knobX = side === 'left' ? -3.57 : 4.08;
  const encoderBezel = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.48, 0.1, 36), deckMaterial);
  encoderBezel.name = `${side}-encoder-bezel`;
  encoderBezel.position.set(knobX, 0.41, -2.7);
  encoderBezel.castShadow = true;
  encoderBezel.receiveShadow = true;
  group.add(encoderBezel);

  const encoderPost = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.25, 0.32, 28), encoderPostMaterial);
  encoderPost.name = `${side}-encoder-post`;
  encoderPost.position.set(knobX, 0.59, -2.7);
  encoderPost.castShadow = true;
  group.add(encoderPost);

  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.4, 0.62, 36), knobMaterial);
  knob.name = `${side}-encoder`;
  knob.position.set(knobX, 1.04, -2.7);
  knob.castShadow = true;
  const encoderIndex = side === 'left' ? 0 : 1;
  const [counterClockwise, clockwise] = vialKeymap.encoder_layout?.[0]?.[encoderIndex] || ['KC_NO', 'KC_NO'];
  knob.userData.encoder = {
    press: 'KC_MUTE',
    counterClockwise,
    clockwise,
    source: 'real/keymap.vil',
  };
  group.add(knob);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.025, 8, 36), bevelMaterial);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(knobX, 1.37, -2.7);
  group.add(ring);

  return group;
}

const leftHalf = makeHalf('left');
const rightHalf = makeHalf('right');
const assembledHalfPositions = {
  left: leftHalf.position.clone(),
  right: rightHalf.position.clone(),
};

let currentLayer = 0;
function setLayer(layerIndex) {
  const nextLayer = THREE.MathUtils.clamp(Math.trunc(Number(layerIndex) || 0), 0, vialKeymap.layout.length - 1);
  currentLayer = nextLayer;
  for (const group of keyGroups) {
    const [primary, secondary] = keyPresentation(group.userData.layerCodes, currentLayer);
    group.userData.legend.material.map = legendTexture(primary, secondary);
    group.userData.legend.material.needsUpdate = true;
  }
}

function performKeyAction(group) {
  const activeCode = group.userData.layerCodes[currentLayer] ?? 'KC_NO';
  const defaultLayer = /^DF\((\d+)\)$/.exec(activeCode);
  if (defaultLayer) setLayer(Number(defaultLayer[1]));
}

const requestedLayer = Number.parseInt(params.get('layer') || '0', 10);
setLayer(Number.isFinite(requestedLayer) ? requestedLayer : 0);

if (FLAT) {
  const flatMaterial = new THREE.MeshBasicMaterial({ color: 0x22242a });
  board.traverse(object => {
    if (object.isMesh) object.material = flatMaterial;
  });
}

for (let i = 0; i < 8; i++) {
  const x = -8.4 + i * 2.4;
  const light = new THREE.PointLight(0xffffff, 0, 3.2, 1.7);
  light.position.set(x, 0.44, 0.2 + (i % 2) * 1.8);
  board.add(light);
  glowSources.push({ point: light, worldXHint: x });
}

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(innerWidth, innerHeight),
  FLAT || !RGB_ENABLED ? 0 : (EMBED ? 0.62 : 0.76),
  0.62,
  0.52,
);
composer.addPass(bloom);
composer.addPass(new OutputPass());

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerDown = null;
renderer.domElement.addEventListener('pointerdown', event => { pointerDown = [event.clientX, event.clientY]; });
renderer.domElement.addEventListener('pointerup', event => {
  if (!pointerDown || Math.hypot(event.clientX - pointerDown[0], event.clientY - pointerDown[1]) > 6) return;
  pointer.set(event.clientX / innerWidth * 2 - 1, -(event.clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const caps = keyGroups.map(group => group.userData.cap);
  const hit = raycaster.intersectObjects(caps, false)[0];
  if (hit) {
    const group = keyGroups.find(candidate => candidate.userData.cap === hit.object);
    group.userData.press = 1;
    performKeyAction(group);
  }
});

const clock = new THREE.Clock();
const color = new THREE.Color();
function animate() {
  requestAnimationFrame(animate);
  const elapsed = SHOT ? 2.4 : clock.getElapsedTime();
  const breathe = 0.58 + (Math.sin(elapsed * 1.35) + 1) * 0.31;

  for (const source of glowSources) {
    if (FLAT || !RGB_ENABLED) continue;
    const hue = THREE.MathUtils.euclideanModulo(source.worldXHint * 0.038 + 0.63, 1);
    color.setHSL(hue, 0.98, 0.58);
    if (source.led) {
      source.led.material.color.copy(color);
      source.housing.material.emissive.copy(color);
      source.housing.material.emissiveIntensity = breathe * 0.72;
      // The LED is below the cap: it illuminates the pale switch housing and
      // the gaps around the skirt, while the PBT cap itself stays non-emissive.
      source.cap.material.emissive.setHex(0x000000);
      source.cap.material.emissiveIntensity = 0;
    }
    if (source.point) {
      source.point.color.copy(color);
      source.point.intensity = breathe * (EMBED ? 0.2 : 0.3);
    }
  }

  for (const group of keyGroups) {
    if (group.userData.press <= 0) continue;
    group.userData.press = Math.max(0, group.userData.press - 0.07);
    group.userData.cap.position.y = group.userData.restY - Math.sin(group.userData.press * Math.PI) * 0.09;
  }
  controls.update();
  composer.render();
}
animate();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});

function setExploded(amount = 0) {
  const value = THREE.MathUtils.clamp(Number(amount) || 0, 0, 1);
  leftHalf.position.copy(assembledHalfPositions.left).add(new THREE.Vector3(-value * 2.4, value * 0.35, 0));
  rightHalf.position.copy(assembledHalfPositions.right).add(new THREE.Vector3(value * 2.4, value * 0.35, 0));
}

board.userData.sculptRuntime = {
  root: board,
  parts: ['left-half', 'right-half', 'left-case', 'right-case', 'left-key-field', 'right-key-field', 'key-system', 'encoder-system', 'deck-system'],
  details: ['perimeter-chamfer', 'exposed-switch-housing', 'macro-column', 'outer-corner-knobs', 'navigation-column', 'arrow-cluster', 'sculpted-row-profiles'],
  pickable: keyGroups.map(group => group.userData.cap),
  destructionGroups: { shell: ['left-half', 'right-half'], controls: ['encoder-system'] },
  keymap: {
    source: 'real/keymap.vil',
    matrixRows: [leftMatrix.length, rightMatrix.length],
    matrixColumns: [leftMatrix[0].length, rightMatrix[0].length],
    encoderLayout: vialKeymap.encoder_layout,
  },
  setLayer,
  get currentLayer() { return currentLayer; },
  setExploded,
};
window.__Q11_RUNTIME__ = board.userData.sculptRuntime;
