import React, { useEffect, useRef, useState } from 'react';
import './MeasureContextMenu.css';
import { NoteGrid } from '../types';

interface MeasureInfo {
  index: number;
  noteCount: number;
  startCol: number;
  endCol: number;
}

interface MeasureContextMenuProps {
  x: number;
  y: number;
  targetMeasure: number;
  noteGrid: NoteGrid;
  notesPerMeasure: number;
  gridSize: { rows: number; cols: number };
  onCopy: (sourceMeasure: number, targetMeasure: number, count: number) => void;
  onClose: () => void;
}

const MeasureContextMenu: React.FC<MeasureContextMenuProps> = ({
  x,
  y,
  targetMeasure,
  noteGrid,
  notesPerMeasure,
  gridSize,
  onCopy,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedSource, setSelectedSource] = useState<number | null>(null);
  const [copyCount, setCopyCount] = useState(1);

  // Get all measures that have notes
  const getMeasuresWithNotes = (): MeasureInfo[] => {
    const measures: MeasureInfo[] = [];
    const totalMeasures = Math.ceil((gridSize.cols - 1) / notesPerMeasure);

    for (let m = 0; m < totalMeasures; m++) {
      const startCol = m * notesPerMeasure + 1;
      const endCol = Math.min(startCol + notesPerMeasure, gridSize.cols);

      let noteCount = 0;
      for (let row = 1; row < gridSize.rows; row++) {
        for (let col = startCol; col < endCol; col++) {
          if (noteGrid[row]?.[col] === 1) {
            noteCount++;
          }
        }
      }

      if (noteCount > 0) {
        measures.push({ index: m, noteCount, startCol, endCol });
      }
    }

    return measures;
  };

  const measuresWithNotes = getMeasuresWithNotes();

  // Calculate max measures that can be copied from source to target
  const getMaxCopyCount = (sourceIndex: number): number => {
    const totalMeasures = Math.ceil((gridSize.cols - 1) / notesPerMeasure);
    const measuresFromSource = totalMeasures - sourceIndex;
    const measuresFromTarget = totalMeasures - targetMeasure;
    return Math.min(measuresFromSource, measuresFromTarget);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Adjust position to keep menu on screen
  const adjustedPosition = {
    left: Math.min(x, window.innerWidth - 280),
    top: Math.min(y, window.innerHeight - 300),
  };

  const handleCopy = () => {
    if (selectedSource !== null) {
      onCopy(selectedSource, targetMeasure, copyCount);
    }
  };

  return (
    <div
      ref={menuRef}
      className="measure-context-menu"
      style={{ left: adjustedPosition.left, top: adjustedPosition.top }}
    >
      <div className="menu-header">
        <span className="menu-title">Copy to Measure {targetMeasure + 1}</span>
        <button className="menu-close" onClick={onClose}>×</button>
      </div>

      {measuresWithNotes.length === 0 ? (
        <div className="menu-empty">No measures with notes to copy</div>
      ) : (
        <>
          <div className="menu-section">
            <label className="section-label">Select source measure:</label>
            <div className="measure-list">
              {measuresWithNotes.map((measure) => (
                <button
                  key={measure.index}
                  className={`measure-item ${selectedSource === measure.index ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedSource(measure.index);
                    setCopyCount(1);
                  }}
                >
                  <span className="measure-label">Measure {measure.index + 1}</span>
                  <span className="measure-notes">{measure.noteCount} notes</span>
                </button>
              ))}
            </div>
          </div>

          {selectedSource !== null && (
            <div className="menu-section">
              <label className="section-label">Number of measures to copy:</label>
              <div className="copy-count-control">
                <button
                  onClick={() => setCopyCount(Math.max(1, copyCount - 1))}
                  disabled={copyCount <= 1}
                >
                  −
                </button>
                <span className="copy-count-value">{copyCount}</span>
                <button
                  onClick={() => setCopyCount(Math.min(getMaxCopyCount(selectedSource), copyCount + 1))}
                  disabled={copyCount >= getMaxCopyCount(selectedSource)}
                >
                  +
                </button>
              </div>
              <div className="copy-preview">
                Copying measures {selectedSource + 1}–{selectedSource + copyCount} → {targetMeasure + 1}–{targetMeasure + copyCount}
              </div>
            </div>
          )}

          <div className="menu-actions">
            <button
              className="copy-button"
              onClick={handleCopy}
              disabled={selectedSource === null}
            >
              Copy Measure{copyCount > 1 ? 's' : ''}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MeasureContextMenu;
