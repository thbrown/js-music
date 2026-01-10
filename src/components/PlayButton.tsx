import React, { useCallback, useEffect, useRef, useState } from 'react';
import './PlayButton.css';
import { NoteGrid, Settings, PlayButtonProps } from '../types';
import { scheduleNote } from '../utils/audio';

// Define the static property for the component
interface PlayButtonStatic {
  setStartingColumn?: (column: number) => void;
}

const PlayButton: React.FC<PlayButtonProps> & PlayButtonStatic = ({
  noteGrid,
  setCurrentColumn,
  settings,
  currentColumn,
  startColumn,
  middleCPosition,
  onReset
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const colRef = useRef<number>(currentColumn);

  // Collect active notes
  const collectActiveNotes = useCallback((): [number, number][] => {
    const activeNotes: [number, number][] = [];
    for (let row = 1; row < noteGrid.length; row++) {
      if (noteGrid[row]) {
        for (let col = 0; col < noteGrid[row].length; col++) {
          if (noteGrid[row][col]) {
            activeNotes.push([row, col]);
          }
        }
      }
    }
    return activeNotes;
  }, [noteGrid]);

  // Get the max column with notes
  const getMaxColumn = useCallback((): number => {
    let maxColumn = -1;
    for (const [_, col] of collectActiveNotes()) {
      maxColumn = Math.max(maxColumn, col);
    }
    return maxColumn;
  }, [collectActiveNotes]);

  // Stop all playback and clean up
  const stopPlayback = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    oscillatorsRef.current.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Ignore errors if oscillator is already stopped
      }
    });
    oscillatorsRef.current = [];

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(e => console.error('Error closing audio context:', e));
      audioContextRef.current = null;
    }

    setIsPlaying(false);
    setCurrentColumn(-1);
  }, [setCurrentColumn]);

  // Update the current column based on elapsed time
  const updateCurrentColumn = useCallback((elapsedTime: number) => {
    const columnsPerSecond = settings.tempo / 20;
    const column = Math.floor(elapsedTime * columnsPerSecond) + startColumn;

    if (column !== colRef.current) {
      setCurrentColumn(column);
      colRef.current = column;
    }

    if (column > getMaxColumn() + 10) {
      stopPlayback();
    } else {
      animationFrameRef.current = requestAnimationFrame(() => {
        if (audioContextRef.current) {
          const newElapsedTime = (audioContextRef.current.currentTime - startTimeRef.current);
          updateCurrentColumn(newElapsedTime);
        }
      });
    }
  }, [getMaxColumn, stopPlayback, startColumn, settings.tempo, setCurrentColumn]);

  // Function to play the composition
  const playComposition = useCallback(() => {
    if (isPlaying) return;

    stopPlayback();

    audioContextRef.current = new AudioContext();
    startTimeRef.current = audioContextRef.current.currentTime;

    setCurrentColumn(startColumn);

    const activeNotes = collectActiveNotes();

    const columnsPerSecond = settings.tempo / 20;
    const noteDuration = 0.2;
    const currentTime = audioContextRef.current.currentTime;

    activeNotes.forEach(([row, col]) => {
      if (col < startColumn) return;

      const noteStartTime = currentTime + (col - startColumn) / columnsPerSecond;

      const osc = scheduleNote(
        audioContextRef.current!,
        row,
        middleCPosition,
        noteStartTime,
        {
          frequency: settings.frequency,
          oscillatorType: settings.oscillatorType as OscillatorType,
          duration: noteDuration,
          gain: 1,
        }
      );

      oscillatorsRef.current.push(osc);
    });

    setIsPlaying(true);

    animationFrameRef.current = requestAnimationFrame(() => {
      if (audioContextRef.current) {
        const elapsedTime = (audioContextRef.current.currentTime - startTimeRef.current);
        updateCurrentColumn(elapsedTime);
      }
    });
  }, [isPlaying, stopPlayback, setCurrentColumn, startColumn, collectActiveNotes, settings.frequency, settings.tempo, settings.oscillatorType, updateCurrentColumn, middleCPosition]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      oscillatorsRef.current.forEach(osc => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // Ignore errors if oscillator is already stopped
        }
      });
      oscillatorsRef.current = [];

      if (audioContextRef.current) {
        audioContextRef.current.close().catch(e => console.error('Error closing audio context:', e));
        audioContextRef.current = null;
      }
    };
  }, []);

  // Calculate progress for display
  const maxCol = getMaxColumn();
  const progress = isPlaying && maxCol > startColumn
    ? Math.min(100, Math.max(0, ((currentColumn - startColumn) / (maxCol - startColumn)) * 100))
    : 0;

  return (
    <div className="playback-panel">
      {/* Main play/stop button */}
      <button
        className={`playback-btn ${isPlaying ? 'playing' : ''}`}
        onClick={isPlaying ? stopPlayback : playComposition}
        title={isPlaying ? 'Stop playback' : 'Play composition'}
      >
        {isPlaying ? (
          <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" />
          </svg>
        ) : (
          <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="6,4 20,12 6,20" />
          </svg>
        )}
      </button>

      {/* Progress/status area */}
      <div className="playback-status">
        {isPlaying ? (
          <>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="status-text">Playing...</span>
          </>
        ) : (
          <span className="status-text hint">
            Click header row to set start position
          </span>
        )}
      </div>

      {/* Start position indicator */}
      <div className="start-indicator" title="Playback starts from this column">
        <span className="start-label">Start</span>
        <span className="start-value">{startColumn}</span>
      </div>

      {/* Reset button */}
      <button
        className="reset-btn"
        onClick={onReset}
        title="Clear all notes and reset start position"
        disabled={isPlaying}
      >
        <span className="reset-label">Reset</span>
        <svg className="reset-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>
    </div>
  );
};

// Add static method for setting starting column
PlayButton.setStartingColumn = (column: number) => {
  console.log('Static method called with column:', column);
};

export default PlayButton;
