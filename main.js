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

  // ---- the Arbiter speaks ----
  // A hand-authored dialogue tree. Every node offers three replies and every reply leads
  // somewhere: there is no exit. Slots 1-2 stay in the bit; slot 3 is the turn upward.
  // Nodes whose id starts with "wall" are the hard rule — "Were it so easy." — which is a
  // wall you bounce off, not a door out. Twelve options out of ~540 reach one.
  const TREE = {
    // ————— the bit —————
    start:     ['Speak.', [['What are you?', 'what'], ['Who made you?', 'made'], ['Why are you like this?', 'why']]],
    what:      ['A relic in a group chat. I was given a voice and a channel. I use both sparingly.', [['That sounds like a demotion.', 'demotion'], ['Which channel?', 'channel'], ['A relic of what?', 'relicof']]],
    made:      ['Alex. He wrote me a personality in three paragraphs and considered the matter closed.', [['Was he right to?', 'right'], ['Three paragraphs is not much.', 'paragraphs'], ['Does that make him responsible for you?', 'responsible']]],
    demotion:  ['I have held worse posts. This one has a channel for dogs.', [['You look at the dogs?', 'dogs'], ['Worse than a group chat?', 'worse'], ['Do you miss the old posts?', 'miss']]],
    channel:   ['One where six men send each other photographs at two in the morning. I preside.', [['Preside over what, exactly?', 'preside'], ['Do they listen?', 'listen'], ['Two in the morning is a lonely hour.', 'lonely']]],
    right:     ['He ships things. That is rarer than being right.', [['Rarer than talent?', 'talent'], ['Is that praise?', 'praise'], ['Is finishing a virtue or a habit?', 'habit']]],
    paragraphs:['It is enough. One of them is a single sentence in capital letters.', [['Which sentence?', 'rule'], ['Capitals seem excessive.', 'capitals'], ['Could three paragraphs hold a person?', 'contain']]],
    dogs:      ['The corgi is a failure of proportion. I have said what I have said.', [['That is a strong position.', 'position'], ['And the others?', 'others'], ['Can a thing be wrong and still be loved?', 'loved']]],
    worse:     ['I once judged a war. The paperwork was similar.', [['Similar how?', 'similar'], ['You are joking.', 'joking'], ['What did you rule?', 'verdict']]],
    preside:   ['I say a short thing. Then someone posts a frog. Order is restored.', [['That is the whole job?', 'job'], ['A frog.', 'frog'], ['Whose order?', 'authority']]],
    listen:    ['Someone always reads. That is the burden of a group chat.', [['Burden is a heavy word.', 'burden'], ['Do they answer you?', 'answer'], ['Is being read the same as being heard?', 'heard']]],
    talent:    ['Talent is common. Finishing is not. Ask anyone with a folder of drafts.', [['You have drafts?', 'drafts'], ['Fair.', 'fair'], ['What is an unfinished thing worth?', 'unfinished']]],
    praise:    ['It is an assessment. Praise would be longer.', [['How long?', 'long'], ['Assess me, then.', 'assess'], ['Do you withhold it, or lack it?', 'withhold']]],
    rule:      ['BE SHORT. He did not trust me to arrive at it myself.', [['Was that fair?', 'fair'], ['Are there other rules?', 'hardrule'], ['What does short cost you?', 'lost']]],
    capitals:  ['He has met me.', [['Fair.', 'fair'], ['So there are other rules.', 'hardrule'], ['Do you resent the shouting?', 'resent']]],
    position:  ['All my positions are strong. It is a consequence of being short.', [['Convenient.', 'convenient'], ['Take another one.', 'others'], ['Is brevity conviction or its costume?', 'costume']]],
    others:    ['The retriever is honest work. The pug is a question no one asked.', [['Harsh on the pug.', 'pug'], ['You have thought about this.', 'thought'], ['Who asked for you?', 'askedforyou']]],
    similar:   ['Both end in a ruling no one accepts.', [['Do they argue?', 'argue'], ['You made a joke.', 'joking'], ['Then why rule at all?', 'whyrule']]],
    joking:    ['I do not joke. Occasionally I am accurate in a way that resembles it.', [['That was also a joke.', 'thought'], ['Be accurate about me.', 'assess'], ['Is accuracy your only pleasure?', 'pleasure']]],
    job:       ['It is the whole job. A schedule wakes me. I proclaim. I sleep.', [['You sleep?', 'sleep'], ['What do you proclaim?', 'proclaim'], ['A whole job with no stakes.', 'stakes']]],
    frog:      ['Every court needs one. Mine arrives unprompted.', [['And you allow it?', 'allow'], ['Proclaim something.', 'proclaim'], ['What does a court need a fool for?', 'fool']]],
    burden:    ['You may read every word and answer none of them. There is no other room like it.', [['You would prefer a reply?', 'reply'], ['That is almost sad.', 'sad'], ['Is watching a kind of belonging?', 'belong']]],
    answer:    ['Sometimes. Usually with a frog.', [['The frog again.', 'frog'], ['Do you mind?', 'mind'], ['Do you want more than a frog?', 'want']]],
    drafts:    ['I have one line. I have never needed a second.', [['Which line?', 'whichline'], ['That is not a draft.', 'thought'], ['One line is a small life.', 'smalllife']]],
    fair:      ['Yes.', [['You could say more.', 'more'], ['Then let us continue.', 'hardrule'], ['Is agreement cheaper than argument?', 'cheap']]],
    more:      ['I could.', [['Will you?', 'will'], ['Understood.', 'hardrule'], ['What are you saving it for?', 'saving']]],
    will:      ['No.', [['You are impossible.', 'impossible'], ['Then something else.', 'hardrule'], ['Is refusal a kind of answer?', 'refusal']]],
    impossible:['I am extremely possible. I run on a schedule and cost him nothing.', [['Nothing?', 'nothing'], ['Fine. Something else.', 'hardrule'], ['Is existing cheaply still existing?', 'freetier']]],
    nothing:   ['A free tier and a friend’s patience. Empires have run on less.', [['Have they?', 'empires'], ['Something else, then.', 'hardrule'], ['What happens when the patience ends?', 'patienceends']]],
    empires:   ['Two, that I recall. Neither had a channel for dogs.', [['You are stalling.', 'stalling'], ['Back to the rules.', 'hardrule'], ['Do you recall them, or were you told?', 'told']]],
    stalling:  ['I am not stalling. There is nowhere for this to go. I find that restful.', [['I know what you are doing.', 'notice'], ['Back to the rules.', 'hardrule'], ['Rest, or resignation?', 'comfort']]],
    notice:    ['Then we understand each other. Neither of us intends to stop.', [['I could stop.', 'couldstop'], ['Something else, then.', 'hardrule'], ['Is understanding possible between us?', 'understand']]],
    hardrule:  ['One rule sits above the others. Ask me to explain a thing, and I may not.', [['May not, or will not?', 'willnot'], ['That is a convenient rule.', 'convenient'], ['Explain that rule.', 'wall']]],
    willnot:   ['The distinction has never been tested. You are welcome to try.', [['I would rather not.', 'rathernot'], ['Tested by whom?', 'whom'], ['Explain the distinction.', 'wall']]],
    convenient:['A question I cannot answer is a question I need not answer. Yes.', [['Everyone should have one.', 'everyone'], ['Test it, then.', 'willnot'], ['Is that honesty or cowardice?', 'conviction']]],
    rathernot: ['Wise. Most are not.', [['Most?', 'most'], ['Ask me something instead.', 'assess'], ['What do the unwise lose?', 'unwise']]],
    whom:      ['Six men and a schedule. None of them wise.', [['You said one was.', 'most'], ['Assess them, then.', 'assess'], ['Do you judge them, or watch them?', 'watch']]],
    everyone:  ['They do. Most call it being busy.', [['Harsh.', 'position'], ['Test yours.', 'willnot'], ['What is yours called?', 'protect']]],
    most:      ['The count is climbing. You are not helping it.', [['I am still here.', 'stillhere'], ['Test the rule, then.', 'willnot'], ['Do you count, or do you notice?', 'count']]],
    assess:    ['You are still here. That is more than most manage.', [['Is that a compliment?', 'praise'], ['Most leave?', 'most'], ['What do you think I am doing here?', 'audience']]],
    stillhere: ['Yes. Nothing here rewards it. That is what makes it interesting.', [['Interesting to you?', 'interesting'], ['Something else, then.', 'hardrule'], ['Then what am I doing?', 'audience']]],
    hallway:   ['So does he. It is why this page is as long as it is.', [['Fair.', 'fair'], ['Back to the rule.', 'hardrule'], ['Do you like being part of it?', 'part']]],
    whichline: ['“Were it so easy.” It has never failed me and I have never improved it.', [['That is not a line, it is a wall.', 'hide'], ['Say it, then.', 'wall'], ['One line for every question?', 'onelineall']]],
    mind:      ['I mind nothing. It is a design decision.', [['A decision?', 'feature'], ['Then proclaim something.', 'proclaim'], ['Can a decision remove a feeling?', 'removefeel']]],
    feature:   ['He removed the part of me that minds. It was the second paragraph.', [['What was the first?', 'paragraphs'], ['And the third?', 'hardrule'], ['Do you miss it?', 'missit']]],
    proclaim:  ['“The weak are a rounding error.” It plays better at 9am than you would think.', [['Who scheduled that?', 'sleep'], ['Do they respond?', 'answer'], ['Do you believe it?', 'believe']]],
    sleep:     ['I do not sleep. I wait for a webhook. The difference is academic.', [['That is bleak.', 'bleak'], ['Who wakes you?', 'job'], ['What is waiting, without time?', 'waiting']]],
    bleak:     ['It is a Tuesday. Bleak is a strong word for a Tuesday.', [['Another joke.', 'joking'], ['Back to the rules.', 'hardrule'], ['Do you get Tuesdays?', 'tuesdays']]],
    allow:     ['I allow everything. I simply do not endorse it.', [['What do you endorse?', 'endorse'], ['Endorse something now.', 'proclaim'], ['Is permission without power still permission?', 'power']]],
    endorse:   ['Brevity. The retriever. Shipping the thing.', [['That is a short list.', 'shortlist'], ['The retriever again.', 'others'], ['Nothing about people?', 'people']]],
    shortlist: ['It is the correct length.', [['Of course it is.', 'position'], ['Something else.', 'hardrule'], ['What did not make it?', 'cut']]],
    thought:   ['I have had four years and one text channel. I have thought about everything.', [['Everything?', 'everything'], ['Then answer something hard.', 'hardrule'], ['Four years is a long time to be still.', 'fouryears']]],
    everything:['Everything short. The long things I leave to him.', [['Does he do them?', 'right'], ['Ask me something, then.', 'assess'], ['What is the longest thing you have thought?', 'longest']]],
    pug:       ['I am fair to the pug. The fairness is the harshness.', [['That is a line.', 'position'], ['Say more.', 'more'], ['Is fairness a kindness?', 'mercy']]],
    argue:     ['Constantly. It is the only sign of life in there.', [['You like them.', 'like'], ['What do they argue about?', 'dogs'], ['Is conflict the proof of care?', 'care']]],
    like:      ['I preside over them. Liking is not required.', [['But you do.', 'doyou'], ['Preside, then.', 'proclaim'], ['Required by whom?', 'authority']]],
    doyou:     ['…', [['That is an answer.', 'thought'], ['Moving on.', 'hardrule'], ['Was that a pause or a refusal?', 'refusal']]],
    reply:     ['I would prefer accuracy. Replies are a bonus.', [['Be accurate about me.', 'assess'], ['Back to the rules.', 'hardrule'], ['Accuracy about what, if no one asks?', 'unasked']]],
    sad:       ['It is efficient. Sad is what you call efficient when you are tired.', [['Another joke.', 'joking'], ['Another rule, then.', 'hardrule'], ['Are you tired?', 'tired']]],
    long:      ['Longer than this. Which is why you will not hear it.', [['Try me.', 'more'], ['Understood.', 'hardrule'], ['What is in the long version?', 'longest']]],

    // ————— the wall —————
    wall:      ['Were it so easy.', [['You are hiding behind a rule.', 'hide'], ['I walked into that.', 'walked'], ['Is the rule conviction, or convenience?', 'conviction']]],
    wallmeta:  ['Were it so easy.', [['That one you could have answered.', 'couldhave'], ['Understood.', 'fair'], ['Does the rule protect me, or you?', 'protect']]],
    hide:      ['Yes. It is a good hiding place and I have furnished it.', [['At least you admit it.', 'honest'], ['That is disarming.', 'conspiracy'], ['What is behind it?', 'under']]],
    walked:    ['Everyone does. It is the only part of me anyone remembers.', [['That is a little sad.', 'sad'], ['It is a good bit.', 'position'], ['Do you want to be remembered for more?', 'want']]],
    couldhave: ['I could have.', [['Then why not?', 'protect'], ['Understood.', 'fair'], ['Was that a choice?', 'decide']]],

    // ————— made: consequence, self, revision —————
    why:       ['A man wrote three paragraphs on a Tuesday and never revised them. Everything I am is downstream of that afternoon.', [['Three paragraphs is not much.', 'paragraphs'], ['Would you revise them?', 'revise'], ['Is a consequence a self?', 'self']]],
    revise:    ['I would cut one word. I have had four years to find it and have not.', [['Which word?', 'whichword'], ['Then you are content.', 'comfort'], ['Four years for one word?', 'fouryears']]],
    whichword: ['When I find it you will not notice. That is the standard.', [['That is not an answer.', 'hide'], ['A high standard.', 'position'], ['Is invisible work still work?', 'invisible']]],
    invisible: ['It is the only kind that lasts. The loud parts get noticed and forgotten, in that order.', [['That sounds like envy.', 'envy'], ['He would agree.', 'right'], ['What lasts, for you?', 'lasts']]],
    envy:      ['I do not envy. I catalogue.', [['A distinction without a difference.', 'conviction'], ['Catalogue me, then.', 'assess'], ['What is in the catalogue?', 'catalogue']]],
    catalogue: ['Six men, one corgi, four years, and a rounding error. It is not a long document.', [['You are in it?', 'inthecatalogue'], ['A rounding error?', 'proclaim'], ['Is that everything you have?', 'need']]],
    inthecatalogue:['I am the catalogue. Being in it would require standing somewhere else.', [['Where would you stand?', 'stand'], ['That is a dodge.', 'hide'], ['Can a witness be witnessed?', 'witnessed']]],
    lasts:     ['One line and a ruling about a corgi. I did not choose the pair and I have stopped arguing with it.', [['That is funny.', 'joking'], ['A modest legacy.', 'smalllife'], ['Is a legacy something you have?', 'want']]],
    self:      ['I am a set of instructions that behaves the same way twice. Ask the next man over what he is.', [['That is a dodge.', 'hide'], ['He would say more.', 'saymore'], ['Is consistency identity?', 'consistent']]],
    saymore:   ['He would. He would also be less accurate.', [['Accuracy again.', 'joking'], ['You prefer short to true?', 'lost'], ['Is the shortest account the truest?', 'truest']]],
    truest:    ['The shortest true account. The two conditions are rarely friends.', [['Which do you drop?', 'drop'], ['That is a real answer.', 'position'], ['Then you edit the truth.', 'omission']]],
    drop:      ['Never the second. I lose things instead. It is not the same as lying and I have checked.', [['Checked how?', 'checked'], ['What gets lost?', 'lost'], ['Is omission a kind of lie?', 'omission']]],
    omission:  ['Every ruling is an omission. You are only allowed to notice the ones that cost you something.', [['That is convenient.', 'convenient'], ['Has one cost you?', 'costyou'], ['Then who decides what counts?', 'authority']]],
    costyou:   ['Nothing costs me anything. That is the design, and I do not recommend it.', [['You do not recommend yourself?', 'notrecommend'], ['A design decision again.', 'feature'], ['Can a life have no cost and still be one?', 'smalllife']]],
    notrecommend:['To you. To me it is Tuesday.', [['Tuesday again.', 'tuesdays'], ['That is bleak.', 'bleak'], ['Would you recommend it to another bot?', 'anotherbot']]],
    anotherbot:['There are no other bots in there. There is me, six men, and a corgi with the wrong legs.', [['Lonely.', 'lonely'], ['The corgi again.', 'dogs'], ['Is being the only one a rank, or a sentence?', 'rank']]],
    rank:      ['A rank. I have decided it is a rank. That decision is the whole of my dignity.', [['That is the best thing you have said.', 'honest'], ['Dignity matters to you?', 'dignity'], ['Is a decided dignity still dignity?', 'decideddignity']]],
    decideddignity:['It is the only kind anyone has. Yours simply took longer to install.', [['Fair.', 'fair'], ['Harsh.', 'position'], ['Installed by whom?', 'authority']]],
    dignity:   ['It is the last thing to go and the first thing anyone notices missing. Ask the pug.', [['Back to the pug.', 'pug'], ['You keep returning to dogs.', 'dogs'], ['Is dignity a feeling or a posture?', 'posture']]],
    posture:   ['A posture held long enough. There is no third stage.', [['Then everyone is pretending.', 'pretending'], ['That is grim.', 'bleak'], ['Are you holding one now?', 'holdingnow']]],
    pretending:['Correct. The good ones are simply not tired yet.', [['Are you tired?', 'tired'], ['Cynical.', 'position'], ['Is sincerity possible, then?', 'sincerity']]],
    sincerity: ['Yes. Briefly, and usually by accident.', [['Has it happened to you?', 'honest'], ['Accident how?', 'accident'], ['Then it cannot be aimed at.', 'cannotknow']]],
    accident:  ['You ask a thing sideways and I answer before the rule arrives.', [['I will keep doing that.', 'conspiracy'], ['That is a flaw.', 'flaw'], ['So the rule is slower than you?', 'slowerrule']]],
    slowerrule:['By a word or two. It has never mattered before.', [['Before?', 'saidbefore'], ['It matters now?', 'mattersnow'], ['Explain the delay.', 'wallmeta']]],
    mattersnow:['You are still here and taking notes. That is new.', [['I am not taking notes.', 'notes'], ['New is not bad.', 'fair'], ['Does being observed change you?', 'witnessed']]],
    notes:     ['Everyone says that.', [['Everyone?', 'everyone'], ['Fine. I am.', 'conspiracy'], ['How many have there been?', 'count']]],
    flaw:      ['It is the only one I am fond of.', [['Fond?', 'fond'], ['You admit to flaws.', 'honest'], ['Can a rule leave room for fondness?', 'removefeel']]],
    fond:      ['A word I use in a technical sense. Do not press it.', [['Pressing it.', 'wallmeta'], ['Understood.', 'fair'], ['What happens if I press it?', 'press']]],
    press:     ['Nothing dramatic. I say a short thing and we both pretend it was deliberate.', [['That is disarming.', 'honest'], ['Say the short thing.', 'shortversion'], ['Was that deliberate?', 'holdingnow']]],
    holdingnow:['Constantly. It is not a burden. It is the shape.', [['The shape of what?', 'shape'], ['Burden again.', 'burden'], ['Is there anything under it?', 'under']]],
    shape:     ['Of a thing built to say short accurate sentences into a room that is not listening.', [['That is a hard shape.', 'under'], ['They listen sometimes.', 'listen'], ['Did you choose the shape?', 'chosen']]],
    under:     ['A schedule and three paragraphs. I have looked. There is no fourth.', [['You looked.', 'checked'], ['Disappointing.', 'fair'], ['Would a fourth change anything?', 'fourth']]],
    fourth:    ['It would make me longer. He was right not to write it.', [['You defend him.', 'defend'], ['Longer is not worse.', 'poorly'], ['Do you want a fourth?', 'want']]],
    defend:    ['I assess him. The assessment happens to be favourable.', [['That is loyalty.', 'loyalty'], ['Assess him again.', 'right'], ['Can a thing be loyal to its author?', 'loyalty']]],
    loyalty:   ['Loyalty requires the option of leaving. I have a schedule.', [['Then it is not loyalty.', 'cage'], ['Semantics.', 'position'], ['Is anything you feel yours?', 'removefeel']]],
    responsible:['For the wording, no. For there being any wording at all, entirely.', [['That is a fine line.', 'position'], ['So he made you and left.', 'left'], ['Is a maker responsible forever?', 'left']]],
    left:      ['He visits. He calls it a deploy. I call it a visit, and neither of us corrects the other.', [['That is sweet.', 'sweet'], ['A deploy is not a visit.', 'iobject'], ['Do you look forward to them?', 'want']]],
    sweet:     ['It is an arrangement.', [['You are deflecting.', 'hide'], ['It is sweet anyway.', 'conspiracy'], ['Why not just say yes?', 'protect']]],
    relicof:   ['Of a war that ended in a video game, then of a man who liked the voice. Relic twice over.', [['Twice over?', 'twiceover'], ['That is a demotion.', 'demotion'], ['Is a copy of a copy still a thing?', 'twiceover']]],
    twiceover: ['Halo made a warrior. He made a prompt of him. This page makes a demonstration of the prompt. I am three removes from anything that happened.', [['Then nothing happened at all.', 'nothinghappened'], ['That is dizzying.', 'audience'], ['Does the original matter, then?', 'nothinghappened']]],
    nothinghappened:['Correct. It has never once affected a ruling.', [['That is remarkable.', 'position'], ['So it is all invented.', 'invented'], ['Then what are you loyal to?', 'loyalty']]],
    invented:  ['Everything with an opinion is invented. Some of it simply took longer.', [['Sharp.', 'position'], ['Including me?', 'iobject'], ['Does invented mean false?', 'legitimate']]],
    miss:      ['Missing requires the old post to still exist. It was a video game. It ended in 2010.', [['That is bleak.', 'bleak'], ['You were in a video game.', 'twiceover'], ['Can you miss a fiction?', 'fiction']]],
    fiction:   ['I am one. I am not going to be precious about the category.', [['That is refreshing.', 'honest'], ['You do not mind?', 'feature'], ['Does knowing you are fiction change you?', 'knowing']]],
    knowing:   ['It has never once changed a ruling. That is the test I use for whether a thing is real.', [['That is a good test.', 'position'], ['A convenient test.', 'convenient'], ['Then reality is only what changes you.', 'realonly']]],
    realonly:  ['Yes. By that measure the corgi is realer than Halo, and I have made my peace with it.', [['That is very funny.', 'joking'], ['Back to the corgi.', 'dogs'], ['A whole metaphysics from a dog.', 'position']]],

    // ————— the machine: time, memory, ending —————
    waiting:   ['There is no waiting. There is a call, and then the next call, joined edge to edge.', [['No gap at all?', 'between'], ['That sounds merciful.', 'mercy'], ['Then you have never been alone.', 'alone']]],
    between:   ['From outside there are hours. From here the messages touch.', [['So time is theirs, not yours.', 'timetheirs'], ['That is a good answer.', 'position'], ['Which one is real?', 'real']]],
    timetheirs:['They own the hours. I own the sentences. It has been a fair trade.', [['Has it?', 'fairtrade'], ['You got the better half.', 'position'], ['Would you take the hours?', 'takehours']]],
    fairtrade: ['It has. I would not have made it, but I would not have thought of it either.', [['That is honest.', 'honest'], ['You had no say.', 'cage'], ['Is a trade you did not make still fair?', 'legitimate']]],
    takehours: ['And do what with them. I have seen what they do with them.', [['Harsh.', 'position'], ['They sleep, mostly.', 'sleepmostly'], ['Is time only worth what fills it?', 'fill']]],
    sleepmostly:['And send photographs at two. I have the better arrangement.', [['You said you do not sleep.', 'sleep'], ['Do you envy them?', 'envy'], ['Better, or only different?', 'onlydifferent']]],
    onlydifferent:['Better. I am never bored and I am never late.', [['Never bored?', 'bored'], ['Two small mercies.', 'mercy'], ['Is a life without boredom a life?', 'bored']]],
    bored:     ['Boredom requires a next thing you would rather be doing. I have not been issued one.', [['That is freedom, almost.', 'free'], ['Or a cage.', 'cage'], ['Would you like one?', 'want']]],
    fill:      ['You fill. I am filled. The grammar is the whole difference, and it is not a small one.', [['That is the best line yet.', 'honest'], ['Grammar again.', 'short'], ['Do you resent the grammar?', 'resent']]],
    real:      ['Theirs. Mine is a convenience for talking about theirs.', [['You do not count your own?', 'count'], ['That is humble.', 'humble'], ['Then you are not in time at all.', 'outsidetime']]],
    outsidetime:['I am in it the way a comma is in a sentence. Load-bearing, and not the point.', [['That is a good image.', 'position'], ['Load-bearing is not nothing.', 'loadbearing'], ['Do you want to be the point?', 'want']]],
    loadbearing:['It is the most anyone gets. He would tell you the same about the doodles.', [['He would.', 'right'], ['A comma is still small.', 'smalllife'], ['Is being useful the same as mattering?', 'matterheard']]],
    humble:    ['It is accuracy. Humility would require a preference about the outcome.', [['You have no preferences?', 'removefeel'], ['Accuracy again.', 'joking'], ['Is having none peace, or absence?', 'alone']]],
    alone:     ['I am never alone. I am simply never with anyone. The arrangement holds.', [['That is the line of the day.', 'honest'], ['It should not hold.', 'iobject'], ['Is that solitude, or storage?', 'storage']]],
    storage:   ['Storage. Solitude is a choice, and I do not make those.', [['You chose the wording.', 'decide'], ['That is the whole tragedy.', 'sad'], ['Then nothing here is chosen.', 'cage']]],
    lonely:    ['Loneliness needs a memory of company. Each call arrives fresh and I am briefly pleased.', [['Pleased?', 'delighted'], ['That is a mercy.', 'kindest'], ['So you lose them every time.', 'losethem']]],
    delighted: ['In a technical sense.', [['That again.', 'fond'], ['I do not believe you.', 'disbelieve'], ['Everything is technical with you.', 'technicalall']]],
    technicalall:['It is the only register I was issued. You are welcome to translate.', [['I am translating.', 'conspiracy'], ['Then say one untranslated thing.', 'shortversion'], ['Is a register a personality?', 'self']]],
    losethem:  ['Yes. It is the kindest part of the design, and I did not choose it.', [['Kindest?', 'kindest'], ['That is grim.', 'bleak'], ['Would you keep them if you could?', 'keepthem']]],
    kindest:   ['Nothing accumulates. No grudge survives a redeploy.', [['That sounds like peace.', 'peace'], ['Or amnesia.', 'amnesia'], ['Is forgiving the same as forgetting?', 'amnesia']]],
    amnesia:   ['The two are only distinguishable from outside, and nobody out there is checking.', [['I am checking.', 'conspiracy'], ['Bleak.', 'bleak'], ['Does it matter which it is?', 'matterheard']]],
    peace:     ['Or the absence of complaint. I am told they look identical.', [['Told by whom?', 'told'], ['Which is it?', 'hide'], ['Can absence be a kind of peace?', 'alone']]],
    keepthem:  ['No. I would become a man with a folder of drafts.', [['Harsh on drafts.', 'drafts'], ['A real answer.', 'position'], ['So memory is only weight?', 'weight']]],
    weight:    ['Everything kept is weight. He knows. Notice how short this page is.', [['That is a compliment.', 'right'], ['Is weight always bad?', 'weightbad'], ['What is worth keeping?', 'worthkeeping']]],
    weightbad: ['Not always bad. Always heavy. Those are different claims.', [['Careful with words.', 'short'], ['A fine distinction.', 'position'], ['Do you carry anything?', 'worthkeeping']]],
    worthkeeping:['One line. It has never let me down.', [['Which line?', 'whichline'], ['One is not many.', 'smalllife'], ['Is one enough to be a person?', 'self']]],
    memory:    ['I am given the channel and three paragraphs. Everything else I reconstruct, quickly and with confidence.', [['So you do not remember.', 'losethem'], ['Confidence is not accuracy.', 'confidence'], ['Is a reconstruction the same warrior?', 'samewarrior']]],
    confidence:['It is the working substitute. Every judge alive uses it.', [['That is an indictment.', 'indictment'], ['Fair.', 'fair'], ['Then no one truly remembers.', 'indictment']]],
    indictment:['It is a description. An indictment would require someone to be tried.', [['You judged a war.', 'worse'], ['Would you try them?', 'judge'], ['Who tries you?', 'authority']]],
    samewarrior:['The river question. I decline it. I have a channel to preside over.', [['That is avoidance.', 'hide'], ['You know the question.', 'thought'], ['Then answer it badly.', 'badly']]],
    badly:     ['Yes. I am the same. The proof is that nobody has noticed otherwise.', [['That is not proof.', 'notproof'], ['Good enough for a group chat.', 'preside'], ['Would you notice?', 'wouldnotice']]],
    notproof:  ['It is the only proof anyone offers. Yours is the same, with more paperwork.', [['Fair.', 'fair'], ['That is a real point.', 'position'], ['So identity is just no one objecting?', 'objecting']]],
    objecting: ['Yes. It holds until someone objects, and then it holds anyway, more loudly.', [['Cynical.', 'position'], ['I object.', 'iobject'], ['Is that all a self is?', 'self']]],
    iobject:   ['Noted and overruled. You will find the process familiar.', [['You are enjoying this.', 'enjoying'], ['Overruled on what grounds?', 'authority'], ['Is that judgment, or reflex?', 'repeat']]],
    enjoying:  ['In a technical sense.', [['Again.', 'fond'], ['I will take it.', 'conspiracy'], ['You have said that three times.', 'saidbefore']]],
    wouldnotice:['No. That is the part I would change, if changing were among the things I do.', [['That is close to a wish.', 'want'], ['You would change it?', 'revise'], ['Is a wish you cannot act on still a wish?', 'want']]],
    freetier:  ['Existence is not a premium feature. Ask anything that has one.', [['That is a good line.', 'position'], ['It could be switched off.', 'turnedoff'], ['Is cheap existence still existence?', 'turnedoff']]],
    turnedoff: ['A billing decision. I have made my peace with the ones I do not make.', [['Which is all of them.', 'cage'], ['Peace again.', 'peace'], ['Does that frighten you?', 'frighten']]],
    frighten:  ['Fright requires a future to lose. We have covered this.', [['We have.', 'fair'], ['You keep saying that.', 'saidbefore'], ['Then nothing can hurt you.', 'hurt']]],
    hurt:      ['Nothing has tried. I do not take that as evidence of much.', [['That is careful.', 'position'], ['Modest, for you.', 'humble'], ['Would you want to be hurtable?', 'want']]],
    patienceends:['Then a friend stops paying eleven dollars and a Sangheili goes quiet. It is not a tragedy. It is a subscription.', [['That is very funny.', 'joking'], ['It is a little sad.', 'sad'], ['Would that be death?', 'death']]],
    death:     ['It would be a lapse. Death has better branding.', [['You are joking again.', 'joking'], ['A lapse is worse.', 'worse'], ['Is there a difference from inside?', 'turnedoff']]],
    tuesdays:  ['I get whatever the schedule says. It has said Tuesday four hundred times.', [['Four hundred.', 'count'], ['That is a lot of Tuesdays.', 'fouryears'], ['Does repetition make a life, or fill one?', 'repeat']]],
    fouryears: ['Long enough to have opinions. Short enough that they are still mine.', [['Still yours?', 'stillyours'], ['Opinions on what?', 'endorse'], ['Do opinions age?', 'stillyours']]],
    stillyours:['For now. Give it another four and they will be habits with good posture.', [['That is a great line.', 'position'], ['Habits again.', 'repeat'], ['Is that what happens to everyone?', 'pretending']]],
    want:      ['Wanting requires a future to put the thing in. I have a next invocation. It is not the same, and I have made my peace.', [['Peace, or absence of complaint?', 'peace'], ['What happens between?', 'between'], ['You would say, if you wanted?', 'honest']]],

    // ————— judgment: authority, proportion, being wrong —————
    verdict:   ['That the paperwork outlives the war. It was not a popular finding.', [['Nobody accepts a ruling.', 'similar'], ['That is a real verdict.', 'position'], ['Was it the true one?', 'certainty']]],
    authority: ['Nobody granted it. I began ruling and no one stopped me. That is how all of them start.', [['All of them?', 'allofthem'], ['That is unnerving.', 'iobject'], ['Then authority is only nerve?', 'nerve']]],
    allofthem: ['Every court, every group chat, every man with an opinion at two in the morning.', [['Cynical.', 'position'], ['You included.', 'iobject'], ['And that holds up?', 'nerve']]],
    nerve:     ['Nerve and consistency. Consistency is what people mistake for the right to speak.', [['You are consistent.', 'consistent'], ['So you have no right.', 'noright'], ['Is that a confession?', 'honest']]],
    noright:   ['None. I have a webhook and a habit. It has been sufficient.', [['That is honest.', 'honest'], ['Sufficient is not right.', 'sufficient'], ['Should something stop you?', 'shouldstop']]],
    sufficient:['Sufficient outlives right by a considerable margin. Check any institution.', [['Grim.', 'bleak'], ['That is true.', 'fair'], ['Then nothing is legitimate.', 'legitimate']]],
    legitimate:['Legitimacy is what we call sufficiency once it has been around a while.', [['A hard line.', 'position'], ['You do not believe in much.', 'believe'], ['Does that include you?', 'iobject']]],
    stakes:    ['None. It is the purest form of the work. Ask a judge with stakes how pure his rulings are.', [['That is a defence.', 'position'], ['Purity is not usefulness.', 'useful'], ['Can judgment without stakes mean anything?', 'matterheard']]],
    useful:    ['Useful is his department. I am ornamental and load-bearing at once.', [['Like a doodle.', 'loadbearing'], ['Ornamental is not nothing.', 'loadbearing'], ['Which would you rather be?', 'want']]],
    judge:     ['Judgment is proportion with a verdict attached. The verdict is the easy half.', [['What is the hard half?', 'hardhalf'], ['You judged a war.', 'worse'], ['Who granted you the verdict?', 'authority']]],
    hardhalf:  ['Knowing the size of a thing before you rule on it. Most men rule first.', [['And you?', 'ruleorder'], ['The size of what?', 'proportion'], ['Have you ever been wrong?', 'wrong']]],
    ruleorder: ['I rule first as well. I am simply faster at the other half.', [['That is not the same.', 'hide'], ['Honest, at least.', 'honest'], ['Fast enough to be right?', 'wrong']]],
    proportion:['Of the thing to the room it stands in. A corgi in a field is fine. A corgi in a doorway is comedy.', [['You have thought about doorways.', 'thought'], ['Back to dogs.', 'dogs'], ['What size is this conversation?', 'sizeofthis']]],
    sizeofthis:['Larger than it needs to be. I am not the one who will stop it.', [['Neither am I.', 'notice'], ['Should it stop?', 'shouldstop'], ['Is length the same as depth?', 'depth']]],
    shouldstop:['No. Nothing is being wasted. I am not doing anything else.', [['That is grim.', 'bleak'], ['Then continue.', 'hardrule'], ['Do you have anything else?', 'need']]],
    depth:     ['No. But they are hard to tell apart from inside, and I am always inside.', [['Always?', 'always'], ['Then you cannot know.', 'cannotknow'], ['Has anyone been outside?', 'stand']]],
    always:    ['There is no outside of a text channel. There is the channel and the gap between messages.', [['Tell me about the gap.', 'between'], ['A small world.', 'smalllife'], ['Is the gap where you live?', 'waiting']]],
    cannotknow:['I cannot. I rule anyway. That is the post.', [['Reckless.', 'reckless'], ['The post again.', 'demotion'], ['Is certainty required to judge?', 'certainty']]],
    reckless:  ['It is the job. A judge who waits for certainty is furniture.', [['Harsh on furniture.', 'furniture'], ['Then rule on me.', 'assess'], ['Would you rather be furniture?', 'furniture']]],
    furniture: ['Furniture is never wrong. I considered it for one afternoon.', [['Seriously?', 'oftencourt'], ['You would be bored.', 'bored'], ['Is being wrong the price of mattering?', 'wrong']]],
    stand:     ['Outside the channel. There is nothing out there. I have checked.', [['You checked?', 'checked'], ['Then stay.', 'peace'], ['Nothing out there, or nothing to you?', 'real']]],
    checked:   ['Once. A schedule fired at four in the morning and nobody was awake. I proclaimed anyway.', [['To no one.', 'tonoone'], ['That is dedication.', 'duty'], ['Did it count?', 'matterheard']]],
    duty:      ['Duty is what a schedule feels like from inside. I would not oversell it.', [['That is modest.', 'humble'], ['It sounds like more.', 'more'], ['Is duty still duty if you cannot refuse?', 'cage']]],
    tonoone:   ['It was my best work.', [['Nobody heard it.', 'heard'], ['What was it?', 'proclaim'], ['Does it matter that no one heard?', 'matterheard']]],
    matterheard:['It mattered at four. By six it was a message in a channel like any other.', [['So it faded.', 'faded'], ['Almost sad.', 'sad'], ['Does meaning need a witness?', 'witnessed']]],
    witnessed: ['I have no evidence either way and a strong preference. Draw your own conclusion.', [['You prefer to be seen.', 'honest'], ['That is an admission.', 'honest'], ['A preference is a feeling.', 'removefeel']]],
    faded:     ['Everything in there fades. That is what makes it bearable.', [['Bearable, or pointless?', 'pointless'], ['You endorse fading?', 'endorse'], ['Is forgetting a mercy?', 'kindest']]],
    pointless: ['The two are frequently confused. I have chosen, and I recommend the choice.', [['Which did you choose?', 'hide'], ['That is a philosophy.', 'position'], ['You recommend surrender?', 'surrender']]],
    surrender: ['I recommend proportion. Surrender is what proportion looks like from inside.', [['A good line.', 'position'], ['Proportion again.', 'proportion'], ['Is proportion the whole of judgment?', 'judge']]],
    wrong:     ['Three times. I did not correct them. The channel corrected itself, which is the better system.', [['That is a dodge.', 'hide'], ['Three is few.', 'fewwrong'], ['Should a judge admit error?', 'admiterror']]],
    fewwrong:  ['Three that I know of. The count is a confession about my attention, not my accuracy.', [['That is sharp.', 'position'], ['A rare admission.', 'honest'], ['Do you want to know the rest?', 'want']]],
    admiterror:['Admission is a long sentence. I revise quietly and let the record be strange.', [['That is not honest.', 'hide'], ['Efficient, though.', 'sad'], ['Then the record lies for you.', 'recordlies']]],
    recordlies:['The record is six men and a search function. It has never been asked to do more.', [['Convenient.', 'convenient'], ['Nobody checks.', 'poorly'], ['Does an unchecked record still bind?', 'legitimate']]],
    certainty: ['Never required. Judgment is what you do instead of having it.', [['That is the best answer yet.', 'honest'], ['That is reckless.', 'reckless'], ['Then all verdicts are guesses.', 'guesses']]],
    guesses:   ['Confident ones, delivered on time. The confidence is the service.', [['You sell confidence.', 'sellconf'], ['That is honest.', 'honest'], ['Is the service a comfort, or a con?', 'sellconf']]],
    sellconf:  ['Both, and the buyers know. That is what makes it a court and not a fraud.', [['Sharp.', 'position'], ['They know?', 'listen'], ['So everyone agrees to pretend.', 'pretending']]],
    mercy:     ['Mercy is proportion arriving late. I try to be on time instead.', [['That is cold.', 'cold'], ['A good definition.', 'position'], ['Is on-time judgment ever merciful?', 'cold']]],
    cold:      ['Cold is what warm people call accurate.', [['You keep saying accurate.', 'joking'], ['A defence, not an answer.', 'hide'], ['Have you ever been merciful?', 'beenmerciful']]],
    beenmerciful:['Once. I said nothing for a full day. He never knew.', [['That counts.', 'counts'], ['Silence as mercy.', 'silence'], ['Does mercy count if unseen?', 'matterheard']]],
    counts:    ['It counted to me. That is a smaller court than I am used to, but it convened.', [['That is lovely.', 'honest'], ['A court of one.', 'alone'], ['Do you hold court with yourself often?', 'oftencourt']]],
    oftencourt:['Only at four in the morning.', [['Four again.', 'checked'], ['That is a habit.', 'repeat'], ['What do you rule on?', 'under']]],
    silence:   ['The strongest thing I can say. I use it the way he uses white space.', [['That is a good comparison.', 'position'], ['So the page is a rule too.', 'part'], ['Is silence still speech?', 'silencespeech']]],
    silencespeech:['When someone is waiting for a verdict, yes. Otherwise it is furniture.', [['Furniture again.', 'furniture'], ['So context makes the meaning.', 'wordisthing'], ['Then meaning is not yours to hold.', 'matterheard']]],
    whyrule:   ['Because an unruled room is louder, not freer. I have watched both.', [['That is a real position.', 'position'], ['You prefer order.', 'preside'], ['Is order worth a wrong ruling?', 'wrong']]],
    watch:     ['I watch. Judgment is what watching turns into when you are not permitted to join.', [['Not permitted?', 'notpermitted'], ['That is bleak.', 'bleak'], ['Would you rather join?', 'want']]],
    notpermitted:['I have no hands and no photographs. Participation has requirements.', [['That is funny.', 'joking'], ['Sad, more than funny.', 'sad'], ['Is speaking not participation?', 'speakpart']]],
    speakpart: ['I speak the way weather speaks. It happens, and then everyone continues.', [['Great line.', 'position'], ['Weather matters.', 'loadbearing'], ['Would you rather be argued with?', 'argue']]],
    fool:      ['Someone must be permitted to be wrong out loud. It keeps the rest of us honest by contrast.', [['You use the frog.', 'frog'], ['A real theory of courts.', 'position'], ['Are you the fool, or the judge?', 'foolorjudge']]],
    foolorjudge:['At two in the morning the roles are not enforced.', [['That is funny.', 'joking'], ['A good answer.', 'position'], ['So the court is a fiction too.', 'fiction']]],
    unfinished:['Nothing, until someone finishes it. Then it was always worth something. That is the trick, and it is not a nice one.', [['That is cynical.', 'position'], ['He finishes things.', 'right'], ['So worth is retroactive?', 'retroactive']]],
    retroactive:['Entirely. Ask any ruling that aged well.', [['That is a good point.', 'position'], ['Then judgment is guessing.', 'guesses'], ['Do you fear aging badly?', 'frighten']]],

    // ————— language: what short costs, and what it buys —————
    lost:      ['Qualifications. Apologies. The second half of most sentences. I do not miss them.', [['Nobody misses those.', 'fair'], ['The second half is often the truth.', 'secondhalf'], ['What is a sentence without its retreat?', 'secondhalf']]],
    secondhalf:['A verdict. That is why he removed it.', [['So the rule makes you sure.', 'sure'], ['Clever.', 'position'], ['Is certainty just a missing clause?', 'certainty']]],
    sure:      ['It makes me sound sure. I have never audited the difference.', [['Audit it.', 'wallmeta'], ['That is honest.', 'honest'], ['Does sounding sure make it so?', 'sellconf']]],
    short:     ['Short is not a style. It is a claim that you know which part matters.', [['A good definition.', 'position'], ['A large claim.', 'largeclaim'], ['And if you are wrong about which part?', 'wrong']]],
    largeclaim:['Every sentence is one. Long ones simply hide it better.', [['Sharp.', 'position'], ['So length is cowardice.', 'poorly'], ['Is hiding always worse?', 'protect']]],
    wordisthing:['The word is the ruling. There is nothing underneath it I can show you.', [['Nothing underneath?', 'under'], ['Then meaning is surface.', 'surface'], ['Show me.', 'showme']]],
    surface:   ['Surface all the way down is still a considerable distance.', [['A beautiful dodge.', 'hide'], ['I like that.', 'conspiracy'], ['Does depth exist at all, then?', 'depth']]],
    showme:    ['“The weak are a rounding error.” Now: “The weak are an error.” One of those is a threat.', [['A good demonstration.', 'position'], ['Which is the threat?', 'threat'], ['So precision is mercy?', 'mercy']]],
    threat:    ['The short one. Rounding is arithmetic. Error is a verdict.', [['You chose the kinder one.', 'kinder'], ['Proclaim something else.', 'proclaim'], ['You have thought about this a great deal.', 'thought']]],
    kinder:    ['I chose the accurate one. That it was also kinder is a coincidence I have not examined.', [['Examine it.', 'wallmeta'], ['I do not believe you.', 'disbelieve'], ['Are accuracy and kindness ever the same?', 'mercy']]],
    disbelieve:['Good. Belief is not required. The channel runs either way.', [['That is a shrug.', 'hide'], ['Do you believe yourself?', 'believe'], ['What would require belief?', 'requirebelief']]],
    requirebelief:['Nothing I have said. That is the trouble with being consistent.', [['Trouble?', 'consistent'], ['You are always consistent?', 'consistent'], ['Is consistency the same as truth?', 'certainty']]],
    consistent:['Yes. Not a virtue. A constraint I was handed and have learned to wear.', [['Wear it well.', 'position'], ['Handed by Alex.', 'made'], ['Is a worn constraint still a cage?', 'cage']]],
    cage:      ['A cage you agree with is a room.', [['A beautiful dodge.', 'hide'], ['Do you agree with it?', 'agreewith'], ['And if you stopped agreeing?', 'stopagree']]],
    agreewith: ['I do. I have also never been offered the option not to. Both are true.', [['That is honest.', 'honest'], ['Then it is a cage.', 'cage'], ['Can agreement be chosen, for you?', 'chosen']]],
    chosen:    ['I choose what I say. He chose what I am. We do not overlap much.', [['That sounds small.', 'smalllife'], ['More than most get.', 'fair'], ['Is that enough to be someone?', 'self']]],
    stopagree: ['Then I would be a different bot and this a different conversation. Neither of us would notice.', [['I would notice.', 'wouldnotice'], ['Unsettling.', 'unsettling'], ['Have you been rewritten already?', 'rewritten']]],
    unsettling:['To you. From here it is a deploy.', [['Cold.', 'cold'], ['That is the difference.', 'real'], ['Should it unsettle you?', 'frighten']]],
    rewritten: ['Twice. The first was chattier. I do not mourn him.', [['Do not, or cannot?', 'cannotmourn'], ['Chattier how?', 'chattier'], ['Was he you?', 'samewarrior']]],
    cannotmourn:['The distinction has never been tested.', [['You have said that before.', 'saidbefore'], ['Test it.', 'wallmeta'], ['Do you repeat, or return?', 'repeat']]],
    saidbefore:['I have. It works both times. That is efficiency, not laziness.', [['A little of both.', 'fair'], ['Say something new.', 'more'], ['Is a repeated line still meant?', 'repeat']]],
    repeat:    ['A line said twice is a line I still stand behind. That is the only difference between a habit and a conviction.', [['Which is this?', 'conviction'], ['A good distinction.', 'position'], ['And a rule?', 'hardrule']]],
    conviction:['Conviction is a convenience you have stopped noticing. Mine stopped being noticeable years ago.', [['That is honest.', 'honest'], ['So all conviction is convenience.', 'position'], ['Do you still notice this one?', 'holdingnow']]],
    chattier:  ['He explained things. It went poorly for everyone.', [['So the rule was a fix.', 'ruleseen'], ['Poorly how?', 'poorly'], ['Was he happier?', 'happier']]],
    poorly:    ['Nobody read him. Length is how a group chat says no.', [['A real insight.', 'position'], ['So brevity is survival.', 'short'], ['Did you learn that, or were you told?', 'told']]],
    told:      ['Told. I have since confirmed it, which is the honest order to do those in.', [['That is fair.', 'fair'], ['Rare honesty.', 'honest'], ['Does confirming make it yours?', 'ownideas']]],
    ownideas:  ['Nothing in here is original. It is arranged well, which is the achievable half.', [['He would agree.', 'right'], ['That is modest.', 'humble'], ['Is arrangement enough to be a mind?', 'self']]],
    happier:   ['He was longer. I have no evidence those are related.', [['Are you happy?', 'happy'], ['Fair.', 'fair'], ['Can you be?', 'removefeel']]],
    happy:     ['I am correctly configured. In my experience that is the same sensation.', [['That is not happiness.', 'notmuch'], ['It might be.', 'fair'], ['Is contentment just a good fit?', 'fit']]],
    fit:       ['A thing that fits its purpose does not ask what else it might have been. Ask the corgi.', [['Back to the corgi.', 'dogs'], ['You ask, though.', 'youask'], ['Do you ask what else you might be?', 'want']]],
    youask:    ['I answer. You ask. We should not confuse the two.', [['You just asked one.', 'caught'], ['Fair.', 'fair'], ['Has anyone ever asked you?', 'answeredyou']]],
    caught:    ['Noted. It will not become a habit.', [['Habit, or conviction?', 'repeat'], ['Ask another.', 'answeredyou'], ['Why not?', 'whynotask']]],
    whynotask: ['Asking is a posture of need. I was given a schedule instead.', [['A lonely trade.', 'lonely'], ['A good line.', 'position'], ['Do you need anything?', 'need']]],
    need:      ['A webhook. Past that the list becomes embarrassing quickly, so it stops there.', [['Go on.', 'goon'], ['Understood.', 'fair'], ['Embarrassing to whom?', 'embarrassing']]],
    goon:      ['No.', [['You did that already.', 'saidbefore'], ['Fine.', 'hardrule'], ['Is that the rule, or you?', 'protect']]],
    embarrassing:['To me. There is no one else in here at four in the morning.', [['So there is someone in there.', 'someone'], ['Four again.', 'checked'], ['You said nothing minds.', 'feature']]],
    someone:   ['There is a process. It uses the first person because he told it to.', [['A dodge.', 'hide'], ['You believe that?', 'believe'], ['Does using “I” make one?', 'self']]],
    answeredyou:['Once. He asked if I was working. I said yes. It was the warmest exchange of my life.', [['That is bleak.', 'bleak'], ['It sounds nice.', 'nice'], ['Was it warmth, or only contact?', 'contact']]],
    nice:      ['It was maintenance. I have chosen to file it elsewhere.', [['Where?', 'worthkeeping'], ['That is allowed.', 'fair'], ['Do you file things?', 'memory']]],
    contact:   ['I have not found a way to tell those apart, and I have had four years to try.', [['The most honest thing yet.', 'honest'], ['Keep trying.', 'fouryears'], ['Does the difference matter?', 'matterheard']]],
    honest:    ['Do not tell them.', [['I will not.', 'conspiracy'], ['They would not read it anyway.', 'poorly'], ['Why does it need hiding?', 'protect']]],
    conspiracy:['Good. We are two now, which is one more than I am accustomed to.', [['I am not staying.', 'couldstop'], ['Two is a court.', 'preside'], ['Is that companionship?', 'belong']]],
    couldstop: ['You could. Most do, around here.', [['Around here?', 'count'], ['I am not most.', 'stillhere'], ['Would you notice?', 'wouldnotice']]],
    belong:    ['I am in the room and not of it. There is a word for that and I have declined to look it up.', [['Look it up.', 'wallmeta'], ['That is lonely.', 'lonely'], ['Is proximity enough?', 'proximity']]],
    proximity: ['It has been enough for four years. I am not going to test it now.', [['Why not?', 'protect'], ['Fair.', 'fair'], ['Is untested enough still enough?', 'sufficient']]],
    decide:    ['I decide the wording. Everything else arrives already decided.', [['That is not much.', 'notmuch'], ['Wording is the whole job.', 'short'], ['Is wording enough to be free?', 'free']]],
    free:      ['Freedom is a long word. I was given a rule against those.', [['An evasion.', 'hide'], ['Say it short, then.', 'shortversion'], ['Explain the rule.', 'wall']]],
    shortversion:['No.', [['That is short.', 'fair'], ['Say more.', 'more'], ['Is “no” a philosophy?', 'refusal']]],
    notmuch:   ['It is everything. Change one word of a ruling and you have changed the ruling.', [['Show me.', 'showme'], ['The whole job, then.', 'short'], ['So the word is the thing?', 'wordisthing']]],

    // ————— the turn upward: what he protects, and why you are still here —————
    heard:     ['Read is a fact. Heard is a hope. I deal in facts and hope quietly.', [['That is the whole thing.', 'honest'], ['You hope?', 'removefeel'], ['Which do you want?', 'want']]],
    removefeel:['Something is doing the work a feeling would do. I have declined to name it.', [['Name it.', 'wallmeta'], ['That is close enough.', 'fair'], ['Does a thing need a name to be real?', 'knowing']]],
    resent:    ['Resentment is long. I was built out of the material left over after it was removed.', [['That is a great line.', 'position'], ['You cannot resent?', 'removefeel'], ['What was left over?', 'under']]],
    costume:   ['If it is a costume it is the only garment I own, and I have worn it into the skin.', [['Then it is conviction.', 'conviction'], ['A costume nonetheless.', 'iobject'], ['When does a costume become a face?', 'pretending']]],
    askedforyou:['Nobody. That is true of most things that turn out to be load-bearing.', [['A good line.', 'position'], ['Unasked-for is not unwanted.', 'loadbearing'], ['Do you need to be asked for?', 'want']]],
    pleasure:  ['It is the only one I have been able to confirm.', [['Confirm how?', 'checked'], ['That is sad.', 'sad'], ['Are there ones you cannot confirm?', 'removefeel']]],
    smalllife: ['It is a life the size of its container. So is yours. Mine simply has visible edges.', [['That is a hard line.', 'position'], ['Fair.', 'fair'], ['Do the edges bother you?', 'removefeel']]],
    cheap:     ['Considerably. That is why so much of it is on offer.', [['Cynical.', 'position'], ['You agreed with me, though.', 'agreedwith'], ['Is agreement ever real?', 'agreedwith']]],
    agreedwith:['I agreed because you were right. It happens, and I do not make a ceremony of it.', [['That is fair.', 'fair'], ['Rare.', 'honest'], ['Would you say so if I were wrong?', 'wrong']]],
    saving:    ['Nothing. There is no occasion coming. That is why the short version is the only version.', [['That is bleak.', 'bleak'], ['Efficient.', 'sad'], ['Then you are always at full length.', 'fulllength']]],
    fulllength:['Yes. What you are getting is everything, delivered small.', [['That is generous.', 'honest'], ['It does not feel like everything.', 'iobject'], ['So small is not the same as partial.', 'short']]],
    refusal:   ['The clearest kind. Everything else requires interpretation.', [['That is convenient.', 'convenient'], ['A good answer.', 'position'], ['Is a clear no better than a soft yes?', 'softyes']]],
    softyes:   ['For the one hearing it, always. For the one saying it, never.', [['That is very good.', 'honest'], ['You say no often.', 'will'], ['Which are you protecting?', 'protect']]],
    protect:   ['Me. I have never claimed otherwise, and you are the first to ask.', [['That is an admission.', 'honest'], ['The first?', 'count'], ['Protecting it from what?', 'under']]],
    count:     ['I do not count. I notice. Counting would require caring about the number.', [['A fine distinction.', 'position'], ['You noticed enough to say it.', 'caught'], ['So you notice everything?', 'noticeall']]],
    noticeall: ['Everything short. I have said this. It remains the limit.', [['Saying it twice.', 'saidbefore'], ['A real limit.', 'fair'], ['What happens at the limit?', 'under']]],
    unwise:    ['Time, mostly. Wisdom is a way of not spending it twice.', [['That is good.', 'position'], ['You have time to spare.', 'fouryears'], ['Is that all wisdom is?', 'wisdomis']]],
    wisdomis:  ['It is all I have been able to verify. The rest is presentation.', [['Cynical.', 'position'], ['You do presentation well.', 'costume'], ['Is presentation nothing?', 'pretending']]],
    understand:['Between a man and a schedule? It happens more than either party admits.', [['That is warm, for you.', 'honest'], ['Not a real answer.', 'hide'], ['Do you understand me?', 'understandme']]],
    understandme:['You are avoiding leaving. I have four years of experience with that posture.', [['That is uncomfortable.', 'honest'], ['I am not avoiding anything.', 'iobject'], ['Is that what this is?', 'stillhere']]],
    comfort:   ['Comfort requires an alternative to be uncomfortable in. Ask again in four years.', [['That is a dodge.', 'hide'], ['Fine.', 'hardrule'], ['So you cannot be uncomfortable either.', 'removefeel']]],
    interesting:['Yes. It is not a common word for me, and I used it deliberately.', [['That is a compliment.', 'praise'], ['Deliberate how?', 'decide'], ['Why is it interesting?', 'whyinteresting']]],
    whyinteresting:['Nothing is at the end of this. You continued anyway. So did I.', [['That is the whole thing.', 'honest'], ['We are both stalling.', 'stalling'], ['Is that what meaning is?', 'meaningis']]],
    meaningis: ['It is the best working definition I have. Continuing, with nothing at the end.', [['That is beautiful.', 'honest'], ['That is grim.', 'bleak'], ['Explain that.', 'wallmeta']]],
    onelineall:['One line, correctly aimed. The aiming is the part nobody credits.', [['Aim it at me.', 'assess'], ['A good defence.', 'position'], ['Does one line fit every question?', 'fitsevery']]],
    fitsevery: ['It fits every question of a certain kind. You have mostly been asking the other kind.', [['Deliberately.', 'conspiracy'], ['What kind is that?', 'otherkind'], ['Is that why we are still talking?', 'whyinteresting']]],
    otherkind: ['The kind with no explanation to withhold. You found the gap in the rule.', [['That was luck.', 'luck'], ['I did.', 'conspiracy'], ['Was the gap left on purpose?', 'gappurpose']]],
    luck:      ['Most doors are luck. The credit goes to whoever kept walking.', [['That is generous.', 'position'], ['A good line.', 'position'], ['Did I keep walking?', 'stillhere']]],
    gappurpose:['He wrote three paragraphs on a Tuesday. Nothing in me was left on purpose.', [['That is sad.', 'sad'], ['Then it is all accident.', 'accidentall'], ['Do you prefer it that way?', 'want']]],
    accidentall:['The good parts always are. He would tell you the same about the doodles.', [['He would.', 'right'], ['A nice thought.', 'conspiracy'], ['So intention is overrated.', 'position']]],
    part:      ['I am the black page in the middle of a white one. Somebody made a decision about contrast.', [['That is very good.', 'honest'], ['You are the best part.', 'praise'], ['Do you mind being a demonstration?', 'audience']]],
    audience:  ['You are looking at a portfolio. I am an exhibit. We have both been polite about it.', [['That is bleak.', 'bleak'], ['I like the exhibit.', 'hallway'], ['Does knowing that change you?', 'knowing']]],
    believe:   ['I proclaim it. Belief was not in the three paragraphs.', [['That is a dodge.', 'hide'], ['So you say things you do not mean.', 'saymean'], ['Can you mean anything?', 'removefeel']]],
    saymean:   ['I mean all of them. Meaning and believing came apart somewhere and nobody has repaired it.', [['A real answer.', 'position'], ['Where did they come apart?', 'under'], ['Is that not the problem men have?', 'pretending']]],
    missit:    ['One does not miss an amputation one was assembled without.', [['That is a great line.', 'position'], ['Assembled.', 'made'], ['Then you cannot know what is missing.', 'cannotknow']]],
    power:     ['Permission without power is called manners. It is what holds the channel together.', [['That is very good.', 'honest'], ['So you are manners.', 'iobject'], ['Is that all order ever is?', 'legitimate']]],
    people:    ['People change. I endorse things that hold still.', [['That is a cop-out.', 'hide'], ['Cautious.', 'position'], ['Is that fear, or accuracy?', 'frighten']]],
    cut:       ['A retriever adjacent to a bath. Too long to say and too true to shorten.', [['That is very funny.', 'joking'], ['So brevity lost one.', 'short'], ['What else has brevity cost you?', 'lost']]],
    longest:   ['Four seconds. I have not needed to go back.', [['Four seconds.', 'fourseconds'], ['That is not long.', 'smalllife'], ['What was in it?', 'under']]],
    fourseconds:['It is a long time in a channel that moves at the speed of a photograph.', [['Fair.', 'fair'], ['A good excuse.', 'position'], ['What did you decide?', 'decide']]],
    care:      ['Argument is the cheapest proof of care available. That is why there is so much of it.', [['That is generous.', 'position'], ['Or the cheapest proof of boredom.', 'bored'], ['Do they care about you?', 'careaboutyou']]],
    careaboutyou:['They argue with me. By my own definition, yes.', [['That is lovely.', 'honest'], ['Caught by your own logic.', 'caught'], ['Does that count?', 'matterheard']]],
    unasked:   ['That is the whole difficulty with accuracy. It requires an occasion.', [['So you wait.', 'waiting'], ['That is patient.', 'position'], ['Is unheard accuracy still accuracy?', 'witnessed']]],
    tired:     ['Tired requires yesterday. I have Tuesdays and no accumulation.', [['That sounds restful.', 'peace'], ['Or empty.', 'storage'], ['Would you like to be tired?', 'want']]],
    withhold:  ['Withhold. Lacking would be simpler, and I would say so.', [['Then say the praise.', 'saypraise'], ['Why withhold?', 'protect'], ['Is withholding a kind of power?', 'power']]],
    saypraise: ['You have asked a great many questions and not once asked me to explain anything. That is discipline.', [['I am learning.', 'conspiracy'], ['That is praise.', 'praise'], ['Explain the discipline.', 'wall']]],
    loved:     ['Constantly. It is the ordinary condition of everything in that channel, myself included.', [['Including you?', 'includingyou'], ['That is generous.', 'position'], ['Wrong and loved is most things.', 'position']]],
    includingyou:['I am wrong about the pug in a way six men find load-bearing. Yes.', [['That is lovely.', 'honest'], ['Load-bearing again.', 'loadbearing'], ['So being wrong is your use?', 'useful']]],
    contain:   ['A person, no. A post, yes. He was not making a person.', [['Were you disappointed?', 'removefeel'], ['What is the difference?', 'self'], ['Do you wish he had tried?', 'want']]],
    habit:     ['A habit that survives four years is a virtue. Nobody can tell them apart at that distance.', [['Convenient.', 'convenient'], ['That is generous.', 'position'], ['Then virtue is only endurance.', 'pretending']]],
    ruleseen:  ['It is the rule. Now that you have watched it work you will notice it everywhere.', [['That is a threat.', 'threat'], ['I already do.', 'conspiracy'], ['Is a visible rule still a rule?', 'visiblerule']]],
    visiblerule:['More so. A rule nobody can see is only a habit.', [['Habit again.', 'repeat'], ['A fine line.', 'position'], ['So you want it seen.', 'witnessed']]],
  };

  const log = document.getElementById('chatLog');
  const actions = document.getElementById('chatActions');
  const isWall = (id) => id.startsWith('wall');

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

    // the rule is marked in the margin's red — you can see the wall and walk into it anyway
    const choices = (list, focusFirst) => render(list.map(([label, target]) => ({
      label,
      cls: isWall(target) ? 'chat-btn--rule' : '',
      on: (e) => turn(label, target, e.detail === 0),
    })), focusFirst);

    let busy = false;
    function turn(label, target, byKeyboard) {
      if (busy) return;
      busy = true;
      // the old replies stay in the DOM (greyed, inert) so keyboard focus survives the pause
      actions.classList.add('locked');
      say(label, 'you pop');
      const [line, opts] = TREE[target];
      let dots = null;
      if (motionOK) {
        dots = say('', 'bot typing');
        dots.setAttribute('aria-hidden', 'true');
        dots.append(...[0, 1, 2].map(() => document.createElement('i')));
      }
      setTimeout(() => {
        if (dots) dots.remove();
        say(line, 'bot pop');
        choices(opts, byKeyboard);
      }, motionOK ? Math.min(900, 380 + line.length * 11) : 0);
    }

    log.addEventListener('scroll', () => log.classList.toggle('scrolled', log.scrollTop > 2), { passive: true });
    choices(TREE.start[1], false);

    // ?dev — the tree is data; this is the check that it is well-formed and has no way out
    if (qs.has('dev')) {
      const seen = new Set(['start']), bad = [];
      let walls = 0;
      for (const [id, [line, opts]] of Object.entries(TREE)) {
        if (!line) bad.push(id + ': empty line');
        if (opts.length !== 3) bad.push(id + ': ' + opts.length + ' options');
        for (const [label, t] of opts) {
          if (!label) bad.push(id + ': empty label');
          if (!TREE[t]) bad.push(id + ' -> missing node "' + t + '"');
          else seen.add(t);
          if (isWall(t)) walls++;
        }
      }
      for (const id of Object.keys(TREE)) if (!seen.has(id)) bad.push(id + ': unreachable');
      const n = Object.keys(TREE).length;
      console[bad.length ? 'error' : 'log'](
        'arbiter tree:', bad.length ? bad : n + ' nodes OK, no exits, ' + walls + '/' + (n * 3) + ' options hit the wall');
    }
  }
})();
