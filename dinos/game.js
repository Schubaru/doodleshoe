const WIN_TARGET = 368;

class DinoGame {
    constructor() {
        this.dinoTypes = ['trex', 'stego', 'ptero', 'trice'];
        this.dinoSVGs = {
            trex: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <rect x="20" y="30" width="60" height="50" fill="#ff0000" stroke="#000" stroke-width="3"/>
                <rect x="40" y="20" width="20" height="20" fill="#ff0000" stroke="#000" stroke-width="3"/>
                <rect x="30" y="40" width="10" height="10" fill="#000"/>
                <rect x="60" y="40" width="10" height="10" fill="#000"/>
                <rect x="45" y="50" width="10" height="5" fill="#000"/>
            </svg>`,
            stego: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <rect x="20" y="40" width="60" height="40" fill="#0066ff" stroke="#000" stroke-width="3"/>
                <rect x="30" y="30" width="40" height="20" fill="#0066ff" stroke="#000" stroke-width="3"/>
                <rect x="35" y="45" width="10" height="10" fill="#000"/>
                <rect x="55" y="45" width="10" height="10" fill="#000"/>
                <rect x="25" y="50" width="5" height="20" fill="#000"/>
                <rect x="70" y="50" width="5" height="20" fill="#000"/>
            </svg>`,
            ptero: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <rect x="30" y="40" width="40" height="30" fill="#ffcc00" stroke="#000" stroke-width="3"/>
                <rect x="40" y="30" width="20" height="20" fill="#ffcc00" stroke="#000" stroke-width="3"/>
                <rect x="45" y="45" width="10" height="10" fill="#000"/>
                <rect x="35" y="50" width="30" height="5" fill="#000"/>
            </svg>`,
            trice: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <rect x="20" y="40" width="60" height="40" fill="#00cc66" stroke="#000" stroke-width="3"/>
                <rect x="30" y="30" width="40" height="20" fill="#00cc66" stroke="#000" stroke-width="3"/>
                <rect x="35" y="45" width="10" height="10" fill="#000"/>
                <rect x="55" y="45" width="10" height="10" fill="#000"/>
                <rect x="40" y="50" width="20" height="5" fill="#000"/>
                <rect x="15" y="45" width="10" height="10" fill="#000"/>
                <rect x="75" y="45" width="10" height="10" fill="#000"/>
            </svg>`
        };
        this.dinoNames = {
            trex: 'T-Rex',
            stego: 'Stegosaurus',
            ptero: 'Pterodactyl',
            trice: 'Triceratops'
        };

        this.armed = false;
        this.focusedRow = 0;
        this.focusedCol = 0;
        this.setupButtons();
        this.setupBoardTap();
        this.startGame();
    }

    setupButtons() {
        document.getElementById('resetButton').addEventListener('click', () => this.startGame());
        document.getElementById('restartButton').addEventListener('click', () => {
            document.getElementById('gameOverModal').classList.add('hidden');
            this.startGame();
            document.getElementById('currentPair').focus();
        });
    }

    startGame() {
        this.board = Array(6).fill(null).map(() => Array(6).fill(null));
        this.rescuedCount = 0;
        this.gameOver = false;
        this.lastPlacedCells = null;
        this.placing = false;

        this.currentPair = this.generatePair();
        this.pairOrientation = this.pickOrientation();
        this.focusedRow = 0;
        this.focusedCol = 0;

        document.getElementById('gameOverModal').classList.add('hidden');

        this.renderBoard();
        this.renderPreview();
        this.renderScore();
        this.setupDrag();
        this.setArmed(false);
    }

    // ── Tap-to-place (armed mode) ───────────────────────────────────────────────
    // A single tap on the pair arms placement mode; the next tap on a board cell
    // places it there. This is the touch-friendly fallback alongside dragging.

    setupBoardTap() {
        const board = document.getElementById('gameBoard');

        board.addEventListener('pointermove', (e) => {
            if (!this.armed) return;
            const cell = e.target.closest('.cell');
            if (cell) this.highlightCells(+cell.dataset.row, +cell.dataset.col);
        });

        board.addEventListener('pointerup', (e) => {
            if (!this.armed) return;
            const cell = e.target.closest('.cell');
            if (!cell) return;
            this.handleArmedTap(+cell.dataset.row, +cell.dataset.col);
        });

        // Tapping anywhere outside the pair or the board disarms placement mode.
        document.addEventListener('pointerdown', (e) => {
            if (!this.armed) return;
            if (e.target.closest('#currentPair') || e.target.closest('.cell')) return;
            this.setArmed(false);
        }, true);

        // Roving tabindex: whichever cell last received focus (via click, tap,
        // or arrow-key movement) becomes the sole Tab stop for the grid.
        board.addEventListener('focusin', (e) => {
            const cell = e.target.closest('.cell');
            if (!cell) return;
            const prev = board.querySelector(`.cell[data-row="${this.focusedRow}"][data-col="${this.focusedCol}"]`);
            if (prev && prev !== cell) prev.tabIndex = -1;
            this.focusedRow = +cell.dataset.row;
            this.focusedCol = +cell.dataset.col;
            cell.tabIndex = 0;
            if (this.armed) this.highlightCells(this.focusedRow, this.focusedCol);
        });

        board.addEventListener('keydown', (e) => {
            const { key } = e;
            if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
                e.preventDefault();
                let r = this.focusedRow;
                let c = this.focusedCol;
                if (key === 'ArrowUp') r = Math.max(0, r - 1);
                else if (key === 'ArrowDown') r = Math.min(5, r + 1);
                else if (key === 'ArrowLeft') c = Math.max(0, c - 1);
                else if (key === 'ArrowRight') c = Math.min(5, c + 1);
                this.moveFocusTo(r, c);
            } else if (key === 'Enter' || key === ' ') {
                e.preventDefault();
                if (this.armed) this.handleArmedTap(this.focusedRow, this.focusedCol);
            } else if (key === 'Escape' && this.armed) {
                this.setArmed(false);
            }
        });

        // Enter/Space on the pair itself arms placement mode, mirroring a tap.
        document.addEventListener('keydown', (e) => {
            if (!e.target.closest('#currentPair')) return;
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleArmed();
            }
        });
    }

    moveFocusTo(row, col) {
        const board = document.getElementById('gameBoard');
        const prev = board.querySelector(`.cell[data-row="${this.focusedRow}"][data-col="${this.focusedCol}"]`);
        const next = board.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        if (!next) return;
        if (prev && prev !== next) prev.tabIndex = -1;
        next.tabIndex = 0;
        this.focusedRow = row;
        this.focusedCol = col;
        next.focus();
        if (this.armed) this.highlightCells(row, col);
    }

    async handleArmedTap(row, col) {
        if (this.gameOver || this.placing) return;
        if (this.isValidPlacement(row, col)) {
            this.setArmed(false);
            this.placing = true;
            await this.placePair(row, col);
            this.placing = false;
        } else {
            // Invalid target: flash the reason, stay armed so the player can retry.
            this.highlightCells(row, col);
            setTimeout(() => this.clearHighlights(), 300);
        }
    }

    setArmed(value) {
        this.armed = value;
        const pairEl = document.getElementById('currentPair');
        const hint = document.getElementById('pairHint');
        if (!pairEl) return;
        pairEl.classList.toggle('selected', value);
        pairEl.setAttribute('aria-pressed', String(value));
        pairEl.setAttribute('aria-label', value
            ? 'Placement mode active. Tap a board cell to place the dinosaur pair.'
            : 'Current dinosaur pair. Drag onto the board, or tap to arm placement mode.');
        if (hint) hint.textContent = value ? 'Tap a board cell to place' : 'Drag onto the board, or tap to place';
        if (!value) this.clearHighlights();
    }

    // ── Drag & Drop ────────────────────────────────────────────────────────────

    setupDrag() {
        // Remove any ghost left over from a mid-drag reset
        document.querySelectorAll('.drag-ghost').forEach(g => g.remove());

        // Replace the pair element to wipe any old listeners
        const old = document.getElementById('currentPair');
        old.classList.remove('dragging');
        const fresh = old.cloneNode(true);
        old.parentNode.replaceChild(fresh, old);

        const pairEl = document.getElementById('currentPair');
        const DRAG_THRESHOLD = 6;
        let ghost = null;
        let dropTarget = null;
        let pointerId = null;
        let dragStarted = false;
        let startX = 0;
        let startY = 0;

        const makeGhost = () => {
            const g = document.createElement('div');
            g.className = 'drag-ghost ' + this.pairOrientation;
            this.currentPair.forEach(type => {
                const c = document.createElement('div');
                c.className = 'preview-cell';
                c.innerHTML = this.dinoSVGs[type];
                g.appendChild(c);
            });
            document.body.appendChild(g);
            return g;
        };

        const placeGhost = (x, y) => {
            ghost.style.left = (x - ghost.offsetWidth  / 2) + 'px';
            ghost.style.top  = (y - ghost.offsetHeight / 2) + 'px';
        };

        const findCell = (x, y) => {
            ghost.style.display = 'none';
            const el = document.elementFromPoint(x, y);
            ghost.style.display = '';
            return el ? el.closest('.cell') : null;
        };

        const cleanup = () => {
            document.removeEventListener('pointermove', onMove);
            if (pointerId !== null) {
                try { pairEl.releasePointerCapture(pointerId); } catch (_) { /* already released */ }
            }
            if (ghost) { ghost.remove(); ghost = null; }
            pairEl.classList.remove('dragging');
            this.clearHighlights();
            dropTarget = null;
            pointerId = null;
            dragStarted = false;
        };

        const onMove = (e) => {
            if (e.pointerId !== pointerId) return;
            if (!dragStarted) {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
                dragStarted = true;
                this.setArmed(false);
                ghost = makeGhost();
                pairEl.classList.add('dragging');
            }
            placeGhost(e.clientX, e.clientY);
            dropTarget = findCell(e.clientX, e.clientY);
            if (dropTarget) {
                this.highlightCells(+dropTarget.dataset.row, +dropTarget.dataset.col);
            } else {
                this.clearHighlights();
            }
        };

        const onUp = async (e) => {
            if (e.pointerId !== pointerId) return;
            document.removeEventListener('pointerup', onUp);
            document.removeEventListener('pointercancel', onCancel);
            const wasDragging = dragStarted;
            const target = dropTarget;
            cleanup();

            if (wasDragging) {
                if (target && !this.gameOver && !this.placing) {
                    const row = +target.dataset.row;
                    const col = +target.dataset.col;
                    if (this.isValidPlacement(row, col)) {
                        this.placing = true;
                        await this.placePair(row, col);
                        this.placing = false;
                    }
                }
            } else if (!this.gameOver && !this.placing) {
                // No movement beyond the threshold: treat it as a tap that arms placement mode.
                this.toggleArmed();
            }
        };

        const onCancel = (e) => {
            if (e.pointerId !== pointerId) return;
            document.removeEventListener('pointerup', onUp);
            document.removeEventListener('pointercancel', onCancel);
            cleanup();
        };

        pairEl.addEventListener('pointerdown', (e) => {
            if (this.gameOver || this.placing || pointerId !== null) return;
            e.preventDefault();
            pointerId = e.pointerId;
            startX = e.clientX;
            startY = e.clientY;
            dragStarted = false;
            try { pairEl.setPointerCapture(pointerId); } catch (_) { /* not capturable, still works */ }
            document.addEventListener('pointermove', onMove);
            document.addEventListener('pointerup', onUp);
            document.addEventListener('pointercancel', onCancel);
        });
    }

    toggleArmed() {
        if (this.gameOver || this.placing) return;
        this.setArmed(!this.armed);
    }

    // ── Placement ──────────────────────────────────────────────────────────────

    isValidPlacement(row, col, orientation) {
        orientation = orientation || this.pairOrientation;
        const second = this.secondCell(row, col, orientation);
        if (!second) return false;
        return this.board[row][col] === null && this.board[second.row][second.col] === null;
    }

    secondCell(row, col, orientation) {
        orientation = orientation || this.pairOrientation;
        const r = orientation === 'vertical'   ? row + 1 : row;
        const c = orientation === 'horizontal' ? col + 1 : col;
        if (r >= 6 || c >= 6) return null;
        return { row: r, col: c };
    }

    async placePair(row, col) {
        const second = this.secondCell(row, col);
        if (!second) return;

        this.lastPlacedCells = [{ row, col }, { row: second.row, col: second.col }];
        this.board[row][col] = this.currentPair[0];
        this.board[second.row][second.col] = this.currentPair[1];

        this.renderBoard();
        await this.processMatches();
        this.lastPlacedCells = null;

        if (this.rescuedCount >= WIN_TARGET) {
            this.showGameOver(true);
            return;
        }

        this.currentPair = this.generatePair();
        this.pairOrientation = this.pickOrientation();
        if (!this.pairOrientation) {
            this.showGameOver(false);
        } else {
            this.renderPreview();
        }
    }

    // ── Match Processing ───────────────────────────────────────────────────────

    async processMatches() {
        let matches = this.findMatches();
        while (matches.length > 0) {
            // Overlapping runs (e.g. a 4-in-a-row produces two overlapping 3-groups,
            // or a horizontal and vertical run crossing at one cell) share cells.
            // Dedupe so each dino is only ever rescued once per pass.
            const uniqueCells = this.dedupeCells(matches);

            const cells = document.querySelectorAll('.cell');
            uniqueCells.forEach(({ row, col }) => {
                const cell = cells[row * 6 + col];
                if (!cell) return;
                cell.classList.add('matched');
                const svg = cell.querySelector('svg');
                if (svg) svg.classList.add('dino-remove');
            });

            await new Promise(r => setTimeout(r, 400));

            uniqueCells.forEach(({ row, col }) => {
                this.board[row][col] = null;
                // The rescue counter is capped at the target even if this pass
                // clears more dinos than remain to hit it exactly.
                this.rescuedCount = Math.min(this.rescuedCount + 1, WIN_TARGET);
            });

            this.renderBoard();
            this.renderScore();
            matches = this.findMatches();
        }
    }

    dedupeCells(matches) {
        const seen = new Map();
        matches.forEach(match => {
            match.forEach(cell => seen.set(`${cell.row},${cell.col}`, cell));
        });
        return [...seen.values()];
    }

    findMatches() {
        const matches = [];
        for (let r = 0; r < 6; r++) {
            for (let c = 0; c < 4; c++) {
                const v = this.board[r][c];
                if (v && v === this.board[r][c+1] && v === this.board[r][c+2]) {
                    matches.push([{row:r,col:c},{row:r,col:c+1},{row:r,col:c+2}]);
                }
            }
        }
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 6; c++) {
                const v = this.board[r][c];
                if (v && v === this.board[r+1][c] && v === this.board[r+2][c]) {
                    matches.push([{row:r,col:c},{row:r+1,col:c},{row:r+2,col:c}]);
                }
            }
        }
        return matches;
    }

    // ── Board Rendering ────────────────────────────────────────────────────────

    renderBoard() {
        const board = document.querySelector('.game-board');
        const hadFocus = board.contains(document.activeElement);
        board.innerHTML = '';
        for (let r = 0; r < 6; r++) {
            for (let c = 0; c < 6; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                cell.setAttribute('role', 'gridcell');
                cell.setAttribute('aria-label', this.cellLabel(r, c));
                cell.tabIndex = (r === this.focusedRow && c === this.focusedCol) ? 0 : -1;
                if (this.board[r][c]) {
                    const wrap = document.createElement('div');
                    wrap.innerHTML = this.dinoSVGs[this.board[r][c]];
                    if (this.isNewlyPlaced(r, c)) wrap.firstChild.classList.add('dino-appear');
                    cell.appendChild(wrap);
                }
                board.appendChild(cell);
            }
        }
        if (hadFocus) {
            const focused = board.querySelector(`.cell[data-row="${this.focusedRow}"][data-col="${this.focusedCol}"]`);
            if (focused) focused.focus();
        }
    }

    cellLabel(row, col) {
        const position = `Row ${row + 1}, column ${col + 1}`;
        const value = this.board[row][col];
        return value ? `${position}, ${this.dinoNames[value]}` : `${position}, empty`;
    }

    isNewlyPlaced(row, col) {
        return this.lastPlacedCells &&
            this.lastPlacedCells.some(p => p.row === row && p.col === col);
    }

    renderPreview() {
        const preview = document.querySelector('.preview-dinos');
        preview.className = 'preview-dinos ' + this.pairOrientation;
        const cells = preview.querySelectorAll('.preview-cell');
        const labels = ['First dinosaur', 'Second dinosaur'];
        cells.forEach((cell, i) => {
            const type = this.currentPair[i];
            cell.innerHTML = this.dinoSVGs[type];
            cell.setAttribute('aria-label', `${labels[i]}: ${this.dinoNames[type]}`);
        });
    }

    renderScore() {
        document.getElementById('rescuedCount').textContent = this.rescuedCount;
    }

    highlightCells(row, col) {
        this.clearHighlights();
        const second = this.secondCell(row, col);
        if (!second) return;
        const cells = document.querySelectorAll('.cell');
        const valid = this.isValidPlacement(row, col);
        const cls = valid ? 'highlight-valid' : 'highlight-invalid';
        cells[row * 6 + col].classList.add(cls);
        cells[second.row * 6 + second.col].classList.add(cls);
    }

    clearHighlights() {
        document.querySelectorAll('.cell').forEach(c =>
            c.classList.remove('highlight-valid', 'highlight-invalid')
        );
    }

    // ── Game State ─────────────────────────────────────────────────────────────

    generatePair() {
        return [
            this.dinoTypes[Math.floor(Math.random() * 4)],
            this.dinoTypes[Math.floor(Math.random() * 4)]
        ];
    }

    pickOrientation() {
        const h = this.canPlace('horizontal');
        const v = this.canPlace('vertical');
        if (h && v) return Math.random() < 0.5 ? 'horizontal' : 'vertical';
        if (h) return 'horizontal';
        if (v) return 'vertical';
        return null;
    }

    canPlace(orientation) {
        for (let r = 0; r < 6; r++) {
            for (let c = 0; c < 6; c++) {
                if (this.isValidPlacement(r, c, orientation)) return true;
            }
        }
        return false;
    }

    showGameOver(won) {
        this.gameOver = true;
        this.setArmed(false);
        document.getElementById('gameOverTitle').textContent =
            won ? 'You saved all the dinosaurs!' : 'Extinction event. Game Over.';
        document.getElementById('finalRescued').textContent = this.rescuedCount;
        document.getElementById('gameOverModal').classList.remove('hidden');
        document.getElementById('restartButton').focus();
    }
}

document.addEventListener('DOMContentLoaded', () => { window.game = new DinoGame(); });
