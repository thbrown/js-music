import React, { useCallback } from 'react';
import './KeyTranspose.css';
import { NoteGrid, GridSize } from '../types';
import { transposeNotes, convertToMinor, convertToMajor } from '../utils/noteHelpers';

// Musical keys with their semitone offset from C
const KEYS = [
  { name: 'C', semitones: 0 },
  { name: 'C#/Db', semitones: 1 },
  { name: 'D', semitones: 2 },
  { name: 'D#/Eb', semitones: 3 },
  { name: 'E', semitones: 4 },
  { name: 'F', semitones: 5 },
  { name: 'F#/Gb', semitones: 6 },
  { name: 'G', semitones: 7 },
  { name: 'G#/Ab', semitones: 8 },
  { name: 'A', semitones: 9 },
  { name: 'A#/Bb', semitones: 10 },
  { name: 'B', semitones: 11 },
];

interface KeyTransposeProps {
  noteGrid: NoteGrid;
  setNoteGrid: (grid: NoteGrid) => void;
  gridSize: GridSize;
  setGridSize: (size: GridSize) => void;
  middleCPosition: number;
  setMiddleCPosition: (pos: number) => void;
  currentKey: number;
  setCurrentKey: (key: number) => void;
  isMinor: boolean;
  setIsMinor: (isMinor: boolean) => void;
}

const KeyTranspose: React.FC<KeyTransposeProps> = ({
  noteGrid,
  setNoteGrid,
  gridSize,
  setGridSize,
  middleCPosition,
  setMiddleCPosition,
  currentKey,
  setCurrentKey,
  isMinor,
  setIsMinor,
}) => {

  // Transpose by a number of semitones
  const handleTranspose = useCallback((semitones: number) => {
    const result = transposeNotes(noteGrid, semitones, gridSize.rows, gridSize.cols);

    if (result.grid !== noteGrid) {
      // Update grid
      localStorage.setItem('musicGrid', JSON.stringify(result.grid));
      setNoteGrid(result.grid);

      // Update grid size if it changed
      if (result.newRows !== gridSize.rows) {
        const newGridSize = { ...gridSize, rows: result.newRows };
        localStorage.setItem('gridSize', JSON.stringify(newGridSize));
        setGridSize(newGridSize);
      }

      // Adjust middleCPosition if rows were added at the top
      if (result.rowsAddedTop > 0) {
        const newMiddleC = middleCPosition + result.rowsAddedTop;
        localStorage.setItem('middleCPosition', JSON.stringify(newMiddleC));
        setMiddleCPosition(newMiddleC);
      }
    }
  }, [noteGrid, setNoteGrid, gridSize, setGridSize, middleCPosition, setMiddleCPosition]);

  // Change to a specific key
  const handleKeyChange = useCallback((newKeyIndex: number) => {
    const currentSemitones = KEYS[currentKey].semitones;
    const newSemitones = KEYS[newKeyIndex].semitones;

    // Calculate the difference (how many semitones to shift)
    let diff = newSemitones - currentSemitones;

    // Normalize to shortest path (-6 to +6 range)
    if (diff > 6) diff -= 12;
    if (diff < -6) diff += 12;

    if (diff !== 0) {
      handleTranspose(diff);
    }

    setCurrentKey(newKeyIndex);
    localStorage.setItem('currentKey', JSON.stringify(newKeyIndex));
  }, [currentKey, handleTranspose, setCurrentKey]);

  // Convert current notes to minor scale
  const handleConvertToMinor = useCallback(() => {
    if (isMinor) return; // Already minor

    const keyOffset = KEYS[currentKey].semitones;
    const newGrid = convertToMinor(noteGrid, gridSize.rows, gridSize.cols, middleCPosition, keyOffset);

    localStorage.setItem('musicGrid', JSON.stringify(newGrid));
    setNoteGrid(newGrid);
    setIsMinor(true);
    localStorage.setItem('isMinor', JSON.stringify(true));
  }, [noteGrid, setNoteGrid, gridSize, middleCPosition, currentKey, isMinor, setIsMinor]);

  // Convert current notes to major scale
  const handleConvertToMajor = useCallback(() => {
    if (!isMinor) return; // Already major

    const keyOffset = KEYS[currentKey].semitones;
    const newGrid = convertToMajor(noteGrid, gridSize.rows, gridSize.cols, middleCPosition, keyOffset);

    localStorage.setItem('musicGrid', JSON.stringify(newGrid));
    setNoteGrid(newGrid);
    setIsMinor(false);
    localStorage.setItem('isMinor', JSON.stringify(false));
  }, [noteGrid, setNoteGrid, gridSize, middleCPosition, currentKey, isMinor, setIsMinor]);

  return (
    <div className="key-transpose">
      <h3>Key / Transpose</h3>
      <div className="key-transpose-controls">
        <div className="key-selector">
          <label htmlFor="key-select">Key:</label>
          <select
            id="key-select"
            value={currentKey}
            onChange={(e) => handleKeyChange(Number(e.target.value))}
          >
            {KEYS.map((key, index) => (
              <option key={key.name} value={index}>
                {key.name}{isMinor ? 'm' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="mode-buttons">
          <button
            className={`mode-btn ${!isMinor ? 'active' : ''}`}
            onClick={handleConvertToMajor}
            title="Convert to major scale (happy)"
          >
            Major
          </button>
          <button
            className={`mode-btn ${isMinor ? 'active' : ''}`}
            onClick={handleConvertToMinor}
            title="Convert to minor scale (melancholic)"
          >
            Minor
          </button>
        </div>

        <div className="transpose-buttons">
          <button
            className="transpose-btn"
            onClick={() => handleTranspose(-1)}
            title="Transpose down 1 semitone"
          >
            -1
          </button>
          <button
            className="transpose-btn"
            onClick={() => handleTranspose(1)}
            title="Transpose up 1 semitone"
          >
            +1
          </button>
          <button
            className="transpose-btn octave"
            onClick={() => handleTranspose(-12)}
            title="Transpose down 1 octave"
          >
            -12
          </button>
          <button
            className="transpose-btn octave"
            onClick={() => handleTranspose(12)}
            title="Transpose up 1 octave"
          >
            +12
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeyTranspose;
