// Take 3: one pin, two layouts. Switch phone -> desktop -> phone; the pin stays on its chip.
import { record } from './rec.mjs';
const url = 'http://localhost:5180/review?page=main&view=slides&screen=def-01-sanguine';
await record('take3', { url, init: { 'rv:wordsword:reviewer': 'Alex' } }, async (r) => {
  const p = r.page;
  const btn = (sel) => p.locator(sel).first();
  await btn('button[aria-label="Hide sidebar"],button[title="Hide sidebar"]').click();
  await r.wait(2400);
  const pin = async () => r.box(p.locator('.rv-pin').first());
  let a = await pin();
  r.cam(a.x + 40, a.y + 60, 1.8, 1);
  await r.setPos(a.x + 160, a.y + 200);
  await r.wait(1600);

  const desk = await r.box(btn('button[aria-label^="Desktop frames"],button[title^="Desktop frames"]'));
  r.cam(640, 400, 1.15, 900);
  await r.move(desk.x, desk.y, 1000);
  await r.wait(200);
  await r.click();
  await r.wait(1800);
  a = await pin();
  r.cam(a.x + 120, a.y + 60, 1.7, 1000);
  await r.move(a.x + 220, a.y + 160, 1000);
  await r.wait(2400);
  await r.shot('take3-desk.png');

  const phone = await r.box(btn('button[aria-label^="Mobile frames"],button[title^="Mobile frames"]'));
  r.cam(640, 400, 1.15, 900);
  await r.move(phone.x, phone.y, 1000);
  await r.wait(200);
  await r.click();
  await r.wait(1800);
  a = await pin();
  r.cam(a.x + 40, a.y + 60, 1.8, 1000);
  await r.move(a.x + 160, a.y + 200, 1000);
  await r.wait(2200);
  await r.shot('take3-end.png');
});
