# doodleshoe Design System

> Source of truth for every UI decision in this project. Read this before touching any UI. Built with the `key-components` skill on 2026-09-10. Version 1.1.0.

## 1. Overview

- **Platforms:** web, as plain HTML and CSS. No framework, no build step, no `node_modules`. That is a design decision, not a gap.
- **Modes:** light only. Paper does not have a dark mode. The Arbiter's black page is a dark *surface* inside the light theme; nothing else on the site inverts.
- **Style in one paragraph:** College-rule notebook paper, drawn on with black ink and a punk attitude, structured with neubrutalist discipline. Everything sits on a 28px rule grid with a red margin line down the left and a reserved lane down the right for the monkey. Type is one family, Atkinson Hyperlegible Next, and hierarchy comes from weight and size only. Exactly one hue exists anywhere: the margin red. Depth is a hard offset shadow with no blur, the kind you could draw with the same pen. Illustration is hand-authored inline SVG in one ink at one weight, and every mark on the page is a character with a job.
- **Sources:** `styles.css` (the shipped variables and component classes), `index.html` (the shipped markup), and `DESIGN.md`, which Alex wrote by hand and which is the prose original of this spec.
- **Where things live:**
  - Spec: `design-system/style-spec.json` (the only file you edit to change the generated half of the system)
  - Generated tokens: `design-system/tokens/tokens.{json,css,ts}` and `contrast-report.md`. Do not hand-edit; edit the spec and re-run.
  - Site tokens: `design-system/tokens/tokens.site.css`. Hand-authored, authoritative, and explained in section 3.6.
  - Components: `design-system/components/manifest.json`. One entry per component, each carrying purpose, use, don't-use, anatomy, the markup, and a `source` pointer into `styles.css`.
  - Playground: `design-system/playground/index.html`. Open it over a local server, not as a `file://` URL, or the screenshots will not load.
  - Migration: `design-system/MIGRATION.md`, mapping every variable `styles.css` uses today onto its token.
  - Storybook: none, on purpose. See section 4.2.
  - Figma: not pushed. When that changes, the file key goes in the spec's `sources[]` and the link goes here.

**The running site is the real gallery.** Every component in this system is on `index.html` in production, doing its actual job. The playground is for seeing the tokens laid out and the components isolated; the site is for seeing whether they work.

## 2. Principles

Decide once, ripple everywhere. Components never contain literal values. Roles describe purpose, not appearance. Accessibility target: **AA**, and every text and background pairing named in the semantic layer is contrast-checked. 18 of 18 pairs pass, with body text at 12:1.

Three principles are specific to this system and outrank convenience:

1. **There is no second pen.** Emphasis comes from weight, size and the neubrutalist frame. Never from hue.
2. **A mark that cannot name its job does not go on the page.** The cast is the shoe, the monkey, the knight and his challenger, the diver, and the masking tape. Scattered decoration is what made this page loud once, and it is gone.
3. **Everything works without JavaScript.** Animation only enhances. `prefers-reduced-motion: reduce` gets the static drawn state, the sticky beats become plain stacked sections, and demo reels hold on their poster frame.

## 3. Foundations

### 3.1 Color

- Seeds: primary `#D33B36`, which is the margin red, `oklch(0.58 0.19 27)`. No secondary, no accent. Neutrals: `cool`.
- Ramps: 11 steps (50 to 950) per family, primitive names `color.<family>.<step>`.
- **Every status seed is ink except danger, which is that same red.** A green or an amber has never appeared on this site and must not. If a state needs to be signalled, it is signalled by weight, by the frame, or by the red, and always with words as well.
- Semantic roles (use these, not ramps): `bg.*`, `surface.*`, `text.*`, `border.*`, `icon.*`, `overlay.*`.
- Light only. There is no `[data-theme="dark"]` block and adding one would be a redesign, not a token change.
- Contrast: 18 pass, 0 fail, at the AA threshold of 4.5:1 for text and 3:1 for UI. Full table in `tokens/contrast-report.md`.

The shipped site does not use the generated semantic colors yet; it uses the four ink values in `tokens.site.css`, which are what the paper look is actually made of. `MIGRATION.md` maps them onto the generated ramp steps they sit nearest, which is close enough to be interchangeable for text and border but not identical. Do not swap one for the other without looking.

### 3.2 Typography

- Families: display and body are both **Atkinson Hyperlegible Next**, the Braille Institute's legibility face, loaded as a variable font (200 to 800) from Google Fonts with `display=swap`. Mono is the system stack, `ui-monospace, SFMono-Regular, Menlo, monospace`, not loaded.
- **One family everywhere.** There is no display face and no handwriting face. The doodles carry the hand; the type stays plain and legible. That is the grid-is-the-straight-man principle taken all the way into the typography.
- Scale: base 16px, ratio 1.25, steps `font.size.100` to `900` (10, 13, 16, 20, 25, 31, 39, 49, 61).
- Body is 1rem on a 28px line box, locked to the rule grid. Body measure caps at 65ch; a beat's measure caps at 48ch.
- Weights in use: 700 for the wordmark and headings, 500 for annotations and the deck, 400 for body.

| Role | Use for | Don't use for |
|---|---|---|
| display | The hero headline, once | Anything else on the page |
| headline | A case study's `h2`, the section headings | Card titles |
| title | The deck under a case-study title (`.study-sub`, 1.25rem) | Body reading |
| body | Beats, the About paragraph, everything you read | Headings or controls |
| label | Buttons | Paragraphs |
| caption | Annotations in the margin | Primary content |
| mono | The label tier: beat headings, the stamp, the built-with line, site-link pills, the colophon | Prose |

**The mono role is a tier, not a typeface choice.** Beat headings live in it because a beat heading is a signpost, not a headline: it sits *below* the body in the hierarchy, and family, size, case and colour all move at once to say so. That is what fixed a header ramp running 1rem / 1.1rem / 1.15rem, which read as one flat step.

### 3.3 Space

Base 4. Steps `space.0 1 2 3 4 5 6 8 10 12 16 20 24` resolving to 0 through 96px. Density normal.

Vertical space is not measured in these steps. It is measured in **rule heights**: `calc(var(--doodle-rule-h) * n)`, where the rule is 28px. Body text sits on the rule lines, and anything that moves off them is visible immediately.

### 3.4 Shape

Radius profile `sharp`: `none 0, xs 1, sm 2, md 4, lg 6, xl 8, full 9999`. Almost everything on this site is 0 to 4px. `full` exists for exactly two things, the Stamp and the SiteLink pill, and they are the same pill on purpose.

Default border weight in the generated tokens is 1px, and the thick step is 2px. **The neubrutalist frame is 2.5px** and lives in `tokens.site.css` as `--doodle-border-ink`, because the generated scale does not go there.

### 3.5 Elevation, motion, z-index

The generated `elevation.0` to `elevation.4` scale is blurred and alpha-based, and **this site does not use it.** Depth here is one hard offset shadow in solid ink with zero blur, at 4px (button at rest), 6px (button on hover) and 8px (the case-study panel, dropping to 5px below 480px). A press collapses the shadow to 1px so the control meets the paper.

Motion: expo and quart out. **No bounce, no elastic, anywhere.** The signature is ink drawing itself in, one `requestAnimationFrame` loop writing `--p` per section and CSS consuming it. Taps and hovers run at 120ms; a stroke draws in over 1.1s. The monkey's scroll spring is tuned near-critical (k 0.028, damping 0.764 per frame) for a ~530ms glide home with zero overshoot; simulate the recurrence before changing those constants.

Z-index, low to high: fixed doodles (1), content (2), nav (10), dialog.

### 3.6 The site layer

`tokens/tokens.site.css` is hand-authored and authoritative. It holds the things the generic generator has no concept of, and they are the things that make this site the thing it is:

| Group | Why it cannot be generated |
|---|---|
| The rule grid: `--doodle-rule-h`, `--doodle-margin-x`, `--doodle-gutter-x` | A 28px baseline with two reserved lanes is a layout system, not a space scale. The gutter is sized as 40 offset + 60 max width + 24 swing + 24 clearance, and changing the monkey's orbit amplitude means re-deriving it. |
| The ink: `--doodle-ink`, `-soft`, `-faint`, `-black`, `--doodle-margin-red` | Hand-picked oklch, not ramp steps. The ramp lands near them but not on them. |
| The night surface | A dark surface inside a light theme is not a mode, and the generator only knows modes. |
| The hard shadow | Zero blur, solid ink, drawn not lit. |
| `--doodle-border-ink: 2.5px` | Above the generated scale's ceiling. |
| The hand: stroke weights, tape, the three fixed tilts | There is no token vocabulary for "how hard the pen presses". |

When a value in `tokens.site.css` moves, the same value in `styles.css` moves with it. They are not allowed to fork.

## 4. Components

Inventory tier: **custom**. Fifteen components, which is every component this site has. The generic Core tier (Input, Select, Checkbox, Toast, Modal, Badge) has no instance here, so it was not built: an API nobody calls is a liability, and this site has no forms and no dialogs.

Full anatomy, purpose, don'ts and a `source` line pointing at the owning CSS block are in `components/manifest.json`, one entry each.

| Component | Category | Purpose | Don't use for |
|---|---|---|---|
| Button | actions | The one solid control: go somewhere on this site, or start something here | Leaving the site from inside a panel. That is SiteLink. |
| SiteLink | actions | A live link out, worn as the Stamp's pill | In-site navigation, which keeps the solid Button because it is a different promise |
| CopyLine | actions | An install command a visitor can take, on the skills page | Prompts or prose, and anything inside a sticky panel |
| ChatButton | actions | One of the Arbiter's three replies, the only control on the night surface | Anywhere on paper. Its shadow colour assumes the black page. |
| Stamp | status | The graded mark on a case study: what state the work is actually in | Anything clickable. It is a mark, and its rotation says so. |
| TopNav | navigation | The sticky header: the wordmark, the shoe, three destinations | Growing. Every sticky panel's height budget is measured off it. |
| SkipLink | navigation | First in the tab order, straight to the work | Any second skip target |
| Panel | content | The case-study card: a sheet of paper laid on the paper | Short content. Without a head, three beats, shots and a built-with line it is just a bordered box. |
| Beat | content | One step of the argument: what it is, why it works this way, my role | A stack list. The built-with line already carries the stack. |
| TapedShot | content | Real screenshots taped to the paper, in three arrangements that must stay distinct | Mockups, device frames, or anything that is not the software running |
| DemoReel | content | The same taped frame, but the thing actually moving | Anything a still already proves |
| Doodle | content | Hand-authored inline SVG in one ink at one weight | Scattered marks. Every one of the old ones is gone. |
| Annotation | content | A margin note in the reader's own hand | Anything load-bearing |
| Chat | content | The Arbiter's dialogue tree: 309 nodes, 927 replies, no exit | A general chat component |
| Colophon | content | The last word: how the site was made | Navigation |

Each has one variant, one size and one state in the manifest, because each one has exactly one form on this site. Where a component has real alternates (Button's paper and ink fills, TapedShot's three fans, ChatButton's wall modifier) the manifest markup shows all of them side by side rather than hiding them behind a selector.

### 4.1 Adding a component

1. Add a row to the table above: category, purpose, anatomy, don'ts.
2. Write its CSS in `styles.css`, using variables only. A hex, a raw font size, or a raw spacing value in a component is a defect.
3. Add an entry to `components/manifest.json` with `purpose`, `useFor`, `dontUseFor`, `anatomy`, `source` and an `html` snippet that uses the real classes.
4. Rebuild the playground (section 6, step 3).

### 4.2 Why there is no Storybook

The site has no build step and no `node_modules`, and a Storybook install would add both, plus a second styling path that can drift from `styles.css`. The playground gives the same isolation with zero dependencies, and it inlines the real stylesheet, so a component rendered there is the component, not an approximation of it. If the site ever moves to a framework, Storybook becomes the right answer and the manifest already holds everything the story generator needs.

## 5. Usage rules (the don'ts)

- No hex, rgb, px or font-size literals in components. Use the variables.
- Don't reach for a primitive ramp step (`color.primary.600`) in page code. Use the site layer's named ink, or a semantic role. If none fits, add one to the spec, don't bypass it.
- **Never introduce a second hue.** The margin red is the only one, and it means "marked", not "danger".
- **Nothing crosses the red margin line.** It is a line, not a track. No character rides it.
- **Nothing enters the monkey's right lane.** Panels are capped so they cannot grow into it.
- Never disable focus visibility. The site's one focus style is `2.5px solid` ink at `5px` offset, and the chat log uses the night-ink version of it.
- Colour never carries meaning alone. The Arbiter's wall reply is red *and* says what it says.
- Autoplay lives in JavaScript, never in the markup. That is what keeps the motion contract in one place.
- **Height inside a sticky panel is the scarce resource, and every rotation spends it.** A figure's cap must be measured against the *rotated* bounding box, not the declared aspect ratio: a 7 degree tilt on a tall phone costs about 5 percent of height the aspect ratio does not know about. After touching any of it, check that `panel.scrollHeight - panel.clientHeight === 0` at 700, 820, 900 and 1080.
- The beat choreography only arms above 900 by 700. That floor was 800 tall once and silently dropped the site's signature on a 1440 by 900 laptop, where browser chrome leaves about 780.

## 6. How to change the system

1. Edit `design-system/style-spec.json`.
2. Regenerate the tokens:
   ```
   python3 ~/.claude/skills/key-components/scripts/build_tokens.py design-system/style-spec.json design-system/tokens/
   ```
3. Regenerate the playground:
   ```
   python3 ~/.claude/skills/key-components/scripts/build_playground.py design-system/tokens/tokens.json design-system/playground/index.html --components design-system/components/manifest.json --extra-css styles.css
   ```
4. If the change touches the rule grid, the ink, the night surface, the hard shadow or the hand, edit `tokens/tokens.site.css` **and** the matching variable in `styles.css` in the same commit. They are not allowed to fork.
5. Only touch a component's CSS if the change adds a variant or a component.
6. Bump `version` in the spec: token values are a minor, a component contract is a major, docs are a patch. Add a changelog entry below.

Or run `/key-components` and describe the change; the skill follows this exact procedure.

To view the playground:
```
python3 -m http.server 8412
```
then open `http://localhost:8412/design-system/playground/index.html`. Opening it as a `file://` URL works for tokens but the taped screenshots will not load.

## 7. Deprecations

| Item | Deprecated in | Replacement | Remove after |
|---|---|---|---|
| — | | | |

## 8. Changelog

- **1.1.0 — 2026-11-02** — Added CopyLine for the new `/skills` page: the Button's frame and resting shadow around a selectable mono command, with an ink Copy half that JS reveals. TapedShot gains a note form (`.note`) for skills whose output is words, taped in the way it came back. The page reuses the rest of the system as it stands (topnav, lede, deck, the mono label tier, SiteLink, the taped shot). Below 640px the home nav drops The Arbiter so Skills fits on one row.
- **1.0.0 — 2026-09-10** — Initial system, extracted from the shipped site rather than invented. Generated tokens from a spec derived from `DESIGN.md` and `styles.css`; hand-authored the site layer for the rule grid, the ink, the night surface, the hard shadow and the hand; catalogued the fourteen components the site actually has; built the playground against the real stylesheet. Also fixed two bugs in the skill's shared `build_tokens.py` and `build_playground.py`, where the primitive `font` and `border` blocks collapsed into malformed CSS variables. `styles.css` is unchanged: see `MIGRATION.md`.
