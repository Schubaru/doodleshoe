// The main loop of N00B Portfolios, in one take: open Trade, find Apple, read what it is
// in plain English, buy $250 of it with fake money, land back on the portfolio.
// DRY=1 stops short of the Buy click, so the take can be rehearsed without placing a trade.
import fs from 'fs';
import { record } from '../don-star-reel/rec.mjs';

const session = JSON.parse(fs.readFileSync(new URL('./session.json', import.meta.url)));
const DRY = !!process.env.DRY;

// the disclaimer counts as already dismissed, and the account's scratch portfolios stay off camera
const setup = (ctx) => ctx.addInitScript(() => {
  sessionStorage.setItem('noob_disclaimer_dismissed', 'true');
  const hide = () => document.querySelectorAll('[data-sidebar="menu-item"] span.truncate').forEach((s) => {
    if (/^(teest|test)$/.test(s.textContent.trim())) s.closest('[data-sidebar="menu-item"]').style.display = 'none';
  });
  new MutationObserver(hide).observe(document, { childList: true, subtree: true });
});

await record(DRY ? 'take-dry' : 'take1', { url: 'http://localhost:8080/portfolio', init: session, setup }, async (r) => {
  const p = r.page;
  await p.getByRole('button', { name: 'Trade' }).waitFor();
  await r.wait(1800);

  const trade = await r.box(p.getByRole('button', { name: 'Trade' }));
  await r.click(trade.x, trade.y, 1100);
  r.cam(640, 360, 1.35, 900);
  await r.wait(1600);

  const search = await r.box(p.getByPlaceholder(/Search by symbol/));
  await r.click(search.x - 120, search.y, 700);
  await r.type('Apple', 110);
  const apple = p.getByText('Apple Inc.').first();
  await apple.waitFor();
  await r.wait(900);
  const a = await r.box(apple);
  await r.click(a.x, a.y, 700);

  // the asset panel: what it is, what it pays, then the numbers
  await p.getByText('About This Asset').first().waitFor();
  r.cam(640, 300, 1.35, 900);
  await r.wait(2600);
  await r.move(640, 420, 600);
  for (let i = 0; i < 9; i++) { await p.mouse.wheel(0, 70); await r.wait(110); }
  await r.wait(1400);

  const dollars = p.getByRole('button', { name: 'Dollars' });
  await dollars.scrollIntoViewIfNeeded();
  r.cam(640, 470, 1.35, 900);
  await r.wait(500);
  const d = await r.box(dollars);
  await r.click(d.x, d.y, 700);
  const amount = await r.box(p.getByPlaceholder(/dollar amount/i));
  await r.click(amount.x - 100, amount.y, 600);
  await r.type('250', 160);
  await r.wait(700);
  // the Buy button sits under the fold of the panel: bring it up before reaching for it.
  // The wheel turns over the fundamentals, never the number field, or it would nudge the amount.
  await r.move(640, 260, 400);
  for (let i = 0; i < 10; i++) { await p.mouse.wheel(0, 70); await r.wait(110); }
  r.cam(640, 520, 1.35, 700);
  await r.wait(700);
  const buy = await r.box(p.getByRole('button', { name: /^Buy AAPL/ }));
  await r.move(buy.x, buy.y, 700);
  if (DRY) { await r.wait(800); await r.shot('take-dry-end.png'); return; }
  await r.click();

  // back on the portfolio: the trade is in the books
  r.cam(640, 360, 1, 900);
  await r.wait(2200);
  const tx = p.getByText('Recent Transactions');
  await r.move(900, 520, 800);
  for (let i = 0; i < 14; i++) { await p.mouse.wheel(0, 70); await r.wait(110); }
  await tx.waitFor();
  await r.wait(2600);
  await r.shot('take1-end.png');
});
