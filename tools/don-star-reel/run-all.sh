#!/bin/sh
# Records all four takes in order against a clean board, answering the question for real in between.
set -e
B=/Users/alexschumacher/wordsword/review/review-board.json
BOARD="python3 $HOME/.claude/skills/don-star/scripts/board.py"
python3 -c "import json;d=json.load(open('$B'));d['comments']=[];json.dump(d,open('$B','w'),indent=2)"
node take1.mjs
node take2a.mjs
ID=$(python3 -c "import json;print(json.load(open('$B'))['comments'][0]['id'])")
(cd /Users/alexschumacher/wordsword/review && $BOARD reply "$ID" \
  --body "The first four synonyms dictionaryapi.dev returns, topped up from Datamuse when it has fewer than four. Offline: a word already in your library opens with the chips it was saved with; a new word shows the offline note instead." \
  --command "resolve-loop" --files "Wordsword/Dictionary.swift,Wordsword/DefineView.swift" \
  --verified "read the lookup in Dictionary.swift and checked it against the iOS capture")
node take2b.mjs
node take3.mjs
./cam2mp4 takes.json ../../assets/don-star-demo.mp4
