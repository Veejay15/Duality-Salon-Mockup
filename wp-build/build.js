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
  `      <div class="field pick"><label for="bb-service">Service</label><span class="val"><select id="bb-service"><option value="">Any service</option><option value="color">Hair Color</option><option value="cut">Haircut</option><option value="finishing">Finishing &amp; Extras</option><option value="occasion">Bridal &amp; Special Occasion</option></select><i>▾</i></span></div>
      <div class="field pick"><label for="bb-stylist">Stylist</label><span class="val"><select id="bb-stylist"><option value="">Any stylist</option><option value="sue">Sue</option><option value="leah">Leah</option><option value="amanda">Amanda</option><option value="darcy">Darcy</option><option value="marianna">Marianna</option></select><i>▾</i></span></div>
      <div class="field"><label>Open</label><span class="val">Wed – Sat</span><small class="hrs">Wed–Thu 10–8 · Fri 9–5<br>Sat 9–3 · Tue by appointment</small></div>
      <div class="go"><a href="${MEEVO}" target="_blank" rel="noopener" class="btn" id="bb-go">Check Availability <span class="arr">→</span></a></div>`
);

js += `
// Booking bar routing. Paste Meevo deep links here (Meevo: Service Category > Main tab,
// employee profile > Online Booking tab). Empty values fall back to the main booking page.
(function(){
  var MEEVO = '${MEEVO}';
  var LINKS = {
    service: { color: '', cut: '', finishing: '', occasion: '' },
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

// ---------- Client edits, Oct 2026 ("Edit Duality Salon Homepage") ----------

// Services: four cards become three (Extensions and Red Carpet Style out, Finishing & Extras in),
// and the "Starting at $35 / $26 / $60" anchors go: the salon felt they made it look cheap.
body = body.replace(/\s*<div class="from">[\s\S]*?<\/div>/g, '');
swap(
  `<ul><li>Balayage<b>$100 +</b></li><li>Complete Highlight<b>$90</b></li><li>Color Retouch<b>$62 +</b></li></ul>`,
  `<ul><li>Balayage &amp; lived-in color</li><li>Highlights &amp; face framing</li><li>Color retouch &amp; grey coverage</li><li>Fashion &amp; vivid color</li></ul>`
);
swap(
  `<ul><li>Haircut + Blow Dry<b>$52 +</b></li><li>Short Clipper Cut<b>$32 +</b></li><li>Kid's Cut (under 12)<b>$26 +</b></li></ul>`,
  `<ul><li>Precision cut &amp; blowout</li><li>Curly &amp; textured cuts</li><li>Short &amp; clipper cuts</li><li>Kids' cuts</li></ul>`
);
body = body.replace(
  /<div class="svc reveal d2">[\s\S]*?<div class="svc reveal d3">[\s\S]*?<\/a>\s*<\/div>/,
  `<div class="svc reveal d2">
        <span class="ghost-n">03</span>
        <div class="ico"><span class="ring dash"></span><span class="ring"></span>
          <svg viewBox="0 0 64 64" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="24" cy="26" r="13" pathLength="1"/>
            <circle cx="24" cy="26" r="5" class="acc" pathLength="1"/>
            <path d="M37 20h14a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4H37" pathLength="1"/>
            <path d="M20 39l-3 17h10l2-16" pathLength="1"/>
            <path d="M58 22h4M58 28h4M58 34h4" class="acc" pathLength="1"/>
          </svg>
        </div>
        <h3>Finishing &amp; Extras</h3>
        <p>The finishing touches: a polished blowout, a treatment matched to your hair and the small extras that complete the look.</p>
        <ul><li>Shampoo &amp; blowout</li><li>Heat styling</li><li>Conditioning treatments &amp; toners</li><li>Brow tinting &amp; waxing</li></ul>
        <a href="#menu" class="more">See the full menu <span class="ln"></span></a>
      </div>`
);
if (body.includes('<h3>Extensions</h3>') || body.includes('<span class="ghost-n">04</span>')) throw new Error('Services still has four cards');

// "We never overbook" panel becomes the consultation story (copy from the task)
swap(
  `<div class="eyebrow">Salon time is your time</div>
        <h3>We never overbook. <em>Ever.</em></h3>
        <p>Your appointment is yours alone. No double-booking, no rushing you out of the chair. Just a stylist who listens, a result you love, and a plan to keep it looking great at home.</p>`,
  `<div class="eyebrow">Our Consultation</div>
        <h3>Great hair shouldn't only look good <em>in the chair.</em></h3>
        <p>Every appointment starts with a real conversation. We'll ask about your routine at home and how much time you want to spend styling each morning. We'll also give you an honest take on your inspiration photos and how they'll work with your hair's natural texture. The result is a look you'll love just as much at home as you did in the salon.</p>`
);
swap(`class="btn">Book with a Stylist <span class="arr">→</span></a>`, `class="btn">Book Your Consultation <span class="arr">→</span></a>`);

// Bios: her own wording from Bios.docx, trimmed for the cards. No L'ANZA anywhere: Sue's background
// is framed as training the educators for a major hair care company, brand unnamed.
swap(
  `<p>A former L'ANZA educator who trained stylists up and down the East Coast. Sue loves mentoring the team and the long-time clients she has cared for over the years.</p>`,
  `<p>Sue brings 40 years behind the chair and a passion for mentoring her team. She spent many years as an education manager for a major hair care company, training the educators who taught stylists across the East Coast.</p>`
);
swap(
  `<p>The daughter of a lifelong stylist, Leah turned her passion for hair into salon ownership. She leads the team with continued education and room to create.</p>`,
  `<p>Leah has been making clients feel beautiful since 2013. The daughter of a lifelong stylist, she turned her passion for hair into salon ownership and leads her stylists with continued education, creativity and growth.</p>`
);
swap(
  `<p>Known for polished blowouts that show off her color and cutting work. Amanda followed her dream into hair in her 30s and has never stopped refining her craft.</p>`,
  `<p>Amanda has been in the beauty industry for almost 20 years. She loves creating polished blowouts that showcase her color and haircutting work while helping her clients feel their best.</p>`
);
swap(
  `<p>Inspired by watching her grandma give perms, Darcy has spent almost 30 years creating custom cuts and styles that are unique to each client.</p>`,
  `<p>Darcy grew up watching her grandma give perms, which sparked her own journey into hairstyling. For almost 30 years she has loved creating custom cuts and styles unique to each client.</p>`
);
swap(
  `<p>A curly girl herself, Marianna helps clients embrace their natural curls, and loves vivid color and one-of-a-kind looks.</p>`,
  `<p>Marianna has been creating hair magic since 2023. A curly girl herself, she loves helping clients embrace their natural curls and tapping into her creative side with vivid color.</p>`
);
swap(
  `<div><b>L'ANZA roots</b>Sue spent years as a L'ANZA educator</div>`,
  `<div><b>Educator roots</b>Sue trained the educators for a major hair care company</div>`
);
if (/ANZA/i.test(body)) throw new Error("L'ANZA still mentioned");

// Hours: Tuesday is now by appointment only; Sunday and Monday stay closed
swap(
  `Wed–Thu 10–8 · Fri 9–5 · Sat 9–3</div>`,
  `Tue by appointment · Wed–Thu 10–8 · Fri 9–5 · Sat 9–3</div>`
);
swap(
  `<p>Wednesday and Thursday 10 AM to 8 PM, Friday 9 AM to 5 PM, and Saturday 9 AM to 3 PM. We are closed Sunday, Monday and Tuesday.</p>`,
  `<p>Wednesday and Thursday 10 AM to 8 PM, Friday 9 AM to 5 PM, and Saturday 9 AM to 3 PM. Tuesday is by appointment only, and we are closed Sunday and Monday.</p>`
);
swap(
  `<tr class="closed"><td>Monday – Tuesday</td><td>Closed</td></tr>`,
  `<tr class="closed"><td>Monday</td><td>Closed</td></tr>
              <tr><td>Tuesday</td><td>By appointment only</td></tr>`
);
swap(
  `<li>Wed–Thu 10–8</li><li>Fri 9–5 · Sat 9–3</li>`,
  `<li>Tue by appointment</li><li>Wed–Thu 10–8</li><li>Fri 9–5 · Sat 9–3</li>`
);
if (/closed Sunday, Monday and Tuesday|Monday – Tuesday/.test(body)) throw new Error('Old hours left');

// Extensions off the site entirely ("we'd just kind of rather not have that on our website").
// Kept: Paula's testimonial, a real review; that section is moving to a live Google reviews feed.
swap(
  `\n        <div class="item"><div class="nm">Hair Extensions</div><div class="pr c">Consultation</div><div class="ds">Length and fullness, color-matched to you.</div></div>`,
  ``
);
swap(
  `<summary>Do I need a consultation for balayage, fashion color or extensions?</summary>
        <p>Fashion color and extensions are priced at a consultation so we can plan the right color, length and budget with you. Balayage starts at $100.</p>`,
  `<summary>Do I need a consultation for balayage or fashion color?</summary>
        <p>Every service starts with a consultation. Fashion color is priced at that consultation so we can plan the right color and budget with you, and your stylist confirms balayage pricing based on your hair's length and thickness.</p>`
);
swap(`Questions about a service, extensions or a bridal party?`, `Questions about a service or a bridal party?`);
swap(`<li><a href="#services">Hair Extensions</a></li>`, `<li><a href="#services">Finishing &amp; Extras</a></li>`);

// Red Carpet: less focus, not removed ("we also don't want so much focus on red carpet style")
swap(`<b>Red Carpet</b><small>3 services</small>`, `<b>Special Occasion</b><small>2 services</small>`);
swap(`<div class="nm">Bridal <em>Signature</em></div>`, `<div class="nm">Bridal</div>`);
swap(
  `<p>Yes. Our Red Carpet Style services cover bridal styling (from $75) and formal styles for prom and special occasions (from $60).</p>`,
  `<p>Yes. We offer bridal styling and formal styles for prom and special occasions. See the price menu for current pricing.</p>`
);
swap(`Hair color, cuts and Red Carpet styling from a mother-daughter team`, `Hair color, cuts and styling from a mother-daughter team`);
if (/xtension(?!s that Sue)/i.test(body) || /Red Carpet/.test(body)) throw new Error('Extensions or Red Carpet still mentioned');

// "Never overbook" stays (true), but drop lines implying one client at a time: the salon does
// sometimes double book (e.g. two colour clients processing at once)
swap(
  `where we never overbook, so every appointment gets our full, undivided attention.`,
  `where we never overbook, because your appointment time is your time.`
);
swap(
  `<p>Full, undivided attention from your stylist. Never rushed, never overbooked.</p>`,
  `<p>Your stylist takes the time to get it right. Never rushed, never overbooked.</p>`
);
if (/undivided/.test(body)) throw new Error('"undivided attention" still on page');

// Darcy's photo (sent by the salon via Sandra, Oct 2026) replaces the placeholder
swap(
  `<div class="pic soon"><svg width="96" height="96" style="color:var(--brass-lt)"><use href="#emblem"/></svg>Photo coming soon</div>`,
  `<div class="pic"><img src="img/darcy.jpg" alt="Darcy Ragione, stylist at Duality Salon" loading="lazy"><span class="tag">30 years</span></div>`
);

// ---------- Price menu: "Duality Salon Menu 9-2026.docx" (client's updated list) ----------
// Service names and prices exactly as the salon lists them; tab order follows their document.
const MENU = [
  { id: 'p-color', tab: 'Color', items: [
    ['Full Highlights', '$130', true, 'Foil highlights throughout for all-over brightness.'],
    ['Partial Highlights', '$95', true, 'Brightness where it shows most, on top and around the face.'],
    ['All Over Color', '$100', true, 'One rich, even color from roots to ends.'],
    ['Retouch', '$70', true, 'Root color refresh and grey coverage.'],
    ['Toner', '$40', true, 'Refines your tone and adds shine.'],
    ['Color Correction', null, false, 'Fixing color that didn\'t go to plan, mapped out with you first.'],
    ['Vivid Color', null, false, 'Bold, creative color, planned with you.'],
  ]},
  { id: 'p-cuts', tab: 'Haircuts', items: [
    ['Haircut with Blow-Dry', '$60', true, 'Consultation, precision cut and a polished blowout.'],
    ['Haircut, No Blow-Dry', '$40', true, 'A precision cut, ready to air dry or style at home.'],
    ['Curly Cut with Style', '$75', true, 'A cut tailored to your natural curl pattern, finished with a curl style.'],
    ['Children Under 12', '$35', true, 'Patient, gentle cuts for little ones.'],
  ]},
  { id: 'p-style', tab: 'Styling', items: [
    ['Shampoo Blow Dry', '$40', true, 'A salon-smooth blowout for any day of the week.'],
    ['Curly Style', '$50', true, 'Curls cleansed and styled to bring out your natural pattern.'],
  ]},
  { id: 'p-other', tab: 'Other Services', items: [
    ['Brow Tinting', '$15', false, 'Soft definition for your brows.'],
    ['Facial Waxing', '$15', false, 'Priced per facial area.', '/ area'],
  ]},
];
const price = ([, p, up, , unit]) => p === null
  ? `<div class="pr c">Consultation</div>`
  : `<div class="pr"><sup>$</sup>${p.slice(1)}${up ? '<small>+</small>' : ''}${unit ? `<small>${unit}</small>` : ''}</div>`;
const menuHtml = `<div class="tabs" role="tablist">
${MENU.map((g, i) => `        <button class="tab${i ? '' : ' on'}" data-p="${g.id}" role="tab" aria-selected="${i ? 'false' : 'true'}"><i>0${i + 1}</i><b>${g.tab}</b><small>${g.items.length} services</small><span class="go">→</span></button>`).join('\n')}
      </div>

${MENU.map((g, i) => `      <div class="panel${i ? '' : ' on'}" id="${g.id}">
${g.items.map(it => `        <div class="item"><div class="nm">${it[0]}</div>${price(it)}<div class="ds">${it[3].replace(/'/g, '&#8217;')}</div></div>`).join('\n')}
      </div>`).join('\n')}

      `;
const before = body;
body = body.replace(/<div class="tabs" role="tablist">[\s\S]*?(?=<div class="foot">)/, menuHtml);
if (body === before) throw new Error('Price menu block not found');

// Everything else that quoted old prices or services no longer on the menu
swap(
  `<p>Balayage, highlights, grey coverage and vivid fashion color, custom mixed for your tone.</p>`,
  `<p>Highlights, all-over color, grey coverage and vivid color, custom mixed for your tone.</p>`
);
swap(
  `<ul><li>Balayage &amp; lived-in color</li><li>Highlights &amp; face framing</li><li>Color retouch &amp; grey coverage</li><li>Fashion &amp; vivid color</li></ul>`,
  `<ul><li>Full &amp; partial highlights</li><li>All-over color &amp; retouch</li><li>Toner</li><li>Vivid color &amp; color correction</li></ul>`
);
swap(
  `<ul><li>Precision cut &amp; blowout</li><li>Curly &amp; textured cuts</li><li>Short &amp; clipper cuts</li><li>Kids' cuts</li></ul>`,
  `<ul><li>Haircut with blow-dry</li><li>Curly cut with style</li><li>Haircut, no blow-dry</li><li>Kids' cuts</li></ul>`
);
swap(
  `<p>The finishing touches: a polished blowout, a treatment matched to your hair and the small extras that complete the look.</p>
        <ul><li>Shampoo &amp; blowout</li><li>Heat styling</li><li>Conditioning treatments &amp; toners</li><li>Brow tinting &amp; waxing</li></ul>`,
  `<p>The finishing touches: a polished blowout or curly style, plus the small extras that complete the look.</p>
        <ul><li>Shampoo blow dry</li><li>Curly style</li><li>Brow tinting</li><li>Facial waxing</li></ul>`
);
swap(
  `From lived-in balayage to a bridal updo, every service starts with a consultation`,
  `From dimensional highlights to a curly cut and style, every service starts with a consultation`
);
swap(
  `<p>A haircut with blow dry starts at $52. Short clipper cuts start at $32 and kids' cuts (under 12) start at $26. Your stylist confirms the final price at your consultation.</p>`,
  `<p>A haircut with blow-dry starts at $60, and a haircut without blow-dry starts at $40. Curly cuts with style start at $75 and kids' cuts (under 12) start at $35. Your stylist confirms the final price at your consultation.</p>`
);
swap(
  `<summary>Do I need a consultation for balayage or fashion color?</summary>
        <p>Every service starts with a consultation. Fashion color is priced at that consultation so we can plan the right color and budget with you, and your stylist confirms balayage pricing based on your hair's length and thickness.</p>`,
  `<summary>Do I need a consultation for vivid color or color correction?</summary>
        <p>Yes. Vivid color and color correction are priced at a consultation so we can plan the right color and budget with you.</p>`
);
swap(
  `<p>Yes. We offer bridal styling and formal styles for prom and special occasions. See the price menu for current pricing.</p>`,
  `<p>Yes. We offer bridal styling and formal styles for prom and special occasions. Give the salon a call and we will plan it with you.</p>`
);
swap(`<li><a href="#services">Hair Color &amp; Balayage</a></li>`, `<li><a href="#services">Hair Color &amp; Highlights</a></li>`);
for (const gone of ['Balayage', 'Root and Scoot', 'Face Framing', 'Clipper', 'Conditioning', 'Heat Styling', '$52', '$26 +']) {
  if (body.includes(gone)) throw new Error('Old menu item still on page: ' + gone);
}

if (/href="#"/.test(body)) throw new Error('Dead href="#" left: ' + body.match(/.{60}href="#".{60}/)[0]);

const extraCss = `
  /* ---------- WordPress build additions ---------- */
  /* WordPress adds width/height attributes to content images; let CSS sizing (aspect-ratio, height:100%) win */
  img{height:auto;}
  .menu .visual img{object-position:50% 35%;}
  .svc-grid{grid-template-columns:repeat(3,1fr);}
  .svc ul{margin-top:24px;padding-top:18px;border-top:1px solid var(--line-dark);}
  .svc li{padding:7px 0;}
  @media (max-width:1180px){ .svc-grid{grid-template-columns:repeat(3,1fr);gap:16px;} .svc{padding:40px 26px 34px;} }
  @media (max-width:900px){ .svc-grid{grid-template-columns:1fr;} }
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
