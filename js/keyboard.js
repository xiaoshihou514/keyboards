import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { U, CASE_OUTLINE_L, PLATE_POLY_L, INSERTS_L } from './layout.js';

const CAP_PITCH = U;          // mm
const CAP_SIZE = 16.2;        // mm base width, ~1.3mm gap like the real board
const CAP_TOP = 14.0;         // top width -> trapezoidal cross-section
const CAP_H = 4.6;            // low-profile choc cap height (short)

// ---------- procedural 3D-print texture (layer lines + speckle) ----------
function makePrintBump() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#808080';
  g.fillRect(0, 0, 512, 512);
  // fine horizontal layer lines
  for (let y = 0; y < 512; y += 3) {
    const v = 118 + Math.random() * 22;
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.fillRect(0, y, 512, 1.4);
  }
  // speckle noise
  for (let i = 0; i < 9000; i++) {
    const v = 100 + Math.random() * 60;
    g.fillStyle = `rgba(${v},${v},${v},0.5)`;
    g.fillRect(Math.random() * 512, Math.random() * 512, 1.3, 1.3);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  return t;
}

// ---------- vector-drawn symbol legends (no font glyphs) ----------
// Every non-alphanumeric legend is drawn with canvas paths so it renders
// identically everywhere and reads like a printed icon.
function drawSymbol(g, name, cx, cy, s) {
  g.strokeStyle = g.fillStyle = '#0a0a0a';
  g.lineWidth = s * 0.15;
  g.lineCap = g.lineJoin = 'round';
  const h = s / 2;
  const arrow = (dx, dy) => {
    g.beginPath();
    g.moveTo(cx - dx * h * 0.85, cy - dy * h * 0.85);
    g.lineTo(cx + dx * h * 0.85, cy + dy * h * 0.85);
    // arrowhead
    const px = -dy, py = dx; // perpendicular
    const hx = cx + dx * h * 0.85, hy = cy + dy * h * 0.85;
    g.moveTo(hx, hy);
    g.lineTo(hx - dx * h * 0.5 + px * h * 0.38, hy - dy * h * 0.5 + py * h * 0.38);
    g.moveTo(hx, hy);
    g.lineTo(hx - dx * h * 0.5 - px * h * 0.38, hy - dy * h * 0.5 - py * h * 0.38);
    g.stroke();
  };
  const tri = (dir) => { // dir: 1 right, -1 left
    g.beginPath();
    g.moveTo(cx + dir * h * 0.7, cy);
    g.lineTo(cx - dir * h * 0.45, cy - h * 0.62);
    g.lineTo(cx - dir * h * 0.45, cy + h * 0.62);
    g.closePath();
    g.fill();
  };
  const bar = (bx, bw) => g.fillRect(cx + bx - bw / 2, cy - h * 0.62, bw, h * 1.24);
  switch (name) {
    case 'up': arrow(0, -1); break;
    case 'down': arrow(0, 1); break;
    case 'left': arrow(-1, 0); break;
    case 'right': arrow(1, 0); break;
    case 'shift': { // block up-arrow
      g.beginPath();
      g.moveTo(cx, cy - h);
      g.lineTo(cx + h * 0.78, cy - h * 0.02);
      g.lineTo(cx + h * 0.34, cy - h * 0.02);
      g.lineTo(cx + h * 0.34, cy + h);
      g.lineTo(cx - h * 0.34, cy + h);
      g.lineTo(cx - h * 0.34, cy - h * 0.02);
      g.lineTo(cx - h * 0.78, cy - h * 0.02);
      g.closePath();
      g.fill();
      break;
    }
    case 'win': { // retained for old cached legend names
      const gap = s * 0.09, w = (s - gap) / 2, shear = s * 0.07;
      for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
        const x0 = cx - h + c * (w + gap), y0 = cy - h + r * (w + gap);
        g.beginPath();
        g.moveTo(x0, y0 + shear);
        g.lineTo(x0 + w, y0);
        g.lineTo(x0 + w, y0 + w);
        g.lineTo(x0, y0 + w + shear);
        g.closePath();
        g.fill();
      }
      break;
    }
    case 'bluetooth': drawBluetooth(g, cx, cy, s); break;
    case 'linux': drawLinux(g, cx, cy, s * 1.14); break;
    case 'backspace': drawBackspace(g, cx, cy, s); break;
    case 'home': drawHome(g, cx, cy, s); break;
    case 'end': drawEnd(g, cx, cy, s); break;
    case 'copy': drawCopy(g, cx, cy, s); break;
    case 'paste': drawPaste(g, cx, cy, s); break;
    case 'control': drawControl(g, cx, cy, s); break;
    case 'tab': drawTab(g, cx, cy, s); break;
    case 'return': drawReturn(g, cx, cy, s); break;
    case 'delete': drawDelete(g, cx, cy, s); break;
    case 'pageUp': drawPage(g, cx, cy, s, 'up'); break;
    case 'pageDown': drawPage(g, cx, cy, s, 'down'); break;
    case 'underglow': drawUnderglow(g, cx, cy, s); break;
    case 'space': drawSpace(g, cx, cy, s); break;
    case 'mouseLeft': drawMouse(g, cx, cy, s, 'left'); break;
    case 'mouseRight': drawMouse(g, cx, cy, s, 'right'); break;
    case 'ctrlBackspace':
      drawBackspace(g, cx, cy - h * 0.06, s * 0.84);
      drawControl(g, cx, cy + h * 0.59, s * 0.3);
      break;
    case 'ctrlTab':
      drawTab(g, cx, cy - h * 0.06, s * 0.84);
      drawControl(g, cx, cy + h * 0.59, s * 0.3);
      break;
    case 'ctrlLeft':
      drawSymbol(g, 'left', cx, cy - h * 0.06, s * 0.82);
      drawControl(g, cx, cy + h * 0.59, s * 0.3);
      break;
    case 'ctrlRight':
      drawSymbol(g, 'right', cx, cy - h * 0.06, s * 0.82);
      drawControl(g, cx, cy + h * 0.59, s * 0.3);
      break;
    case 'play': tri(1); break;
    case 'playL': tri(-1); break;
    case 'prev': bar(-h * 0.62, s * 0.13); tri(-1); break;
    case 'next': tri(1); bar(h * 0.62, s * 0.13); break;
    case 'playpause': { // small play triangle left, two pause bars right
      g.beginPath();
      g.moveTo(cx - h * 0.75 + h * 0.55, cy);
      g.lineTo(cx - h * 0.75, cy - h * 0.45);
      g.lineTo(cx - h * 0.75, cy + h * 0.45);
      g.closePath();
      g.fill();
      bar(h * 0.25, s * 0.11);
      bar(h * 0.62, s * 0.11);
      break;
    }
    case 'eject': { // up triangle over a bar
      g.beginPath();
      g.moveTo(cx, cy - h * 0.85);
      g.lineTo(cx + h * 0.72, cy + h * 0.12);
      g.lineTo(cx - h * 0.72, cy + h * 0.12);
      g.closePath();
      g.fill();
      g.fillRect(cx - h * 0.72, cy + h * 0.42, h * 1.44, s * 0.13);
      break;
    }
  }
}
const SYMBOLS = {
  '↑': 'up', '↓': 'down', '←': 'left', '→': 'right',
  '⇧': 'shift', '⊞': 'linux', '▷': 'play', '◁': 'playL',
  '⏮': 'prev', '⏯': 'playpause', '⏭': 'next', '⏄': 'eject',
  BT: 'bluetooth', Bksp: 'backspace', Home: 'home', End: 'end',
  Tab: 'tab', Enter: 'return', Del: 'delete', Spc: 'space',
  PgUp: 'pageUp', PgDn: 'pageDown', Ctrl: 'control', LC: 'control',
};

function drawBackspace(g, cx, cy, s) {
  const w = s * 0.94, h = s * 0.58;
  const x = cx - w / 2, y = cy - h / 2;
  g.beginPath();
  g.moveTo(x + w * 0.23, y);
  g.lineTo(x + w, y);
  g.lineTo(x + w, y + h);
  g.lineTo(x + w * 0.23, y + h);
  g.lineTo(x, cy);
  g.closePath();
  g.stroke();
  g.beginPath();
  g.moveTo(x + w * 0.47, y + h * 0.28);
  g.lineTo(x + w * 0.78, y + h * 0.72);
  g.moveTo(x + w * 0.78, y + h * 0.28);
  g.lineTo(x + w * 0.47, y + h * 0.72);
  g.stroke();
}

function drawHome(g, cx, cy, s) {
  const h = s / 2;
  g.beginPath();
  g.moveTo(cx - h * 0.78, cy - h * 0.02);
  g.lineTo(cx, cy - h * 0.72);
  g.lineTo(cx + h * 0.78, cy - h * 0.02);
  g.lineTo(cx + h * 0.63, cy - h * 0.02);
  g.lineTo(cx + h * 0.63, cy + h * 0.72);
  g.lineTo(cx - h * 0.63, cy + h * 0.72);
  g.lineTo(cx - h * 0.63, cy - h * 0.02);
  g.stroke();
  g.beginPath();
  g.moveTo(cx - h * 0.12, cy + h * 0.72);
  g.lineTo(cx - h * 0.12, cy + h * 0.2);
  g.lineTo(cx + h * 0.2, cy + h * 0.2);
  g.lineTo(cx + h * 0.2, cy + h * 0.72);
  g.stroke();
}

function drawEnd(g, cx, cy, s) {
  const h = s / 2;
  g.beginPath();
  g.moveTo(cx - h * 0.75, cy);
  g.lineTo(cx + h * 0.55, cy);
  g.moveTo(cx + h * 0.2, cy - h * 0.34);
  g.lineTo(cx + h * 0.55, cy);
  g.lineTo(cx + h * 0.2, cy + h * 0.34);
  g.moveTo(cx + h * 0.72, cy - h * 0.65);
  g.lineTo(cx + h * 0.72, cy + h * 0.65);
  g.stroke();
}

function drawCopy(g, cx, cy, s) {
  const h = s / 2, w = h * 0.9;
  g.strokeRect(cx - h * 0.62, cy - h * 0.68, w, w * 1.02);
  g.strokeRect(cx - h * 0.1, cy - h * 0.28, w, w * 1.02);
}

function drawPaste(g, cx, cy, s) {
  const h = s / 2, w = h * 0.78;
  const left = cx - w / 2, right = cx + w / 2;
  const top = cy - h * 0.52, bottom = cy + h * 0.78;
  const r = h * 0.12;

  // Minimal clipboard: thick outlined board, solid clip, two text lines.
  g.strokeStyle = '#0a0a0a';
  g.lineWidth = s * 0.085;
  g.beginPath();
  g.moveTo(left + r, top);
  g.lineTo(right - r, top);
  g.quadraticCurveTo(right, top, right, top + r);
  g.lineTo(right, bottom - r);
  g.quadraticCurveTo(right, bottom, right - r, bottom);
  g.lineTo(left + r, bottom);
  g.quadraticCurveTo(left, bottom, left, bottom - r);
  g.lineTo(left, top + r);
  g.quadraticCurveTo(left, top, left + r, top);
  g.closePath();
  g.stroke();

  // solid clip straddling the top edge
  g.fillStyle = '#0a0a0a';
  const cw = w * 0.46, ch = h * 0.22, cr = ch * 0.45;
  const cl = cx - cw / 2, ct = top - ch * 0.55;
  g.beginPath();
  g.moveTo(cl + cr, ct);
  g.lineTo(cl + cw - cr, ct);
  g.quadraticCurveTo(cl + cw, ct, cl + cw, ct + cr);
  g.lineTo(cl + cw, ct + ch - cr);
  g.quadraticCurveTo(cl + cw, ct + ch, cl + cw - cr, ct + ch);
  g.lineTo(cl + cr, ct + ch);
  g.quadraticCurveTo(cl, ct + ch, cl, ct + ch - cr);
  g.lineTo(cl, ct + cr);
  g.quadraticCurveTo(cl, ct, cl + cr, ct);
  g.closePath();
  g.fill();

  // pasted content lines
  g.lineWidth = s * 0.08;
  g.beginPath();
  g.moveTo(left + w * 0.2, cy + h * 0.12);
  g.lineTo(right - w * 0.2, cy + h * 0.12);
  g.moveTo(left + w * 0.2, cy + h * 0.42);
  g.lineTo(right - w * 0.38, cy + h * 0.42);
  g.stroke();
}

function drawMouse(g, cx, cy, s, button) {
  const h = s / 2;
  const w = h * 0.68;
  const top = cy - h * 0.78, bottom = cy + h * 0.78;
  const splitY = cy - h * 0.02;
  const body = () => {
    g.beginPath();
    g.moveTo(cx, top);
    g.bezierCurveTo(cx - w, top, cx - w, cy - h * 0.25, cx - w, cy + h * 0.05);
    g.bezierCurveTo(cx - w, bottom, cx + w, bottom, cx + w, cy + h * 0.05);
    g.bezierCurveTo(cx + w, cy - h * 0.25, cx + w, top, cx, top);
    g.closePath();
  };

  // Outlined body with the clicked button filled solid: the filled quadrant
  // is the whole message, so it must be a single bold shape.
  g.save();
  body();
  g.clip();
  g.fillStyle = '#0a0a0a';
  const bx = button === 'left' ? cx - w : cx;
  g.fillRect(bx, top - 1, w, splitY - top + 1);
  g.restore();

  g.strokeStyle = '#0a0a0a';
  g.lineWidth = s * 0.085;
  body();
  g.stroke();
  g.beginPath();
  g.moveTo(cx, top);
  g.lineTo(cx, splitY);
  g.moveTo(cx - w, splitY);
  g.lineTo(cx + w, splitY);
  g.stroke();

  // wheel: short thick dash between the buttons (manual capsule, no roundRect)
  g.lineWidth = s * 0.09;
  g.beginPath();
  g.moveTo(cx, cy - h * 0.5);
  g.lineTo(cx, cy - h * 0.22);
  g.stroke();
}

function drawBluetooth(g, cx, cy, s) {
  const h = s / 2;
  g.beginPath();
  g.moveTo(cx, cy - h * 0.9);
  g.lineTo(cx, cy + h * 0.9);
  g.moveTo(cx, cy - h * 0.9);
  g.lineTo(cx + h * 0.62, cy - h * 0.38);
  g.lineTo(cx - h * 0.52, cy + h * 0.42);
  g.moveTo(cx, cy + h * 0.9);
  g.lineTo(cx + h * 0.62, cy + h * 0.38);
  g.lineTo(cx - h * 0.52, cy - h * 0.42);
  g.stroke();
}

function drawLinux(g, cx, cy, s) {
  const h = s / 2;
  g.save();

  // Tux reduced to three bold masses so it survives keycap scale:
  // black body, big white belly/face, orange beak and feet.
  g.fillStyle = '#0a0a0a';
  g.beginPath();
  g.ellipse(cx, cy, h * 0.6, h * 0.84, 0, 0, Math.PI * 2);
  g.fill();

  g.fillStyle = '#f4f0f8';
  g.beginPath();
  g.ellipse(cx, cy + h * 0.06, h * 0.36, h * 0.6, 0, 0, Math.PI * 2);
  g.fill();

  // eyes
  g.fillStyle = '#0a0a0a';
  g.beginPath();
  g.arc(cx - h * 0.16, cy - h * 0.3, h * 0.1, 0, Math.PI * 2);
  g.arc(cx + h * 0.16, cy - h * 0.3, h * 0.1, 0, Math.PI * 2);
  g.fill();

  // beak
  g.fillStyle = '#e8930c';
  g.beginPath();
  g.moveTo(cx - h * 0.23, cy - h * 0.08);
  g.lineTo(cx + h * 0.23, cy - h * 0.08);
  g.lineTo(cx, cy + h * 0.14);
  g.closePath();
  g.fill();

  // feet
  g.beginPath();
  g.ellipse(cx - h * 0.32, cy + h * 0.78, h * 0.27, h * 0.13, -0.25, 0, Math.PI * 2);
  g.ellipse(cx + h * 0.32, cy + h * 0.78, h * 0.27, h * 0.13, 0.25, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

function drawControl(g, cx, cy, s) {
  const h = s / 2;
  g.beginPath();
  g.moveTo(cx - h * 0.62, cy + h * 0.25);
  g.lineTo(cx, cy - h * 0.48);
  g.lineTo(cx + h * 0.62, cy + h * 0.25);
  g.stroke();
}

function drawTab(g, cx, cy, s) {
  const h = s / 2;
  g.beginPath();
  g.moveTo(cx - h * 0.7, cy);
  g.lineTo(cx + h * 0.38, cy);
  g.moveTo(cx + h * 0.05, cy - h * 0.34);
  g.lineTo(cx + h * 0.38, cy);
  g.lineTo(cx + h * 0.05, cy + h * 0.34);
  g.moveTo(cx + h * 0.7, cy - h * 0.62);
  g.lineTo(cx + h * 0.7, cy + h * 0.62);
  g.stroke();
}

function drawReturn(g, cx, cy, s) {
  const h = s / 2;
  g.beginPath();
  g.moveTo(cx + h * 0.7, cy - h * 0.3);
  g.lineTo(cx + h * 0.7, cy + h * 0.35);
  g.lineTo(cx - h * 0.35, cy + h * 0.35);
  g.moveTo(cx - h * 0.65, cy + h * 0.35);
  g.lineTo(cx - h * 0.35, cy + h * 0.05);
  g.moveTo(cx - h * 0.65, cy + h * 0.35);
  g.lineTo(cx - h * 0.35, cy + h * 0.65);
  g.stroke();
}

function drawDelete(g, cx, cy, s) {
  const h = s / 2;
  g.beginPath();
  g.moveTo(cx - h * 0.68, cy);
  g.lineTo(cx - h * 0.35, cy - h * 0.38);
  g.lineTo(cx + h * 0.68, cy - h * 0.38);
  g.lineTo(cx + h * 0.68, cy + h * 0.38);
  g.lineTo(cx - h * 0.35, cy + h * 0.38);
  g.closePath();
  g.stroke();
  g.beginPath();
  g.moveTo(cx - h * 0.57, cy - h * 0.15);
  g.lineTo(cx - h * 0.26, cy + h * 0.15);
  g.moveTo(cx - h * 0.26, cy - h * 0.15);
  g.lineTo(cx - h * 0.57, cy + h * 0.15);
  g.stroke();
}

function drawPage(g, cx, cy, s, direction) {
  const h = s / 2;
  const up = direction === 'up';
  const tipY = cy + (up ? -h * 0.45 : h * 0.45);
  const tailY = cy + (up ? h * 0.35 : -h * 0.35);
  g.beginPath();
  g.moveTo(cx, tailY);
  g.lineTo(cx, tipY);
  g.moveTo(cx, tipY);
  g.lineTo(cx - h * 0.25, tipY + (up ? h * 0.22 : -h * 0.22));
  g.moveTo(cx, tipY);
  g.lineTo(cx + h * 0.25, tipY + (up ? h * 0.22 : -h * 0.22));
  g.moveTo(cx - h * 0.58, cy + h * 0.62);
  g.lineTo(cx + h * 0.58, cy + h * 0.62);
  g.stroke();
}

function drawUnderglow(g, cx, cy, s) {
  const h = s / 2;
  // A bulb reads faster than the old abstract LED dot on a low-resolution cap.
  g.beginPath();
  g.moveTo(cx, cy - h * 0.7);
  g.bezierCurveTo(cx - h * 0.62, cy - h * 0.7, cx - h * 0.68, cy + h * 0.08, cx - h * 0.26, cy + h * 0.4);
  g.lineTo(cx - h * 0.26, cy + h * 0.58);
  g.lineTo(cx + h * 0.26, cy + h * 0.58);
  g.lineTo(cx + h * 0.26, cy + h * 0.4);
  g.bezierCurveTo(cx + h * 0.68, cy + h * 0.08, cx + h * 0.62, cy - h * 0.7, cx, cy - h * 0.7);
  g.stroke();
  g.beginPath();
  g.moveTo(cx - h * 0.3, cy + h * 0.72);
  g.lineTo(cx + h * 0.3, cy + h * 0.72);
  g.moveTo(cx - h * 0.22, cy + h * 0.86);
  g.lineTo(cx + h * 0.22, cy + h * 0.86);
  g.stroke();
  for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
    g.beginPath();
    g.moveTo(cx + dx * h * 0.78, cy + dy * h * 0.02);
    g.lineTo(cx + dx * h, cy + dy * h * 0.02);
    g.stroke();
  }
}

function drawSpace(g, cx, cy, s) {
  const h = s / 2;
  g.beginPath();
  g.moveTo(cx - h * 0.75, cy + h * 0.18);
  g.lineTo(cx + h * 0.75, cy + h * 0.18);
  g.stroke();
}

const SHIFTED_LEGENDS = new Set([
  '`~', '1!', '2@', '3#', '4$', '5%', '6^', '7&', '8*', '9(', '0)',
  '-_', '=+', '[{', ']}', '\\|', ';:', "'\"", ',<', '.>', '/?',
]);

function drawShiftedLegend(g, value) {
  const base = value[0], shifted = value.slice(1);
  g.fillStyle = '#0a0a0a';
  g.strokeStyle = '#0a0a0a';
  g.textAlign = 'center';
  g.textBaseline = 'middle';

  // A small, heavy shifted symbol above the larger base character mirrors
  // the convention used on full-size keyboard keycaps.
  g.font = '900 58px "Segoe UI", Arial, sans-serif';
  g.lineWidth = 2.4;
  g.strokeText(shifted, 128, 72);
  g.fillText(shifted, 128, 72);

  g.font = '900 98px "Segoe UI", Arial, sans-serif';
  g.lineWidth = 3.2;
  g.strokeText(base, 128, 170);
  g.fillText(base, 128, 170);
}

function legendPresentation(main, sub) {
  const a = String(main || '').trim();
  const b = String(sub || '').trim();
  const combo = `${a} ${b}`
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/\+/g, '-')
    .replace(/\s+/g, '-');

  // Shortcut chords get a single visual mark instead of a tiny unreadable
  // string on the cap. Keep the aliases here so VIA labels can evolve
  // without changing the renderer.
  if (['c-s-c', 'lc-ls-c'].includes(combo)) return { symbol: 'copy', sub: '' };
  if (['c-s-v', 'lc-ls-v'].includes(combo)) return { symbol: 'paste', sub: '' };
  if (combo === 'lc-bksp') return { symbol: 'ctrlBackspace', sub: '' };
  if (combo === 'lc-tab') return { symbol: 'ctrlTab', sub: '' };
  if (combo === 'lc-←' || combo === 'lc-left') return { symbol: 'ctrlLeft', sub: '' };
  if (combo === 'lc-→' || combo === 'lc-right') return { symbol: 'ctrlRight', sub: '' };

  const direct = {
    bt: 'bluetooth', bksp: 'backspace', backspace: 'backspace',
    home: 'home', end: 'end', tab: 'tab', enter: 'return',
    del: 'delete', delete: 'delete', spc: 'space',
    pgup: 'pageUp', pgdn: 'pageDown', ctrl: 'control', lc: 'control',
    lclk: 'mouseLeft', rclk: 'mouseRight',
    '⊞': 'linux', ug: 'underglow',
  };
  const symbol = direct[a.toLowerCase()] || SYMBOLS[a];
  if (symbol === 'bluetooth' || symbol === 'underglow') return { symbol, sub: b };
  if (symbol) return { symbol, sub: b };
  return { main: a, sub: b };
}

// ---------- legend texture (black print on clear cap, like the real caps) ----------
const legendCache = new Map();
export function legendTexture(main, sub) {
  const key = `${main}|${sub}`;
  if (legendCache.has(key)) return legendCache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 256, 256);
  // frosted top sheet: a soft light rounded rect under the print,
  // like the diffused top surface of the real clear caps
  const sheet = g.createRadialGradient(128, 128, 20, 128, 128, 118);
  sheet.addColorStop(0, 'rgba(240,240,245,0.34)');
  sheet.addColorStop(0.8, 'rgba(240,240,245,0.22)');
  sheet.addColorStop(1, 'rgba(240,240,245,0)');
  g.fillStyle = sheet;
  g.beginPath();
  // manual rounded-rect path (arcTo is universally supported)
  const x0 = 8, y0 = 8, w = 240, rr = 42;
  g.moveTo(x0 + rr, y0);
  g.lineTo(x0 + w - rr, y0); g.arcTo(x0 + w, y0, x0 + w, y0 + rr, rr);
  g.lineTo(x0 + w, y0 + w - rr); g.arcTo(x0 + w, y0 + w, x0 + w - rr, y0 + w, rr);
  g.lineTo(x0 + rr, y0 + w); g.arcTo(x0, y0 + w, x0, y0 + w - rr, rr);
  g.lineTo(x0, y0 + rr); g.arcTo(x0, y0, x0 + rr, y0, rr);
  g.closePath();
  g.fill();
  const presentation = legendPresentation(main, sub);
  const displayMain = presentation.main ?? main;
  const displaySub = presentation.sub ?? sub;
  if (displayMain || presentation.symbol) {
    g.fillStyle = '#0a0a0a';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const sym = presentation.symbol;
    if (sym) {
      drawSymbol(g, sym, 128, displaySub ? 102 : 128, displaySub ? 82 : 96);
    } else if (!displaySub && SHIFTED_LEGENDS.has(displayMain)) {
      drawShiftedLegend(g, displayMain);
    } else {
      const long = displayMain.length >= 3;
      g.font = `800 ${long ? 64 : displayMain.length === 2 ? 88 : 122}px "Segoe UI", system-ui, sans-serif`;
      g.fillText(displayMain, 128, displaySub ? 108 : 128);
    }
    if (displaySub) {
      const subSym = SYMBOLS[displaySub];
      if (subSym) drawSymbol(g, subSym, 128, 192, 52);
      else {
        g.font = '700 46px "Segoe UI", system-ui, sans-serif';
        g.fillText(displaySub, 128, 192);
      }
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  legendCache.set(key, t);
  return t;
}

// ---------- rounded polygon helper ----------
function roundedPoly(points, r) {
  const shape = new THREE.Shape();
  const n = points.length;
  const pt = i => new THREE.Vector2(points[i][0], points[i][1]);
  for (let i = 0; i < n; i++) {
    const p0 = pt((i + n - 1) % n), p1 = pt(i), p2 = pt((i + 1) % n);
    const d1 = p1.clone().sub(p0).normalize();
    const d2 = p2.clone().sub(p1).normalize();
    const a = p1.clone().sub(d1.clone().multiplyScalar(r));
    const b = p1.clone().add(d2.clone().multiplyScalar(r));
    if (i === 0) shape.moveTo(a.x, a.y); else shape.lineTo(a.x, a.y);
    shape.quadraticCurveTo(p1.x, p1.y, b.x, b.y);
  }
  shape.closePath();
  return shape;
}

// ---------- keycap profile (extruded rounded rect with bevel = tapered skirt) ----------
// Keycap: trapezoidal cross-section (base wider than top) and short,
// like the real low-profile choc caps. y = 0 at cap bottom.
function capGeometry() {
  const s = new THREE.Shape();
  const h = CAP_TOP / 2;
  const r = 3.0;
  s.moveTo(-h + r, -h);
  s.lineTo(h - r, -h); s.quadraticCurveTo(h, -h, h, -h + r);
  s.lineTo(h, h - r); s.quadraticCurveTo(h, h, h - r, h);
  s.lineTo(-h + r, h); s.quadraticCurveTo(-h, h, -h, h - r);
  s.lineTo(-h, -h + r); s.quadraticCurveTo(-h, -h, -h + r, -h);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: CAP_H, bevelEnabled: false, curveSegments: 6,
  });
  geo.rotateX(-Math.PI / 2); // extrude direction -> +y, y in [0, CAP_H]
  // taper the walls: scale x/z linearly from CAP_SIZE at bottom to CAP_TOP
  // at the top face -> true trapezoidal cross-section
  const p = geo.attributes.position;
  const taper = CAP_SIZE / CAP_TOP - 1;
  for (let i = 0; i < p.count; i++) {
    const f = 1 + taper * (1 - p.getY(i) / CAP_H);
    p.setX(i, p.getX(i) * f);
    p.setZ(i, p.getZ(i) * f);
  }
  geo.computeVertexNormals();
  return geo;
}

// Kailh Choc "pig-nose" stem: two round barrels flanking a center web,
// reads as two circles from the top through the clear cap.
function chocStem(material) {
  const g = new THREE.Group();
  const barrelGeo = new THREE.CylinderGeometry(1.6, 1.6, 2.6, 16);
  const webGeo = new THREE.BoxGeometry(6.2, 2.6, 1.7);
  for (const dx of [-2.35, 2.35]) {
    const b = new THREE.Mesh(barrelGeo, material);
    b.position.x = dx;
    g.add(b);
  }
  const web = new THREE.Mesh(webGeo, material);
  g.add(web);
  return g;
}

export function buildKeyboard(layout) {
  const bump = makePrintBump();

  const caseMat = new THREE.MeshStandardMaterial({
    color: 0x17181a, roughness: 0.92, metalness: 0.05,
    bumpMap: bump, bumpScale: 0.5, envMapIntensity: 0.4,
  });
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0x1d1e21, roughness: 0.55, metalness: 0.1,
  });
  const capMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.3, metalness: 0,
    transmission: 0.9, thickness: 2.0, ior: 1.49,
    clearcoat: 0.5, clearcoatRoughness: 0.4,
    attenuationColor: new THREE.Color(0xdcd2e8), attenuationDistance: 14,
  });
  const housingMat = new THREE.MeshPhysicalMaterial({
    color: 0x3a3340, roughness: 0.35, transmission: 0.55, thickness: 2,
  });
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0xb45ae0, roughness: 0.4,
    emissive: 0x7e22ce, emissiveIntensity: 0.28,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc9a04e, roughness: 0.35, metalness: 0.95,
  });

  const capGeo = capGeometry();
  const housingGeo = new RoundedBoxGeometry(13.0, 3.2, 13.0, 2, 0.7);
  // soft radial glow sprite for the per-key RGB LED
  const glowC = document.createElement('canvas');
  glowC.width = glowC.height = 128;
  const gg = glowC.getContext('2d');
  const grad = gg.createRadialGradient(64, 64, 4, 64, 64, 62);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  gg.fillStyle = grad;
  gg.fillRect(0, 0, 128, 128);
  const glowTex = new THREE.CanvasTexture(glowC);
  // spill pool bleeds across the plate between caps; rim sliver is just wider
  // than the 16.2mm cap base so only a thin bright edge escapes the gap
  const ledGeo = new THREE.PlaneGeometry(21, 21);
  const ledCoreGeo = new THREE.PlaneGeometry(17.8, 17.8);
  const legendGeo = new THREE.PlaneGeometry(12.6, 12.6);
  const insertGeo = new THREE.CylinderGeometry(2.1, 2.1, 1.2, 24);

  const keys = [];   // {group, cap, led, legend, base, home:{x,z,rot}, half}
  const halves = [];

  for (const side of ['left', 'right']) {
    const mirror = side === 'right';
    const half = new THREE.Group();
    half.name = side;
    // right-half case = left-half case mirrored about x = 3.0u
    // (grid keys already live in final local coords; only case parts mirror)
    const mx = v => (mirror ? 6 * U - v : v);

    // --- case: thin bottom slab ---
    const outline = CASE_OUTLINE_L.map(([x, y]) => [mx(x * U), y * U]);
    const caseGeo = new THREE.ExtrudeGeometry(roundedPoly(outline, 0.16 * U), {
      depth: 5.5, bevelEnabled: true, bevelThickness: 1.6, bevelSize: 1.6, bevelSegments: 2,
    });
    // rotateX(+PI/2): layout +y -> +z (toward viewer), extrusion -> downward
    caseGeo.rotateX(Math.PI / 2);
    caseGeo.translate(0, -1.6, 0); // top face (deck) at y=0, body below
    const caseMesh = new THREE.Mesh(caseGeo, caseMat);
    caseMesh.castShadow = caseMesh.receiveShadow = true;
    half.add(caseMesh);

    // --- raised plateau: cover plate + inner rim strip, up to cap base ---
    const RIM_TOP = 4.4; // ~keycap bottom height
    const plateShape = roundedPoly(PLATE_POLY_L.map(([x, y]) => [mx(x * U), y * U]), 0.06 * U);
    const plateGeo = new THREE.ExtrudeGeometry(plateShape, { depth: RIM_TOP, bevelEnabled: false });
    plateGeo.rotateX(Math.PI / 2); // shape y -> +z
    plateGeo.translate(0, RIM_TOP, 0); // spans deck .. RIM_TOP
    const plate = new THREE.Mesh(plateGeo, caseMat);
    plate.castShadow = plate.receiveShadow = true;
    half.add(plate);

    // --- brass heat-set inserts ---
    for (const ins of INSERTS_L) {
      const m = new THREE.Mesh(insertGeo, brassMat);
      m.position.set(mx(ins.x * U), 0.35, ins.y * U);
      half.add(m);
    }

    // --- keys ---
    for (const k of layout[side]) {
      const kg = new THREE.Group();
      const x = k.x * U, z = k.y * U;
      kg.position.set(x, 0.4, z);
      kg.rotation.y = THREE.MathUtils.degToRad(-k.rot);

      // per-key RGB: light escapes the gap under the cap as a bright rim
      // sliver around the cap base, plus a soft spill pooling on the plate
      const ledCoreMat = new THREE.MeshBasicMaterial({
        color: 0x9933ff, transparent: true, opacity: 0.9, map: glowTex,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const led = new THREE.Mesh(ledCoreGeo, ledCoreMat);
      led.rotation.x = -Math.PI / 2;
      led.position.y = 4.24; // just under the cap base -> only the rim shows
      kg.add(led);

      const ledSpillMat = new THREE.MeshBasicMaterial({
        color: 0x9933ff, transparent: true, opacity: 0.3, map: glowTex,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const spill = new THREE.Mesh(ledGeo, ledSpillMat);
      spill.rotation.x = -Math.PI / 2;
      spill.position.y = 0.12;
      kg.add(spill);

      const housing = new THREE.Mesh(housingGeo, housingMat);
      housing.position.y = 1.9;
      kg.add(housing);

      const stem = chocStem(stemMat);
      stem.position.y = 4.1;
      kg.add(stem);

      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.y = 4.3;
      cap.castShadow = true;
      kg.add(cap);

      const legend = new THREE.Mesh(legendGeo, new THREE.MeshBasicMaterial({
        map: legendTexture(k.layers[0][0], k.layers[0][1]),
        transparent: true, depthWrite: false,
      }));
      legend.rotation.x = -Math.PI / 2;
      legend.position.y = 4.3 + CAP_H + 0.18;
      kg.add(legend);

      kg.userData = {
        key: k, cap, led, spill, legend,
        restCapY: cap.position.y,
        restLegendY: legend.position.y,
        press: 0,
        wx: x, wz: z,
      };
      keys.push(kg);
      half.add(kg);
    }

    halves.push(half);
  }

  return { halves, keys };
}
