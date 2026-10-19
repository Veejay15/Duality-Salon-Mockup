// Duality Salon logo generator: outlines the emblem and lockups to pure SVG paths (no fonts needed to open them).
// Usage: node gen.js <outDir> [blueHex]
//   Oct 15 2026: D in storefront sign blue #3B7FD9 (sampled from "Duality Salon Front Sign.png").
//   Oct 19 2026: client asked for a more silvery blue, between the sign and V2B's grey (#939FA9): #678FC1.
const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');

const OUT = process.argv[2];
const BLUE = process.argv[3] || '#678FC1';
const serif = opentype.loadSync(path.join(__dirname, 'cormorant-500.ttf'));
const sans = opentype.loadSync(path.join(__dirname, 'jost-500.ttf'));

const THEMES = {
  light: { ink: '#161412', sub: '#72695F' },
  dark: { ink: '#F8F4EE', sub: '#A39A8F' },
};

const f = n => +n.toFixed(2);

function glyphRuns(font, text, size, spacing) {
  const scale = size / font.unitsPerEm;
  const glyphs = font.stringToGlyphs(text);
  const out = [];
  let x = 0;
  glyphs.forEach((g, i) => {
    const w = g.advanceWidth * scale;
    out.push({ g, x, w });
    const kern = i < glyphs.length - 1 ? font.getKerningValue(g, glyphs[i + 1]) * scale : 0;
    x += w + kern + (i < glyphs.length - 1 ? spacing : 0);
  });
  return { out, length: x };
}

// Text on a circle. top=true reads over the top (tops outward); top=false along the bottom (tops inward).
// shift moves the run's centre along the arc (positive = towards the right).
function arcText(font, text, size, spacing, r, cx, cy, top, shift = 0) {
  const { out, length } = glyphRuns(font, text, size, spacing);
  return out.map(({ g, x, w }) => {
    const s = x + w / 2 - length / 2 + shift;
    const theta = top ? -Math.PI / 2 + s / r : Math.PI / 2 - s / r;
    const rot = (top ? theta + Math.PI / 2 : theta - Math.PI / 2) * 180 / Math.PI;
    const px = cx + r * Math.cos(theta), py = cy + r * Math.sin(theta);
    return `<path transform="translate(${f(px)} ${f(py)}) rotate(${f(rot)})" d="${g.getPath(-w / 2, 0, size).toPathData(2)}"/>`;
  }).join('');
}

const runLength = (font, text, size, spacing) => glyphRuns(font, text, size, spacing).length;

function lineText(font, text, size, spacing, x0, baseline) {
  return glyphRuns(font, text, size, spacing).out
    .map(({ g, x }) => `<path d="${g.getPath(x0 + x, baseline, size).toPathData(2)}"/>`).join('');
}

function centeredGlyph(font, ch, size, cx, baseline) {
  const g = font.charToGlyph(ch);
  const w = g.advanceWidth * size / font.unitsPerEm;
  return g.getPath(cx - w / 2, baseline, size).toPathData(2);
}

// Open shears, horizontal, centred on (0,0): finger loops left, blades right. Thin line art like the site icons.
function scissors(color, sw) {
  return `<g fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">
    <ellipse cx="-5.6" cy="-2.6" rx="2.3" ry="1.9"/>
    <ellipse cx="-5.6" cy="2.6" rx="2.3" ry="1.9"/>
    <path d="M-3.4 -1.9 L8 2.3"/>
    <path d="M-3.4 1.9 L8 -2.3"/>
  </g>
  <circle cx="0.9" cy="0" r="0.75" fill="${color}"/>`;
}

const rings = t => `<circle cx="60" cy="60" r="56" fill="none" stroke="${t.ink}" stroke-width="2.2"/>
  <circle cx="60" cy="60" r="49.5" fill="none" stroke="${t.ink}" stroke-width=".8"/>`;
const bigD = () => `<path fill="${BLUE}" d="${centeredGlyph(serif, 'D', 56, 60, 80)}"/>`;

// Same geometry as the homepage <symbol id="emblem"> (viewBox 0 0 120 120)
function emblemGroup(t, ox = 0, oy = 0, s = 1) {
  return `<g transform="translate(${ox} ${oy}) scale(${s})">
  ${rings(t)}
  <g fill="${t.ink}">${arcText(sans, 'DUALITY', 10.5, 3.2, 38, 60, 60, true)}</g>
  <g fill="${t.ink}">${arcText(sans, 'EST. 2020', 8.5, 2.6, 47, 60, 60, false)}</g>
  ${bigD()}
</g>`;
}

// Variant requested Oct 19: "DUALITY SALON" over the top, scissors at the bottom between EST. and 2020
function emblemSalonGroup(t, ox = 0, oy = 0, s = 1) {
  const gap = 14;
  const lEst = runLength(sans, 'EST.', 8.5, 2.6), l2020 = runLength(sans, '2020', 8.5, 2.6);
  return `<g transform="translate(${ox} ${oy}) scale(${s})">
  ${rings(t)}
  <g fill="${t.ink}">${arcText(sans, 'DUALITY SALON', 8.6, 1.95, 38, 60, 60, true)}</g>
  <g fill="${t.ink}">${arcText(sans, 'EST.', 8.5, 2.6, 47, 60, 60, false, -(gap + lEst / 2))}</g>
  <g fill="${t.ink}">${arcText(sans, '2020', 8.5, 2.6, 47, 60, 60, false, gap + l2020 / 2)}</g>
  <g transform="translate(60 103.6) scale(0.95)">${scissors(t.ink, 0.85)}</g>
  ${bigD()}
</g>`;
}

const svg = (w, h, body, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${title}">
<title>${title}</title>
${body}
</svg>
`;

fs.mkdirSync(OUT, { recursive: true });
const files = [];

for (const [name, t] of Object.entries(THEMES)) {
  files.push([`duality-emblem-${name}.svg`, svg(128, 128, emblemGroup(t, 4, 4), 'Duality Salon emblem')]);
  files.push([`duality-salon-emblem-scissors-${name}.svg`, svg(128, 128, emblemSalonGroup(t, 4, 4), 'Duality Salon emblem with scissors')]);

  // Horizontal lockup, matching the website header (emblem 58px, wordmark 30px, sub-line 10.5px)
  const word = lineText(serif, 'DUALITY', 30, 6, 72, 31);
  const sub = lineText(sans, 'SALON · WILLIAMSVILLE', 10.5, 4.41, 73, 46.5);
  const width = Math.ceil(72 + Math.max(runLength(serif, 'DUALITY', 30, 6), runLength(sans, 'SALON · WILLIAMSVILLE', 10.5, 4.41) + 1) + 4);
  files.push([`duality-logo-horizontal-${name}.svg`, svg(width, 60, `${emblemGroup(t, 1, 1, 58 / 120)}
<g fill="${t.ink}">${word}</g>
<g fill="${t.sub}">${sub}</g>`, 'Duality Salon logo')]);
}

// Favicon / site icon: simplified so it reads from 16 to 512 px
files.push(['duality-favicon.svg', svg(512, 512, `<circle cx="256" cy="256" r="248" fill="#F8F4EE"/>
<circle cx="256" cy="256" r="226" fill="none" stroke="#161412" stroke-width="28"/>
<path fill="${BLUE}" d="${centeredGlyph(serif, 'D', 430, 256, 392)}"/>`, 'Duality Salon icon')]);

for (const [n, c] of files) fs.writeFileSync(path.join(OUT, n), c);
console.log(`blue ${BLUE}\n` + files.map(([n, c]) => `${n} ${c.length}b`).join('\n'));
