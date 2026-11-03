// The home page's skills: every install line gets a copy button (an icon; the label is aria-label).
// Without JS the buttons stay hidden and the commands are still selectable text.
(() => {
  const motionOK = matchMedia('(prefers-reduced-motion: no-preference)').matches;

  // Demo reels loop silently while on screen; autoplay lives here, never in the markup, and
  // reduced motion keeps the poster until someone presses play. A pause sticks, even back on
  // screen. Expand opens the same loop large, from the frame it was on.
  document.querySelectorAll('.reel').forEach((fig) => {
    const v = fig.querySelector('video');
    const ctl = fig.querySelector('.reel-ctl');
    const toggle = ctl.querySelector('[data-reel="toggle"]');
    const icon = toggle.querySelector('use');
    let held = !motionOK;
    let onScreen = !('IntersectionObserver' in window);
    const run = () => {
      if (onScreen && !held) { v.preload = 'auto'; v.play().catch(() => {}); } else v.pause();
    };
    const sync = () => {
      icon.setAttribute('href', held ? '#i-play' : '#i-pause');
      toggle.setAttribute('aria-label', held ? 'Play demo' : 'Pause demo');
    };
    toggle.addEventListener('click', () => { held = !held; sync(); run(); });
    if (!onScreen) {
      new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; run(); }, { rootMargin: '200px' }).observe(v);
    }

    const box = document.createElement('dialog');
    box.className = 'reel-box';
    box.setAttribute('aria-label', 'Demo, enlarged');
    box.innerHTML = '<button class="reel-btn" type="button" aria-label="Close"><svg aria-hidden="true"><use href="#i-close"/></svg></button>';
    const big = v.cloneNode(true);
    big.removeAttribute('class');
    big.controls = true;
    box.append(big);
    document.body.append(box);
    ctl.querySelector('[data-reel="expand"]').addEventListener('click', () => {
      const at = v.currentTime;
      // a time set before the metadata lands is dropped, so the first open waits for it
      if (big.readyState) big.currentTime = at;
      else big.addEventListener('loadedmetadata', () => { big.currentTime = at; }, { once: true });
      big.preload = 'auto';
      v.pause();
      box.showModal();
      if (!held) big.play().catch(() => {});
    });
    box.querySelector('button').addEventListener('click', () => box.close());
    // a click on the backdrop lands on the dialog itself, outside the video's box
    box.addEventListener('click', (e) => {
      const r = big.getBoundingClientRect();
      if (e.target === box && (e.clientY < r.top || e.clientY > r.bottom || e.clientX < r.left || e.clientX > r.right)) box.close();
    });
    box.addEventListener('close', () => {
      v.currentTime = big.currentTime;
      held = big.paused;
      big.pause();
      sync();
      run();
    });
    sync();
    ctl.hidden = false;
    run();
  });

  // Filter pills: one pressed at a time; a pill with no data-show (All) keeps every card.
  const filter = document.querySelector('.skill-filter');
  if (filter) {
    const pills = filter.querySelectorAll('.filter-pill');
    const cards = document.querySelectorAll('.skill-list .skill');
    pills.forEach((pill) => pill.addEventListener('click', () => {
      const keep = pill.dataset.show && pill.dataset.show.split(' ');
      pills.forEach((p) => p.setAttribute('aria-pressed', p === pill));
      cards.forEach((card) => { card.hidden = !!keep && !keep.includes(card.id); });
    }));
    filter.hidden = false;
  }

  if (!navigator.clipboard) return;
  const status = document.getElementById('copy-status');
  document.querySelectorAll('.copyline .copy').forEach((btn) => {
    const cmd = btn.previousElementSibling.textContent;
    btn.innerHTML = '<svg aria-hidden="true"><use href="#i-copy"/></svg>';
    const icon = btn.querySelector('use');
    btn.hidden = false;
    btn.setAttribute('aria-label', 'Copy: ' + cmd);
    btn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(cmd); } catch {
        // clipboard refused (permissions, an embedded frame): select it so ⌘C still works
        getSelection().selectAllChildren(btn.previousElementSibling);
        status.textContent = 'Selected ' + cmd;
        return;
      }
      icon.setAttribute('href', '#i-check');
      status.textContent = 'Copied ' + cmd;
      clearTimeout(btn.t);
      btn.t = setTimeout(() => icon.setAttribute('href', '#i-copy'), 1600);
    });
  });
})();
