import { useEffect, useState } from 'react';
import './ExportCode.css';
import { ExportCodeProps } from '../types';

const ExportCode: React.FC<ExportCodeProps> = ({ 
  noteGrid, 
  settings 
}) => {
  const [exportCode, setExportCode] = useState<string>('');
  const { oscillatorType, frequency = 440, tempo = 100 } = settings;

  // Generate export code whenever the grid or settings change
  useEffect(() => {
    // Collect active notes using dynamic grid dimensions
    const activeNotes: [number, number][] = [];
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
    
    // Prepare data for export
    const noteRows: number[] = [];
    const noteCols: number[] = [];
    for (let i = 0; i < activeNotes.length; i++) {
      noteRows[i] = activeNotes[i][0];
      noteCols[i] = activeNotes[i][1];
    }
    
    // Generate the export code that exactly matches the PlayButton behavior
    let oscillatorTypeCode = '';
    if (oscillatorType && oscillatorType !== 'sine') {
      oscillatorTypeCode = `
      osc.type = '${oscillatorType}';`;
    }
    
    // Convert tempo to columns per second
    const columnsPerSecond = tempo / 20;
    
    const exportCode = `((ctx)=>{
      // Create audio context
      const startTime = ctx.currentTime;
      const startColumn = 1; // Default start column
      
      // Define active notes
      const noteRows = ${JSON.stringify(noteRows)};
      const noteCols = ${JSON.stringify(noteCols)};
      
      // Create and schedule oscillators
      noteRows.forEach((row, i) => {
        if (row) {
          const col = noteCols[i];
          
          // Skip notes before the start column
          if (col < startColumn) return;
          
          // Create oscillator and gain node
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          // Connect oscillator to gain node and gain node to destination
          osc.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          // Set oscillator properties
          // Use the frequency parameter as the base frequency for middle C (row 13)
          const baseFrequency = ${frequency};
          const semitoneRatio = Math.pow(2, 1/12); // 12th root of 2 for semitone calculation
          const middleC = 13; // Middle C position
          const semitoneOffset = middleC - row;
          
          // Calculate frequency using equal temperament formula
          osc.frequency.value = baseFrequency * Math.pow(semitoneRatio, semitoneOffset);${oscillatorTypeCode}
          
          // Schedule start and stop times - adjust for startColumn
          // Use tempo to calculate playback speed (higher tempo = faster playback)
          const noteStartTime = startTime + (col - startColumn) / ${columnsPerSecond};
          const noteDuration = 0.2; // Fixed note duration
          
          osc.start(noteStartTime);
          osc.stop(noteStartTime + noteDuration);
        }
      });
    })(new AudioContext())`;
    
    setExportCode(exportCode);
  }, [noteGrid, settings, oscillatorType, frequency, tempo]);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(exportCode)
      .then(() => {
        alert('Code copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  return (
    <div className="export-code">
      <h3>JavaScript Export Code</h3>
      <textarea 
        id="exportCode" 
        value={exportCode} 
        readOnly 
        placeholder="Your exportable JavaScript code will appear here"
      />
      <div className="export-buttons">
        <button onClick={handleCopyToClipboard} title="Copy to clipboard">
          Copy to Clipboard
        </button>
      </div>
    </div>
  );
};

export default ExportCode;
