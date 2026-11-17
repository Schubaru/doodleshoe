// i = frame index. Plays a past Plexicon (?day=N): three guesses that close in, then the word.
// Serve ~/plexicon on :4402, then: webrec "http://localhost:4402/?day=3" frames 480 780 132 55 plexicon-step.js
document.querySelector('dialog[open]')?.close();
// frame the board alone: no Mac scrollbar track, no "More from Wordsword" footer peeking in
if (i === 0) document.head.insertAdjacentHTML('beforeend', '<style>html,body{overflow:hidden}footer.more{display:none}</style>');
// An offscreen WKWebView never ticks CSS animations: run each one off the wall clock instead.
{ const now = performance.now();
  for (const a of document.getAnimations()) { a.__t0 ??= now - (a.currentTime || 0); a.pause(); a.currentTime = now - a.__t0; } }
if (i === 0) (async () => {
  const L = await import('/play/logic.js');
  const n = Number(new URLSearchParams(location.search).get('day'));
  const list = (await (await fetch('/play/data/plexicon-answers.txt')).text()).trim().split('\n');
  const ans = L.plexAnswer(list, n);
  // a guess's heat: 2 per letter in place, 1 per letter in the word
  const heat = g => L.plexScore(g, ans).reduce((t, m) => t + m, 0);
  const find = (lo, hi, skip) => list.find((w, k) => k % 7 === 3 && w !== ans && !skip.includes(w) && heat(w) >= lo && heat(w) <= hi);
  const g1 = find(1, 2, []), g2 = find(3, 4, [g1]), g3 = find(6, 8, [g1, g2]);
  window.__plan = [g1, g2, g3, ans].filter(Boolean);
})();
const key = k => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
const plan = window.__plan;
if (plan && !window.__sched) {
  // a letter every 2 frames, Enter, then wait out the five-tile reveal
  const s = []; let f = Math.max(i, 8);
  for (const w of plan) {
    for (const c of w) s.push([f += 2, () => key(c)]);
    s.push([f += 3, () => key('Enter')]);
    f += 15;
  }
  window.__sched = s;
}
for (const [f, fn] of window.__sched || []) if (i === f) fn();
