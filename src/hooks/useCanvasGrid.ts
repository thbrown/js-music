import { useRef, useEffect, useCallback } from 'react';
import { NoteGrid, GridSize } from '../types';
import { isActiveCell } from '../utils/noteHelpers';

// Rendering constants (matching existing CSS)
const CELL_WIDTH = 30;
const CELL_HEIGHT = 20;

const COLORS = {
  WHITE_CELL: '#ffffff',
  BLACK_KEY_EMPTY: '#888888',
  ACTIVE_NOTE: '#000000',
  CELL_BORDER: '#cccccc',
  HIGHLIGHT_BG: '#e3f2fd',
  MEASURE_BORDER: 'rgba(75, 0, 130, 0.6)',
  START_COLUMN_BORDER: '#4CAF50',
};

interface UseCanvasGridProps {
  noteGrid: NoteGrid;
  gridSize: GridSize;
  currentColumn: number;
  startColumn: number;
  notesPerMeasure: number;
  middleCPosition: number;
  onToggleNote: (row: number, col: number) => void;
  onNoteRightClick?: (row: number, col: number) => void;
}

export function useCanvasGrid({
  noteGrid,
  gridSize,
  currentColumn,
  startColumn,
  notesPerMeasure,
  middleCPosition,
  onToggleNote,
  onNoteRightClick,
}: UseCanvasGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Check if a row is a black key
  const isBlackKeyRow = useCallback((row: number): boolean => {
    const relativePosition = middleCPosition - row;
    let notePosition = relativePosition % 12;
    if (notePosition < 0) notePosition += 12;
    return [1, 3, 6, 8, 10].includes(notePosition);
  }, [middleCPosition]);

  // Render the entire grid
  const renderGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasWidth = (gridSize.cols - 1) * CELL_WIDTH;
    const canvasHeight = (gridSize.rows - 1) * CELL_HEIGHT;

    // Set canvas size if changed
    if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Collect cells by type for batched drawing
    const whiteCells: [number, number][] = [];
    const blackKeyCells: [number, number][] = [];
    // Note spans: [row, startCol, duration]
    const noteSpans: [number, number, number][] = [];

    for (let row = 1; row < gridSize.rows; row++) {
      const isBlackKey = isBlackKeyRow(row);
      for (let col = 1; col < gridSize.cols; col++) {
        const cellValue = noteGrid[row]?.[col] ?? 0;

        if (cellValue > 0) {
          // This is a note start - record the span
          noteSpans.push([row, col, cellValue]);
        } else if (cellValue === 0) {
          // Empty cell - draw background
          if (isBlackKey) {
            blackKeyCells.push([row, col]);
          } else {
            whiteCells.push([row, col]);
          }
        }
        // Skip -1 cells (continuations) - they'll be covered by the note span
      }
    }

    // Draw cells by color (batched for performance)
    const drawCell = (row: number, col: number) => {
      const x = (col - 1) * CELL_WIDTH;
      const y = (row - 1) * CELL_HEIGHT;
      ctx.fillRect(x, y, CELL_WIDTH, CELL_HEIGHT);
    };

    // White cells
    ctx.fillStyle = COLORS.WHITE_CELL;
    whiteCells.forEach(([row, col]) => drawCell(row, col));

    // Black key cells
    ctx.fillStyle = COLORS.BLACK_KEY_EMPTY;
    blackKeyCells.forEach(([row, col]) => drawCell(row, col));

    // Draw note spans
    noteSpans.forEach(([row, startCol, duration]) => {
      const x = (startCol - 1) * CELL_WIDTH;
      const y = (row - 1) * CELL_HEIGHT;

      // First cell is always a solid square
      ctx.fillStyle = COLORS.ACTIVE_NOTE;
      ctx.fillRect(x, y, CELL_WIDTH, CELL_HEIGHT);

      if (duration > 1) {
        // Draw a triangle extending from the first cell to the end
        // Triangle starts at full height after first cell, tapers to a point
        const triangleStartX = x + CELL_WIDTH;
        const triangleEndX = x + (duration * CELL_WIDTH) - 2;
        const bottomY = y + CELL_HEIGHT;

        // Use gradient to create a smoother fade-out effect
        //const gradient = ctx.createLinearGradient(triangleStartX, 0, triangleEndX, 0);
        //gradient.addColorStop(0, COLORS.ACTIVE_NOTE);
        //gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.7)');
        //gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        //ctx.fillStyle = gradient;

        // Draw triangle
        ctx.beginPath();
        ctx.moveTo(triangleStartX, y);
        ctx.lineTo(triangleStartX, y + CELL_HEIGHT);
        ctx.lineTo(triangleEndX, bottomY);
        ctx.closePath();
        ctx.fill();
      }
    });

    // Draw highlight overlay for current column
    if (currentColumn > 0) {
      ctx.fillStyle = 'rgba(100, 149, 237, 0.3)';
      const x = (currentColumn - 1) * CELL_WIDTH;
      ctx.fillRect(x, 0, CELL_WIDTH, canvasHeight);
    }

    // Draw grid lines
    ctx.strokeStyle = COLORS.CELL_BORDER;
    ctx.lineWidth = 1;
    ctx.beginPath();

    // Vertical lines
    for (let col = 0; col <= gridSize.cols - 1; col++) {
      const x = col * CELL_WIDTH + 0.5;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
    }

    // Horizontal lines
    for (let row = 0; row <= gridSize.rows - 1; row++) {
      const y = row * CELL_HEIGHT + 0.5;
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
    }
    ctx.stroke();

    // Draw measure markers (indigo left border)
    ctx.strokeStyle = COLORS.MEASURE_BORDER;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let col = 1; col < gridSize.cols; col++) {
      if (col % notesPerMeasure === 1) {
        const x = (col - 1) * CELL_WIDTH + 1;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
      }
    }
    ctx.stroke();

    // Draw start column indicator (green left border)
    if (startColumn > 0) {
      ctx.strokeStyle = COLORS.START_COLUMN_BORDER;
      ctx.lineWidth = 2;
      ctx.beginPath();
      const x = (startColumn - 1) * CELL_WIDTH + 1;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }
  }, [noteGrid, gridSize, currentColumn, startColumn, notesPerMeasure, isBlackKeyRow]);

  // Handle canvas clicks
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convert to grid coordinates (add 1 because col 0 and row 0 are DOM elements)
    const col = Math.floor(x / CELL_WIDTH) + 1;
    const row = Math.floor(y / CELL_HEIGHT) + 1;

    // Validate bounds
    if (col >= 1 && col < gridSize.cols && row >= 1 && row < gridSize.rows) {
      onToggleNote(row, col);
    }
  }, [gridSize, onToggleNote]);

  // Handle right-click for note merging
  const handleCanvasContextMenu = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();

    if (!onNoteRightClick) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convert to grid coordinates
    const col = Math.floor(x / CELL_WIDTH) + 1;
    const row = Math.floor(y / CELL_HEIGHT) + 1;

    // Only trigger for active cells (notes)
    if (col >= 1 && col < gridSize.cols && row >= 1 && row < gridSize.rows) {
      if (isActiveCell(noteGrid, row, col)) {
        onNoteRightClick(row, col);
      }
    }
  }, [noteGrid, gridSize, onNoteRightClick]);

  // Re-render when dependencies change
  useEffect(() => {
    renderGrid();
  }, [renderGrid]);

  return {
    canvasRef,
    handleCanvasClick,
    handleCanvasContextMenu,
    canvasWidth: (gridSize.cols - 1) * CELL_WIDTH,
    canvasHeight: (gridSize.rows - 1) * CELL_HEIGHT,
  };
}
