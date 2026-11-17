// i = frame index. Plays a past Linking words (?day=N): one group, a one-away miss, then the other three.
// Serve ~/linking-words on :4403, then: webrec "http://localhost:4403/?day=20" frames 480 780 132 55 linking-step.js
document.querySelector('dialog[open]')?.close();
// frame the board alone: no Mac scrollbar track, no "More from Wordsword" footer peeking in
if (i === 0) document.head.insertAdjacentHTML('beforeend', '<style>html,body{overflow:hidden}footer.more{display:none}</style>');
// An offscreen WKWebView never ticks CSS animations: run each one off the wall clock instead.
{ const now = performance.now();
  for (const a of document.getAnimations()) { a.__t0 ??= now - (a.currentTime || 0); a.pause(); a.currentTime = now - a.__t0; } }
if (i === 0) (async () => {
  const L = await import('/play/logic.js');
  const n = Number(new URLSearchParams(location.search).get('day'));
  const p = L.makePuzzle(L.bankByTier(L.parseBank(await (await fetch('/play/data/linking-words.txt')).text())), n);
  const [a, b, c, d] = p.groups.map(g => g.words);
  // three of b and one of c: the near miss a real player makes
  window.__plan = [a, [b[0], b[1], b[2], c[0]], b, c, d];
})();
const plan = window.__plan;
if (plan && !window.__sched) {
  const s = []; let f = Math.max(i, 10);
  for (const guess of plan) {
    for (const w of guess) s.push([f += 2, () => document.querySelector(`.tile[data-w="${CSS.escape(w)}"]`)?.click()]);
    // a miss leaves the four picked: clear them, the way a player hits Deselect
    s.push([f += 11, () => document.querySelector('#deselect:not(:disabled)')?.click()]);
    f += 1;
  }
  window.__sched = s;
}
for (const [f, fn] of window.__sched || []) if (i === f) fn();
