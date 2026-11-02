// The skills page: the shoe draws in, and every install line gets a copy button (an icon; the label is aria-label).
// Without JS the buttons stay hidden and the commands are still selectable text.
(() => {
  const motionOK = matchMedia('(prefers-reduced-motion: no-preference)').matches;

  if (motionOK && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('js-anim');
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('drawn'); io.unobserve(e.target); }
    }, { threshold: 0.4 });
    document.querySelectorAll('.draw').forEach((el) => io.observe(el));
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
