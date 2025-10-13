const BOARD_SIZE = 8;
const CELLS_PER_ROW = BOARD_SIZE;
const COLORS = ["#fecd1a", "#45d4ff", "#fb6f92", "#7cf579", "#c77dff", "#ff8fab"];

const pieceTemplates = [
  { name: "single", matrix: [[1]] },
  { name: "domino", matrix: [[1, 1]] },
  { name: "triple", matrix: [[1, 1, 1]] },
  { name: "quad", matrix: [[1, 1, 1, 1]] },
  { name: "quint", matrix: [[1, 1, 1, 1, 1]] },
  { name: "square", matrix: [[1, 1], [1, 1]] },
  { name: "square-3", matrix: [[1, 1, 1], [1, 1, 1], [1, 1, 1]] },
  { name: "L2", matrix: [[1, 0], [1, 0], [1, 1]] },
  { name: "L3", matrix: [[1, 0, 0], [1, 0, 0], [1, 1, 1]] },
  { name: "L4", matrix: [[1, 0, 0, 0], [1, 0, 0, 0], [1, 1, 1, 1]] },
  { name: "zig", matrix: [[1, 1, 0], [0, 1, 1]] },
  { name: "zig-long", matrix: [[1, 1, 0, 0], [0, 1, 1, 1]] },
  { name: "T3", matrix: [[1, 1, 1], [0, 1, 0]] },
  { name: "corner", matrix: [[1, 1], [1, 0]] },
  { name: "corner-big", matrix: [[1, 1, 1], [1, 0, 0], [1, 0, 0]] },
];

const tinyTemplates = pieceTemplates.filter((template) => countCells(template.matrix) <= 4);
const smallTemplates = pieceTemplates.filter((template) => countCells(template.matrix) <= 5);

const createId =
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? () => crypto.randomUUID()
    : () => `piece-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const boardEl = document.querySelector("#board");
const scoreEl = document.querySelector("#score");
const bestScoreEl = document.querySelector("#bestScore");
const comboEl = document.querySelector("#combo");
const trayEl = document.querySelector("#pieceTray");
const dragLayer = document.querySelector("#dragLayer");
const newGameButton = document.querySelector("#newGame");
const undoButton = document.querySelector("#undo");
const restartButton = document.querySelector("#restart");
const dialog = document.querySelector("#gameOverDialog");
const finalScoreEl = document.querySelector("#finalScore");
const rootEl = document.documentElement;

rootEl.style.setProperty("--board-size", String(BOARD_SIZE));
boardEl.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 1fr)`;

let boardState = createEmptyBoard();
let trayPieces = [];
let score = 0;
let combo = 0;
let bestScore = loadBestScore();
let history = [];
let dragState = null;

setupBoardCells();
startNewGame();

newGameButton.addEventListener("click", startNewGame);
restartButton.addEventListener("click", startNewGame);
undoButton.addEventListener("click", handleUndo);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && dragState) {
    cancelDrag();
  }
});

document.addEventListener("pointerup", (event) => {
  if (dragState && dragState.pointerId === event.pointerId) {
    finishDrag(event);
  }
});

document.addEventListener("pointercancel", (event) => {
  if (dragState && dragState.pointerId === event.pointerId) {
    cancelDrag();
  }
});

document.addEventListener(
  "pointermove",
  (event) => {
    if (dragState && dragState.pointerId === event.pointerId) {
      event.preventDefault();
      updateDrag(event);
    }
  },
  { passive: false }
);

function startNewGame() {
  boardState = createEmptyBoard();
  trayPieces = generateTray();
  score = 0;
  combo = 0;
  history = [];
  bestScore = loadBestScore();
  updateScoreboard();
  renderBoard();
  renderTray();
  if (dialog.open) {
    dialog.close();
  }
}

function createEmptyBoard() {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => ({ filled: false, color: null }))
  );
}

function setupBoardCells() {
  boardEl.innerHTML = "";
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const cell = document.createElement("div");
      cell.className = "board__cell";
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      boardEl.append(cell);
    }
  }
}

function renderBoard() {
  const cells = boardEl.children;
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const idx = row * CELLS_PER_ROW + col;
      const cell = cells[idx];
      const state = boardState[row][col];
      cell.dataset.filled = state.filled ? "true" : "false";
      if (state.filled) {
        cell.style.setProperty("--cell-color", state.color);
      } else {
        cell.style.removeProperty("--cell-color");
      }
      cell.classList.remove("preview-valid", "preview-invalid");
    }
  }
}

function updateScoreboard() {
  scoreEl.textContent = String(score);
  comboEl.textContent = `${combo}×`;
  bestScoreEl.textContent = String(bestScore);
}

function generateTray() {
  const pieces = [];
  for (let i = 0; i < 3; i += 1) {
    pieces.push(createPieceInstance(getRandomTemplate()));
  }
  return pieces;
}

function getRandomTemplate() {
  const weight = Math.random();
  if (weight > 0.8) {
    return pieceTemplates[Math.floor(Math.random() * pieceTemplates.length)];
  }
  if (weight > 0.55) {
    return smallTemplates[Math.floor(Math.random() * smallTemplates.length)];
  }
  return tinyTemplates[Math.floor(Math.random() * tinyTemplates.length)];
}

function createPieceInstance(template) {
  const cells = [];
  template.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        cells.push({ x, y });
      }
    });
  });

  return {
    id: createId(),
    name: template.name,
    matrix: template.matrix,
    cells,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  };
}

function renderTray() {
  trayEl.innerHTML = "";
  trayPieces.forEach((piece) => {
    const element = createPieceElement(piece);
    trayEl.append(element);
  });
}

function createPieceElement(piece) {
  const rows = piece.matrix.length;
  const cols = piece.matrix[0].length;
  const el = document.createElement("div");
  el.className = "piece";
  el.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  el.dataset.pieceId = piece.id;
  el.dataset.rows = String(rows);
  el.dataset.cols = String(cols);
  el.style.setProperty("--piece-color", piece.color);

  piece.matrix.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      const cell = document.createElement("div");
      cell.className = "piece__cell";
      cell.dataset.row = String(rowIndex);
      cell.dataset.col = String(colIndex);
      if (!value) {
        cell.classList.add("piece__cell--empty");
        cell.style.opacity = "0";
        cell.style.pointerEvents = "none";
      }
      el.append(cell);
    });
  });

  el.addEventListener("pointerdown", (event) => startDrag(event, piece));
  return el;
}

function startDrag(event, piece) {
  if (!piece.cells.length) {
    return;
  }
  const targetCell = event.target.closest(".piece__cell");
  if (!targetCell || targetCell.classList.contains("piece__cell--empty")) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();

  const pieceEl = event.currentTarget;
  const rect = pieceEl.getBoundingClientRect();
  const cellRect = targetCell.getBoundingClientRect();
  const anchor = {
    x: cellRect.left - rect.left,
    y: cellRect.top - rect.top,
    col: Number(targetCell.dataset.col),
    row: Number(targetCell.dataset.row),
  };

  const ghost = pieceEl.cloneNode(true);
  ghost.classList.add("drag-ghost");
  ghost.style.width = `${rect.width}px`;
  ghost.style.height = `${rect.height}px`;
  ghost.style.left = `${rect.left}px`;
  ghost.style.top = `${rect.top}px`;
  ghost.style.setProperty("--piece-color", piece.color);
  dragLayer.append(ghost);

  dragState = {
    pointerId: event.pointerId,
    piece,
    originPieceEl: pieceEl,
    ghost,
    anchor,
    boardPreview: [],
    startX: event.clientX,
    startY: event.clientY,
  };

  pieceEl.style.visibility = "hidden";
  updateGhostPosition(event.clientX, event.clientY);
}

function updateDrag(event) {
  updateGhostPosition(event.clientX, event.clientY);
  updateBoardPreview(event.clientX, event.clientY);
}

function updateGhostPosition(clientX, clientY) {
  if (!dragState) {
    return;
  }
  const { ghost, startX, startY } = dragState;
  const deltaX = clientX - startX;
  const deltaY = clientY - startY;
  ghost.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
}

function updateBoardPreview(clientX, clientY) {
  if (!dragState) {
    return;
  }
  clearPreview();
  const boardRect = boardEl.getBoundingClientRect();
  const cellSize = boardRect.width / BOARD_SIZE;
  const offsetX = clientX - boardRect.left;
  const offsetY = clientY - boardRect.top;
  const hoverCol = Math.floor(offsetX / cellSize);
  const hoverRow = Math.floor(offsetY / cellSize);

  const placement = {
    row: hoverRow - dragState.anchor.row,
    col: hoverCol - dragState.anchor.col,
  };

  const cells = getPlacementCells(dragState.piece, placement.row, placement.col);
  if (!cells.length) {
    return;
  }

  const isValid = cells.every(({ row, col }) => isInsideBoard(row, col) && !boardState[row][col].filled);

  cells.forEach(({ row, col }) => {
    if (!isInsideBoard(row, col)) {
      return;
    }
    const idx = row * CELLS_PER_ROW + col;
    const cellEl = boardEl.children[idx];
    cellEl.classList.add(isValid ? "preview-valid" : "preview-invalid");
  });

  dragState.boardPreview = cells;
  dragState.previewValid = isValid;
  dragState.previewPlacement = placement;
}

function finishDrag(event) {
  if (!dragState) {
    return;
  }
  const { originPieceEl, ghost, piece, previewValid, previewPlacement } = dragState;
  ghost.remove();
  originPieceEl.style.visibility = "";

  if (previewValid && previewPlacement) {
    commitMove(piece, previewPlacement.row, previewPlacement.col);
  }

  dragState = null;
  clearPreview();
}

function cancelDrag() {
  if (!dragState) {
    return;
  }
  dragState.ghost.remove();
  dragState.originPieceEl.style.visibility = "";
  dragState = null;
  clearPreview();
}

function getPlacementCells(piece, startRow, startCol) {
  return piece.cells.map(({ x, y }) => ({ row: startRow + y, col: startCol + x }));
}

function isInsideBoard(row, col) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function clearPreview() {
  if (!dragState || !dragState.boardPreview) {
    const cells = boardEl.querySelectorAll(".preview-valid, .preview-invalid");
    cells.forEach((cell) => cell.classList.remove("preview-valid", "preview-invalid"));
    return;
  }
  const cells = boardEl.querySelectorAll(".preview-valid, .preview-invalid");
  cells.forEach((cell) => cell.classList.remove("preview-valid", "preview-invalid"));
  dragState.boardPreview = [];
}

function commitMove(piece, startRow, startCol) {
  history.push({
    board: boardState.map((row) => row.map((cell) => ({ ...cell }))),
    tray: trayPieces.slice(),
    score,
    combo,
  });
  if (history.length > 20) {
    history.shift();
  }

  const placementCells = getPlacementCells(piece, startRow, startCol);
  placementCells.forEach(({ row, col }) => {
    if (isInsideBoard(row, col)) {
      boardState[row][col] = { filled: true, color: piece.color };
    }
  });

  trayPieces = trayPieces.filter((p) => p.id !== piece.id);
  const placedBlocks = placementCells.length;
  let pointsEarned = placedBlocks * 10;
  let clearedLines = 0;

  const completedRows = getCompletedRows();
  const completedCols = getCompletedCols();

  if (completedRows.length || completedCols.length) {
    clearedLines = completedRows.length + completedCols.length;
    clearLines(completedRows, completedCols);
    combo += 1;
    showComboToast(combo, clearedLines);
    pointsEarned += clearedLines * 120 * combo;
  } else {
    combo = 0;
  }

  score += pointsEarned;
  if (score > bestScore) {
    bestScore = score;
    saveBestScore(bestScore);
  }

  if (trayPieces.length === 0) {
    trayPieces = generateTray();
  }

  renderBoard();
  renderTray();
  updateScoreboard();

  if (!canAnyPieceFit()) {
    handleGameOver();
  }
}

function getCompletedRows() {
  const rows = [];
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    if (boardState[row].every((cell) => cell.filled)) {
      rows.push(row);
    }
  }
  return rows;
}

function getCompletedCols() {
  const cols = [];
  for (let col = 0; col < BOARD_SIZE; col += 1) {
    let filled = true;
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      if (!boardState[row][col].filled) {
        filled = false;
        break;
      }
    }
    if (filled) {
      cols.push(col);
    }
  }
  return cols;
}

function clearLines(rows, cols) {
  rows.forEach((row) => {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      boardState[row][col] = { filled: false, color: null };
    }
  });
  cols.forEach((col) => {
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      boardState[row][col] = { filled: false, color: null };
    }
  });
}

function canAnyPieceFit() {
  return trayPieces.some((piece) => canPieceFit(piece));
}

function canPieceFit(piece) {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const placement = getPlacementCells(piece, row, col);
      if (
        placement.every(({ row: r, col: c }) => isInsideBoard(r, c) && !boardState[r][c].filled)
      ) {
        return true;
      }
    }
  }
  return false;
}

function handleGameOver() {
  finalScoreEl.textContent = String(score);
  if (!dialog.open) {
    dialog.showModal();
  }
}

function loadBestScore() {
  try {
    return Number(localStorage.getItem("blockBlastBest")) || 0;
  } catch (error) {
    console.warn("Unable to read best score", error);
    return 0;
  }
}

function saveBestScore(value) {
  try {
    localStorage.setItem("blockBlastBest", String(value));
  } catch (error) {
    console.warn("Unable to persist best score", error);
  }
}

function showComboToast(currentCombo, clearedLines) {
  if (clearedLines === 0) {
    return;
  }
  if (currentCombo <= 1 && clearedLines === 1) {
    return;
  }
  const toast = document.createElement("div");
  toast.className = "combo-toast";
  toast.textContent = `${clearedLines} line${clearedLines > 1 ? "s" : ""}! Combo ${currentCombo}×`;
  document.body.append(toast);
  setTimeout(() => toast.remove(), 2200);
}

function countCells(matrix) {
  return matrix.reduce(
    (acc, row) => acc + row.reduce((rowAcc, value) => rowAcc + (value ? 1 : 0), 0),
    0
  );
}

function handleUndo() {
  const prev = history.pop();
  if (!prev) {
    return;
  }
  boardState = prev.board.map((row) => row.map((cell) => ({ ...cell })));
  trayPieces = prev.tray;
  score = prev.score;
  combo = prev.combo;
  renderBoard();
  renderTray();
  updateScoreboard();
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch((error) => {
      console.warn("Service worker registration failed", error);
    });
  });
}
