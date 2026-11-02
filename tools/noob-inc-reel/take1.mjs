// Take 1: view only. Pick a name at the door, send someone for coffee, emote.
import { record } from '../don-star-reel/rec.mjs';
import { deskPoint, untilHittable, hideDevBadge, onlySeeded, VIEWER } from './office.mjs';
const url = `http://localhost:3100/watch/${process.env.SHARE_TOKEN}`;
await record('take1', { url, init: { 'noob-theme': 'light' }, setup: onlySeeded }, async (r) => {
  const p = r.page;
  await hideDevBadge(p);
  await r.caption('View only');
  await r.wait(1600);

  const name = await r.box(p.locator('#viewer-name'));
  r.cam(name.x, name.y + 30, 1.7, 900);
  await r.click(name.x - 60, name.y, 900);
  await r.type(VIEWER, 70);
  await r.wait(300);
  const go = await r.box(p.getByRole('button', { name: 'Enter the office' }));
  await r.click(go.x, go.y, 600);
  await r.caption('');
  r.cam(640, 360, 1, 900);
  await r.wait(2600);

  const box = await r.box(p.locator('.office-canvas'));
  r.cam(box.x, box.y + 30, 1.55, 1000);
  const who = await deskPoint(p, 1);
  await r.move(who.x - 30, who.y + 40, 900);
  await r.move(who.x, who.y, 400);
  await untilHittable(p, who.x, who.y);
  await r.click();
  await r.wait(700);
  const coffee = await r.box(p.getByRole('menuitem', { name: /for coffee/ }));
  await r.click(coffee.x, coffee.y, 600);
  await r.wait(4200);

  const heart = await r.box(p.locator('.emote-key').nth(3));
  await r.click(heart.x, heart.y, 800);
  await r.wait(500);
  const rocket = await r.box(p.locator('.emote-key').nth(2));
  await r.click(rocket.x, rocket.y, 400);
  await r.wait(1600);

  // the visitor log has them by name
  r.cam(960, 440, 1.3, 1000);
  await r.move(1180, 640, 900);
  await r.wait(2600);
  await r.shot('take1-end.png');
});
