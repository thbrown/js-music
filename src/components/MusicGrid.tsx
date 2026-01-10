import React, { useCallback, useEffect, useRef, useState } from 'react';
import './MusicGrid.css';
import PlayButton from './PlayButton';
import GridCanvas from './GridCanvas';
import { MusicGridProps } from '../types';

// Extend the PlayButton with static properties
interface PlayButtonWithStatic extends React.FC<any> {
  setStartingColumn?: (column: number) => void;
}

const MusicGrid: React.FC<MusicGridProps> = ({
  noteGrid,
  setNoteGrid,
  settings,
  gridSize,
  notesPerMeasure,
  setGridSize,
  setNotesPerMeasure,
  middleCPosition,
  setMiddleCPosition,
  resetGrid
}) => {
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const [currentColumn, setCurrentColumn] = useState<number>(-1);
  const [startColumn, setStartColumn] = useState<number>(1);

  // Handle column click to set starting position
  const handleColumnClick = (col: number) => {
    if (col >= 1) {
      setStartColumn(col);
      const playButtonWithStatic = PlayButton as PlayButtonWithStatic;
      if (playButtonWithStatic.setStartingColumn) {
        playButtonWithStatic.setStartingColumn(col);
      }
    }
  };

  // Handle notes per measure update
  const updateNotesPerMeasure = (value: number) => {
    if (value >= 1) {
      setNotesPerMeasure(value);
      localStorage.setItem('notesPerMeasure', JSON.stringify(value));
    }
  };

  // Toggle note state
  const toggleNote = useCallback((row: number, col: number) => {
    if (col === 0) return;

    const newGrid = [...noteGrid];
    if (!newGrid[row]) {
      newGrid[row] = [];
    } else {
      newGrid[row] = [...newGrid[row]];
    }

    newGrid[row][col] = newGrid[row][col] ? 0 : 1;

    localStorage.setItem('musicGrid', JSON.stringify(newGrid));
    setNoteGrid(newGrid);
  }, [noteGrid, setNoteGrid]);

  // Get note name based on position
  const getNoteName = useCallback((row: number): string => {
    const relativePosition = middleCPosition - row;
    const octave = Math.floor(relativePosition / 12) + 4;

    let notePosition = relativePosition % 12;
    if (notePosition < 0) notePosition += 12;

    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return noteNames[notePosition] + octave;
  }, [middleCPosition]);

  // Check if a row is a black key
  const isBlackKeyRow = useCallback((row: number): boolean => {
    const relativePosition = middleCPosition - row;
    let notePosition = relativePosition % 12;
    if (notePosition < 0) notePosition += 12;
    return [1, 3, 6, 8, 10].includes(notePosition);
  }, [middleCPosition]);

  // Render column headers (row 0) - stays as DOM for click handling
  const renderColumnHeaders = useCallback(() => {
    const headers: React.ReactNode[] = [];

    for (let col = 0; col < gridSize.cols; col++) {
      const isStart = col === startColumn;
      const isCurrent = col === currentColumn;

      if (col === 0) {
        headers.push(
          <div
            key={`header_${col}`}
            className="note note-header note-label"
            style={{
              backgroundColor: '#eee',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '10px'
            }}
          >
            Start
          </div>
        );
      } else {
        headers.push(
          <div
            key={`header_${col}`}
            className={`note note-header ${isStart ? 'start-column' : ''} ${isCurrent ? 'highlighted' : ''}`}
            onClick={() => handleColumnClick(col)}
            style={{
              backgroundColor: isStart ? '#4CAF50' : '#eee',
              color: isStart ? 'white' : 'black',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            {isStart ? '▶' : ''}
          </div>
        );
      }
    }

    return headers;
  }, [gridSize.cols, startColumn, currentColumn]);

  // Render note labels (column 0) - stays as DOM for sticky positioning
  const renderNoteLabels = useCallback(() => {
    const labels: React.ReactNode[] = [];

    for (let row = 1; row < gridSize.rows; row++) {
      const isBlackKey = isBlackKeyRow(row);
      labels.push(
        <div
          key={`label_${row}`}
          className="note note-label"
          style={{
            backgroundColor: isBlackKey ? '#444' : '#fff',
            color: isBlackKey ? 'white' : 'black',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '10px',
          }}
        >
          {getNoteName(row)}
        </div>
      );
    }

    return labels;
  }, [gridSize.rows, isBlackKeyRow, getNoteName]);

  // Handle grid size changes
  const updateGridSize = (newRows: number, newCols: number, addToTop = false) => {
    let newGrid;
    let newMiddleCPosition = middleCPosition;

    if (addToTop) {
      const rowsToAdd = newRows - gridSize.rows;
      newMiddleCPosition = middleCPosition + rowsToAdd;

      newGrid = Array(newRows).fill(null).map((_, rowIndex) => {
        if (rowIndex < rowsToAdd) {
          return Array(newCols).fill(0);
        } else {
          const existingRowIndex = rowIndex - rowsToAdd;
          const existingRow = noteGrid[existingRowIndex] || [];
          return Array(newCols).fill(null).map((_, colIndex) =>
            colIndex < existingRow.length ? existingRow[colIndex] : 0
          );
        }
      });
    } else {
      newGrid = Array(newRows).fill(null).map((_, rowIndex) => {
        if (rowIndex < noteGrid.length) {
          const existingRow = noteGrid[rowIndex] || [];
          return Array(newCols).fill(null).map((_, colIndex) =>
            colIndex < existingRow.length ? existingRow[colIndex] : 0
          );
        } else {
          return Array(newCols).fill(0);
        }
      });
    }

    localStorage.setItem('musicGrid', JSON.stringify(newGrid));
    localStorage.setItem('gridSize', JSON.stringify({ rows: newRows, cols: newCols }));
    localStorage.setItem('middleCPosition', JSON.stringify(newMiddleCPosition));

    setNoteGrid(newGrid);
    setGridSize({ rows: newRows, cols: newCols });
    setMiddleCPosition(newMiddleCPosition);
  };

  // Pass the starting column to PlayButton when it changes
  useEffect(() => {
    const playButtonWithStatic = PlayButton as PlayButtonWithStatic;
    if (playButtonWithStatic.setStartingColumn) {
      playButtonWithStatic.setStartingColumn(startColumn);
    }
  }, [startColumn]);

  // Calculate container width based on grid size
  const containerStyle = {
    width: `${gridSize.cols * 30}px`,
  };

  return (
    <div className="music-grid-app">
      {/* Grid Dimension Controls */}
      <div className="grid-controls">
        <div className="control-group">
          <label>Add Notes: </label>
          <button onClick={() => updateGridSize(gridSize.rows + 5, gridSize.cols, true)} title="Add notes to top">↑</button>
          <button onClick={() => updateGridSize(gridSize.rows + 5, gridSize.cols)} title="Add notes to bottom">↓</button>
          <span>{gridSize.rows - 1}</span>
          <button onClick={() => updateGridSize(Math.max(6, gridSize.rows - 5), gridSize.cols)} title="Remove notes">-</button>
        </div>

        <div className="control-group">
          <label>Length: </label>
          <button onClick={() => updateGridSize(gridSize.rows, gridSize.cols + 50)} title="Increase song length">+</button>
          <span>{gridSize.cols}</span>
          <button onClick={() => updateGridSize(gridSize.rows, Math.max(50, gridSize.cols - 50))} title="Decrease song length">-</button>
        </div>

        <div className="control-group">
          <label>Notes per measure: </label>
          <button onClick={() => updateNotesPerMeasure(notesPerMeasure + 1)} title="Increase notes per measure">+</button>
          <span>{notesPerMeasure}</span>
          <button onClick={() => updateNotesPerMeasure(Math.max(1, notesPerMeasure - 1))} title="Decrease notes per measure">-</button>
        </div>
      </div>

      {/* Music Grid - Hybrid DOM/Canvas Layout */}
      <div className="grid-wrapper">
        <div className="grid-container" ref={gridContainerRef} style={containerStyle}>
          {/* Row 0: Column Headers (DOM) */}
          <div className="column-headers-row">
            {renderColumnHeaders()}
          </div>

          {/* Grid Body: Note Labels (DOM) + Canvas */}
          <div className="grid-body">
            {/* Left sticky column with note labels (DOM) */}
            <div className="note-labels-column">
              {renderNoteLabels()}
            </div>

            {/* Canvas for note cells */}
            <GridCanvas
              noteGrid={noteGrid}
              gridSize={gridSize}
              currentColumn={currentColumn}
              startColumn={startColumn}
              notesPerMeasure={notesPerMeasure}
              middleCPosition={middleCPosition}
              onToggleNote={toggleNote}
            />
          </div>
        </div>
      </div>

      {/* Main Controls Panel */}
      <div className="main-controls">
        <div className="playback-section">
          <PlayButton
            noteGrid={noteGrid}
            settings={settings}
            middleCPosition={middleCPosition}
            currentColumn={currentColumn}
            setCurrentColumn={setCurrentColumn}
            startColumn={startColumn}
            setStartColumn={setStartColumn}
          />
        </div>

        <div className="utility-section">
          <button className="reset-button" onClick={resetGrid} title="Reset all notes to default state">Reset Notes</button>
        </div>
      </div>
    </div>
  );
};

export default MusicGrid;
