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
