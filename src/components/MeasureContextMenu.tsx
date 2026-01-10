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
  onCopy: (sourceMeasure: number, targetMeasure: number, count: number, transparent: boolean) => void;
  onClear: (measureIndex: number) => void;
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
  onClear,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedSource, setSelectedSource] = useState<number | null>(null);
  const [copyCount, setCopyCount] = useState(1);
  const [transparentMode, setTransparentMode] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ left: x, top: y });

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

  // Check if target measure has notes
  const targetHasNotes = (() => {
    const startCol = targetMeasure * notesPerMeasure + 1;
    const endCol = Math.min(startCol + notesPerMeasure, gridSize.cols);
    for (let row = 1; row < gridSize.rows; row++) {
      for (let col = startCol; col < endCol; col++) {
        if (noteGrid[row]?.[col] === 1) return true;
      }
    }
    return false;
  })();

  // Reposition menu when it might overflow
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const newLeft = Math.min(x, window.innerWidth - rect.width - 10);
      const newTop = Math.min(y, window.innerHeight - rect.height - 10);

      if (newLeft !== menuPosition.left || newTop !== menuPosition.top) {
        setMenuPosition({ left: Math.max(10, newLeft), top: Math.max(10, newTop) });
      }
    }
  }, [x, y, selectedSource, menuPosition.left, menuPosition.top]);

  const handleCopy = () => {
    if (selectedSource !== null) {
      onCopy(selectedSource, targetMeasure, copyCount, transparentMode);
    }
  };

  return (
    <div
      ref={menuRef}
      className="measure-context-menu"
      style={{ left: menuPosition.left, top: menuPosition.top }}
    >
      <div className="menu-header">
        <span className="menu-title">Measure {targetMeasure + 1}</span>
        <button className="menu-close" onClick={onClose}>×</button>
      </div>

      {/* Clear measure button */}
      {targetHasNotes && (
        <div className="menu-section">
          <button
            className="clear-measure-btn"
            onClick={() => onClear(targetMeasure)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" />
            </svg>
            Clear this measure
          </button>
        </div>
      )}

      {measuresWithNotes.length === 0 ? (
        <div className="menu-empty">No measures with notes to copy</div>
      ) : (
        <>
          <div className="menu-section">
            <label className="section-label">Copy measure:</label>
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

          {selectedSource !== null && (
            <div className="menu-section">
              <label className="transparent-toggle">
                <input
                  type="checkbox"
                  checked={transparentMode}
                  onChange={(e) => setTransparentMode(e.target.checked)}
                />
                <span className="toggle-label">Transparent copy</span>
                <span className="toggle-hint">Only adds notes, keeps existing</span>
              </label>
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
