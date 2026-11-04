/**
 * Membership receipt — A4 print/PDF layout.
 * Mirrors the Deep Fitness Gym branded receipt: purple wave stationery,
 * kettlebell mark, angled title banner and icon-led sections.
 */

const PURPLE = '#5B21B6';
const PURPLE_MID = '#6D28D9';
const PURPLE_LIGHT = '#8B5CF6';

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

const money = (n) => `&#8377;${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

/** Split "Deep Fitness Gym" into "Deep Fitness" + "Gym" so the last word can be accented. */
function splitName(name) {
  const words = String(name || 'Deep Fitness Gym').trim().split(/\s+/);
  if (words.length === 1) return [words[0], ''];
  return [words.slice(0, -1).join(' '), words[words.length - 1]];
}

const KETTLEBELL = `
<svg viewBox="0 0 48 48" width="31" height="31" xmlns="http://www.w3.org/2000/svg">
  <path d="M17.7 24a6.3 6.3 0 0 1 12.6 0" stroke="currentColor" stroke-width="3.1" fill="none"/>
  <path fill="currentColor" d="M24 23c-8.8 0-16 6.6-16 14.8 0 1.9.4 3.6 1 5.1.3.7 1 1.1 1.8 1.1h26.4c.8 0 1.5-.4 1.8-1.1.6-1.5 1-3.2 1-5.1C40 29.6 32.8 23 24 23Z"/>
</svg>`;

const ICON_PERSON = `<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-3.9 0-7.5 2-7.5 4.6V21h15v-2.4C19.5 16 15.9 14 12 14Z"/></svg>`;
const ICON_PLAN = `<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M9 2h6a1 1 0 0 1 1 1v1h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2V3a1 1 0 0 1 1-1Zm-1 8v2h8v-2H8Zm0 4v2h8v-2H8Z"/></svg>`;
const ICON_CARD = `<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1H3V6Zm0 4h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8Zm3 5v2h5v-2H6Z"/></svg>`;
const ICON_RECEIPT = `<svg viewBox="0 0 24 24" width="21" height="21" fill="currentColor"><path d="M5 2h14a1 1 0 0 1 1 1v19l-3-2-3 2-3-2-3 2-3-2V3a1 1 0 0 1 1-1Zm2 5v2h10V7H7Zm0 4v2h10v-2H7Zm0 4v2h7v-2H7Z"/></svg>`;
const ICON_DUMBBELL = `<svg viewBox="0 0 48 16" width="48" height="16" fill="currentColor"><rect x="1" y="4" width="4" height="8" rx="1.5"/><rect x="6" y="1.5" width="5" height="13" rx="2"/><rect x="11" y="6.5" width="26" height="3" rx="1.5"/><rect x="37" y="1.5" width="5" height="13" rx="2"/><rect x="43" y="4" width="4" height="8" rx="1.5"/></svg>`;

function row(label, value, accent = '') {
  return `<div class="row">
    <span class="label">${label}</span>
    <span class="value${accent ? ' ' + accent : ''}">${value}</span>
  </div>`;
}

function section(icon, title, rows) {
  return `<div class="section">
    <div class="section-head">
      <span class="section-icon">${icon}</span>
      <span class="section-title">${title}</span>
      <span class="section-rule"></span>
    </div>
    ${rows}
  </div>`;
}

/**
 * @param {object}  opts
 * @param {object}  opts.gymInfo  { name, location, contact }
 * @param {object}  opts.member   member document
 * @param {object} [opts.payment] optional payment row this receipt is for
 * @param {string} [opts.logoUrl] absolute URL of the logo for the header mark
 * @param {boolean} [opts.logoOnDark] true when that logo needs a dark backing
 * @param {'mark'|'wordmark'} [opts.logoVariant] 'wordmark' when the artwork already
 *        carries the gym's name, so the header does not repeat it as text
 */
export function buildReceiptHtml({
  gymInfo = {}, member = {}, payment = null,
  logoUrl = '', logoOnDark = false, logoVariant = 'mark',
} = {}) {
  const mark = logoUrl || gymInfo.logoUrl || '';
  const usingPassedLogo = Boolean(logoUrl) && mark === logoUrl;
  const markDark = usingPassedLogo ? logoOnDark : false;
  const isWordmark = usingPassedLogo && logoVariant === 'wordmark';
  const [nameMain, nameAccent] = splitName(gymInfo.name || 'Deep Fitness Gym');
  const subLine = [gymInfo.location, gymInfo.contact].filter(Boolean).map(esc).join('&nbsp; | &nbsp;');

  const issued = payment?.date ? new Date(payment.date) : new Date();
  const dateStr = issued.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const planName = payment?.planName || member.planName;
  const activeFrom = payment?.planActiveFrom || member.planActiveFrom;
  const expiry = payment?.expiryDate || member.expiryDate;
  const totalFees = payment?.totalFees ?? member.totalFees;
  const paid = payment ? (payment.paidAmount ?? payment.amount) : member.paidFees;
  const balance = Number(payment?.balanceFees ?? member.balanceFees ?? 0);

  const gstPercent = Number(member.gstPercent || 0);
  const gstAmount = gstPercent > 0 ? (Number(totalFees || 0) * gstPercent) / 100 : 0;

  const paymentRows = [
    row('Total Fees', money(totalFees)),
    gstPercent > 0 ? row(`GST (${gstPercent}%)`, money(gstAmount)) : '',
    row('Amount Paid', money(paid), 'green'),
    balance > 0
      ? row('Balance Due', money(balance), 'red')
      : row('Balance Due', money(0), 'green'),
    payment?.paymentMode ? row('Payment Mode', esc(payment.paymentMode)) : '',
  ].join('');

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<title>Receipt — ${esc(member.name || 'Member')}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Yellowtail&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  :root{--purple:${PURPLE};--purple-mid:${PURPLE_MID};--purple-light:${PURPLE_LIGHT}}
  html,body{background:#eceaf3}
  body{font-family:'Poppins',-apple-system,'Segoe UI',Arial,sans-serif;color:#1b1b22;display:flex;justify-content:center;padding:24px 12px}

  .page{position:relative;width:210mm;min-height:297mm;background:#fff;overflow:hidden;
        box-shadow:0 12px 40px rgba(70,40,140,.18)}

  /* stationery: left edge bar + top-left corner swoosh + bottom waves */
  .edge{position:absolute;top:0;left:0;width:5mm;height:100%;
        background:linear-gradient(180deg,var(--purple-light),var(--purple));z-index:3}
  .corner{position:absolute;top:0;left:0;width:46mm;height:34mm;z-index:1}
  .waves{position:absolute;left:0;bottom:0;width:100%;height:42mm;z-index:1}

  .content{position:relative;z-index:2;padding:14mm 14mm 0 16mm}

  /* ── header ── */
  .head{display:flex;align-items:center;gap:7mm}
  .mark{width:17.5mm;height:17.5mm;border-radius:4.8mm;background:var(--purple);color:#fff;
        display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden}
  .mark-dark{background:#16213a}
  .mark-plain{background:#fff;border:0.3mm solid #e3e0ee}
  .mark-img{width:100%;height:100%;object-fit:contain;padding:0.9mm}
    .logo-full{height:25mm;width:auto;display:block}
  .logo-panel{background:#16213a;border-radius:3.5mm;padding:2.5mm 4mm;flex-shrink:0;
              display:flex;align-items:center;justify-content:center}
  .logo-panel-plain{background:transparent;padding:0}
  .head-text{min-width:0}
  .bar{width:1.1mm;height:22mm;background:#15151c;border-radius:1mm;flex-shrink:0}
  .gym-name{font-size:27px;font-weight:800;letter-spacing:-.5px;line-height:1.05;white-space:nowrap}
  .gym-name em{font-style:normal;color:var(--purple)}
  .gym-sub{font-size:11px;color:#3d3d49;margin-top:1.8mm;letter-spacing:.1px;white-space:nowrap}
  .tagline{margin-left:auto;text-align:right;font-size:10px;font-weight:700;color:var(--purple);
           letter-spacing:1px;white-space:nowrap;align-self:flex-start;padding-top:1mm}

  /* ── angled banner ── */
  .banner-wrap{position:relative;margin:11mm -16mm 0 0;display:flex;justify-content:flex-end}
  .banner{position:relative;display:flex;align-items:center;gap:5mm;color:#fff;
          background:linear-gradient(90deg,var(--purple-light),var(--purple));
          padding:4.5mm 16mm 4.5mm 14mm;
          clip-path:polygon(7mm 0,100% 0,100% 100%,0 100%);
          border-top-left-radius:2mm;border-bottom-left-radius:2mm}
  .banner .ico{opacity:.95;display:flex}
  .banner .t{font-size:15px;font-weight:700;letter-spacing:.6px;line-height:1.15}
  .banner .d{font-size:10.5px;font-weight:400;opacity:.9;margin-top:.6mm}

  /* ── sections ── */
  .section{margin-top:9mm}
  .section-head{display:flex;align-items:center;gap:4mm;margin-bottom:4mm}
  .section-icon{width:9mm;height:9mm;border-radius:50%;background:var(--purple);color:#fff;
                display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .section-title{font-size:13px;font-weight:700;color:var(--purple);letter-spacing:.9px;text-transform:uppercase;white-space:nowrap}
  .section-rule{flex:1;height:1px;background:#d7d4e4}

  .row{display:flex;justify-content:space-between;align-items:baseline;gap:8mm;
       padding:3.6mm 0;border-bottom:1px solid #eceaf2}
  .row:last-child{border-bottom:none}
  .label{font-size:12.5px;color:#4a4a57;font-weight:400}
  .value{font-size:13px;font-weight:700;color:#15151c;text-align:right}
  .value.green{color:#047857}
  .value.red{color:#be123c}

  /* ── footer ── */
  .foot{display:flex;align-items:flex-end;justify-content:space-between;gap:10mm;
        margin-top:14mm;padding-bottom:28mm}
  .thanks{font-family:'Yellowtail',cursive;font-size:36px;color:var(--purple);line-height:1}
  .thanks-rule{width:40mm;height:1.4px;background:var(--purple);margin:1.5mm 0 4mm;border-radius:2px}
  .foot-main{font-size:12.5px;font-weight:600;color:#15151c}
  .foot-sub{font-size:11.5px;color:#4a4a57;margin-top:1mm;line-height:1.55;max-width:68mm}
  .stay{text-align:right;color:var(--purple)}
  .stay .t{font-size:11.5px;font-weight:700;letter-spacing:1.1px;white-space:nowrap}
  .stay .d{display:flex;align-items:center;justify-content:flex-end;gap:3mm;margin-top:2.5mm}
  .stay .d:before,.stay .d:after{content:'';height:1.4px;width:13mm;background:var(--purple);border-radius:2px}

  @page{size:A4;margin:0}
  @media print{
    html,body{background:#fff;padding:0}
    .page{box-shadow:none;width:100%;min-height:100vh}
    *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  }
</style></head>
<body>
<div class="page">
  <div class="edge"></div>

  <svg class="corner" viewBox="0 0 160 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 0H160C120 18 70 42 44 78 30 97 22 110 18 120H0Z" fill="${PURPLE_LIGHT}" opacity=".16"/>
    <path d="M0 0H92C66 20 36 50 20 84 12 101 7 112 5 120H0Z" fill="${PURPLE}" opacity=".10"/>
  </svg>

  <svg class="waves" viewBox="0 0 800 160" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 96c120-34 240-34 360-8s240 44 440-6v78H0Z" fill="${PURPLE_LIGHT}" opacity=".30"/>
    <path d="M0 120c140-30 250-24 380 2s270 36 420-14v52H0Z" fill="${PURPLE_MID}" opacity=".55"/>
    <path d="M0 140c150-26 260-14 400 8s260 22 400-16v28H0Z" fill="${PURPLE}"/>
  </svg>

  <div class="content">
    <div class="head">
      ${isWordmark
        ? `<div class="logo-panel${markDark ? '' : ' logo-panel-plain'}"><img class="logo-full" src="${esc(mark)}" alt="${esc(gymInfo.name || '')}"/></div>`
        : `<div class="mark${markDark ? ' mark-dark' : mark ? ' mark-plain' : ''}">${mark
             ? `<img class="mark-img" src="${esc(mark)}" alt=""/>`
             : KETTLEBELL}</div>`}
      <div class="bar"></div>
      <div class="head-text">
        <div class="gym-name">${esc(nameMain)}${nameAccent ? ` <em>${esc(nameAccent)}</em>` : ''}</div>
        ${subLine ? `<div class="gym-sub">${subLine}</div>` : ''}
      </div>
      <div class="tagline">FITNESS&nbsp; |&nbsp; HEALTH&nbsp; |&nbsp; STRONGER YOU</div>
    </div>

    <div class="banner-wrap">
      <div class="banner">
        <span class="ico">${ICON_RECEIPT}</span>
        <span>
          <div class="t">MEMBERSHIP RECEIPT</div>
          <div class="d">${esc(dateStr)}</div>
        </span>
      </div>
    </div>

    ${section(ICON_PERSON, 'Member Details',
      row('Name', esc(member.name || 'N/A')) +
      row('Phone', esc(member.phone || 'N/A')) +
      (member.membershipId ? row('Membership ID', esc(member.membershipId)) : '') +
      (member.email ? row('Email', esc(member.email)) : '')
    )}

    ${section(ICON_PLAN, 'Plan Details',
      row('Membership Plan', esc(planName || 'N/A')) +
      row('Plan Active From', esc(activeFrom || 'N/A')) +
      row('Valid Until (Expiry)', esc(expiry || 'N/A'))
    )}

    ${section(ICON_CARD, 'Payment Summary', paymentRows)}

    <div class="foot">
      <div>
        <div class="thanks">Thank You!</div>
        <div class="thanks-rule"></div>
        <div class="foot-main">For choosing ${esc(gymInfo.name || 'Deep Fitness Gym')}.</div>
        <div class="foot-sub">Your health and fitness journey matters to us!</div>
      </div>
      <div class="stay">
        <div class="t">STAY FIT&nbsp; |&nbsp; STAY STRONG</div>
        <div class="d">${ICON_DUMBBELL}</div>
      </div>
    </div>
  </div>
</div>
</body></html>`;
}

/** Open the receipt in a new window, optionally sending it straight to print. */
export function openReceipt(opts, { print = true } = {}) {
  const win = window.open('', '_blank', 'width=860,height=1000');
  if (!win) return false;
  win.document.write(buildReceiptHtml(opts));
  win.document.close();
  win.focus();

  if (print) {
    // Wait for the logo and the webfonts, otherwise the printed copy can come
    // out with a missing mark or a fallback typeface.
    const go = () => {
      const fonts = win.document.fonts?.ready ?? Promise.resolve();
      const images = Promise.all(
        [...win.document.images].map(img => (img.complete ? null : new Promise(done => {
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
        }))),
      );
      Promise.race([
        Promise.all([fonts, images]),
        new Promise(done => setTimeout(done, 4000)),
      ]).then(() => { try { win.print(); } catch { /* user closed it */ } });
    };
    if (win.document.readyState === 'complete') go();
    else win.addEventListener('load', go, { once: true });
  }
  return true;
}
