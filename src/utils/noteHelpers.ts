import { NoteGrid } from '../types';

/**
 * Check if a cell is active (part of a note - either start or continuation)
 */
export function isActiveCell(noteGrid: NoteGrid, row: number, col: number): boolean {
  const value = noteGrid[row]?.[col] ?? 0;
  return value !== 0;
}

/**
 * Check if a cell is a note start (value > 0)
 */
export function isNoteStart(noteGrid: NoteGrid, row: number, col: number): boolean {
  const value = noteGrid[row]?.[col] ?? 0;
  return value > 0;
}

/**
 * Find the starting column of a note at a given position.
 * Walks backwards through continuation cells (-1) to find the start.
 */
export function findNoteStart(noteGrid: NoteGrid, row: number, col: number): number | null {
  const value = noteGrid[row]?.[col] ?? 0;

  if (value === 0) return null; // Not a note
  if (value > 0) return col; // Already at start

  // Walk backwards to find the start
  let currentCol = col - 1;
  while (currentCol >= 0) {
    const cellValue = noteGrid[row]?.[currentCol] ?? 0;
    if (cellValue > 0) return currentCol; // Found the start
    if (cellValue === 0) return null; // Gap - shouldn't happen in valid grid
    currentCol--;
  }

  return null;
}

/**
 * Get the duration of a note starting at a given position.
 * Returns 0 if the cell is not a note start.
 */
export function getNoteDuration(noteGrid: NoteGrid, row: number, col: number): number {
  const value = noteGrid[row]?.[col] ?? 0;
  return value > 0 ? value : 0;
}

/**
 * Find all horizontally adjacent active cells on the same row.
 * Returns the start and end columns (inclusive) of the connected group.
 */
export function findAdjacentNotes(
  noteGrid: NoteGrid,
  row: number,
  col: number
): { startCol: number; endCol: number } {
  if (!isActiveCell(noteGrid, row, col)) {
    return { startCol: col, endCol: col };
  }

  // Expand left to find the start of the group
  let startCol = col;
  while (startCol > 1 && isActiveCell(noteGrid, row, startCol - 1)) {
    startCol--;
  }

  // Expand right to find the end of the group
  let endCol = col;
  const maxCol = noteGrid[row]?.length ?? 0;
  while (endCol < maxCol - 1 && isActiveCell(noteGrid, row, endCol + 1)) {
    endCol++;
  }

  return { startCol, endCol };
}

/**
 * Create a deep copy of the note grid
 */
function cloneGrid(noteGrid: NoteGrid): NoteGrid {
  return noteGrid.map(row => row ? [...row] : []);
}

/**
 * Create a note spanning multiple columns.
 * Sets the start cell to the duration value and continuation cells to -1.
 */
export function createNote(
  noteGrid: NoteGrid,
  row: number,
  startCol: number,
  duration: number
): NoteGrid {
  const newGrid = cloneGrid(noteGrid);

  if (!newGrid[row]) {
    newGrid[row] = [];
  }

  // Set the start cell with duration
  newGrid[row][startCol] = duration;

  // Set continuation cells
  for (let i = 1; i < duration; i++) {
    newGrid[row][startCol + i] = -1;
  }

  return newGrid;
}

/**
 * Delete an entire note (start and all continuations).
 * If col is in the middle of a note, finds the start first.
 */
export function deleteNote(noteGrid: NoteGrid, row: number, col: number): NoteGrid {
  const startCol = findNoteStart(noteGrid, row, col);
  if (startCol === null) return noteGrid; // Not a note

  const duration = getNoteDuration(noteGrid, row, startCol);
  if (duration === 0) return noteGrid;

  const newGrid = cloneGrid(noteGrid);

  // Clear the start and all continuation cells
  for (let i = 0; i < duration; i++) {
    if (newGrid[row]) {
      newGrid[row][startCol + i] = 0;
    }
  }

  return newGrid;
}

/**
 * Merge all adjacent notes on a row into a single long note.
 * Returns the new grid with the merged note.
 */
export function mergeAdjacentNotes(
  noteGrid: NoteGrid,
  row: number,
  col: number
): NoteGrid {
  const { startCol, endCol } = findAdjacentNotes(noteGrid, row, col);
  const duration = endCol - startCol + 1;

  if (duration <= 1) return noteGrid; // Nothing to merge

  const newGrid = cloneGrid(noteGrid);

  if (!newGrid[row]) {
    newGrid[row] = [];
  }

  // Clear all cells in the range first
  for (let c = startCol; c <= endCol; c++) {
    newGrid[row][c] = 0;
  }

  // Create the merged note
  newGrid[row][startCol] = duration;
  for (let i = 1; i < duration; i++) {
    newGrid[row][startCol + i] = -1;
  }

  return newGrid;
}
