// Take 2b: the agent's answer, after the resolve loop ran in Claude Code.
import { record } from './rec.mjs';
const url = 'http://localhost:5180/review?page=main&view=slides&screen=def-01-sanguine';
await record('take2b', { url, init: { 'rv:wordsword:reviewer': 'Alex' } }, async (r) => {
  const p = r.page;
  await p.locator('button[aria-label="Hide sidebar"],button[title="Hide sidebar"]').first().click();
  await r.wait(1200);
  const pin = await r.box(p.locator('.rv-pin').first());
  r.cam(pin.x + 60, pin.y + 40, 1.9, 1);
  await r.setPos(pin.x + 140, pin.y + 160);
  await r.caption('Then, in Claude Code: /don-star works the board');
  await r.wait(2200);
  await r.move(pin.x + 2, pin.y + 2, 800);
  await r.wait(200);
  await r.click();
  await r.caption('');
  await r.wait(600);
  const pop = await r.box(p.locator('.rv-thread, [role="dialog"]').first());
  console.log('pop', JSON.stringify(pop.b));
  r.cam(pop.x, pop.y, Math.min(2.1, 720 / (pop.b.height + 60)), 900);
  await r.move(pop.b.x + pop.b.width - 60, pop.y + 20, 900);
  await r.wait(1600);
  for (let i = 0; i < 12; i++) { await p.mouse.wheel(0, 14); await r.wait(40); }
  await r.wait(400);
  await r.move(pop.b.x + pop.b.width + 60, pop.y + 80, 700);
  await r.wait(3000);
  await r.shot('take2b-end.png');
});
