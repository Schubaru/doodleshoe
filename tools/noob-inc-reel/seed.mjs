// Seeds a demo office through the real bridge, then holds a permission prompt and a question open
// until the admin take answers them (or 10 minutes pass). `node seed.mjs clean` removes everything it made.
// Adapted from ~/noob-inc/bridge/replay.mjs. Needs ~/noob-inc running on :3100 with its .env.local.
import { createRequire } from 'module';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn, spawnSync } from 'child_process';
import { VIEWER } from './office.mjs';
import { createHash, randomBytes } from 'crypto';

const APP = '/Users/alexschumacher/noob-inc';
const URL_ = 'http://localhost:3100';
const MACHINE = 'reel-mac';

for (const l of fs.readFileSync(APP + '/.env.local', 'utf8').split('\n')) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
}
const postgres = createRequire(APP + '/package.json')('postgres');
const sql = postgres(process.env.DATABASE_URL, { prepare: false, ssl: 'require' });

if (process.argv[2] === 'clean') {
  // agents, blockers, commands and their events cascade from the machine
  // only what this seed made: the viewer rows are scoped to the time it started
  const since = new Date(Number(fs.readFileSync('.seeded-at', 'utf8')));
  // `clean viewer` only lets the door name be picked again, for a retake
  const m = process.argv[3] === 'viewer' ? [] : await sql`delete from noob.machines where name = ${MACHINE} returning id`;
  const v = await sql`delete from noob.viewers where name = ${VIEWER} and created_at >= ${since} returning key`;
  const e = await sql`delete from noob.events where kind = 'viewer' and payload->>'by' = ${VIEWER} and created_at >= ${since} returning id`;
  console.log('removed', m.length, 'machine,', v.length, 'viewer,', e.length, 'viewer events');
  await sql.end();
  process.exit(0);
}

fs.writeFileSync('.seeded-at', String(Date.now()));
const token = 'nb_reel_' + randomBytes(8).toString('hex');
await sql`insert into noob.machines (name, token_hash) values (${MACHINE}, ${createHash('sha256').update(token).digest('hex')})`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'noob-reel-'));
fs.writeFileSync(path.join(dir, 'config.json'), JSON.stringify({ url: URL_, token }));
const bridge = APP + '/public/bridge/bridge.mjs';
const env = { ...process.env, NOOB_BRIDGE_DIR: dir };

const hook = (p) => spawnSync(process.execPath, [bridge], { input: JSON.stringify(p), env, encoding: 'utf8', timeout: 20000 }).stdout;
// held hooks run in the background and resolve when the dashboard answers
const held = (p) => new Promise((res) => {
  const c = spawn(process.execPath, [bridge], { env });
  let out = '';
  c.stdout.on('data', (d) => (out += d));
  c.on('close', () => res(out));
  c.stdin.end(JSON.stringify(p));
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// prompts are only held while a dashboard is open; stand in for one (local dev skips sign-in)
const beat = () => fetch(URL_ + '/api/heartbeat', { method: 'POST' }).catch(() => {});
await beat();
const beating = setInterval(beat, 10000);
let req = 0;
const usage = (s, i, o, c) => fs.appendFileSync(s.transcript, JSON.stringify({ type: 'assistant', requestId: 'r' + ++req, uuid: 'u' + req, gitBranch: 'main',
  message: { model: s.model, usage: { input_tokens: i, output_tokens: o, cache_read_input_tokens: c, cache_creation_input_tokens: 1200 } } }) + '\n');

const S = (cwd, prompt, model) => ({ id: 's-' + randomBytes(3).toString('hex'), cwd, prompt, model });
const sessions = [
  S('/Users/you/recipe-app', 'Add an offline mode to the recipe app', 'claude-opus-5-5'),
  S('/Users/you/billing-api', 'Fix the flaky checkout test and tighten the retry', 'claude-opus-5-5'),
  S('/Users/you/docs-site', 'Write the 2.4 release notes from the merged PRs', 'claude-sonnet-5-5'),
];
const tx = fs.mkdtempSync(path.join(os.tmpdir(), 'noob-reel-tx-'));
for (const s of sessions) { s.transcript = path.join(tx, s.id + '.jsonl'); fs.writeFileSync(s.transcript, ''); }
const base = (s, extra) => ({ session_id: s.id, transcript_path: s.transcript, cwd: s.cwd, permission_mode: 'default', ...extra });
const pre = (s, name, input) => hook(base(s, { hook_event_name: 'PreToolUse', tool_name: name, tool_input: input }));
// a finished tool call: PostToolUse is when the bridge reports usage (and it expires open prompts, so never between a prompt and its answer)
const tool = (s, name, input, k = 1) => {
  pre(s, name, input);
  usage(s, 2200 * k, 800 * k, 380000 * k);
  hook(base(s, { hook_event_name: 'PostToolUse', tool_name: name, tool_input: {}, tool_response: 'ok' }));
};

for (const s of sessions) {
  hook(base(s, { hook_event_name: 'SessionStart', source: 'startup', model: s.model }));
  hook(base(s, { hook_event_name: 'UserPromptSubmit', prompt: s.prompt }));
  await sleep(300);
}
const [a, b, c] = sessions;
tool(a, 'Read', { file_path: '/Users/you/recipe-app/src/sync.ts' }, 6);
tool(b, 'Edit', { file_path: '/Users/you/billing-api/tests/checkout.spec.ts', old_string: 'x', new_string: 'y' }, 3);
tool(c, 'Bash', { command: 'gh pr list --state merged --limit 30', description: 'List merged PRs' }, 2);
await sleep(800);

const perm = held(base(b, { hook_event_name: 'PermissionRequest', tool_name: 'Bash',
  tool_input: { command: 'npm test -- checkout --runInBand', description: 'Run the checkout tests one at a time' } }));
const ask = held(base(c, { hook_event_name: 'PermissionRequest', tool_name: 'AskUserQuestion', tool_input: { questions: [{
  question: 'How should the 2.4 notes read?', header: 'Tone', multiSelect: false,
  options: [{ label: 'Short and plain', description: 'One line per change' }, { label: 'Full changelog', description: 'Every PR, grouped by area' }] }] } }));
console.log('seeded; holding a permission prompt and a question');

// a keeps typing so the office has someone working
let open = 2;
perm.then((o) => { open--; console.log('permission:', o.trim() || '(released)'); if (o) pre(b, 'Bash', { command: 'npm test -- checkout --runInBand' }); });
ask.then((o) => { open--; console.log('question:', o.trim() || '(released)'); if (o) pre(c, 'Write', { file_path: '/Users/you/docs-site/RELEASE.md', content: '…' }); });
const files = ['src/sync.ts', 'src/db/cache.ts', 'src/hooks/useOffline.ts', 'src/App.tsx'];
for (let i = 0; open > 0 && i < 200; i++) {
  tool(a, i % 3 ? 'Edit' : 'Read', { file_path: '/Users/you/recipe-app/' + files[i % files.length], old_string: 'a', new_string: 'b' });
  await sleep(3000);
}
// let the answered agents be seen working before the seed lets go
await sleep(30000);
clearInterval(beating);
await sql.end();
