// i = frame index. Drives 368 Dinos: clear if you can, otherwise sit next to your own kind.
if (!window.__d) {
  window.__d = 1;
  const g = window.game;
  const near = (r, c, t) => {
    let n = 0;
    for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const a = r + dr, b = c + dc;
      if (a >= 0 && a < 6 && b >= 0 && b < 6 && g.board[a][b] === t) n++;
    }
    return n;
  };
  g.__best = () => {
    let best = null, bestScore = -Infinity;
    for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) {
      if (!g.isValidPlacement(r, c)) continue;
      const s2 = g.secondCell(r, c);
      const snap = g.board.map(x => x.slice());
      g.board[r][c] = g.currentPair[0];
      g.board[s2.row][s2.col] = g.currentPair[1];
      const cleared = g.dedupeCells(g.findMatches()).length;
      g.board = snap;
      // clearing dominates; otherwise sit beside your own colour, and keep the pile low
      const score = cleared * 10000
        + (near(r, c, g.currentPair[0]) + near(s2.row, s2.col, g.currentPair[1])) * 40
        + (r + s2.row) * 3;
      if (score > bestScore) { bestScore = score; best = [r, c]; }
    }
    return best;
  };
}
const g = window.game;
if (i > 3 && i % 5 === 0 && !g.placing && !g.gameOver) {
  const b = g.__best();
  if (b) g.handleArmedTap(b[0], b[1]);
}
