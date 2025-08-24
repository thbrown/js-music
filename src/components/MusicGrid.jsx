import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './MusicGrid.css';
import PlayButton from './PlayButton';


const MusicGrid = ({ noteGrid, setNoteGrid, settings, gridSize, notesPerMeasure, setGridSize, setNotesPerMeasure, middleCPosition, setMiddleCPosition, resetGrid }) => {
  const gridContainerRef = useRef(null);
  
  const [currentColumn, setCurrentColumn] = useState(-1);
  const [startColumn, setStartColumn] = useState(1);

  // Handle column click to set starting position
  const handleColumnClick = (col) => {
    // Only handle clicks on column headers (row 0)
    if (col >= 1) {
      setStartColumn(col);
      // Also update the PlayButton component if it's available
      if (PlayButton.setStartingColumn) {
        PlayButton.setStartingColumn(col);
      }
    }
  };
  
  // Handle notes per measure update
  const updateNotesPerMeasure = (value) => {
    if (value >= 1) {
      setNotesPerMeasure(value);
      localStorage.setItem('notesPerMeasure', JSON.stringify(value));
    }
  };

  // Toggle note state - optimized with useCallback
  const toggleNote = useCallback((row, col) => {
    // Start timing
    const startTime = performance.now();
    
    // Don't toggle first column (labels)
    if (col === 0) return;
    
    // Create a copy of the grid to modify, but only copy the specific row we're changing
    const newGrid = [...noteGrid];
    
    // Ensure the row exists in the grid
    if (!newGrid[row]) {
      newGrid[row] = [];
    } else {
      // Only copy the row we're modifying
      newGrid[row] = [...newGrid[row]];
    }
    
    // Toggle between 0 and 1
    newGrid[row][col] = newGrid[row][col] ? 0 : 1;
    
    localStorage.setItem('musicGrid', JSON.stringify(newGrid));    
    setNoteGrid(newGrid);
    
    // End timing and log
    const endTime = performance.now();
    console.log(`toggleNote execution time: ${endTime - startTime}ms for row ${row}, col ${col}`);
  }, [noteGrid, setNoteGrid]);

  // Get note name based on position - wrapped in useCallback to prevent unnecessary recalculations
  const getNoteName = useCallback((row) => {
    // C4 (middle C) is at middleCPosition
    // For ascending order, we need to invert the row calculation
    // Higher row numbers should be lower notes
    const relativePosition = middleCPosition - row;
    const octave = Math.floor(relativePosition / 12) + 4;
    
    // Calculate note position in the octave (0-11)
    // We need to ensure this wraps correctly for negative values
    let notePosition = relativePosition % 12;
    if (notePosition < 0) notePosition += 12;
    
    // Note names in order from C (0) to B (11)
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return noteNames[notePosition] + octave;
  }, []);

  // Create a memoized GridCell component to prevent unnecessary re-renders
  const GridCell = memo(({ row, col, backgroundColor, textColor, content, isHighlighted, isStartColumn, isMeasureStart, onClick, style }) => {
    return (
      <div 
        key={`note_${row}_${col}`}
        className={`note ${col === 0 ? 'note-label' : ''} ${isHighlighted ? 'highlighted' : ''} ${isStartColumn ? 'start-column' : ''} ${isMeasureStart ? 'measure-start' : ''}`}
        data-line={row}
        onClick={onClick}
        style={{ 
          backgroundColor,
          color: textColor,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: col === 0 ? '10px' : 'inherit',
          borderLeft: isStartColumn && col > 0 ? '2px solid #4CAF50' : null,
          ...style
        }}
      >
        {content}
      </div>
    );
  });
  
  // Render the grid - memoized with useCallback
  const renderGrid = useCallback(() => {
    const gridElements = [];
    
    // Add column headers (row 0) for setting starting position
    for (let col = 0; col < gridSize.cols; col++) {
      const isStartColumn = col === startColumn;
      const isCurrentColumn = col === currentColumn;
      
      if (col === 0) {
        // Skip first column (it would be above the note labels)
        gridElements.push(
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
        // Column headers for setting start position
        gridElements.push(
          <div 
            key={`header_${col}`}
            className={`note note-header ${isStartColumn ? 'start-column' : ''} ${isCurrentColumn ? 'highlighted' : ''}`}
            onClick={() => handleColumnClick(col)}
            style={{ 
              backgroundColor: isStartColumn ? '#4CAF50' : '#eee',
              color: isStartColumn ? 'white' : 'black',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            {isStartColumn ? '▶' : ''}
          </div>
        );
      }
    }
    
    // Create rows and columns based on gridSize
    for (let row = 1; row < gridSize.rows; row++) {
      for (let col = 0; col < gridSize.cols; col++) {
        // Determine if this is a black key (specific rows)
        // With the updated note calculation, we need to use the same logic as in getNoteName
        const relativePosition = middleCPosition - row;
        let notePosition = relativePosition % 12;
        if (notePosition < 0) notePosition += 12;
        
        // Black keys are at positions 1, 3, 6, 8, 10 (C#, D#, F#, G#, A#)
        const isBlackKey = [1, 3, 6, 8, 10].includes(notePosition);
        
        // Set initial background color
        let backgroundColor = '';
        let content = '';
        let textColor = '';
        
        if (col === 0) {
          // First column (labels)
          backgroundColor = isBlackKey ? '#444' : ''; // Lighter background for black keys
          content = getNoteName(row);
          textColor = isBlackKey ? 'white' : 'black';
        } else if (isBlackKey) {
          // Shade all columns for black keys with grey
          // Ensure we check for both undefined and falsy values
          const hasNote = noteGrid[row] !== undefined && noteGrid[row][col] === 1;
          backgroundColor = hasNote ? '#000' : '#888';
        } else {
          // Regular notes
          // Ensure we check for both undefined and falsy values
          const hasNote = noteGrid[row] !== undefined && noteGrid[row][col] === 1;
          backgroundColor = hasNote ? '#000' : '#fff';
        }
        
        // Check if this column is currently playing
        const isHighlighted = col === currentColumn;
        const isStartColumn = col === startColumn;
        
        // Check if this column is the start of a measure
        const isMeasureStart = col > 0 && (col % notesPerMeasure === 1);
        
        // Use the memoized GridCell component
        gridElements.push(
          <GridCell
            key={`note_${row}_${col}`}
            row={row}
            col={col}
            backgroundColor={backgroundColor}
            textColor={textColor}
            content={content}
            isHighlighted={isHighlighted}
            isStartColumn={isStartColumn}
            isMeasureStart={isMeasureStart}
            onClick={() => toggleNote(row, col)}
          />
        );
      }
    }
    
    return gridElements;
  }, [gridSize.cols, gridSize.rows, startColumn, currentColumn, middleCPosition, notesPerMeasure, getNoteName, noteGrid, toggleNote]);

  // Handle grid size changes
  const updateGridSize = (newRows, newCols, addToTop = false) => {
    let newGrid;
    let newMiddleCPosition = middleCPosition;
    
    if (addToTop) {
      // Adding rows to the top
      const rowsToAdd = newRows - gridSize.rows;
      newMiddleCPosition = middleCPosition + rowsToAdd;
      
      // Create new grid with empty rows at the top
      newGrid = Array(newRows).fill().map((_, rowIndex) => {
        if (rowIndex < rowsToAdd) {
          // New empty rows at the top
          return Array(newCols).fill(0);
        } else {
          // Copy existing rows
          const existingRowIndex = rowIndex - rowsToAdd;
          const existingRow = noteGrid[existingRowIndex] || [];
          return Array(newCols).fill().map((_, colIndex) => 
            colIndex < existingRow.length ? existingRow[colIndex] : 0
          );
        }
      });
    } else {
      // Adding rows to the bottom or adjusting columns
      newGrid = Array(newRows).fill().map((_, rowIndex) => {
        if (rowIndex < noteGrid.length) {
          // Copy existing row data and extend if needed
          const existingRow = noteGrid[rowIndex] || [];
          return Array(newCols).fill().map((_, colIndex) => 
            colIndex < existingRow.length ? existingRow[colIndex] : 0
          );
        } else {
          // Create new empty row
          return Array(newCols).fill(0);
        }
      });
    }
    
    // Save to localStorage
    localStorage.setItem('musicGrid', JSON.stringify(newGrid));
    localStorage.setItem('gridSize', JSON.stringify({ rows: newRows, cols: newCols }));
    localStorage.setItem('middleCPosition', JSON.stringify(newMiddleCPosition));

    setNoteGrid(newGrid);
    setGridSize({ rows: newRows, cols: newCols });
    setMiddleCPosition(newMiddleCPosition);

  };
  
  // Pass the starting column to PlayButton when it changes
  useEffect(() => {
    if (PlayButton.setStartingColumn) {
      PlayButton.setStartingColumn(startColumn);
    }
  }, [startColumn]);
  
  // No debug logging needed

  // Calculate container width based on grid size
  const containerStyle = {
    width: `${gridSize.cols * 30}px`, // Each note is 30px wide
  };

  // Use useMemo to optimize the grid rendering
  const gridContent = useMemo(() => renderGrid(), [renderGrid]);
  
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
      
      {/* Music Grid */}
      <div className="grid-wrapper">
        <div className="grid-container" ref={gridContainerRef} style={containerStyle}>
          {gridContent}
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
