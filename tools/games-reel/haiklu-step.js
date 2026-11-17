// i = frame index. Plays a past Haiklu (?day=N): a lukewarm guess, a warm one, then the word.
// Serve ~/haiklu on :4401, then: webrec "http://localhost:4401/?day=3" frames 480 780 132 55 haiklu-step.js
const at = (f, fn) => { if (i === f) fn(); };
document.querySelector('dialog[open]')?.close();
// frame the board alone: no Mac scrollbar track, no "More from Wordsword" footer peeking in
if (i === 0) document.head.insertAdjacentHTML('beforeend', '<style>html,body{overflow:hidden}footer.more{display:none}</style>');
// An offscreen WKWebView never ticks CSS animations: run each one off the wall clock instead.
{ const now = performance.now();
  for (const a of document.getAnimations()) { a.__t0 ??= now - (a.currentTime || 0); a.pause(); a.currentTime = now - a.__t0; } }
if (i === 0) (async () => {
  const L = await import('/play/logic.js');
  const n = Number(new URLSearchParams(location.search).get('day'));
  const bank = await (await fetch('/play/data/haiklu-bank.json')).json();
  const idx = L.haikuIndex(bank, n), ans = bank[idx].answer;
  const scores = [...L.parseScores(await (await fetch(`/play/data/haiklu/${idx}.txt`)).text())]
    .filter(([w]) => w.length >= 4 && w.length <= 7 && !L.sameWord(w, ans));
  const pick = (lo, hi) => scores.find(([, s]) => s >= lo && s <= hi)?.[0];
  window.__plan = [pick(45, 65), pick(86, 96), ans].filter(Boolean);
})();
const plan = window.__plan;
if (plan && !window.__sched) {
  // each guess: one letter every 2 frames, a beat, submit, then let the score bar land
  const s = []; let f = Math.max(i, 10);
  for (const w of plan) {
    for (let k = 1; k <= w.length; k++) s.push([f += 2, () => {
      const el = document.querySelector('#input'); el.value = w.slice(0, k); el.dispatchEvent(new Event('input'));
    }]);
    s.push([f += 5, () => document.querySelector('#field').requestSubmit()]);
    f += 22;
  }
  window.__sched = s;
}
for (const [f, fn] of window.__sched || []) at(f, fn);
