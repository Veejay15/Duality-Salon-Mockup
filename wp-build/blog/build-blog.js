// Builds the shared header / CTA / footer partials for the 2026 blog templates from the approved
// homepage markup (../content.html, output of ../build.js), so the blog always matches the homepage.
// Homepage in-page anchors become real site pages, matching the live 2026 service pages.
// Run after ../build.js:  node wp-build/blog/build-blog.js
const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'content.html'), 'utf8');

function between(startMarker, endMarker, includeEnd = true) {
  const s = content.indexOf(startMarker);
  const e = content.indexOf(endMarker, s);
  if (s < 0 || e < 0) throw new Error('Marker not found: ' + (s < 0 ? startMarker : endMarker));
  return content.slice(s, includeEnd ? e + endMarker.length : e);
}

// Section anchors on the homepage -> pages on the site ({{SITE}} = home URL, filled in by PHP)
const LINKS = {
  '#services': '{{SITE}}services/',
  '#menu': '{{SITE}}services/',
  '#team': '{{SITE}}about/',
  '#gallery': '{{SITE}}our-gallery/',
  '#contact': '{{SITE}}contact/',
  '/blog-regular/': '{{SITE}}blog/',
  '/': '{{SITE}}',
};
function relink(html) {
  let out = html.replace(/href="([^"]+)"/g, (m, href) => (href in LINKS ? `href="${LINKS[href]}"` : m));
  out = out.replace(/ class="active"/g, '');
  const dead = out.match(/href="#(?!emblem|i-check|arcTop|arcBot)[^"]*"/);
  if (dead) throw new Error('Unmapped in-page link: ' + dead[0]);
  return out;
}

const header = relink(content.slice(0, content.indexOf('</header>') + '</header>'.length));
const cta = relink(between('<!-- ============ CTA BAND', '</section>'));
const footer = relink(content.slice(content.indexOf('<!-- ============ FOOTER')));

if (!header.includes('<symbol id="emblem"')) throw new Error('Header is missing the emblem symbol');
if (!footer.includes('class="mbar"')) throw new Error('Footer is missing the mobile bar');

const dir = path.join(__dirname, 'partials');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'header.html'), header.trim() + '\n');
fs.writeFileSync(path.join(dir, 'cta.html'), cta.trim() + '\n');
fs.writeFileSync(path.join(dir, 'footer.html'), footer.trim() + '\n');
console.log('header', header.length, 'cta', cta.length, 'footer', footer.length);
