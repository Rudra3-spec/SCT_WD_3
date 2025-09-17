/* Tic-Tac-Toe logic with optional unbeatable AI (Minimax) */

const boardEl = document.getElementById("board");
const cells = Array.from(document.querySelectorAll(".cell"));
const statusEl = document.getElementById("status");
const turnEl = document.getElementById("turn");
const newBtn = document.getElementById("newBtn");
const modeInputs = Array.from(document.querySelectorAll('input[name="mode"]'));
const firstSelect = document.getElementById("firstSelect");

const scoreXEl = document.getElementById("scoreX");
const scoreOEl = document.getElementById("scoreO");
const scoreTieEl = document.getElementById("scoreTie");

let board = Array(9).fill(null); // null / 'X' / 'O'
let current = "X";
let gameOver = false;
let vsAI = false;
let scores = { X: 0, O: 0, Tie: 0 };
let aiPlayer = "O"; // when vs AI, AI will play 'O' by default

// Winning combos
const WIN = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function startNewGame() {
  board = Array(9).fill(null);
  gameOver = false;
  cells.forEach((c) => {
    c.disabled = false;
    c.classList.remove("x", "o", "win");
    c.textContent = "";
  });
  current = firstSelect.value || "X";
  turnEl.textContent = current;
  statusEl.classList.remove("flash");
  // If vs AI and AI starts, make AI move
  if (vsAI && current === aiPlayer) {
    // small delay to feel natural
    setTimeout(() => aiMove(), 220);
  }
}

function updateStatus(text) {
  turnEl.textContent = text;
}

function checkWinner(bd) {
  for (const line of WIN) {
    const [a, b, c] = line;
    if (bd[a] && bd[a] === bd[b] && bd[a] === bd[c])
      return { winner: bd[a], line };
  }
  if (bd.every(Boolean)) return { winner: "Tie" };
  return null;
}

function highlightWin(line) {
  line.forEach((i) => cells[i].classList.add("win"));
}

function endGame(result) {
  gameOver = true;
  if (result === "Tie") {
    scores.Tie += 1;
    scoreTieEl.textContent = scores.Tie;
    statusEl.textContent = "It's a tie!";
  } else {
    scores[result] += 1;
    if (result === "X") scoreXEl.textContent = scores.X;
    else scoreOEl.textContent = scores.O;
    statusEl.textContent = result + " wins!";
  }
  statusEl.classList.add("flash");
  // disable remaining cells
  cells.forEach((c) => (c.disabled = true));
}

function handleClick(e) {
  if (gameOver) return;
  const idx = Number(e.currentTarget.dataset.index);
  if (board[idx]) return; // occupied
  playMove(idx, current);
}

function playMove(i, player) {
  board[i] = player;
  const el = cells[i];
  el.textContent = player;
  el.classList.add(player === "X" ? "x" : "o");
  el.disabled = true;

  const res = checkWinner(board);
  if (res) {
    if (res.winner === "Tie") {
      endGame("Tie");
    } else {
      highlightWin(res.line);
      endGame(res.winner);
    }
    return;
  }

  // switch turn
  current = player === "X" ? "O" : "X";
  updateStatus(current);

  // If vs AI and it's AI's turn, trigger AI move
  if (vsAI && current === aiPlayer && !gameOver) {
    // small delay
    setTimeout(() => aiMove(), 220);
  }
}

/* -------------------- AI (Minimax) --------------------
   We use a simple minimax with scoring:
     +10 for AI win, -10 for human win, 0 tie.
   Because board is only 9 cells, this is fast enough in browser.
------------------------------------------------------- */

function aiMove() {
  // find best spot
  const best = minimax(board.slice(), aiPlayer);
  if (best.index !== undefined) {
    playMove(best.index, aiPlayer);
  }
}

function minimax(newBoard, player) {
  // base checks
  const result = checkWinner(newBoard);
  if (result) {
    if (result.winner === "Tie") return { score: 0 };
    return { score: result.winner === aiPlayer ? 10 : -10 };
  }

  const avail = newBoard
    .map((v, i) => (v ? null : i))
    .filter((i) => i !== null);
  const moves = [];

  for (const i of avail) {
    // simulate move
    newBoard[i] = player;
    const nextPlayer = player === "X" ? "O" : "X";
    const outcome = minimax(newBoard, nextPlayer);

    moves.push({
      index: i,
      score: outcome.score,
    });
    // undo
    newBoard[i] = null;
  }

  // choose best move for current player
  let bestMove;
  if (player === aiPlayer) {
    // maximize
    let bestScore = -Infinity;
    for (const m of moves) {
      if (m.score > bestScore) {
        bestScore = m.score;
        bestMove = m;
      }
    }
  } else {
    // minimize
    let bestScore = +Infinity;
    for (const m of moves) {
      if (m.score < bestScore) {
        bestScore = m.score;
        bestMove = m;
      }
    }
  }
  return bestMove || { index: avail[0], score: 0 };
}

/* -------------------- Event wiring -------------------- */

cells.forEach((c) => c.addEventListener("click", handleClick));

newBtn.addEventListener("click", () => {
  startNewGame();
});

modeInputs.forEach((inp) => {
  inp.addEventListener("change", () => {
    vsAI = document.querySelector('input[name="mode"]:checked').value === "pvc";
    // when mode changes, set aiPlayer: keep AI as 'O' and human 'X' by default,
    // but if user chooses O to start, they'll play as O and AI becomes X (we'll keep AI as 'O' for clarity),
    // so we will make AI always play 'O' to keep semantics simple (user UI indicates "Computer plays O").
    // So if user wants to start as O vs AI, the AI will still be 'O' but will only move when it's its turn.
    // (This design keeps the example straightforward.)
    startNewGame();
  });
});

firstSelect.addEventListener("change", () => {
  startNewGame();
});

/* keyboard accessibility - space to reset, number keys to play cells 1-9 */
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    startNewGame();
    return;
  }
  const num = parseInt(e.key, 10);
  if (!isNaN(num) && num >= 1 && num <= 9) {
    const idx = num - 1;
    if (!gameOver && !board[idx]) {
      playMove(idx, current);
    }
  }
});

/* initialize */
(function init() {
  vsAI = document.querySelector('input[name="mode"]:checked').value === "pvc";
  startNewGame();
})();
