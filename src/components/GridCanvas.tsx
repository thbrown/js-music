import React from 'react';
import { useCanvasGrid } from '../hooks/useCanvasGrid';
import { NoteGrid, GridSize } from '../types';

interface GridCanvasProps {
  noteGrid: NoteGrid;
  gridSize: GridSize;
  currentColumn: number;
  startColumn: number;
  notesPerMeasure: number;
  middleCPosition: number;
  onToggleNote: (row: number, col: number) => void;
}

const GridCanvas: React.FC<GridCanvasProps> = ({
  noteGrid,
  gridSize,
  currentColumn,
  startColumn,
  notesPerMeasure,
  middleCPosition,
  onToggleNote,
}) => {
  const { canvasRef, handleCanvasClick, canvasWidth, canvasHeight } = useCanvasGrid({
    noteGrid,
    gridSize,
    currentColumn,
    startColumn,
    notesPerMeasure,
    middleCPosition,
    onToggleNote,
  });

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      onClick={handleCanvasClick}
      className="grid-canvas"
      style={{ display: 'block', cursor: 'pointer' }}
    />
  );
};

export default GridCanvas;
