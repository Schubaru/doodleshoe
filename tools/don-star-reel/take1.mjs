// Take 1: the Design tool. Pick a live element, restyle it, queue it.
import { record } from './rec.mjs';
const url = 'http://localhost:5180/review?page=main&view=slides&screen=def-01-sanguine';
await record('take1', { url, init: { 'rv:wordsword:reviewer': 'Alex' } }, async (r) => {
  const p = r.page;
  const btn = (sel) => p.locator(sel).first();
  await r.cardOn('don-star · 1 of 3', 'Design tool', 'Pick anything on the live screen and restyle it.');
  await btn('button[aria-label="Hide sidebar"],button[title="Hide sidebar"]').click();
  await r.wait(2200);
  await r.cardOff();
  await r.wait(700);

  const design = await r.box(btn('button[aria-label^="Design"],button[title^="Design"]'));
  await r.click(design.x, design.y, 900);
  await r.wait(500);
  const fr = p.frameLocator('.rv-slides-framebox iframe');
  const add = await r.box(fr.getByRole('button', { name: /Add to wordlist/ }));
  r.cam(add.x + 10, add.y - 120, 1.6, 900);
  await r.move(add.x - 40, add.y - 60, 700);
  await r.move(add.x - 10, add.y + 2, 500);
  await r.wait(250);
  await r.click();
  await r.wait(700);

  // wide two-shot: the button and the panel
  r.cam(880, 440, 1.45, 900);
  const radius = await r.box(btn('input[aria-label="Corner radius"]'));
  await r.move(radius.x + 10, radius.y, 800);
  await r.wait(200);
  await p.mouse.click(radius.x + 10, radius.y, { clickCount: 3 });
  await p.evaluate(([x, y]) => window.__rc.ring(x, y), [radius.x + 10, radius.y]);
  await r.type('14', 140);
  await r.key('Enter');
  await r.wait(900);

  const swatch = await r.box(btn('button[aria-label="Change color"],button[title="Change color"]'));
  await r.click(swatch.x, swatch.y, 700);
  await r.wait(600);
  await r.type('red', 110);
  await r.wait(400);
  const red = await r.box(btn('button[aria-label="red"],button[title="red"]'));
  await r.click(red.x, red.y, 700);
  await r.wait(500);
  await r.shot('take1-picked.png');

  // close on the result
  r.cam(add.x, add.y - 10, 2.2, 900);
  await r.move(add.x + 120, add.y + 50, 900);
  await r.wait(1400);

  r.cam(760, 560, 1.5, 900);
  const queue = await r.box(p.getByRole('button', { name: /^Queue \d+ edits?$/ }));
  await r.move(queue.x, queue.y, 900);
  await r.wait(300);
  await r.click();
  await r.wait(2800);
  await r.shot('take1-end.png');
});
