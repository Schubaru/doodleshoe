// Opens a real Chrome window on the local app so a person can sign in by hand.
// Once Supabase has a session, it is copied to session.json (gitignored) for the
// headless takes to start from, and the window closes. Nobody's password touches a script.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire('/Users/alexschumacher/wordsword/review/package.json');
const { chromium } = require('playwright-core');

const KEY = 'sb-tkdybvdbpdjlnguqgxrb-auth-token';
const browser = await chromium.launch({ headless: false });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
await page.goto('http://localhost:8080/auth');
await page.bringToFront();

const deadline = Date.now() + 10 * 60_000;
let token = null;
while (!token && Date.now() < deadline) {
  await page.waitForTimeout(1000);
  token = await page.evaluate((k) => localStorage.getItem(k), KEY).catch(() => null);
}
if (token) {
  fs.writeFileSync(new URL('./session.json', import.meta.url), JSON.stringify({ [KEY]: token }));
  console.log('signed in; session saved');
} else console.log('timed out waiting for sign-in');
await browser.close();
