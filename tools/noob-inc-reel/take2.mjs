// Take 2: admin. Allow a permission prompt, answer a question, open someone from the office, copy the share link.
import { record } from '../don-star-reel/rec.mjs';
import { deskPoint, untilHittable, hideDevBadge, onlySeeded } from './office.mjs';
await record('take2', { url: 'http://localhost:3100/', init: { 'noob-theme': 'light' }, setup: onlySeeded }, async (r) => {
  const p = r.page;
  const btn = (name, exact = true) => r.box(p.getByRole('button', { name, exact }).first());
  await hideDevBadge(p);
  await r.caption('Admin');
  await r.wait(1800);

  // permission prompt
  const review = await btn('Review');
  r.cam(420, 180, 1.5, 900);
  await r.click(review.x, review.y, 900);
  await r.caption('');
  await r.wait(900);
  const allow = await btn('Allow');
  r.cam(1010, 220, 1.55, 900);
  await r.click(allow.x, allow.y, 900);
  await r.wait(1800);
  const close = await btn('Close panel');
  await r.click(close.x, close.y, 700);
  await r.wait(500);

  // question
  r.cam(420, 180, 1.5, 900);
  const answer = await btn('Answer');
  await r.click(answer.x, answer.y, 800);
  await r.wait(900);
  const choice = await r.box(p.getByRole('radio', { name: /Short and plain/ }));
  r.cam(1010, 300, 1.45, 900);
  await r.click(choice.x, choice.y, 900);
  await r.wait(400);
  const send = await btn(/Send answer/, false);
  await r.click(send.x, send.y, 700);
  await r.wait(1800);
  const close2 = await btn('Close panel');
  await r.click(close2.x, close2.y, 700);
  r.cam(640, 360, 1, 900);
  await r.wait(1200);

  // office -> board: click someone at a desk, open their details
  const box = await r.box(p.locator('.office-canvas'));
  r.cam(box.x, box.y + 30, 1.5, 1000);
  const who = await deskPoint(p, 2);
  await r.move(who.x, who.y, 1000);
  await untilHittable(p, who.x, who.y);
  await r.click();
  await r.wait(700);
  const details = await r.box(p.getByRole('menuitem', { name: /details/ }));
  await r.click(details.x, details.y, 600);
  await r.wait(600);
  r.cam(760, 330, 1.12, 1000);
  await r.wait(2400);
  const close3 = await btn('Close panel');
  await r.click(close3.x, close3.y, 900);
  await r.wait(600);

  // share the view-only link (Copy only: New link and Turn off would break the live one)
  const share = await btn('Share a view-only link');
  r.cam(1060, 150, 1.6, 900);
  await r.click(share.x, share.y, 1000);
  await r.wait(900);
  const copy = await btn('Copy');
  await r.click(copy.x, copy.y, 800);
  await r.wait(2000);
  await r.key('Escape');
  r.cam(640, 360, 1, 1000);
  await r.move(700, 600, 1000);
  await r.wait(1600);
  await r.shot('take2-end.png');
});
