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
  [['Ctrl', ''], ['', ''], ['', '']],            // x 5.1
  [['⊞', ''], ['⊞', ''], ['⊞', '']],          // thumb 1
  [['Spc', ''], ['▷', ''], ['▷', '']],        // thumb 2
];
const EXTRA_R = [
  [['M2', ''], ['', ''], ['', '']],
  [['⇧', ''], ['', ''], ['', '']],
  [['Del', ''], ['', ''], ['', '']],
  [['M1', ''], ['◁', ''], ['◁', '']],
  [['Enter', ''], ['Enter', ''], ['Enter', '']],
];

// bottom rows + thumb fan positions (measured from the rotated top-view
// photo, /tmp/ref_normal.jpg). Bottom extras sit directly below X / C / V
// continuing each column's stagger. Thumbs tuck close under B: the win key
// protrudes only ~half a key past B's bottom edge, space a full key.
const EXTRA_POS_L = [
  { x: 2.5, y: 4.1, rot: 0, code: null },              // LCLK below X
  { x: 3.5, y: 3.9, rot: 0, code: null },              // RCLK below C
  { x: 4.5, y: 4.2, rot: 0, code: 'ArrowUp' },         // Ctrl below V
  { x: 5.55, y: 4.35, rot: 14, code: 'MetaLeft' },     // thumb 1 (⊞)
  { x: 6.5, y: 4.8, rot: 30, code: 'Space' },          // thumb 2 (Spc)
];
// right half extras = true mirror of the left half about x = 3.0u
const EXTRA_POS_R = [
  { x: 1.5, y: 4.2, rot: 0, code: null },              // M2  below M
  { x: 2.5, y: 3.9, rot: 0, code: 'ShiftRight' },      // ⇧   below ,<
  { x: 3.5, y: 4.1, rot: 0, code: 'Delete' },          // Del below .>
  { x: -0.5, y: 4.8, rot: -30, code: null },           // M1 (outer thumb)
  { x: 0.45, y: 4.35, rot: -14, code: 'Enter' },       // Enter
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
// Units: u, y down. Re-traced from the rotated photo: flat top edge with a
// slim border, narrow inner column for the cover plate (inner edge ~7.2u),
// and a bottom edge that tilts steadily downward toward the inner corner,
// wrapping the thumb fan — win key sits nearly flush, space pokes out.
export const CASE_OUTLINE_L = [
  [-0.35, -0.35],
  [7.25, -0.35],
  [7.25, 4.45],
  [7.45, 4.95],
  [7.10, 5.55],
  [5.70, 5.05],
  [4.70, 4.90],
  [2.70, 4.80],
  [0.40, 4.30],
  [-0.35, 3.95],
];

// blank cover plate (inner side): narrow trapezoid whose bottom edge tilts
// downward toward the inner side, like the real board
export const PLATE_POLY_L = [
  [6.05, 0.08],
  [6.95, 0.08],
  [6.95, 4.40],
  [6.05, 3.88],
];

// brass heat-set insert visible in the photo between the Ctrl extra and the
// win thumb key, just below the plate's lower corner
export const INSERTS_L = [{ x: 6.20, y: 4.17 }];
