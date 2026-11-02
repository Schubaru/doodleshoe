# Migration

`styles.css` is unchanged and still ships. This is the map from what it uses today to what the system calls those things, so the two can be reconciled in one commit whenever that is worth doing. Read `DESIGN_SYSTEM.md` first.

Nothing here is urgent. The site is correct as it stands. What this file buys is that the next person to add a colour has somewhere to look before inventing one.

## 1. How to do it, if you do it

Add one line to `index.html`, above the existing stylesheet:

```html
<link rel="stylesheet" href="design-system/tokens/tokens.site.css">
<link rel="stylesheet" href="styles.css">
```

then replace `styles.css`'s `:root` block with aliases:

```css
:root {
  --paper: var(--doodle-paper);
  --ink: var(--doodle-ink);
  /* …and so on, per the table below */
}
```

Every rule downstream keeps working, because the short names survive. That is the point of doing it this way rather than renaming 773 lines: the diff is one block, and it is reversible.

## 2. The `:root` block

| `styles.css` today | Token | Note |
|---|---|---|
| `--paper` | `--doodle-paper` | identical |
| `--rule` | `--doodle-rule-line` | identical. Renamed because `--rule` reads as a rule of design, not a ruled line. |
| `--ink` | `--doodle-ink` | identical |
| `--ink-soft` | `--doodle-ink-soft` | identical |
| `--margin-red` | `--doodle-margin-red` | identical |
| `--ink-black` | `--doodle-ink-black` | identical |
| `--ink-faint` | `--doodle-ink-faint` | identical |
| `--tape` | `--doodle-tape` | identical |
| `--night` | `--doodle-night` | identical |
| `--night-ink` | `--doodle-night-ink` | identical |
| `--rule-h` | `--doodle-rule-h` | identical |
| `--margin-x` | `--doodle-margin-x` | identical, including the 30px override below 900px |
| `--gutter-x` | `--doodle-gutter-x` | identical, including the collapse to 0 below 900px |
| `--font-body` | `--doodle-font-family-body` | identical stack |
| `--font-mono` | `--doodle-font-family-mono` | identical stack |
| `--z-doodle`, `--z-content`, `--z-nav` | `--doodle-z-doodle`, `-content`, `-nav` | identical |
| `--cursor-sword`, `--cursor-slash` | no token | Two inline SVG data URIs of the Wordsword blade. They are illustration, not a token, and they belong where they are. |

## 3. Literals still inline in `styles.css`

These are the real find. Fourteen distinct colours are written directly into rules rather than named, and all but one of them are on the Arbiter's black page, which is exactly where a second ink would be hardest to notice. Every one now has a name in `tokens.site.css`.

| Value | Used at | Token |
|---|---|---|
| `oklch(0.22 0.015 260 / 0.25)` | `styles.css:303`, `:316`, `:329` — the screens behind the lead screen in all three fans | `--doodle-shadow-fan` |
| `oklch(0.88 0.005 260)` | `styles.css:614` — `.arbiter-copy` | `--doodle-night-copy` |
| `oklch(0.21 0.012 260)` | `styles.css:627` — `.chat` background | `--doodle-night-panel` |
| `oklch(0.4 0.02 260 / 0.6)` | `styles.css:625` — the chat's own offset shadow | `--doodle-shadow-night-lg` |
| `oklch(0.45 0.02 260)` | `styles.css:639` — the log's scrollbar thumb | `--doodle-night-scroll` |
| `oklch(0.62 0 0)` | `styles.css:660` — `.msg.you` border | `--doodle-night-you-border` |
| `oklch(0.82 0 0)` | `styles.css:661` — `.msg.you` text | `--doodle-night-you` |
| `oklch(0.45 0.02 260 / 0.7)` | `styles.css:694`, `:698`, `:699` — ChatButton at rest, hover, press | `--doodle-shadow-night-sm`, `-md`, `-pressed` |
| `oklch(0.83 0.12 27)` | `styles.css:702` — the wall reply's text | `--doodle-wall-text` |
| `oklch(0.65 0.17 27)` | `styles.css:703` — the wall reply's border | `--doodle-wall-border` |
| `oklch(0.5 0.16 27 / 0.7)` | `styles.css:704`, `:706`, `:707` — the wall reply's shadow at rest, hover, press | `--doodle-shadow-wall-sm`, `-md`, `-pressed` |
| `oklch(0.4 0.02 260)` | `styles.css:708` — `.arbiter-built` dashed rule | `--doodle-night-rule` |
| `oklch(0.72 0.01 260)` | `styles.css:708` — `.arbiter-built` text | `--doodle-night-faint` |
| `oklch(0.75 0.01 260)` | `styles.css:609` — the Arbiter's deck | `--doodle-night-muted` |

The three red values on the black page are the margin red's hue (27) lifted in lightness, because the paper red disappears against `--doodle-night`. That is still one hue, and it is the only place the system stretches it.

## 4. Generated tokens against the shipped ink

The generated ramp in `tokens/tokens.css` was seeded from the same colours but is HSL-derived, so it lands near the shipped ink rather than on it. Close enough to reason about, not close enough to substitute blind.

| Shipped | Hex | Nearest generated step | Hex | Delta |
|---|---|---|---|---|
| `--ink` | `#171B22` | `color.neutral.950` | `#1C1E21` | imperceptible |
| `--ink-soft` | `#50565E` | `color.neutral.700` | `#545963` | imperceptible |
| `--ink-faint` | `#D4D8DD` | `color.neutral.200` | `#D8DADE` | imperceptible |
| `--margin-red` | `#D33B36` | `color.primary.500` | `#D33B36` | exact; the seed snaps to its own step |
| `--rule` | `#CBE2EE` | none | — | genuinely blue-tinted at chroma 0.03, well outside the 8% neutral ramp. It stays a site token. |

Note that the generated semantic layer maps `text.default` to `neutral.900` (`#2F3237`), a step lighter than the shipped ink. **Use `--doodle-ink`, not `--doodle-text-default`, for text on this site.** The semantic layer is there for a surface that does not exist yet.

## 5. What is out of scope

`dinos/` is the 368 Dinos arcade sub-app, and it is a different visual system on purpose: four saturated arcade colours (`#FF0000`, `#0066FF`, `#FFCC00`, `#00CC66`), Space Mono, its own stylesheet, zero dependencies. It is not in this design system and should not be pulled into it. The one-hue rule governs the portfolio; the game is the game.
