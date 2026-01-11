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
 * Find the end column of adjacent notes to the RIGHT of the clicked position.
 * Returns the end column (inclusive) of the connected group extending right.
 */
export function findAdjacentNotesRight(
  noteGrid: NoteGrid,
  row: number,
  col: number
): number {
  if (!isActiveCell(noteGrid, row, col)) {
    return col;
  }

  // Expand right to find the end of the group
  let endCol = col;
  const maxCol = noteGrid[row]?.length ?? 0;
  while (endCol < maxCol - 1 && isActiveCell(noteGrid, row, endCol + 1)) {
    endCol++;
  }

  return endCol;
}

/**
 * Merge notes from the clicked note to the right only.
 * The clicked note becomes the start of the merged note.
 */
export function mergeNotesRight(
  noteGrid: NoteGrid,
  row: number,
  col: number
): NoteGrid {
  // First, find the start of the note we clicked on
  const noteStart = findNoteStart(noteGrid, row, col);
  if (noteStart === null) return noteGrid;

  // Find how far right the adjacent notes extend
  const endCol = findAdjacentNotesRight(noteGrid, row, noteStart);
  const duration = endCol - noteStart + 1;

  if (duration <= 1) return noteGrid; // Nothing to merge

  const newGrid = cloneGrid(noteGrid);

  if (!newGrid[row]) {
    newGrid[row] = [];
  }

  // Clear all cells in the range first
  for (let c = noteStart; c <= endCol; c++) {
    newGrid[row][c] = 0;
  }

  // Create the merged note
  newGrid[row][noteStart] = duration;
  for (let i = 1; i < duration; i++) {
    newGrid[row][noteStart + i] = -1;
  }

  return newGrid;
}

/**
 * Decouple notes to the right of the clicked position (including the clicked cell).
 * The note from start to before the clicked position stays as one note.
 * The clicked cell and everything to its right become individual single-beat notes.
 */
export function decoupleNotesRight(
  noteGrid: NoteGrid,
  row: number,
  col: number
): NoteGrid {
  const noteStart = findNoteStart(noteGrid, row, col);
  if (noteStart === null) return noteGrid;

  const totalDuration = getNoteDuration(noteGrid, row, noteStart);
  if (totalDuration <= 1) return noteGrid; // Already a single note, nothing to decouple

  // Calculate the duration from start to before clicked position
  const leftDuration = col - noteStart;

  const newGrid = cloneGrid(noteGrid);

  if (!newGrid[row]) {
    newGrid[row] = [];
  }

  if (leftDuration > 0) {
    // Update the left portion to have the new shorter duration
    newGrid[row][noteStart] = leftDuration;

    // Set continuation cells for the left portion
    for (let i = 1; i < leftDuration; i++) {
      newGrid[row][noteStart + i] = -1;
    }
  }

  // Convert clicked cell and cells to the right into individual notes
  for (let i = leftDuration; i < totalDuration; i++) {
    newGrid[row][noteStart + i] = 1;
  }

  return newGrid;
}
