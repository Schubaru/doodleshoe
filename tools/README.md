# Demo reel recorder

Records a web page playing itself and encodes it to a looping mp4. Two small Swift
files, both against frameworks that already ship with macOS — no ffmpeg, no Homebrew,
no Puppeteer. Nothing here is deployed (`tools` is in `.vercelignore`).

```bash
swiftc -O webrec.swift -o webrec          # WKWebView -> png frames
swiftc -O frames2mp4.swift -o frames2mp4  # png frames -> h264 mp4
```

`webrec` loads a URL offscreen and, once per frame, runs your step script with the
frame index bound to `i`, then snapshots. That script is where you drive the page —
click things, scroll, call into the app's own JS.

```bash
# how assets/dinos-demo.mp4 was made
./webrec "http://localhost:4321/dinos/" frames 480 780 132 55 dinos-step.js
./frames2mp4 frames ../assets/dinos-demo.mp4 12 700
```

Args: `webrec <url> <outDir> <w> <h> <frames> <settleMs> <stepJsFile>` and
`frames2mp4 <framesDir> <out.mp4> <fps> [kbps]`.

Capture runs at roughly 10 real frames/sec, so **encode near 10–12fps and the result
plays back at life speed**. Frames come out at 2x for retina; 480x780 in gives a
960x1560 file. Time the fps to the measured wall clock, not to what you asked for.

Two things it cannot do: log into anything, and record a native iOS app. For those,
`Cmd+Shift+5` and hand the file over.

## The don-star reel (`don-star-reel/`)

`assets/don-star-demo.mp4` is a person using a tool, not a page playing itself, so it is
recorded differently: Playwright drives the real Wordsword board (`~/wordsword/review`,
`npm run dev` on :5180) with real mouse and keys, Chrome's screencast captures it in real
time, and `cam2mp4` crops each take with an eased camera and crossfades them into one loop.
The cursor, title cards and caption are drawn into the page by `rec.mjs`.

```bash
cd don-star-reel
swiftc -O cam2mp4.swift -o cam2mp4
./run-all.sh   # clears the board, records the takes, replies with board.py between them, encodes
```

`run-all.sh` really answers the take-2 question with the skill's `board.py`, so the board file
ends with that thread in it. Poster: a still from the reply (`assets/don-star-poster.jpg`).
