// Where a desk's occupant stands on screen, from the engine's own layout (components/office/engine.ts):
// a 320x200 room scaled by a whole number and centred in the canvas. 2x2 grid for up to four people.
export const deskPoint = (page, i) => page.evaluate((i) => {
  const c = document.querySelector('.office-canvas'), r = c.getBoundingClientRect();
  const dpr = Math.min(3, devicePixelRatio || 1), cw = Math.floor(r.width * dpr), ch = Math.floor(r.height * dpr);
  const s = Math.max(1, Math.floor(Math.min(cw / 320, ch / 200)));
  const ox = Math.floor((cw - 320 * s) / 2), oy = Math.floor((ch - 200 * s) / 2);
  const x = 52 + (i % 2) * 140 + 20, y = 72 + Math.floor(i / 2) * 46 - 11;
  return { x: r.left + (ox + x * s) / dpr, y: r.top + (oy + y * s) / dpr };
}, i);

export const hideDevBadge = (page) => page.addStyleTag({ content: 'nextjs-portal{display:none!important}' });

export const VIEWER = 'N00B Labs reader';

// The board in the recording shows only the seeded agents: the feed is filtered in the recording browser, the database is untouched.
export async function onlySeeded(ctx) {
  const { createRequire } = await import('module');
  const fs = await import('fs');
  const APP = '/Users/alexschumacher/noob-inc';
  const url = fs.readFileSync(APP + '/.env.local', 'utf8').match(/^DATABASE_URL=(.*)$/m)[1].replace(/^"|"$/g, '');
  const sql = createRequire(APP + '/package.json')('postgres')(url, { prepare: false, ssl: 'require' });
  const ids = new Set((await sql`select a.id from noob.agents a join noob.machines m on m.id = a.machine_id where m.name = 'reel-mac'`).map((r) => r.id));
  await sql.end();
  if (!ids.size) throw new Error('nothing seeded: run seed.mjs first');
  // the share popover shows a made-up link, never the live one
  await ctx.route(/\/api\/share$/, (route) => route.request().method() === 'GET'
    ? route.fulfill({ json: { token: 'q7Vd2mXc9LpR4sTa8nWbK3eYhJ6uZ0fG' } }) : route.abort());
  await ctx.route(/\/api\/(state|watch\/[^/?]+)(\?.*)?$/, async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    const res = await route.fetch();
    const j = await res.json().catch(() => null);
    if (!j || !Array.isArray(j.agents)) return route.fulfill({ response: res });
    j.agents = j.agents.filter((a) => ids.has(a.id));
    j.events = (j.events ?? []).filter((e) => !e.agent_id || ids.has(e.agent_id));
    j.blockers = (j.blockers ?? []).filter((b) => ids.has(b.agent_id));
    j.machines = (j.machines ?? []).filter((m) => m.name === 'reel-mac').map((m) => ({ ...m, name: 'MacBook Pro' }));
    return route.fulfill({ response: res, json: j });
  });
}

// People walk to their desks after the page loads. Hover is only re-tested on pointer moves, so nudge the
// mouse a pixel at a time until the one under the cursor is hittable.
export async function untilHittable(page, x, y) {
  for (let i = 0; i < 40; i++) {
    await page.mouse.move(x + (i % 2), y);
    await page.waitForTimeout(250);
    if ((await page.evaluate(() => document.querySelector('.office-canvas').style.cursor)) === 'pointer') return;
  }
  throw new Error('nobody to click at ' + x + ',' + y);
}
