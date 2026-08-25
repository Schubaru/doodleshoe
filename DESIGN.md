# Design

## Theme

College-rule notebook paper, drawn on with black ink and a punk attitude, structured with neubrutalist discipline. Light theme only — paper is white; committing to the single look is the design (the notebook doesn't have a dark mode).

## Color

Strategy: **Restrained to the point of monochrome.** The page is ink on paper. Exactly one hue survives anywhere on the site: the red margin line of the ruled sheet. Every piece of type is `--ink` or `--ink-soft`; every doodle stroke is ink. Nothing else carries a hue.

```css
:root {
  --paper: oklch(1 0 0);                 /* body bg — pure white paper */
  --rule: oklch(0.87 0.035 230);         /* horizontal rule lines (structural, never text) */
  --ink: oklch(0.22 0.015 260);          /* body text + doodle strokes — ballpoint black */
  --ink-soft: oklch(0.45 0.015 260);     /* secondary text (≥4.5:1 on paper) */
  --margin-red: oklch(0.58 0.19 27);     /* THE only hue on the page — the ruled sheet's margin line */
  --ink-faint: oklch(0.88 0.008 260);    /* selection wash, masking tape */
}
```

- Ink carries the entire surface. There is no second pen. Emphasis comes from weight, size and the neubrutalist frames — never from hue.
- Never tint the paper cream. The warmth comes from the hand-drawn line quality, not the background.
- Red margin line is a persistent vertical rule on the left (x ≈ 56–72px desktop, thinner on mobile) — sacred, and nothing crosses it. It is a line, not a track: no character rides it.
- A matching right lane (`--gutter-x`, 92px) is reserved for the monkey. Panels are capped so they can never grow into it; it collapses to 0 below 900px, where he is hidden.

## Typography

- **One family everywhere: "Atkinson Hyperlegible Next"** (Google Fonts, variable 200–800) — Braille Institute's legibility face. Hierarchy comes from weight and size only, never from a second family. Wordmark and headings 700; body 400; annotations 500. Body 1rem/1.75 (28px line-height locked to the 28px rule grid).
- No display/handwriting font. The doodles carry the hand; the type stays plain and legible — the grid-is-the-straight-man principle taken all the way into the typography.
- Mono (build-notes / stack lines): `ui-monospace, SFMono-Regular, Menlo, monospace` — system, not loaded.
- Scale: fluid clamp() for display (ratio ≥1.33); body fixed. Body max measure 65ch.
- Baseline discipline: body text sits ON the rule lines (28px vertical rhythm everywhere).

## Doodles (the illustration system)

Hand-authored inline SVGs, consistent line weight (~5px at 100px viewBox scale), round caps, slight wobble in paths — ballpoint ink style, always ink, never coloured.

**The vocabulary of scattered marks is gone.** No skulls, stars, sparks, bolts, crowns, flames, hearts, or horns anywhere on the site. Loose doodles scattered around a section are decoration, and decoration was the thing making the page loud. What survives is only the cast — three characters who do a job — plus the masking tape on the screenshots. If a new mark cannot name its job, it does not go on the page.

Cast of characters:
- **The Knight** (from Wordsword) — the app's mascot, so he lives in the app's case study, not in the chrome. He duels a plumed challenger on the Wordsword panel's "built with" line: two exchanges (wind-up, strike, spark, recoil), then ~2s of guard before it repeats. Reduced motion freezes them mid-clash, blades crossed. The rival is the same build with a crest, a pointed helm, a nasal bar, a heater shield and a longer blade — different enough to read at 90px.
- **Monkey astronaut** — the companion. `position: fixed` in a reserved right lane (`--gutter-x`, 148px, collapsing to 0 below 900px where he is hidden). Two independent motions compose on separate elements so they never fight: the wrapper carries the scroll response (`--drift` / `--lean`), the inner SVG carries a lazy 14s figure-eight orbit, and one arm carries the wave. He flips to white over the Arbiter's black page.
- **Retro scuba diver** — swims across the case-study transition, bubbles rise. Ink, like everything else.

All doodles draw themselves in (stroke-dashoffset) on scroll entry. Reduced motion: pre-drawn, static.

## Layout

- Single long-scroll page. Robin-noguier-style case studies: each study is a tall section with a sticky 100vh takeover panel; internal scroll progress advances beats (**what it is → why it works this way → how I built it**). The middle beat is the case study's job: it names the decision and the thing it rejected. The third is first-person and picks one hard part; it is not a stack list — the mono footer already carries the stack.
- Neubrutalist frames: 2–3px solid ink borders, hard offset shadows (4–6px solid, no blur), zero-to-4px radii. Tape/paperclip conceits for screenshots ("taped-in" photos).
- Asymmetric: content hangs off the ruled grid; annotations rotate ±2–4°.
- **The shots get the wide column.** `.study-body` is `8fr / 5fr`, shots first. The beats are three short paragraphs revealed one at a time, so they need a measure (~48ch), not half the panel; the screenshots are the evidence and have to be legible at a glance. Getting this backwards is what made the N00B dashboard unreadable.
- **Inside the sticky panel, height is the scarce resource, and every rotation spends it.** The panel is clipped to `100vh - 56px` and `--shot-h` is what remains after the header, footer and padding (`100vh - 356px`). Each figure's cap is `--shot-h × k`, where k must be measured against the *rotated* bounding box, not the declared `aspect-ratio` — a 7° tilt on a tall phone costs ~5% of height that the aspect-ratio does not know about. The budget also has to pay for chrome the formula kept forgetting: `.shot`'s own 8px margin (all studies), and the 14px a `.study-links` pill adds to the footer over the bare mono line (N00B, B43) — hence `100vh - 364px`, and `100vh - 378px` where links are present. Check `panel.scrollHeight - panel.clientHeight === 0` at 700, 820, 900 and 1080 after touching any of it.
- A vertical stagger in a fan is the expensive kind: rendered phone width works out to `height × (1 − lastStep) ÷ 2.1732`, so the step fraction, not the image width, is what sets how big the screens can be.
- z-scale: fixed doodles < sticky-panels < nav < dialog.

## Motion

- Signature: **ink draws itself** — scroll-driven SVG stroke animation, one rAF loop writing CSS custom properties (`--p` per section), CSS/SVG consume them.
- Ease: expo/quart out. **No bounce, no elastic.** The monkey's scroll-trail spring is tuned near-critical (k 0.028, damping 0.764 per frame): ~530ms glide home, zero overshoot, zero oscillation. Verify any change to those constants by simulating the recurrence before shipping it.
- The monkey's idle orbit is a lemniscate sampled from `x = 24·sin(t)`, `y = 14·sin(2t)` at 16 steps, `linear` for 14s — the sine sampling already carries the easing, and sampling a closed curve is what makes the loop seam invisible. Amplitude is not free: the 148px lane is sized as 40 (offset) + 60 (max width) + 24 (swing) + 24 (clearance). Changing the amplitude means re-deriving the lane, or he clips the case-study panels on 1280-class laptops.
- One screen per beat: inside a case study the shots arrive with the beats, not all at once (`--p` gates each at 0.34 and 0.64). This is the choreography the page is *for* — and it only arms above `900×700`. That floor was 800px tall and silently dropped the whole effect on a 1440×900 laptop, where browser chrome leaves ~780. If you raise it again, you are turning the site's signature off for most visitors.
- Everything visible without JS; animation only enhances. `prefers-reduced-motion: reduce` → static drawn state, sticky beats become plain stacked sections, demo reels hold on their poster frame.

## Components

- **Case-study panel**: paper card, ink border, offset shadow; header row (title + deck + hand-drawn platform badge), beats as internal scroll steps, footer "built with" mono line.
- **Beat label**: the beat heading (`WHAT IT IS` / `WHY IT WORKS THIS WAY` / `HOW I BUILT IT`) sits in the mono label tier the page already owns — stamp, built-with line, site-link pill — not in the type ramp. It is a signpost, so it goes *below* the body in the hierarchy, not above it: family, size, case and colour all move at once. That is what fixed a header ramp running 1rem / 1.1rem / 1.15rem, which read as one flat step. Only one beat is visible at a time, so these never stack into a column of eyebrows. Deck (`.study-sub`) is 1.25rem; every one of these sits inside the locked 28px line box, so type sizes here never move the panel's height budget.
- **Taped screenshot**: real screenshot, slight rotation, masking-tape corner SVGs. Three arrangements, one per case, and they must stay distinct — two identical fans back to back read as a template rather than a hand. `.phone-shot` is Wordsword's dealt deck (each screen steps right and down); `.stack-shot` is B43's centre-forward trio (the middle screen leads, the wings open out from behind it); `.wide-shot` is one letterboxed dashboard with two close-ups taped over it.
- **Taped demo reel**: the same taped frame, but a silent looping `<video>` of the thing actually running. `preload="none"` with a real screenshot as `poster`, so it costs nothing until it is nearly on screen and reduced-motion visitors keep a true still. Autoplay lives in JS, never in the markup — that is what keeps the motion contract in one place. Recorded by `tools/webrec`, which drives the page in a WKWebView and snapshots it; see `tools/README.md`.
- **Site-link pill**: live links sit in the panel footer wearing the stamp's pill — 2px ink border, full radius, mono caps, filling with ink on hover. Borrowing the stamp means a panel gains a control without gaining a visual language. Unrotated, so it never reads as a stamp. Only for leaving the site; an in-site destination (368 Dinos) keeps its solid `.btn`, because it is a different promise.
- **Stamp**: red circular "graded" stamp (e.g. SHIPPED) — margin-red, rotated.
- **Arbiter chat**: a hand-authored dialogue tree (309 nodes, 927 replies) rendered as a mini chat on the black page. Three replies per turn; slots 1–2 stay in the bit, slot 3 turns philosophical — duty, memory, being a thing that waits for a webhook. **There is no exit.** Every reply opens three more; the conversation outlasts the visitor, which is the character. "Were it so easy." survives as a *wall*, not a door: 13 of the 927 options reach it, it is marked in margin-red so you can see it coming, and he keeps talking afterwards. An always-available "Explain…" was the earlier design and it was the wrong one — a trap door advertised on every wall, and the same joke told sixty times. The tree is data; `?dev` validates it (every option resolves, every node reachable, no dead ends) and prints the wall ratio.
