import { useCallback, useEffect, useRef, useState } from 'react';
import './PlayButton.css';

const PlayButton = ({ noteGrid, setCurrentColumn, settings, currentColumn, startColumn }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef(null);
  const oscillatorsRef = useRef([]);
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(0);

  const colRef = useRef(currentColumn);

  // Optimized for performance

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

  // Use the grid dimensions instead of recalculating max column
  const getMaxColumn = useCallback(() => {
    let maxColumn = -1;
    for(const [_, col] of collectActiveNotes()) {
      maxColumn = Math.max(maxColumn, col);
    }
    return maxColumn;
  }, [collectActiveNotes]);
  
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
  }, [setCurrentColumn, startColumn]);
  
  // Update the current column based on elapsed time
  const updateCurrentColumn = useCallback((elapsedTime) => {
    // Calculate current column based on tempo (same conversion as in playComposition)
    const columnsPerSecond = settings.tempo / 20; // Convert tempo (BPM) to columns per second
    const column = Math.floor(elapsedTime * columnsPerSecond) + startColumn;
    console.log('Updating current column', elapsedTime, column, getMaxColumn());

    if (column !== colRef.current) {
      setCurrentColumn(column);
      colRef.current = column;
    }
    
    // Check if we've reached the end of the composition
    if (column > getMaxColumn() + 10) { // +10 to give some buffer after the last note // Maybe this should be one measure
      stopPlayback();
    } else {
      // Continue animation
      animationFrameRef.current = requestAnimationFrame(() => {
        const newElapsedTime = (audioContextRef.current.currentTime - startTimeRef.current);
        updateCurrentColumn(newElapsedTime);
      });
    }
  }, [getMaxColumn, stopPlayback, startColumn, settings.tempo, setCurrentColumn]);
  
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
    
    // Pre-calculate values that don't change for each note
    const baseFrequency = settings.frequency;
    const semitoneRatio = Math.pow(2, 1/12); // 12th root of 2 for semitone calculation
    const middleC = 13; // Middle C position
    const columnsPerSecond = settings.tempo / 20; // Convert tempo (BPM) to columns per second
    const noteDuration = 0.2; // Fixed note duration for now
    const currentTime = audioContextRef.current.currentTime;
    
    // Create and schedule oscillators
    activeNotes.forEach(([row, col]) => {
      // Skip notes before the start column
      if (col < startColumn) return;
      
      const osc = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      // Connect oscillator to gain node and gain node to destination
      osc.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      // Calculate frequency using equal temperament formula
      const semitoneOffset = middleC - row;
      osc.frequency.value = baseFrequency * Math.pow(semitoneRatio, semitoneOffset);
      
      // Set oscillator type
      osc.type = settings.oscillatorType;
      
      // Schedule start and stop times
      const startTime = (col - startColumn) / columnsPerSecond;
      
      osc.start(currentTime + startTime);
      osc.stop(currentTime + startTime + noteDuration);
      
      // Store oscillator for later cleanup
      oscillatorsRef.current.push(osc);
    });
    
    // Start animation to update current column
    setIsPlaying(true);
    
    // Start with a small delay to ensure UI updates first
    animationFrameRef.current = requestAnimationFrame(() => {
      const elapsedTime = (audioContextRef.current.currentTime - startTimeRef.current);
      updateCurrentColumn(elapsedTime);
    });
  }, [isPlaying, stopPlayback, setCurrentColumn, startColumn, collectActiveNotes, settings.frequency, settings.tempo, settings.oscillatorType, updateCurrentColumn]);
  
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
