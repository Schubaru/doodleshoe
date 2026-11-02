// Drives the don-star board with real input while Chrome's screencast records it.
// Writes <out>/frames/*.jpg, <out>/frames.json (timestamps) and <out>/camera.json.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire('/Users/alexschumacher/wordsword/review/package.json');
const { chromium } = require('playwright-core');

export const W = 1280, H = 720;

const OVERLAY = `
(() => {
  if (window.top !== window) return;
  const css = \`
  #rc-cur{position:fixed;left:0;top:0;width:26px;height:26px;z-index:2147483647;pointer-events:none;
    transform:translate(-100px,-100px);will-change:transform;filter:drop-shadow(0 1px 1.5px rgba(0,0,0,.35))}
  #rc-cur svg{display:block;transition:transform .12s ease}
  #rc-cur.down svg{transform:scale(.86)}
  .rc-ring{position:fixed;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;border:2px solid #1f2330;
    z-index:2147483646;pointer-events:none;animation:rc-ring .45s ease-out forwards}
  @keyframes rc-ring{from{transform:scale(.3);opacity:.6}to{transform:scale(1.25);opacity:0}}
  #rc-card{position:fixed;inset:0;z-index:2147483645;pointer-events:none;opacity:0;transition:opacity .45s ease;
    background:#fff;background-image:linear-gradient(to bottom,transparent 55px,#d3dfe9 55px,#d3dfe9 56px,transparent 56px);
    background-size:100% 56px;font-family:'Atkinson Hyperlegible Next',system-ui,sans-serif;color:#1f2330}
  #rc-card::before{content:"";position:absolute;top:0;bottom:0;left:132px;width:2px;background:#d6453a}
  #rc-card.on{opacity:1}
  #rc-cap{position:fixed;left:50%;bottom:92px;transform:translate(-50%,12px);z-index:2147483644;pointer-events:none;opacity:0;
    transition:opacity .35s ease,transform .35s ease;background:#1f2330;color:#fff;border-radius:999px;padding:9px 18px;
    font:600 14px/20px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.02em;white-space:nowrap}
  #rc-cap.on{opacity:1;transform:translate(-50%,0)}
  #rc-card .in{position:absolute;left:184px;top:236px;right:120px}
  #rc-card .k{margin-top:28px;font:600 16px/28px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:#5f6472}
  #rc-card h1{margin:0;font-weight:700;font-size:92px;line-height:112px;letter-spacing:-.02em}
  #rc-card p{margin:0;font-size:30px;line-height:56px;color:#5f6472}
  \`;
  const boot = () => {
    const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
    const l = document.createElement('link'); l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;600;700&display=block';
    document.head.appendChild(l);
    const c = document.createElement('div'); c.id = 'rc-cur';
    c.innerHTML = '<svg width="26" height="26" viewBox="0 0 26 26"><path d="M3 2 L3 21 L8 16.4 L11.6 24 L15 22.4 L11.5 15 L18 15 Z" fill="#1f2330" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    document.body.appendChild(c);
    const card = document.createElement('div'); card.id = 'rc-card';
    card.innerHTML = '<div class="in"><h1></h1><p></p><div class="k"></div></div>';
    document.body.appendChild(card);
  };
  if (document.body) boot(); else document.addEventListener('DOMContentLoaded', boot);
  window.__rc = {
    at(x, y) { document.getElementById('rc-cur').style.transform = 'translate(' + (x - 3) + 'px,' + (y - 2) + 'px)'; },
    down(on) { document.getElementById('rc-cur').classList.toggle('down', on); },
    ring(x, y) { const r = document.createElement('div'); r.className = 'rc-ring'; r.style.left = x + 'px'; r.style.top = y + 'px';
      document.body.appendChild(r); setTimeout(() => r.remove(), 500); },
    card(on, k, h, p) { const c = document.getElementById('rc-card'); if (k !== undefined) {
      c.querySelector('.k').textContent = k; c.querySelector('h1').textContent = h; c.querySelector('p').textContent = p; }
      c.classList.toggle('on', on); },
    caption(t) { let c = document.getElementById('rc-cap'); if (!c) { c = document.createElement('div'); c.id = 'rc-cap'; document.body.appendChild(c); }
      if (t) c.textContent = t; c.classList.toggle('on', !!t); },
    hide(on) { document.getElementById('rc-cur').style.opacity = on ? 0 : 1; },
  };
})();`;

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export async function record(out, { url, init = {}, dpr = 2 }, script) {
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out + '/frames', { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: dpr, permissions: ['clipboard-read', 'clipboard-write'] });
  await ctx.addInitScript(({ init }) => {
    if (window.top !== window) return;
    for (const [k, v] of Object.entries(init)) if (localStorage.getItem(k) === null) localStorage.setItem(k, v);
  }, { init });
  await ctx.addInitScript(OVERLAY);
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  let n = 0, t0 = null, recording = false;
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
    if (!recording) return;
    const t = metadata.timestamp * 1000;
    const f = String(n++).padStart(5, '0') + '.jpg';
    fs.writeFileSync(`${out}/frames/${f}`, Buffer.from(data, 'base64'));
    frames.push({ f, t });
  });

  const camera = [];
  let pos = { x: W / 2, y: H + 40 };
  const now = () => Date.now();
  const api = {
    page,
    wait: (ms) => page.waitForTimeout(ms),
    // camera: centre (CSS px) and zoom, eased over ms starting now
    cam: (x, y, z = 1, ms = 700) => { camera.push({ t: now(), x, y, z, ms }); },
    async move(x, y, ms = 650) {
      const from = { ...pos }, steps = Math.max(8, Math.round(ms / 16));
      for (let i = 1; i <= steps; i++) {
        const k = ease(i / steps);
        const px = from.x + (x - from.x) * k, py = from.y + (y - from.y) * k;
        await page.mouse.move(px, py);
        await page.evaluate(([a, b]) => window.__rc.at(a, b), [px, py]);
        await page.waitForTimeout(ms / steps / 2);
      }
      pos = { x, y };
    },
    async click(x, y, ms) {
      if (x !== undefined) await api.move(x, y, ms);
      await page.evaluate(() => window.__rc.down(true));
      await page.mouse.down(); await page.waitForTimeout(70); await page.mouse.up();
      await page.evaluate(([a, b]) => { window.__rc.down(false); window.__rc.ring(a, b); }, [pos.x, pos.y]);
    },
    async type(text, delay = 55) { await page.keyboard.type(text, { delay }); },
    key: (k) => page.keyboard.press(k),
    async box(locator) { const b = await locator.boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2, b }; },
    cardOn: (k, h, p) => page.evaluate(([k, h, p]) => window.__rc.card(true, k, h, p), [k, h, p]),
    cardOff: () => page.evaluate(() => window.__rc.card(false)),
    caption: (text) => page.evaluate((t) => window.__rc.caption(t), text),
    hideCursor: (on) => page.evaluate((v) => window.__rc.hide(v), on),
    setPos(x, y) { pos = { x, y }; return page.evaluate(([a, b]) => window.__rc.at(a, b), [x, y]); },
    shot: (p) => page.screenshot({ path: p }),
  };

  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 95, everyNthFrame: 1 });
  await page.waitForTimeout(300);
  t0 = now(); recording = true;
  try {
    await script(api);
  } finally {
    recording = false;
    await cdp.send('Page.stopScreencast').catch(() => {});
    const end = now();
    fs.writeFileSync(`${out}/frames.json`, JSON.stringify({ t0, end, frames }));
    fs.writeFileSync(`${out}/camera.json`, JSON.stringify(camera));
    await browser.close();
  }
  console.log(out, frames.length, 'frames over', ((now() - t0) / 1000).toFixed(1), 's');
}
