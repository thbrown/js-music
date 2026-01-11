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

export interface TransposeResult {
  grid: NoteGrid;
  newRows: number;
  rowsAddedTop: number;
}

/**
 * Transpose all notes in the grid by a given number of semitones.
 * Positive values shift notes up (higher pitch), negative values shift down.
 * Expands the grid if notes would overflow.
 */
export function transposeNotes(
  noteGrid: NoteGrid,
  semitones: number,
  gridRows: number,
  gridCols: number
): TransposeResult {
  if (semitones === 0) {
    return { grid: noteGrid, newRows: gridRows, rowsAddedTop: 0 };
  }

  // First, find the bounds of existing notes
  let minRow = gridRows;
  let maxRow = 0;

  for (let row = 1; row < noteGrid.length; row++) {
    if (!noteGrid[row]) continue;
    for (let col = 0; col < noteGrid[row].length; col++) {
      if (noteGrid[row][col] > 0) {
        minRow = Math.min(minRow, row);
        maxRow = Math.max(maxRow, row);
      }
    }
  }

  // If no notes, just return the original grid
  if (minRow > maxRow) {
    return { grid: noteGrid, newRows: gridRows, rowsAddedTop: 0 };
  }

  // Calculate new positions after transpose
  const newMinRow = minRow - semitones;
  const newMaxRow = maxRow - semitones;

  // Calculate how many rows to add
  let rowsAddedTop = 0;
  let rowsAddedBottom = 0;

  if (newMinRow < 1) {
    rowsAddedTop = 1 - newMinRow;
  }
  if (newMaxRow >= gridRows) {
    rowsAddedBottom = newMaxRow - gridRows + 1;
  }

  const newGridRows = gridRows + rowsAddedTop + rowsAddedBottom;

  // Create new grid with expanded size
  const newGrid: NoteGrid = [];
  for (let i = 0; i < newGridRows; i++) {
    newGrid[i] = Array(gridCols).fill(0);
  }

  // Copy notes to their new positions (adjusted for rows added at top)
  for (let row = 1; row < noteGrid.length; row++) {
    if (!noteGrid[row]) continue;

    for (let col = 0; col < noteGrid[row].length; col++) {
      const cellValue = noteGrid[row][col];

      // Only process note starts (value > 0)
      if (cellValue > 0) {
        // Calculate new row (subtract semitones, add rowsAddedTop offset)
        const newRow = row - semitones + rowsAddedTop;

        // Set the note start
        newGrid[newRow][col] = cellValue;

        // Set continuation cells
        for (let i = 1; i < cellValue; i++) {
          newGrid[newRow][col + i] = -1;
        }
      }
    }
  }

  return { grid: newGrid, newRows: newGridRows, rowsAddedTop };
}

export interface TrimResult {
  grid: NoteGrid;
  newRows: number;
  newCols: number;
  rowsRemovedTop: number;
  colsRemovedLeft: number;
}

/**
 * Trim unused rows and columns from the grid.
 * Keeps a minimum padding around the notes.
 */
export function trimGrid(
  noteGrid: NoteGrid,
  gridRows: number,
  gridCols: number,
  minPadding: number = 2
): TrimResult {
  // Find the bounds of existing notes
  let minRow = gridRows;
  let maxRow = 0;
  let minCol = gridCols;
  let maxCol = 0;

  for (let row = 1; row < noteGrid.length; row++) {
    if (!noteGrid[row]) continue;
    for (let col = 0; col < noteGrid[row].length; col++) {
      const cellValue = noteGrid[row][col];
      if (cellValue > 0) {
        minRow = Math.min(minRow, row);
        maxRow = Math.max(maxRow, row);
        minCol = Math.min(minCol, col);
        // Account for note duration
        maxCol = Math.max(maxCol, col + cellValue - 1);
      }
    }
  }

  // If no notes, return minimal grid
  if (minRow > maxRow) {
    const defaultRows = 26;
    const defaultCols = 16;
    const newGrid: NoteGrid = [];
    for (let i = 0; i < defaultRows; i++) {
      newGrid[i] = Array(defaultCols).fill(0);
    }
    return {
      grid: newGrid,
      newRows: defaultRows,
      newCols: defaultCols,
      rowsRemovedTop: 0,
      colsRemovedLeft: 0,
    };
  }

  // Calculate new bounds with padding
  const newMinRow = Math.max(1, minRow - minPadding);
  const newMaxRow = Math.min(gridRows - 1, maxRow + minPadding);
  const newMinCol = Math.max(1, minCol - minPadding);
  const newMaxCol = Math.min(gridCols - 1, maxCol + minPadding);

  const rowsRemovedTop = newMinRow - 1;
  const colsRemovedLeft = newMinCol - 1;
  const newRows = newMaxRow - newMinRow + 2; // +1 for range, +1 for header row
  const newCols = newMaxCol - newMinCol + 2; // +1 for range, +1 for label column

  // Create new trimmed grid
  const newGrid: NoteGrid = [];
  for (let i = 0; i < newRows; i++) {
    newGrid[i] = Array(newCols).fill(0);
  }

  // Copy notes to new positions
  for (let row = newMinRow; row <= newMaxRow; row++) {
    if (!noteGrid[row]) continue;
    const newRow = row - rowsRemovedTop;

    for (let col = newMinCol; col <= newMaxCol; col++) {
      const cellValue = noteGrid[row]?.[col] ?? 0;
      const newCol = col - colsRemovedLeft;
      newGrid[newRow][newCol] = cellValue;
    }
  }

  return {
    grid: newGrid,
    newRows,
    newCols,
    rowsRemovedTop,
    colsRemovedLeft,
  };
}

/**
 * Get the scale degree (0-11) of a note relative to a key.
 * @param row - The row in the grid
 * @param middleCPosition - The row where middle C is located
 * @param keyOffset - The semitone offset of the key from C (0 = C, 2 = D, etc.)
 * @returns The scale degree (0-11) where 0 is the root
 */
function getScaleDegree(row: number, middleCPosition: number, keyOffset: number): number {
  // Calculate semitones from middle C (negative = lower, positive = higher)
  const semitonesFromC = middleCPosition - row;
  // Normalize to 0-11 pitch class
  const pitchClass = ((semitonesFromC % 12) + 12) % 12;
  // Calculate scale degree relative to the key
  const scaleDegree = ((pitchClass - keyOffset) % 12 + 12) % 12;
  return scaleDegree;
}

/**
 * Convert notes from major to minor by lowering the 3rd, 6th, and 7th scale degrees.
 * @param noteGrid - The note grid
 * @param gridRows - Number of rows in the grid
 * @param gridCols - Number of columns in the grid
 * @param middleCPosition - The row where middle C is located
 * @param keyOffset - The semitone offset of the key from C (0 = C, 2 = D, etc.)
 */
export function convertToMinor(
  noteGrid: NoteGrid,
  gridRows: number,
  gridCols: number,
  middleCPosition: number,
  keyOffset: number
): NoteGrid {
  // Major scale degrees to convert: 3rd (4), 6th (9), 7th (11)
  const majorDegrees = [4, 9, 11];

  const newGrid = cloneGrid(noteGrid);

  // First pass: collect notes to move and clear their original positions
  const notesToMove: { fromRow: number; toRow: number; col: number; duration: number }[] = [];

  for (let row = 1; row < noteGrid.length; row++) {
    if (!noteGrid[row]) continue;

    for (let col = 0; col < noteGrid[row].length; col++) {
      const cellValue = noteGrid[row][col];

      // Only process note starts (value > 0)
      if (cellValue > 0) {
        const scaleDegree = getScaleDegree(row, middleCPosition, keyOffset);

        if (majorDegrees.includes(scaleDegree)) {
          // This note needs to be lowered by 1 semitone (row + 1)
          notesToMove.push({ fromRow: row, toRow: row + 1, col, duration: cellValue });

          // Clear the original note
          newGrid[row][col] = 0;
          for (let i = 1; i < cellValue; i++) {
            if (newGrid[row][col + i] === -1) {
              newGrid[row][col + i] = 0;
            }
          }
        }
      }
    }
  }

  // Second pass: place notes in new positions
  for (const { toRow, col, duration } of notesToMove) {
    if (toRow >= 1 && toRow < gridRows) {
      if (!newGrid[toRow]) {
        newGrid[toRow] = Array(gridCols).fill(0);
      }

      // Only place if the target is empty
      if (newGrid[toRow][col] === 0) {
        newGrid[toRow][col] = duration;
        for (let i = 1; i < duration; i++) {
          newGrid[toRow][col + i] = -1;
        }
      }
    }
  }

  return newGrid;
}

/**
 * Convert notes from minor to major by raising the 3rd, 6th, and 7th scale degrees.
 * @param noteGrid - The note grid
 * @param gridRows - Number of rows in the grid
 * @param gridCols - Number of columns in the grid
 * @param middleCPosition - The row where middle C is located
 * @param keyOffset - The semitone offset of the key from C (0 = C, 2 = D, etc.)
 */
export function convertToMajor(
  noteGrid: NoteGrid,
  gridRows: number,
  gridCols: number,
  middleCPosition: number,
  keyOffset: number
): NoteGrid {
  // Minor scale degrees to convert: 3rd (3), 6th (8), 7th (10)
  const minorDegrees = [3, 8, 10];

  const newGrid = cloneGrid(noteGrid);

  // First pass: collect notes to move and clear their original positions
  const notesToMove: { fromRow: number; toRow: number; col: number; duration: number }[] = [];

  for (let row = 1; row < noteGrid.length; row++) {
    if (!noteGrid[row]) continue;

    for (let col = 0; col < noteGrid[row].length; col++) {
      const cellValue = noteGrid[row][col];

      // Only process note starts (value > 0)
      if (cellValue > 0) {
        const scaleDegree = getScaleDegree(row, middleCPosition, keyOffset);

        if (minorDegrees.includes(scaleDegree)) {
          // This note needs to be raised by 1 semitone (row - 1)
          notesToMove.push({ fromRow: row, toRow: row - 1, col, duration: cellValue });

          // Clear the original note
          newGrid[row][col] = 0;
          for (let i = 1; i < cellValue; i++) {
            if (newGrid[row][col + i] === -1) {
              newGrid[row][col + i] = 0;
            }
          }
        }
      }
    }
  }

  // Second pass: place notes in new positions
  for (const { toRow, col, duration } of notesToMove) {
    if (toRow >= 1 && toRow < gridRows) {
      if (!newGrid[toRow]) {
        newGrid[toRow] = Array(gridCols).fill(0);
      }

      // Only place if the target is empty
      if (newGrid[toRow][col] === 0) {
        newGrid[toRow][col] = duration;
        for (let i = 1; i < duration; i++) {
          newGrid[toRow][col + i] = -1;
        }
      }
    }
  }

  return newGrid;
}
