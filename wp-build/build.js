// Turns the approved V1 mockup (../index.html) into WordPress build assets:
//   home.css, home.js, content.html (page body), fonts/ (self-hosted)
// Images stay as src="img/<name>.jpg" tokens; the WordPress installer swaps them for Media Library URLs.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let js = scripts[scripts.length - 1];
let body = html.match(/<body>([\s\S]*?)<script>/)[1];

function swap(from, to) {
  if (!body.includes(from)) throw new Error('Not found: ' + from.slice(0, 80));
  body = body.split(from).join(to);
}

// Concept ribbon and reviewer notes are mockup-only
body = body.replace(/<div class="ribbon">[\s\S]*?<\/div>\n/, '');
body = body.replace(/\s*<p class="note"[^>]*>[\s\S]*?<\/p>/g, '');

// Brand links go home
body = body.split('<a href="#" class="brand"').join('<a href="/" class="brand"');

// Education: client asked to mention classes are open to stylists from other salons; add curly class photos
swap(
  `<p class="sub">Duality hosts hands-on classes right here in the salon. Our stylists train together on the newest color and cutting techniques, then bring that inspiration straight back to your chair.</p>`,
  `<p class="sub">Duality hosts hands-on classes right here in the salon, and we open them to stylists from other local salons too. Our team trains together on the newest color, cutting and curl techniques, then brings that inspiration straight back to your chair.</p>`
);
swap(
  `<div><b>In-salon classes</b>Hosted at Duality for the whole team</div>`,
  `<div><b>In-salon classes</b>Open to stylists from other local salons</div>`
);
swap(
  `        <div><b>L'ANZA roots</b>Sue spent years as a L'ANZA educator</div>
      </div>
    </div>`,
  `        <div><b>L'ANZA roots</b>Sue spent years as a L'ANZA educator</div>
      </div>
    </div>
    <figure class="edu-photos">
      <img src="img/curly-class-1.jpg" alt="Curly hair class at Duality Salon in Williamsville, NY" loading="lazy">
      <img src="img/curly-class-4.jpg" alt="Stylists learning curly cutting techniques at Duality Salon" loading="lazy">
      <img src="img/curly-class-5.jpg" alt="Hands-on curly hair styling class at Duality Salon" loading="lazy">
      <figcaption>From our recent curly hair class</figcaption>
    </figure>`
);

// Gallery: show the class instead of repeating team portraits
swap(
  `<img src="img/amanda.jpg" alt="Stylist Amanda at her station" loading="lazy" style="object-position:50% 20%">`,
  `<img src="img/curly-class-6.jpg" alt="Curly hair class at Duality Salon" loading="lazy" style="object-position:50% 40%">`
);
swap(
  `<img src="img/leah.jpg" alt="Leah at her styling chair" loading="lazy" style="object-position:50% 40%">`,
  `<img src="img/curly-class-3.jpg" alt="Curly cut demonstration at Duality Salon" loading="lazy" style="object-position:50% 40%">`
);

// Booking bar: the mockup's fields were all plain links to Meevo. Service and Stylist become real
// dropdowns that route to Meevo deep links (filled in home.js once copied from Meevo). Meevo can't
// preselect a date, so Day becomes the opening hours.
const MEEVO = 'https://login.meevo.com/DualitySalonBuffalo/ob?locationId=105068';
swap(
  `      <a class="field" href="${MEEVO}" target="_blank" rel="noopener"><label>Service</label><span class="val">Color or Cut <i>▾</i></span></a>
      <a class="field" href="${MEEVO}" target="_blank" rel="noopener"><label>Stylist</label><span class="val">Any stylist <i>▾</i></span></a>
      <a class="field" href="${MEEVO}" target="_blank" rel="noopener"><label>Day</label><span class="val">Wed – Sat <i>▾</i></span></a>
      <div class="go"><a href="${MEEVO}" target="_blank" rel="noopener" class="btn">Check Availability <span class="arr">→</span></a></div>`,
  `      <div class="field pick"><label for="bb-service">Service</label><span class="val"><select id="bb-service"><option value="">Any service</option><option value="color">Hair Color</option><option value="cut">Haircut</option><option value="redcarpet">Red Carpet Style</option><option value="extensions">Extensions</option></select><i>▾</i></span></div>
      <div class="field pick"><label for="bb-stylist">Stylist</label><span class="val"><select id="bb-stylist"><option value="">Any stylist</option><option value="sue">Sue</option><option value="leah">Leah</option><option value="amanda">Amanda</option><option value="darcy">Darcy</option><option value="marianna">Marianna</option></select><i>▾</i></span></div>
      <div class="field"><label>Open</label><span class="val">Wed – Sat</span><small class="hrs">Wed–Thu 10–8 · Fri 9–5 · Sat 9–3</small></div>
      <div class="go"><a href="${MEEVO}" target="_blank" rel="noopener" class="btn" id="bb-go">Check Availability <span class="arr">→</span></a></div>`
);

js += `
// Booking bar routing. Paste Meevo deep links here (Meevo: Service Category > Main tab,
// employee profile > Online Booking tab). Empty values fall back to the main booking page.
(function(){
  var MEEVO = '${MEEVO}';
  var LINKS = {
    service: { color: '', cut: '', redcarpet: '', extensions: '' },
    stylist: { sue: '', leah: '', amanda: '', darcy: '', marianna: '' }
  };
  var svc = document.getElementById('bb-service');
  var sty = document.getElementById('bb-stylist');
  var go = document.getElementById('bb-go');
  if (!svc || !sty || !go) return;
  // A stylist link skips the stylist step; a service link skips the service steps. Meevo can't combine them,
  // so a chosen stylist wins when both are set.
  function target(){ return (sty.value && LINKS.stylist[sty.value]) || (svc.value && LINKS.service[svc.value]) || MEEVO; }
  function sync(){ go.href = target(); }
  svc.addEventListener('change', sync);
  sty.addEventListener('change', sync);
  go.addEventListener('click', function(){
    sync();
    if (typeof gtag === 'function') {
      gtag('event', 'book_online_click', { placement: 'booking_bar', service: svc.value || 'any', stylist: sty.value || 'any' });
    }
  });
})();
`;

// Price menu panel is tall and narrow: use a portrait crop from the original photo so every
// srcset size is sharp (the landscape version got upscaled from its 768w copy)
swap(
  `<div class="img"><img src="img/marianna-2.jpg" alt="Stylist Marianna styling curly hair at Duality Salon" loading="lazy"></div>`,
  `<div class="img"><img src="img/marianna-portrait.jpg" alt="Stylist Marianna styling curly hair at Duality Salon" loading="lazy"></div>`
);

// Price menu footnote was a review note
swap(
  `<p>Service descriptions drafted for review. Prices from the salon's current menu.</p>`,
  `<p>Not sure what to book? Call us at <a href="tel:+17169988528" style="color:var(--brass-lt)">(716) 998-8528</a> and we will point you to the right service.</p>`
);

// Service-area towns are not pages yet: plain labels instead of dead links
body = body.replace(/<a href="#" class="city">([\s\S]*?)<\/a>/g, '<div class="city">$1</div>');

// Footer: real blog link, drop links to legal pages that do not exist yet
swap(`<li><a href="#">Blog</a></li>`, `<li><a href="/blog-regular/">Blog</a></li>`);
swap(
  `<span><a href="#">Privacy Policy</a> &nbsp;·&nbsp; <a href="#">Terms</a></span>`,
  `<span>1606 Hopkins Road, Williamsville, NY 14221</span>`
);

// Contact form: real Contact Form 7 form (installer replaces the token with the new form ID)
body = body.replace(
  /<form class="form"[^>]*>([\s\S]*?)<div class="fields">[\s\S]*?<\/button>\s*([\s\S]*?)<\/form>/,
  (m, intro, fine) => `<div class="form">${intro}[contact-form-7 id="{{CF7_ID}}" title="Homepage Contact Form"]
      ${fine.trim()}
    </div>`
);

if (/href="#"/.test(body)) throw new Error('Dead href="#" left: ' + body.match(/.{60}href="#".{60}/)[0]);

const extraCss = `
  /* ---------- WordPress build additions ---------- */
  /* WordPress adds width/height attributes to content images; let CSS sizing (aspect-ratio, height:100%) win */
  img{height:auto;}
  .menu .visual img{object-position:50% 35%;}
  .book-bar .field.pick{cursor:pointer;transition:background .2s;}
  .book-bar .field.pick:hover,.book-bar .field.pick:focus-within{background:var(--ivory);}
  .book-bar .field .val{position:relative;}
  .book-bar .field select{appearance:none;-webkit-appearance:none;border:0;background:transparent;width:100%;padding:0 26px 0 0;margin:0;font-family:var(--serif);font-size:22px;font-weight:500;color:var(--ink);cursor:pointer;line-height:1.3;}
  .book-bar .field select:focus{outline:none;}
  .book-bar .field select:focus-visible{outline:2px solid var(--brass-lt);outline-offset:6px;}
  .book-bar .field .val i{position:absolute;right:0;top:50%;transform:translateY(-50%);pointer-events:none;}
  .book-bar .field .hrs{display:block;font-size:12px;color:var(--stone);margin-top:4px;letter-spacing:.02em;}
  .edu .wrap{display:grid;grid-template-columns:minmax(0,560px) minmax(0,1fr);gap:64px;align-items:center;}
  .edu::before{background:linear-gradient(90deg,rgba(22,20,18,.94) 0%,rgba(22,20,18,.86) 55%,rgba(22,20,18,.72) 100%);}
  .edu-photos{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:0;}
  .edu-photos img{position:static;width:100%;height:auto;aspect-ratio:3/4;object-fit:cover;border:1px solid rgba(201,175,134,.35);}
  .edu-photos figcaption{grid-column:1/-1;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#bdb4a8;margin-top:4px;}
  .area .city b{transition:color .2s;}
  .form .wpcf7{margin:0;}
  .form .wpcf7-form-control-wrap{display:block;}
  .form .f input,.form .f select,.form .f textarea{width:100%;}
  .form input.wpcf7-submit{width:100%;margin-top:22px;cursor:pointer;font-family:var(--sans);font-weight:500;font-size:14px;letter-spacing:.2em;text-transform:uppercase;padding:18px 34px;background:var(--ink);color:#fff;border:1px solid var(--ink);transition:background .25s,border-color .25s;}
  .form input.wpcf7-submit:hover{background:var(--brass);border-color:var(--brass);}
  .form .wpcf7-spinner{display:block;margin:12px auto 0;}
  .form .wpcf7-not-valid-tip{font-size:12.5px;color:#a3332b;margin-top:6px;}
  .form .wpcf7 form .wpcf7-response-output{margin:18px 0 0;padding:12px 16px;font-size:14px;border:1px solid var(--brass-lt);background:var(--white);}
  .form .wpcf7 form.sent .wpcf7-response-output{border-color:#4f7a5a;}
  .form .wpcf7 form.invalid .wpcf7-response-output,.form .wpcf7 form.failed .wpcf7-response-output{border-color:#a3332b;}
  .form .screen-reader-response{position:absolute;overflow:hidden;clip:rect(1px,1px,1px,1px);height:1px;width:1px;}
  @media (max-width:900px){
    .edu .wrap{grid-template-columns:1fr;gap:40px;}
    .edu-photos{gap:8px;}
  }
`;

const out = __dirname;
fs.writeFileSync(path.join(out, 'home.css'), css.trim() + '\n' + extraCss);
fs.writeFileSync(path.join(out, 'home.js'), js.trim() + '\n');
fs.writeFileSync(path.join(out, 'content.html'), body.trim() + '\n');
fs.mkdirSync(path.join(out, 'fonts'), { recursive: true });
for (const f of fs.readdirSync(path.join(root, 'fonts'))) {
  fs.copyFileSync(path.join(root, 'fonts', f), path.join(out, 'fonts', f));
}

const imgs = [...new Set([...body.matchAll(/src="img\/([a-z0-9-]+)\.jpg"/g)].map(m => m[1]))];
fs.writeFileSync(path.join(out, 'images.json'), JSON.stringify(imgs, null, 1));
console.log('css', fs.statSync(path.join(out, 'home.css')).size, 'js', js.length, 'content', body.length, 'images', imgs.join(','));
