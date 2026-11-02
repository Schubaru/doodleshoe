// Take 2a: pin a question on the live screen.
import { record } from './rec.mjs';
const url = 'http://localhost:5180/review?page=main&view=slides&screen=def-01-sanguine';
await record('take2a', { url, init: { 'rv:wordsword:reviewer': 'Alex' } }, async (r) => {
  const p = r.page;
  const btn = (sel) => p.locator(sel).first();
  await btn('button[aria-label="Hide sidebar"],button[title="Hide sidebar"]').click();
  await r.wait(2400);
  await r.wait(700);

  const tool = await r.box(btn('button[aria-label^="Comment mode"],button[title^="Comment mode"]'));
  await r.click(tool.x, tool.y, 900);
  await r.wait(400);
  const fr = p.frameLocator('.rv-slides-framebox iframe');
  const chip = await r.box(fr.getByRole('button', { name: 'optimistic', exact: true }));
  r.cam(chip.x + 90, chip.y + 40, 1.9, 900);
  await r.move(chip.x - 30, chip.y + 40, 800);
  await r.move(chip.x, chip.y, 400);
  await r.wait(250);
  await r.click();
  await r.wait(600);
  await r.type('Where do these four come from? Do they still show offline?', 45);
  await r.wait(500);
  await r.key('Enter');
  await r.wait(1600);
  await r.shot('take2a-end.png');
});
