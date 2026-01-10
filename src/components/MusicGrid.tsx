import React, { useCallback, useEffect, useRef, useState } from 'react';
import './MusicGrid.css';
import PlayButton from './PlayButton';
import GridCanvas from './GridCanvas';
import MeasureContextMenu from './MeasureContextMenu';
import { MusicGridProps } from '../types';
import { playNote } from '../utils/audio';

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

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    targetMeasure: number;
  }>({ visible: false, x: 0, y: 0, targetMeasure: 0 });

  // Handle right-click on measure
  const handleMeasureRightClick = useCallback((measureIndex: number, x: number, y: number) => {
    setContextMenu({ visible: true, x, y, targetMeasure: measureIndex });
  }, []);

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  // Check if a measure has any notes
  const measureHasNotes = useCallback((measureIndex: number): boolean => {
    const startCol = measureIndex * notesPerMeasure + 1;
    const endCol = Math.min(startCol + notesPerMeasure, gridSize.cols);

    for (let row = 1; row < gridSize.rows; row++) {
      for (let col = startCol; col < endCol; col++) {
        if (noteGrid[row]?.[col] === 1) {
          return true;
        }
      }
    }
    return false;
  }, [noteGrid, notesPerMeasure, gridSize]);

  // Copy measures from source to target
  const handleCopyMeasures = useCallback((sourceMeasure: number, targetMeasure: number, count: number, transparent: boolean) => {
    // Check if any target measures have notes (only for non-transparent mode)
    if (!transparent) {
      let targetHasNotes = false;
      for (let i = 0; i < count; i++) {
        if (measureHasNotes(targetMeasure + i)) {
          targetHasNotes = true;
          break;
        }
      }

      // Confirm if overwriting
      if (targetHasNotes) {
        const targetRange = count === 1
          ? `measure ${targetMeasure + 1}`
          : `measures ${targetMeasure + 1}–${targetMeasure + count}`;
        if (!window.confirm(`Overwrite notes in ${targetRange}?`)) {
          return;
        }
      }
    }

    // Perform the copy
    const newGrid = noteGrid.map(row => row ? [...row] : []);

    for (let m = 0; m < count; m++) {
      const srcStartCol = (sourceMeasure + m) * notesPerMeasure + 1;
      const tgtStartCol = (targetMeasure + m) * notesPerMeasure + 1;

      for (let row = 1; row < gridSize.rows; row++) {
        if (!newGrid[row]) newGrid[row] = [];

        for (let offset = 0; offset < notesPerMeasure; offset++) {
          const srcCol = srcStartCol + offset;
          const tgtCol = tgtStartCol + offset;

          if (tgtCol < gridSize.cols) {
            const srcValue = noteGrid[row]?.[srcCol] ?? 0;
            if (transparent) {
              // Transparent mode: only add notes, don't remove existing
              if (srcValue === 1) {
                newGrid[row][tgtCol] = 1;
              }
            } else {
              // Normal mode: overwrite completely
              newGrid[row][tgtCol] = srcValue;
            }
          }
        }
      }
    }

    localStorage.setItem('musicGrid', JSON.stringify(newGrid));
    setNoteGrid(newGrid);
    closeContextMenu();
  }, [noteGrid, notesPerMeasure, gridSize, measureHasNotes, setNoteGrid, closeContextMenu]);

  // Clear all notes from a measure
  const handleClearMeasure = useCallback((measureIndex: number) => {
    if (!window.confirm(`Clear all notes from measure ${measureIndex + 1}?`)) {
      return;
    }

    const startCol = measureIndex * notesPerMeasure + 1;
    const endCol = Math.min(startCol + notesPerMeasure, gridSize.cols);

    const newGrid = noteGrid.map(row => row ? [...row] : []);

    for (let row = 1; row < gridSize.rows; row++) {
      if (!newGrid[row]) continue;
      for (let col = startCol; col < endCol; col++) {
        newGrid[row][col] = 0;
      }
    }

    localStorage.setItem('musicGrid', JSON.stringify(newGrid));
    setNoteGrid(newGrid);
    closeContextMenu();
  }, [noteGrid, notesPerMeasure, gridSize, setNoteGrid, closeContextMenu]);

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

  // Play a single note using shared audio utility
  const playSingleNote = useCallback((row: number) => {
    playNote(row, middleCPosition, {
      frequency: settings.frequency,
      oscillatorType: settings.oscillatorType as OscillatorType,
      duration: 0.2,
      gain: 1,
    });
  }, [middleCPosition, settings.frequency, settings.oscillatorType]);

  // Toggle note state
  const toggleNote = useCallback((row: number, col: number) => {
    if (col === 0) return;

    const newGrid = [...noteGrid];
    if (!newGrid[row]) {
      newGrid[row] = [];
    } else {
      newGrid[row] = [...newGrid[row]];
    }

    const wasActive = newGrid[row][col] === 1;
    newGrid[row][col] = wasActive ? 0 : 1;

    // Play the note when activating it
    if (!wasActive) {
      playSingleNote(row);
    }

    localStorage.setItem('musicGrid', JSON.stringify(newGrid));
    setNoteGrid(newGrid);
  }, [noteGrid, setNoteGrid, playSingleNote]);

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
      // Check if this is the first column of a measure (col 1, 1+notesPerMeasure, etc.)
      const isMeasureStart = col > 0 && (col - 1) % notesPerMeasure === 0;
      const measureNumber = isMeasureStart ? Math.floor((col - 1) / notesPerMeasure) + 1 : null;

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
            M
          </div>
        );
      } else {
        headers.push(
          <div
            key={`header_${col}`}
            className={`note note-header ${isStart ? 'start-column' : ''} ${isCurrent ? 'highlighted' : ''} ${isMeasureStart ? 'measure-start-header' : ''}`}
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
            {isStart ? '▶' : measureNumber || ''}
          </div>
        );
      }
    }

    return headers;
  }, [gridSize.cols, startColumn, currentColumn, notesPerMeasure]);

  // Render note labels (column 0) - stays as DOM for sticky positioning
  // Clicking a label plays that note
  const renderNoteLabels = useCallback(() => {
    const labels: React.ReactNode[] = [];

    for (let row = 1; row < gridSize.rows; row++) {
      const isBlackKey = isBlackKeyRow(row);
      labels.push(
        <div
          key={`label_${row}`}
          className="note note-label note-label-clickable"
          onClick={() => playSingleNote(row)}
          style={{
            backgroundColor: isBlackKey ? '#444' : '#fff',
            color: isBlackKey ? 'white' : 'black',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '10px',
            cursor: 'pointer',
          }}
        >
          {getNoteName(row)}
        </div>
      );
    }

    return labels;
  }, [gridSize.rows, isBlackKeyRow, getNoteName, playSingleNote]);

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

  // Check if specific rows contain any notes
  const rowsHaveNotes = (startRow: number, endRow: number): boolean => {
    for (let row = startRow; row < endRow; row++) {
      if (noteGrid[row]?.some(cell => cell === 1)) {
        return true;
      }
    }
    return false;
  };

  // Check if columns beyond a certain point contain notes
  const colsHaveNotes = (startCol: number): boolean => {
    return noteGrid.some(row => {
      if (!row) return false;
      for (let col = startCol; col < row.length; col++) {
        if (row[col] === 1) return true;
      }
      return false;
    });
  };

  // Remove rows from the top of the grid
  const removeRowsFromTop = (count: number) => {
    const newRows = Math.max(6, gridSize.rows - count);
    const rowsToRemove = gridSize.rows - newRows;

    if (rowsToRemove <= 0) return;

    // Check if rows being removed have notes
    if (rowsHaveNotes(0, rowsToRemove)) {
      if (!window.confirm(`Remove ${rowsToRemove} high notes? This will delete notes in those rows.`)) {
        return;
      }
    }

    // Remove rows from the beginning and adjust middleCPosition
    const newMiddleCPosition = middleCPosition - rowsToRemove;
    const newGrid = noteGrid.slice(rowsToRemove);

    localStorage.setItem('musicGrid', JSON.stringify(newGrid));
    localStorage.setItem('gridSize', JSON.stringify({ rows: newRows, cols: gridSize.cols }));
    localStorage.setItem('middleCPosition', JSON.stringify(newMiddleCPosition));

    setNoteGrid(newGrid);
    setGridSize({ rows: newRows, cols: gridSize.cols });
    setMiddleCPosition(newMiddleCPosition);
  };

  // Remove rows from the bottom of the grid
  const removeRowsFromBottom = (count: number) => {
    const newRows = Math.max(6, gridSize.rows - count);
    const rowsToRemove = gridSize.rows - newRows;

    if (rowsToRemove <= 0) return;

    // Check if rows being removed have notes
    if (rowsHaveNotes(newRows, gridSize.rows)) {
      if (!window.confirm(`Remove ${rowsToRemove} low notes? This will delete notes in those rows.`)) {
        return;
      }
    }

    updateGridSize(newRows, gridSize.cols, false);
  };

  // Remove columns from the end of the grid
  const removeColumns = (count: number) => {
    const newCols = Math.max(50, gridSize.cols - count);

    if (newCols >= gridSize.cols) return;

    // Check if columns being removed have notes
    if (colsHaveNotes(newCols)) {
      if (!window.confirm(`Shorten the song? This will delete notes beyond column ${newCols}.`)) {
        return;
      }
    }

    updateGridSize(gridSize.rows, newCols, false);
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
          <label>High notes: </label>
          <button onClick={() => updateGridSize(gridSize.rows + 5, gridSize.cols, true)} title="Add 5 higher notes">+</button>
          <button onClick={() => removeRowsFromTop(5)} title="Remove 5 higher notes">−</button>
        </div>

        <div className="control-group">
          <label>Low notes: </label>
          <button onClick={() => updateGridSize(gridSize.rows + 5, gridSize.cols, false)} title="Add 5 lower notes">+</button>
          <button onClick={() => removeRowsFromBottom(5)} title="Remove 5 lower notes">−</button>
        </div>

        <div className="control-group">
          <label>Total: </label>
          <span>{gridSize.rows - 1}</span>
        </div>

        <div className="control-group">
          <label>Length: </label>
          <button onClick={() => updateGridSize(gridSize.rows, gridSize.cols + 50)} title="Increase song length">+</button>
          <span>{gridSize.cols}</span>
          <button onClick={() => removeColumns(50)} title="Decrease song length">−</button>
        </div>

        <div className="control-group">
          <label>Notes per measure: </label>
          <button onClick={() => updateNotesPerMeasure(notesPerMeasure + 1)} title="Increase notes per measure">+</button>
          <span>{notesPerMeasure}</span>
          <button onClick={() => updateNotesPerMeasure(Math.max(1, notesPerMeasure - 1))} title="Decrease notes per measure">-</button>
        </div>
      </div>

      {/* Playback Controls */}
      <PlayButton
        noteGrid={noteGrid}
        settings={settings}
        middleCPosition={middleCPosition}
        currentColumn={currentColumn}
        setCurrentColumn={setCurrentColumn}
        startColumn={startColumn}
        setStartColumn={setStartColumn}
        onReset={() => {
          resetGrid();
          setStartColumn(1);
        }}
      />

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
              onMeasureRightClick={handleMeasureRightClick}
            />
          </div>
        </div>
      </div>

      {/* Measure Copy Context Menu */}
      {contextMenu.visible && (
        <MeasureContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          targetMeasure={contextMenu.targetMeasure}
          noteGrid={noteGrid}
          notesPerMeasure={notesPerMeasure}
          gridSize={gridSize}
          onCopy={handleCopyMeasures}
          onClear={handleClearMeasure}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
};

export default MusicGrid;
