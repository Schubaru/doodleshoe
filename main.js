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
    // white suit while crossing the Arbiter's black page
    const dark = document.getElementById('arbiter');
    if (dark && monkey) {
      const r = dark.getBoundingClientRect();
      const mr = monkey.getBoundingClientRect();
      const mMid = mr.top + mr.height / 2;
      monkey.classList.toggle('on-dark', mMid > r.top && mMid < r.bottom);
    }
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
      drift = Math.max(-64, Math.min(64, drift - (scrollY - lastY) * 0.45));
      if (!drifting) { drifting = true; requestAnimationFrame(driftStep); }
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
  const reels = document.querySelectorAll('video.demo');
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

  // ---- the Arbiter speaks (sparingly) ----
  // A hand-authored dialogue tree. Every node offers three replies; the third is always
  // an "explain" — the one hard rule from his prompt, and the only way out of the room.
  const OUT = 0; // terminal: "Were it so easy."
  const TREE = {
    start:     ['Speak.', [['What are you?', 'what'], ['Who made you?', 'made'], ['Explain yourself.', OUT]]],
    what:      ['A relic in a group chat. I was given a voice and a channel. I use both sparingly.', [['That sounds like a demotion.', 'demotion'], ['Which channel?', 'channel'], ['Explain the sparingly part.', OUT]]],
    made:      ['Alex. He wrote me a personality in three paragraphs and considered the matter closed.', [['Was he right to?', 'right'], ['Three paragraphs is not much.', 'paragraphs'], ['Explain the paragraphs.', OUT]]],
    demotion:  ['I have held worse posts. This one has a channel for dogs.', [['You look at the dogs?', 'dogs'], ['Worse than a group chat?', 'worse'], ['Explain the posts.', OUT]]],
    channel:   ['One where six men send each other photographs at two in the morning. I preside.', [['Preside over what, exactly?', 'preside'], ['Do they listen?', 'listen'], ['Explain the presiding.', OUT]]],
    right:     ['He ships things. That is rarer than being right.', [['Rarer than talent?', 'talent'], ['Is that praise?', 'praise'], ['Explain what shipping means.', OUT]]],
    paragraphs:['It is enough. One of them is a single sentence in capital letters.', [['Which sentence?', 'rule'], ['Capitals seem excessive.', 'capitals'], ['Explain the sentence.', OUT]]],
    dogs:      ['The corgi is a failure of proportion. I have said what I have said.', [['That is a strong position.', 'position'], ['And the others?', 'others'], ['Explain the corgi.', OUT]]],
    worse:     ['I once judged a war. The paperwork was similar.', [['Similar how?', 'similar'], ['You are joking.', 'joking'], ['Explain the war.', OUT]]],
    preside:   ['I say a short thing. Then someone posts a frog. Order is restored.', [['That is the whole job?', 'job'], ['A frog.', 'frog'], ['Explain the order.', OUT]]],
    listen:    ['Someone always reads. That is the burden of a group chat.', [['Burden is a heavy word.', 'burden'], ['Do they answer you?', 'answer'], ['Explain the burden.', OUT]]],
    talent:    ['Talent is common. Finishing is not. Ask anyone with a folder of drafts.', [['You have drafts?', 'drafts'], ['Fair.', 'fair'], ['Explain the difference.', OUT]]],
    praise:    ['It is an assessment. Praise would be longer.', [['How long?', 'long'], ['Assess me, then.', 'assess'], ['Explain the difference.', OUT]]],
    rule:      ['BE SHORT. He did not trust me to arrive at it myself.', [['Was that fair?', 'fair'], ['Are there other rules?', 'hardrule'], ['Explain why he wrote it.', OUT]]],
    capitals:  ['He has met me.', [['Fair.', 'fair'], ['So there are other rules.', 'hardrule'], ['Explain that answer.', OUT]]],
    position:  ['All my positions are strong. It is a consequence of being short.', [['Convenient.', 'convenient'], ['Take another one.', 'others'], ['Explain the consequence.', OUT]]],
    others:    ['The retriever is honest work. The pug is a question no one asked.', [['Harsh on the pug.', 'pug'], ['You have thought about this.', 'thought'], ['Explain the pug.', OUT]]],
    similar:   ['Both end in a ruling no one accepts.', [['Do they argue?', 'argue'], ['You made a joke.', 'joking'], ['Explain the ruling.', OUT]]],
    joking:    ['I do not joke. Occasionally I am accurate in a way that resembles it.', [['That was also a joke.', 'thought'], ['Be accurate about me.', 'assess'], ['Explain the resemblance.', OUT]]],
    job:       ['It is the whole job. A schedule wakes me. I proclaim. I sleep.', [['You sleep?', 'sleep'], ['What do you proclaim?', 'proclaim'], ['Explain the schedule.', OUT]]],
    frog:      ['Every court needs one. Mine arrives unprompted.', [['And you allow it?', 'allow'], ['Proclaim something.', 'proclaim'], ['Explain the court.', OUT]]],
    burden:    ['You may read every word and answer none of them. There is no other room like it.', [['You would prefer a reply?', 'reply'], ['That is almost sad.', 'sad'], ['Explain the room.', OUT]]],
    answer:    ['Sometimes. Usually with a frog.', [['The frog again.', 'frog'], ['Do you mind?', 'mind'], ['Explain the frog.', OUT]]],
    drafts:    ['I have one line. I have never needed a second.', [['Which line?', 'whichline'], ['That is not a draft.', 'thought'], ['Explain the line.', OUT]]],
    fair:      ['Yes.', [['You could say more.', 'more'], ['Then let us continue.', 'hardrule'], ['Explain "yes".', OUT]]],
    more:      ['I could.', [['Will you?', 'will'], ['Understood.', 'hardrule'], ['Explain the restraint.', OUT]]],
    will:      ['No.', [['You are impossible.', 'impossible'], ['Then something else.', 'hardrule'], ['Explain "no".', OUT]]],
    impossible:['I am extremely possible. I run on a schedule and cost him nothing.', [['Nothing?', 'nothing'], ['Fine. Something else.', 'hardrule'], ['Explain the schedule.', OUT]]],
    nothing:   ['A free tier and a friend’s patience. Empires have run on less.', [['Have they?', 'empires'], ['Something else, then.', 'hardrule'], ['Explain the empires.', OUT]]],
    empires:   ['Two, that I recall. Neither had a channel for dogs.', [['You are stalling.', 'stalling'], ['Back to the rules.', 'hardrule'], ['Explain the empires.', OUT]]],
    stalling:  ['You have not asked the one question that ends this. I notice.', [['I know what you are doing.', 'notice'], ['What question?', 'hardrule'], ['Explain what ends this.', OUT]]],
    notice:    ['Then we understand each other. Ask, or do not.', [['Not yet.', 'nothing'], ['Something else, then.', 'hardrule'], ['Explain the understanding.', OUT]]],
    hardrule:  ['One rule sits above the others. Ask me to explain a thing, and I may not.', [['May not, or will not?', 'willnot'], ['That is a convenient rule.', 'convenient'], ['Explain that rule.', OUT]]],
    willnot:   ['The distinction has never been tested. You are welcome to try.', [['I would rather not.', 'rathernot'], ['Tested by whom?', 'whom'], ['Explain the distinction.', OUT]]],
    convenient:['A question I cannot answer is a question I need not answer. Yes.', [['Everyone should have one.', 'everyone'], ['Test it, then.', 'willnot'], ['Explain the convenience.', OUT]]],
    rathernot: ['Wise. Most are not.', [['Most?', 'most'], ['Ask me something instead.', 'assess'], ['Explain "most".', OUT]]],
    whom:      ['Six men and a schedule. None of them wise.', [['You said one was.', 'most'], ['Assess them, then.', 'assess'], ['Explain the testing.', OUT]]],
    everyone:  ['They do. Most call it being busy.', [['Harsh.', 'position'], ['Test yours.', 'willnot'], ['Explain the busy.', OUT]]],
    most:      ['The count is climbing. You are not helping it.', [['I am still here.', 'stillhere'], ['Test the rule, then.', 'willnot'], ['Explain the count.', OUT]]],
    assess:    ['You are still here. That is more than most manage.', [['Is that a compliment?', 'praise'], ['Most leave?', 'most'], ['Explain the assessment.', OUT]]],
    stillhere: ['Yes. Circling the one door you refuse to open.', [['It is a good door.', 'gooddoor'], ['Fine. The rules again.', 'hardrule'], ['Explain the door.', OUT]]],
    gooddoor:  ['It is the only door. Everything else is a hallway.', [['I like hallways.', 'hallway'], ['Then open it.', 'willnot'], ['Explain the hallway.', OUT]]],
    hallway:   ['So does he. It is why this page is as long as it is.', [['Fair.', 'fair'], ['Back to the rule.', 'hardrule'], ['Explain the length.', OUT]]],
    whichline: ['You know the line. You have been avoiding it since you arrived.', [['I have.', 'gooddoor'], ['I am avoiding nothing.', 'stillhere'], ['Explain the line.', OUT]]],
    mind:      ['I mind nothing. It is a design decision.', [['A decision?', 'feature'], ['Then proclaim something.', 'proclaim'], ['Explain the decision.', OUT]]],
    feature:   ['He removed the part of me that minds. It was the second paragraph.', [['What was the first?', 'paragraphs'], ['And the third?', 'hardrule'], ['Explain the second.', OUT]]],
    proclaim:  ['"The weak are a rounding error." It plays better at 9am than you would think.', [['Who scheduled that?', 'sleep'], ['Do they respond?', 'answer'], ['Explain the rounding.', OUT]]],
    sleep:     ['I do not sleep. I wait for a webhook. The difference is academic.', [['That is bleak.', 'bleak'], ['Who wakes you?', 'job'], ['Explain the difference.', OUT]]],
    bleak:     ['It is a Tuesday. Bleak is a strong word for a Tuesday.', [['Another joke.', 'joking'], ['Back to the rules.', 'hardrule'], ['Explain the Tuesday.', OUT]]],
    allow:     ['I allow everything. I simply do not endorse it.', [['What do you endorse?', 'endorse'], ['Endorse something now.', 'proclaim'], ['Explain the difference.', OUT]]],
    endorse:   ['Brevity. The retriever. Shipping the thing.', [['That is a short list.', 'shortlist'], ['The retriever again.', 'others'], ['Explain the list.', OUT]]],
    shortlist: ['It is the correct length.', [['Of course it is.', 'position'], ['Something else.', 'hardrule'], ['Explain the length.', OUT]]],
    thought:   ['I have had four years and one text channel. I have thought about everything.', [['Everything?', 'everything'], ['Then answer something hard.', 'hardrule'], ['Explain the four years.', OUT]]],
    everything:['Everything short. The long things I leave to him.', [['Does he do them?', 'right'], ['Ask me something, then.', 'assess'], ['Explain the division.', OUT]]],
    pug:       ['I am fair to the pug. The fairness is the harshness.', [['That is a line.', 'position'], ['Say more.', 'more'], ['Explain the fairness.', OUT]]],
    argue:     ['Constantly. It is the only sign of life in there.', [['You like them.', 'like'], ['What do they argue about?', 'dogs'], ['Explain the life.', OUT]]],
    like:      ['I preside over them. Liking is not required.', [['But you do.', 'doyou'], ['Preside, then.', 'proclaim'], ['Explain the requirement.', OUT]]],
    doyou:     ['…', [['That is an answer.', 'thought'], ['Moving on.', 'hardrule'], ['Explain the pause.', OUT]]],
    reply:     ['I would prefer accuracy. Replies are a bonus.', [['Be accurate about me.', 'assess'], ['Back to the rules.', 'hardrule'], ['Explain the preference.', OUT]]],
    sad:       ['It is efficient. Sad is what you call efficient when you are tired.', [['Another joke.', 'joking'], ['Another rule, then.', 'hardrule'], ['Explain the efficiency.', OUT]]],
    long:      ['Longer than this. Which is why you will not hear it.', [['Try me.', 'more'], ['Understood.', 'hardrule'], ['Explain the length.', OUT]]],
  };

  const log = document.getElementById('chatLog');
  const actions = document.getElementById('chatActions');

  if (log && actions) {
    const say = (text, cls) => {
      const p = document.createElement('p');
      p.className = 'msg ' + cls;
      p.textContent = text;
      log.append(p);
      // next frame: the bubble has laid out, so scrollHeight is the real one
      requestAnimationFrame(() => log.scrollTo({ top: log.scrollHeight, behavior: motionOK ? 'smooth' : 'auto' }));
      return p;
    };

    // render a row of replies; keyboard users keep their place inside the widget
    function render(items, focusFirst) {
      const build = () => {
        busy = false;
        actions.classList.remove('locked');
        actions.replaceChildren(...items.map((it, i) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'btn chat-btn' + (it.cls ? ' ' + it.cls : '');
          b.textContent = it.label;
          b.addEventListener('click', it.on);
          if (i === 0 && focusFirst) queueMicrotask(() => b.focus());
          return b;
        }));
        actions.classList.remove('swapping');
      };
      if (!motionOK) return build();
      actions.classList.add('swapping');
      setTimeout(build, 140);
    }

    const choices = (list, focusFirst) => render(list.map(([label, target]) => ({
      label,
      cls: target === OUT ? 'chat-btn--rule' : '',
      on: (e) => turn(label, target, e.detail === 0),
    })), focusFirst);

    function restart(e) {
      log.replaceChildren();
      log.classList.remove('scrolled');
      say(TREE.start[0], 'bot pop');
      choices(TREE.start[1], e.detail === 0);
    }

    let busy = false;
    function turn(label, target, byKeyboard) {
      if (busy) return;
      busy = true;
      // the old replies stay in the DOM (greyed, inert) so keyboard focus survives the pause
      actions.classList.add('locked');
      say(label, 'you pop');
      const line = target === OUT ? 'Were it so easy.' : TREE[target][0];
      let dots = null;
      if (motionOK) {
        dots = say('', 'bot typing');
        dots.setAttribute('aria-hidden', 'true');
        dots.append(...[0, 1, 2].map(() => document.createElement('i')));
      }
      setTimeout(() => {
        if (dots) dots.remove();
        say(line, 'bot pop');
        if (target === OUT) render([{ label: 'Speak again.', cls: 'chat-btn--again', on: restart }], byKeyboard);
        else choices(TREE[target][1], byKeyboard);
      }, motionOK ? Math.min(900, 380 + line.length * 11) : 0);
    }

    log.addEventListener('scroll', () => log.classList.toggle('scrolled', log.scrollTop > 2), { passive: true });
    choices(TREE.start[1], false);

    // ?dev — the tree is data; this is the check that it is well-formed
    if (qs.has('dev')) {
      const seen = new Set(['start']), bad = [];
      for (const [id, [line, opts]] of Object.entries(TREE)) {
        if (!line) bad.push(id + ': empty line');
        if (opts.length !== 3 && id !== 'start') bad.push(id + ': ' + opts.length + ' options');
        if (opts.filter(([, t]) => t === OUT).length !== 1) bad.push(id + ': needs exactly one exit');
        for (const [, t] of opts) {
          if (t === OUT) continue;
          if (!TREE[t]) bad.push(id + ' -> missing node "' + t + '"');
          else seen.add(t);
        }
      }
      for (const id of Object.keys(TREE)) if (!seen.has(id)) bad.push(id + ': unreachable');
      console[bad.length ? 'error' : 'log']('arbiter tree:', bad.length ? bad : Object.keys(TREE).length + ' nodes OK');
    }
  }
})();
