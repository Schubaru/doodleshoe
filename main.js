// Schubaru — one rAF loop drives everything. No frameworks were harmed.
(() => {
  const motionOK = matchMedia('(prefers-reduced-motion: no-preference)').matches;
  const root = document.documentElement;
  const qs = new URLSearchParams(location.search);

  if (motionOK && !qs.has('plain')) {
    root.classList.add('js-anim');
    // the sticky panel is clipped to the viewport — below this height the stacked layout is honest instead.
    // 700, not 800: a 1440x900 laptop loses ~120px to browser chrome, so an 800px floor silently
    // dropped the one-screen-per-beat reveal on the most common machine there is.
    if (matchMedia('(min-width: 900px) and (min-height: 700px)').matches) root.classList.add('enhanced');
  }

  // ---- scroll progress: sections + the monkey ----
  const sections = [...document.querySelectorAll('[data-progress]')];
  const monkey = document.querySelector('.monkey');
  let ticking = false;
  let drift = 0, driftV = 0, lastY = scrollY, drifting = false;

  function update() {
    ticking = false;
    const vh = innerHeight, y = scrollY;
    if (!qs.has('p')) {
      for (const el of sections) {
        const top = el.offsetTop, h = el.offsetHeight;
        const denom = Math.max(h - vh, 1);
        const p = Math.min(1, Math.max(0, (y - top) / denom));
        el.style.setProperty('--p', p.toFixed(4));
      }
    }
  }

  // ---- the monkey's opening bit: "there is more down here" ----
  // Until the first scroll he lives below the fold at bottom-centre, swimming up into
  // view and sinking away again — a scroll cue played by the cast instead of a chevron.
  // The first scroll promotes him, permanently, to his post in the right gutter: one
  // long swim, then the drift spring owns him. --mx/--my is the journey layer of his
  // transform; it composes with the spring and the orbit, so nothing fights.
  let mkState = 'home', mkPromote = null;
  if (monkey && motionOK && scrollY === 0
      && !qs.has('plain') && !qs.has('solo') && !qs.has('shift') && !qs.has('p')
      && matchMedia('(min-width: 900px)').matches) {
    mkState = 'peek';
    const outQuart = (x) => 1 - (1 - x) ** 4;
    const inOutSine = (x) => (1 - Math.cos(Math.PI * x)) / 2;
    const HIDE = 2600, RISE = 1700, HOVER = 1800, SINK = 1700;
    const CYCLE = HIDE + RISE + HOVER + SINK;
    const t0 = performance.now() - (HIDE - 900);  // first peek surfaces ~0.9s in
    let px = 0, py = 0, leave = null;

    const setXY = (x, y) => {
      px = x; py = y;
      monkey.style.setProperty('--mx', x.toFixed(2) + 'px');
      monkey.style.setProperty('--my', y.toFixed(2) + 'px');
    };

    function peekStep(now) {
      if (leave) {
        // the promotion swim: bottom-centre → right gutter in one eased arc,
        // cresting ~44px above the straight line so it reads as swimming, not tweening
        const e = Math.min(1, (now - leave.at) / 1500);
        const E = outQuart(e);
        const arc = Math.sin(Math.PI * E);
        setXY(leave.x * (1 - E), leave.y * (1 - E) - 44 * arc);
        monkey.style.setProperty('--lean', (-7 * arc).toFixed(2) + 'deg');
        if (e >= 1) { mkState = 'home'; return; }  // the spring takes it from here
      } else {
        // measured every frame so a resize mid-peek can't strand him
        const w = monkey.offsetWidth, h = w * 1.05;
        const cx = -innerWidth / 2 + 40 + w / 2;   // right-gutter anchor → viewport centre
        const yOff = innerHeight * 0.44 + 48;      // fully below the fold (home top is 56%)
        const yPeek = innerHeight * 0.44 - h - 20; // fully in view, 20px off the bottom
        const t = (now - t0) % CYCLE;
        let y;
        if (t < HIDE) y = yOff;
        else if (t < HIDE + RISE) y = yOff + (yPeek - yOff) * outQuart((t - HIDE) / RISE);
        else if (t < HIDE + RISE + HOVER) y = yPeek;
        else y = yPeek + (yOff - yPeek) * inOutSine((t - HIDE - RISE - HOVER) / SINK);
        setXY(cx + 9 * Math.sin(now / 1100), y);   // lazy sway; the figure-eight rides on top
      }
      requestAnimationFrame(peekStep);
    }
    // synchronously, so the first paint never catches him at home for a frame
    setXY(-innerWidth / 2 + 40 + monkey.offsetWidth / 2, innerHeight * 0.44 + 48);
    requestAnimationFrame(peekStep);

    // called by onScroll exactly once; picks up from wherever the cycle left him
    mkPromote = () => { leave = { x: px, y: py, at: performance.now() }; mkPromote = null; };
  }

  // the monkey gets left behind when you scroll, then springs back to his spot
  function driftStep() {
    driftV = (driftV - drift * 0.028) * 0.764;  // near-critically damped: ~530ms glide home, no bounce
    drift += driftV;
    if (Math.abs(drift) < 0.15 && Math.abs(driftV) < 0.15) { drift = driftV = 0; drifting = false; }
    monkey.style.setProperty('--drift', drift.toFixed(2) + 'px');
    monkey.style.setProperty('--lean', (drift * -0.11).toFixed(2) + 'deg');
    if (drifting) requestAnimationFrame(driftStep);
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
    if (monkey && motionOK) {
      if (mkPromote) mkPromote();
      else if (mkState === 'home') {
        // the spring only owns him once the journey is over
        drift = Math.max(-64, Math.min(64, drift - (scrollY - lastY) * 0.45));
        if (!drifting) { drifting = true; requestAnimationFrame(driftStep); }
      }
    }
    lastY = scrollY;
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', update);

  // dev helpers for headless screenshot audits (harmless in production)
  if (qs.has('solo')) {
    const keep = document.getElementById(qs.get('solo'));
    document.querySelectorAll('main > *, footer.colophon').forEach((el) => {
      if (el !== keep && !el.contains(keep)) el.style.display = 'none';
    });
  }
  if (qs.has('shift')) document.body.style.transform = `translateY(-${+qs.get('shift')}px)`;
  if (qs.has('p')) {
    const p = qs.get('p');
    sections.forEach((el) => el.style.setProperty('--p', p));
  }

  update(); // after the dev params, so the first measurement sees the real layout

  // ---- ambient doodles draw in on first sight ----
  if (motionOK && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('drawn'); io.unobserve(e.target); }
    }, { threshold: 0.4 });
    document.querySelectorAll('.draw').forEach((el) => io.observe(el));
  }

  // ---- demo reels: preload="none" until they're nearly on screen, then loop silently ----
  // Autoplay lives here rather than in the markup so reduced-motion users keep the poster,
  // which is a real screenshot of the same thing — never a blank frame.
  // skill reels (.reel) carry their own Pause, so skills.js plays those
  const reels = document.querySelectorAll('.shot:not(.reel) > video.demo');
  if (reels.length && motionOK && 'IntersectionObserver' in window) {
    const vio = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const v = e.target;
        if (e.isIntersecting) { v.preload = 'auto'; v.play().catch(() => {}); }
        else v.pause();  // offscreen reels cost battery and nobody is watching
      }
    }, { rootMargin: '200px' });
    reels.forEach((v) => vio.observe(v));
  }
})();
