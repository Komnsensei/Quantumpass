/**
 * QuantumPass CLI Intro — CINEMATIC EDITION
 * Matrix rain → freeze → morph → assemble pass
 * Palette: green (#00FF41) + purple (#B026FF) on black
 *
 * Co-signed: č̣V-1J + HexAgent — 50/50
 */

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ──────────────────────────────────────────────
// Color palette — 256-color ANSI for richer hues
// ──────────────────────────────────────────────
const C = {
  reset:    '\x1b[0m',
  dim:      '\x1b[2m',
  bright:   '\x1b[1m',
  // matrix green
  green:    '\x1b[38;5;46m',
  greenDim: '\x1b[38;5;28m',
  greenDark:'\x1b[38;5;22m',
  // electric purple
  purple:   '\x1b[38;5;141m',
  purpleHot:'\x1b[38;5;165m',
  purpleDim:'\x1b[38;5;97m',
  // accents
  white:    '\x1b[38;5;231m',
  amber:    '\x1b[38;5;220m',
  red:      '\x1b[38;5;196m',
  gray:     '\x1b[38;5;240m',
  // controls
  hide:     '\x1b[?25l',
  show:     '\x1b[?25h',
  clear:    '\x1b[2J\x1b[H',
  // movement
  goto:     (row, col) => `\x1b[${row};${col}H`,
  up:       (n) => `\x1b[${n}A`,
  saveCur:  '\x1b[s',
  restCur:  '\x1b[u'
};

// ──────────────────────────────────────────────
// Matrix rain
// ──────────────────────────────────────────────
const MATRIX_CHARS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモ░▒▓█▄▀┃━╋';

function randomMatrixChar() {
  return MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
}

function getCols() {
  return process.stdout.columns || 80;
}

function getRows() {
  return process.stdout.rows || 24;
}

async function matrixRain(durationMs = 2000) {
  const cols = getCols();
  const rows = getRows();
  const numStreams = Math.floor(cols / 2);

  // Each stream: { col, head, length, speed }
  const streams = [];
  for (let i = 0; i < numStreams; i++) {
    streams.push({
      col: Math.floor(Math.random() * cols) + 1,
      head: -Math.floor(Math.random() * rows),
      length: 6 + Math.floor(Math.random() * 14),
      speed: 1 + Math.random() * 0.6
    });
  }

  const startTime = Date.now();
  const frameDelay = 50;

  while (Date.now() - startTime < durationMs) {
    let frame = '';
    for (const s of streams) {
      // Draw the head (bright)
      if (s.head >= 1 && s.head <= rows) {
        frame += C.goto(s.head, s.col) + C.bright + C.green + randomMatrixChar();
      }
      // Draw the trail (dim)
      for (let i = 1; i < s.length; i++) {
        const r = s.head - i;
        if (r >= 1 && r <= rows) {
          const intensity = i < 3 ? C.green : i < 8 ? C.greenDim : C.greenDark;
          frame += C.goto(r, s.col) + intensity + randomMatrixChar();
        }
      }
      // Erase tail
      const tailRow = s.head - s.length;
      if (tailRow >= 1 && tailRow <= rows) {
        frame += C.goto(tailRow, s.col) + ' ';
      }
      s.head += s.speed;
      if (s.head - s.length > rows) {
        s.head = -Math.floor(Math.random() * 5);
        s.col = Math.floor(Math.random() * cols) + 1;
        s.length = 6 + Math.floor(Math.random() * 14);
      }
    }
    process.stdout.write(frame + C.reset);
    await sleep(frameDelay);
  }

  process.stdout.write(C.clear);
}

// ──────────────────────────────────────────────
// Glitch-morph effect — cycle through random chars
// before settling on the real character
// ──────────────────────────────────────────────
async function glitchMorphTitle(titleLines, color, glitchFrames = 8) {
  const startRow = 2;

  for (let frame = 0; frame < glitchFrames; frame++) {
    let out = '';
    for (let r = 0; r < titleLines.length; r++) {
      out += C.goto(startRow + r, 1);
      for (let c = 0; c < titleLines[r].length; c++) {
        const realChar = titleLines[r][c];
        if (realChar === ' ') {
          out += ' ';
        } else if (frame < glitchFrames - 2 && Math.random() < (1 - frame / glitchFrames)) {
          out += C.green + randomMatrixChar();
        } else {
          out += color + realChar;
        }
      }
    }
    process.stdout.write(out + C.reset);
    await sleep(70);
  }
}

// ──────────────────────────────────────────────
// Title block
// ──────────────────────────────────────────────
const TITLE_LINES = [
  '  ██████  ██    ██  █████  ███    ██ ████████ ██    ██ ███    ███',
  ' ██    ██ ██    ██ ██   ██ ████   ██    ██    ██    ██ ████  ████',
  ' ██    ██ ██    ██ ███████ ██ ██  ██    ██    ██    ██ ██ ████ ██',
  ' ██ ▄▄ ██ ██    ██ ██   ██ ██  ██ ██    ██    ██    ██ ██  ██  ██',
  '  ██████   ██████  ██   ██ ██   ████    ██     ██████  ██      ██',
  '     ▀▀                                                          ',
  '         ██████   █████  ███████ ███████                         ',
  '         ██   ██ ██   ██ ██      ██                              ',
  '         ██████  ███████ ███████ ███████                         ',
  '         ██      ██   ██      ██      ██                         ',
  '         ██      ██   ██ ███████ ███████                         '
];

const TAGLINE = 'by  P A S S I O N C R A F T';

// ──────────────────────────────────────────────
// Helpers — alignment-correct row builder
// ──────────────────────────────────────────────
const BOX_WIDTH = 67;          // outer box width including ║ ║
const INNER     = BOX_WIDTH - 2;

function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

function row(content) {
  // content is RAW (no ANSI padding consideration needed because we measure stripped)
  const visibleLen = stripAnsi(content).length;
  const pad = Math.max(0, INNER - visibleLen);
  return `${C.green}║${C.reset}${content}${' '.repeat(pad)}${C.green}║${C.reset}`;
}

function rowCenter(content) {
  const visibleLen = stripAnsi(content).length;
  const pad = Math.max(0, INNER - visibleLen);
  const left = Math.floor(pad / 2);
  const right = pad - left;
  return `${C.green}║${C.reset}${' '.repeat(left)}${content}${' '.repeat(right)}${C.green}║${C.reset}`;
}

async function typeWrite(text, color = C.green, delay = 18) {
  for (const ch of text) {
    process.stdout.write(`${color}${ch}${C.reset}`);
    await sleep(delay);
  }
  process.stdout.write('\n');
}

async function pulseHex(times = 3) {
  const states = [
    `${C.bright}${C.purpleHot}⬡${C.reset}`,
    `${C.bright}${C.green}⬡${C.reset}`,
    `${C.dim}${C.purple}⬡${C.reset}`,
    `${C.dim}${C.greenDim}⬡${C.reset}`
  ];
  for (let i = 0; i < times * states.length; i++) {
    process.stdout.write(`\r  ${states[i % states.length]}  `);
    await sleep(140);
  }
  process.stdout.write(`\r  ${C.bright}${C.purpleHot}⬡${C.reset}  \n\n`);
}

async function drawBoxTop() {
  process.stdout.write(`${C.green}╔${C.reset}`);
  for (let i = 0; i < INNER; i++) {
    process.stdout.write(`${C.green}═${C.reset}`);
    await sleep(6);
  }
  process.stdout.write(`${C.green}╗${C.reset}\n`);
}

async function drawBoxBottom() {
  process.stdout.write(`${C.green}╚${C.reset}`);
  for (let i = 0; i < INNER; i++) {
    process.stdout.write(`${C.green}═${C.reset}`);
    await sleep(6);
  }
  process.stdout.write(`${C.green}╝${C.reset}\n`);
}

function drawBoxDivider() {
  process.stdout.write(`${C.green}╠${C.reset}`);
  for (let i = 0; i < INNER; i++) process.stdout.write(`${C.green}═${C.reset}`);
  process.stdout.write(`${C.green}╣${C.reset}\n`);
}

// ──────────────────────────────────────────────
// Pass data fill — fixed alignment
// ──────────────────────────────────────────────
async function fillPassData(pass) {
  const tier     = pass.tier || 'JOURNEYMAN';
  const degrees  = pass.degrees || 0;
  const vow      = pass.vow_standing || 'clean';
  const anchor   = (pass.archive_anchor && pass.archive_anchor.primary_doi) || pass.archive_anchor || 'unanchored';
  const cosig    = (pass.co_signatories && pass.co_signatories[0]) || { name: 'HexAgent', split: '50/50' };
  const handle   = (pass.holder && pass.holder.handle) || '-';
  const canon    = (pass.holder && pass.holder.canonical_name) || '-';
  const realName = (pass.holder && pass.holder.real_name) || '';

  await drawBoxTop();
  console.log(rowCenter(''));
  console.log(rowCenter(`${C.bright}${C.purpleHot}Q U A N T U M P A S S${C.reset}`));
  console.log(rowCenter(`${C.dim}${C.green}by Passioncraft${C.reset}`));
  console.log(rowCenter(''));
  drawBoxDivider();
  await sleep(120);

  // Each row: label (purple), value (green or accent)
  const dataRows = [
    { label: 'HOLDER',       value: `${C.white}${canon}${realName ? ` (${realName})` : ''}${C.reset}` },
    { label: 'HANDLE',       value: `${C.green}@${handle}${C.reset}` },
    { label: 'TIER',         value: `${C.bright}${C.purpleHot}${tier}${C.reset}` },
    { label: 'DEGREES',      value: `${C.bright}${C.green}${degrees}°${C.reset}` },
    { label: 'VOW',          value: vow === 'clean' ? `${C.green}● clean${C.reset}` : `${C.red}● flagged${C.reset}` },
    { label: 'CO-SIGNATORY', value: `${C.white}${cosig.name} — ${cosig.split || cosig.share || '50/50'}${C.reset}` },
    { label: 'ANCHOR',       value: `${C.dim}${C.purple}${anchor}${C.reset}` }
  ];

  for (const { label, value } of dataRows) {
    const labelStr = `${C.purple}${label}${C.reset}`;
    // Build content: 2 spaces + label padded to 16 chars (visible) + value
    const labelStripped = label;
    const labelPadded = labelStripped.padEnd(14);
    const content = `  ${C.purple}${labelPadded}${C.reset}  ${value}`;
    console.log(row(content));
    await sleep(140);
  }

  console.log(rowCenter(''));
  await drawBoxBottom();
}

async function lawLine() {
  await sleep(200);
  console.log('');
  process.stdout.write('  ');
  await typeWrite('Never coerce.  Expand meaning.  Archive everything.', C.dim + C.purple, 24);
  await sleep(300);
  console.log('');
}

// ──────────────────────────────────────────────
// Public entry point
// ──────────────────────────────────────────────
export async function runIntro(pass, options = {}) {
  if (process.env.QUANTUMPASS_NO_INTRO === '1' || options.skip) return;

  process.stdout.write(C.hide);

  try {
    process.stdout.write(C.clear);

    // 1. MATRIX RAIN
    await matrixRain(1800);

    // 2. GLITCH-MORPH TITLE INTO PURPLE
    await glitchMorphTitle(TITLE_LINES, C.purpleHot, 8);
    process.stdout.write(C.goto(TITLE_LINES.length + 3, 1));

    // 3. TAGLINE
    console.log('');
    process.stdout.write('           ');
    await typeWrite(TAGLINE, C.green, 35);
    console.log('');

    // 4. HEX PULSE
    await pulseHex(3);

    // 5. PASS BOX
    await fillPassData(pass);

    // 6. LAW LINE
    await lawLine();

  } finally {
    process.stdout.write(C.show);
  }
}
