import { useCallback, useState, useRef, useEffect } from 'react';
import './PlayButton.css';

const PlayButton = ({ noteGrid, oscillatorType, onColumnChange, tempo = 100, frequency = 440 }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentColumn, setCurrentColumn] = useState(-1);
  const [startColumn, setStartColumn] = useState(1); // Default start column is 1
  const audioContextRef = useRef(null);
  const oscillatorsRef = useRef([]);
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(0);
  
  // Update parent component when current column changes
  useEffect(() => {
    if (onColumnChange) {
      onColumnChange(currentColumn);
    }
  }, [currentColumn, onColumnChange]);

  // Find the maximum column in the grid
  const getMaxColumn = useCallback(() => {
    let maxCol = 0;
    for (let row = 1; row < noteGrid.length; row++) {
      if (noteGrid[row]) {
        for (let col = 0; col < noteGrid[row].length; col++) {
          if (noteGrid[row][col] && col > maxCol) {
            maxCol = col;
          }
        }
      }
    }
    return maxCol;
  }, [noteGrid]);

  // Collect active notes
  const collectActiveNotes = useCallback(() => {
    const activeNotes = [];
    // Use the actual grid dimensions instead of hardcoded values
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
  
  // Stop all playback and clean up
  const stopPlayback = useCallback(() => {
    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Stop and disconnect all oscillators
    oscillatorsRef.current.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Ignore errors if oscillator is already stopped
      }
    });
    oscillatorsRef.current = [];
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(e => console.error('Error closing audio context:', e));
      audioContextRef.current = null;
    }
    
    // Reset state
    setIsPlaying(false);
    setCurrentColumn(startColumn);
  }, [startColumn]);
  
  // Update the current column based on elapsed time
  const updateCurrentColumn = useCallback((elapsedTime) => {
    // Calculate current column based on tempo (same conversion as in playComposition)
    const columnsPerSecond = tempo / 20; // Convert tempo (BPM) to columns per second
    const column = Math.floor(elapsedTime * columnsPerSecond) + startColumn;
    setCurrentColumn(column);
    
    // Check if we've reached the end of the composition
    if (column > getMaxColumn() + 10) { // +10 to give some buffer after the last note
      stopPlayback();
    } else {
      // Continue animation
      animationFrameRef.current = requestAnimationFrame(() => {
        const newElapsedTime = (audioContextRef.current.currentTime - startTimeRef.current);
        updateCurrentColumn(newElapsedTime);
      });
    }
  }, [getMaxColumn, stopPlayback, startColumn, tempo]);
  
  // Function to play the composition
  const playComposition = useCallback(() => {
    // If already playing, do nothing
    if (isPlaying) return;
    
    // Stop any existing playback
    stopPlayback();
    
    // Create new audio context
    audioContextRef.current = new AudioContext();
    startTimeRef.current = audioContextRef.current.currentTime;
    
    // Set current column to starting column immediately
    setCurrentColumn(startColumn);
    
    // Collect active notes
    const activeNotes = collectActiveNotes();
    
    // Create and schedule oscillators
    activeNotes.forEach(([row, col]) => {
      // Skip notes before the start column
      if (col < startColumn) return;
      
      const osc = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      // Connect oscillator to gain node and gain node to destination
      osc.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      // Set oscillator properties
      // Use the frequency parameter as the base frequency for middle C (row 13)
      const baseFrequency = frequency;
      const semitoneRatio = Math.pow(2, 1/12); // 12th root of 2 for semitone calculation
      const middleC = 13; // Middle C position
      const semitoneOffset = middleC - row;
      
      // Calculate frequency using equal temperament formula
      osc.frequency.value = baseFrequency * Math.pow(semitoneRatio, semitoneOffset);
      
      if (oscillatorType && oscillatorType !== 'sine') {
        osc.type = oscillatorType;
      }
      
      // Schedule start and stop times - adjust for startColumn
      // Use tempo to calculate playback speed (higher tempo = faster playback)
      const columnsPerSecond = tempo / 20; // Convert tempo (BPM) to columns per second
      const startTime = (col - startColumn) / columnsPerSecond;
      const noteDuration = 0.2; // Fixed note duration for now
      
      osc.start(audioContextRef.current.currentTime + startTime);
      osc.stop(audioContextRef.current.currentTime + startTime + noteDuration);
      
      // Store oscillator for later cleanup
      oscillatorsRef.current.push(osc);
    });
    
    // Start animation to update current column
    setIsPlaying(true);
    
    // Start with a small delay to ensure UI updates first
    setTimeout(() => {
      animationFrameRef.current = requestAnimationFrame(() => {
        const elapsedTime = (audioContextRef.current.currentTime - startTimeRef.current);
        updateCurrentColumn(elapsedTime);
      });
    }, 50);
  }, [oscillatorType, isPlaying, collectActiveNotes, stopPlayback, updateCurrentColumn, startColumn, frequency, tempo]);
  
  // Set the starting column for playback
  const handleSetStartingColumn = useCallback((col) => {
    if (!isPlaying && col >= 1) {
      setStartColumn(col);
      setCurrentColumn(col);
    }
  }, [isPlaying]);
  
  // Expose the function to parent components
  PlayButton.setStartingColumn = handleSetStartingColumn;
  
  // Clean up on unmount - added after stopPlayback is defined
  useEffect(() => {
    return () => {
      // Cancel animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Stop and disconnect all oscillators
      oscillatorsRef.current.forEach(osc => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // Ignore errors if oscillator is already stopped
        }
      });
      oscillatorsRef.current = [];
      
      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(e => console.error('Error closing audio context:', e));
        audioContextRef.current = null;
      }
    };
  }, []);

  return (
    <div className="play-button-container">
      <div className="playback-controls">
        {!isPlaying ? (
          <button className="play-button" onClick={playComposition}>
            PLAY
          </button>
        ) : (
          <button className="stop-button" onClick={stopPlayback}>
            STOP
          </button>
        )}
      </div>
      <div className="column-controls">
        <span>Start Column: {startColumn}</span>
        <div className="current-column">Current Column: {currentColumn}</div>
      </div>
      <div className="column-info">
        <small>Click any column to set as starting position</small>
      </div>
    </div>
  );
};

export default PlayButton;
