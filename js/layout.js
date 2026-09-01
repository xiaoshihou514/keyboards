// Key layout data transcribed from the real board's VIA config (real/*.jpg)
// Units: key units (1u = 17.5mm pitch). x -> right, y -> down.

export const U = 17.5; // mm per key unit

// columnar stagger per column (in u), measured from the VIA screenshots
const STAGGER_L = [0.0, 0.0, -0.4, -0.6, -0.3, -0.2];
const STAGGER_R = [-0.2, -0.3, -0.6, -0.4, 0.0, 0.0];

// legend entry: [main, sub, code]

// ---------------- LAYER 0 ----------------
const L0_LEFT = [
  [['`~', '', 'Backquote'], ['1!', '', 'Digit1'], ['2@', '', 'Digit2'], ['3#', '', 'Digit3'], ['4$', '', 'Digit4'], ['5%', '', 'Digit5']],
  [['Tab', '', 'Tab'], ['Q', '', 'KeyQ'], ['W', '', 'KeyW'], ['E', '', 'KeyE'], ['R', '', 'KeyR'], ['T', '', 'KeyT']],
  [['Ctrl', '', 'ControlLeft'], ['A', '', 'KeyA'], ['S', '', 'KeyS'], ['D', '', 'KeyD'], ['F', '', 'KeyF'], ['G', '', 'KeyG']],
  [['Esc', '', 'Escape'], ['Z', '', 'KeyZ'], ['X', '', 'KeyX'], ['C', '', 'KeyC'], ['V', '', 'KeyV'], ['B', '', 'KeyB']],
];
const L0_RIGHT = [
  [['6^', '', 'Digit6'], ['7&', '', 'Digit7'], ['8*', '', 'Digit8'], ['9(', '', 'Digit9'], ['0)', '', 'Digit0'], ['Bksp', '', 'Backspace']],
  [['Y', '', 'KeyY'], ['U', '', 'KeyU'], ['I', '', 'KeyI'], ['O', '', 'KeyO'], ['P', '', 'KeyP'], ['\\|', '', 'Backslash']],
  [['H', '', 'KeyH'], ['J', '', 'KeyJ'], ['K', '', 'KeyK'], ['L', '', 'KeyL'], [';:', '', 'Semicolon'], ['\'"', '', 'Quote']],
  [['N', '', 'KeyN'], ['M', '', 'KeyM'], [',<', '', 'Comma'], ['.>', '', 'Period'], ['/?', '', 'Slash'], ['TO1', '', null]],
];

// ---------------- LAYER 1 ----------------
const L1_LEFT = [
  [['UG', 'Tog', null], ['F1', '', 'F1'], ['F2', '', 'F2'], ['F3', '', 'F3'], ['F4', '', 'F4'], ['F5', '', 'F5']],
  [['LC', 'Tab', null], ['', '', null], ['LC(', 'Bksp', null], ['End', '', 'End'], ['', '', null], ['', '', null]],
  [['UG', 'Next', null], ['', '', null], ['', '', null], ['Home', '', 'Home'], ['→', '', 'ArrowRight'], ['', '', null]],
  [['UG', 'Prev', null], ['', '', null], ['', '', null], ['LC+LS', '(C)', null], ['LC+LS', '(V)', null], ['←', '', 'ArrowLeft']],
];
const L1_RIGHT = [
  [['F6', '', 'F6'], ['F7', '', 'F7'], ['F8', '', 'F8'], ['F9', '', 'F9'], ['F10', '', 'F10'], ['F11', '', 'F11']],
  [['', '', null], ['', '', null], ['-_', '', 'Minus'], ['=+', '', 'Equal'], ['↑', '', 'ArrowUp'], ['F12', '', 'F12']],
  [['Bksp', '', 'Backspace'], ['PgDn', '', 'PageDown'], ['PgUp', '', 'PageUp'], ['[{', '', 'BracketLeft'], [']}', '', 'BracketRight'], ['', '', null]],
  [['↓', '', 'ArrowDown'], ['', '', null], ['', '', null], ['', '', null], ['', '', null], ['TO2', '', null]],
];

// ---------------- LAYER 2 ----------------
const L2_LEFT = [
  [['BT', 'CLR', null], ['F21', '', null], ['F20', '', null], ['', '', null], ['', '', null], ['', '', null]],
  [['', '', null], ['', '', null], ['↑', '', 'ArrowUp'], ['', '', null], ['', '', null], ['', '', null]],
  [['', '', null], ['←', '', 'ArrowLeft'], ['↓', '', 'ArrowDown'], ['→', '', 'ArrowRight'], ['LC', '(→)', null], ['', '', null]],
  [['Esc', '', 'Escape'], ['', '', null], ['', '', null], ['', '', null], ['', '', null], ['LC', '(←)', null]],
];
const L2_RIGHT = [
  [['⏮', '', null], ['⏯', '', null], ['⏭', '', null], ['⏄', '', null], ['Vol-', '', null], ['Vol+', '', null]],
  [['', '', null], ['', '', null], ['', '', null], ['', '', null], ['', '', null], ['', '', null]],
  [['', '', null], ['', '', null], ['', '', null], ['', '', null], ['', '', null], ['', '', null]],
  [['', '', null], ['', '', null], ['', '', null], ['', '', null], ['', '', null], ['TO0', '', null]],
];

// extra keys per layer [main, sub]
const EXTRA_L = [
  [['LCLK', ''], ['UG', 'Bri+'], ['', '']],   // x 3.1
  [['RCLK', ''], ['UG', 'Bri-'], ['', '']],   // x 4.1
  [['↑', ''], ['', ''], ['', '']],            // x 5.1
  [['⊞', ''], ['⊞', ''], ['⊞', '']],          // thumb 1
  [['Spc', ''], ['▷', ''], ['▷', '']],        // thumb 2
];
const EXTRA_R = [
  [['MO2', ''], ['', ''], ['', '']],
  [['⇧', ''], ['', ''], ['', '']],
  [['Del', ''], ['', ''], ['', '']],
  [['MO1', ''], ['◁', ''], ['◁', '']],
  [['Enter', ''], ['Enter', ''], ['Enter', '']],
];

// bottom rows + thumb fan positions (from the top-view photo).
// Bottom row continues each column's stagger directly below row 3 (normal
// row spacing — the case is one continuous piece, no gap). Thumbs fan out
// rotated from the bottom-inner corner.
const EXTRA_POS_L = [
  { x: 3.5, y: 3.9, rot: 0, code: null },              // below col 3
  { x: 4.5, y: 4.2, rot: 0, code: null },              // below col 4
  { x: 5.5, y: 4.3, rot: 0, code: 'ArrowUp' },         // below col 5
  { x: 6.55, y: 5.15, rot: 22, code: 'MetaLeft' },     // thumb 1
  { x: 7.3, y: 5.75, rot: 32, code: 'Space' },         // thumb 2
];
// right half extras = true mirror of the left half about x = 3.0u
const EXTRA_POS_R = [
  { x: 0.5, y: 4.3, rot: 0, code: null },              // MO2  (mirror of col5 extra)
  { x: 1.5, y: 4.2, rot: 0, code: 'ShiftRight' },      // ⇧
  { x: 2.5, y: 3.9, rot: 0, code: 'Delete' },          // Del
  { x: -1.3, y: 5.75, rot: -32, code: null },          // MO1 (outer thumb)
  { x: -0.55, y: 5.15, rot: -22, code: 'Enter' },      // Enter
];

function grid(stagger, rows) {
  const keys = [];
  rows.forEach((row, r) => {
    row.forEach((k, c) => {
      if (!k) return;
      keys.push({
        x: c + 0.5, y: r + stagger[c] + 0.5,
        legend: k[0], sub: k[1] || '', code: k[2] || null,
      });
    });
  });
  return keys;
}

function merge(g0, g1, g2, extraPos, extraLegends) {
  const m1 = new Map(g1.map(k => [`${k.x}|${k.y}`, k]));
  const m2 = new Map(g2.map(k => [`${k.x}|${k.y}`, k]));
  const out = g0.map(k0 => {
    const k1 = m1.get(`${k0.x}|${k0.y}`);
    const k2 = m2.get(`${k0.x}|${k0.y}`);
    return {
      x: k0.x, y: k0.y, rot: 0, code: k0.code,
      layers: [
        [k0.legend, k0.sub],
        k1 ? [k1.legend, k1.sub] : ['', ''],
        k2 ? [k2.legend, k2.sub] : ['', ''],
      ],
    };
  });
  extraPos.forEach((p, i) => out.push({ ...p, layers: extraLegends[i] }));
  return out;
}

export function buildLayout() {
  const left = merge(
    grid(STAGGER_L, L0_LEFT), grid(STAGGER_L, L1_LEFT), grid(STAGGER_L, L2_LEFT),
    EXTRA_POS_L, EXTRA_L,
  );
  const right = merge(
    grid(STAGGER_R, L0_RIGHT), grid(STAGGER_R, L1_RIGHT), grid(STAGGER_R, L2_RIGHT),
    EXTRA_POS_R, EXTRA_R,
  );
  return { left, right };
}

// Case outline (left half; right half is mirrored via scale.x = -1).
// Units: u, y down. Traced from the top-view photo: one continuous body —
// diagonal bottom edge rising toward the outer corner with a big chamfer,
// and a deeper rectangular thumb bay at the bottom-inner next to the tall
// blank cover plate.
export const CASE_OUTLINE_L = [
  [-0.70, -0.55],
  [-0.32, -1.18],
  [5.85, -1.18],
  [6.38, -0.72],
  [8.42, -0.72],
  [8.88, -0.28],
  [8.88, 4.35],
  [8.42, 4.82],
  [8.42, 6.05],
  [7.72, 6.72],
  [6.10, 6.72],
  [5.55, 6.18],
  [5.55, 5.42],
  [0.30, 4.72],
  [-0.70, 3.75],
];

// blank cover plate region (inner side), slightly smoother inset panel
export const PLATE_RECT_L = { x0: 6.38, y0: -0.45, x1: 8.6, y1: 4.35 };

// brass heat-set insert visible in the photo next to the thumb fan
export const INSERTS_L = [{ x: 6.02, y: 4.38 }];
