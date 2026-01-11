import React, { useRef, useState } from 'react';
import './FileImportExport.css';
import { FileImportExportProps, GridSize, NoteGrid, Settings } from '../types';

const DEFAULT_SONG_NAME = 'My Composition';

interface GridData {
  songName: string;
  activeNotes: [number, number, number][]; // [row, col, duration]
  gridSize: GridSize;
  notesPerMeasure: number;
  version: string;
  settings: Settings;
  middleCPosition: number;
  currentKey?: number;
  isMinor?: boolean;
  timestamp: string;
}

const FileImportExport: React.FC<FileImportExportProps> = ({
  noteGrid,
  gridSize,
  notesPerMeasure,
  settings,
  middleCPosition,
  currentKey,
  setCurrentKey,
  isMinor,
  setIsMinor,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [songName, setSongName] = useState<string>(DEFAULT_SONG_NAME);

  // Export grid data to a JSON file
  const exportGrid = () => {
    try {
      // Collect note starts with duration: [row, col, duration]
      const activeNotes: [number, number, number][] = [];
      for (let row = 1; row < noteGrid.length; row++) {
        if (noteGrid[row]) {
          for (let col = 0; col < noteGrid[row].length; col++) {
            const cellValue = noteGrid[row][col];
            // Only collect note starts (value > 0), skip continuations (-1) and empty (0)
            if (cellValue > 0) {
              activeNotes.push([row, col, cellValue]);
            }
          }
        }
      }

      // Use default name if empty
      const finalSongName = songName.trim() || DEFAULT_SONG_NAME;

      // Create a compact data object with only necessary information
      const gridData: GridData = {
        songName: finalSongName,
        activeNotes,
        gridSize,
        notesPerMeasure,
        version: '4.0', // Version 4.0 supports key/minor settings
        settings,
        middleCPosition,
        currentKey,
        isMinor,
        timestamp: new Date().toISOString()
      };

      // Convert to JSON string without pretty-printing
      const jsonString = JSON.stringify(gridData);
      
      // Create a blob with the JSON data
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const noteCount = activeNotes.length;
      const sanitizedName = finalSongName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      link.download = `${sanitizedName}-notes-${noteCount}-${new Date().toISOString().slice(0, 10)}.json`;
      
      // Trigger the download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting grid:', error);
      alert('Failed to export grid. Please try again.');
    }
  };

  // Import grid data from a JSON file
  const importGrid = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      
      reader.onload = (e: ProgressEvent<FileReader>) => {
        try {
          if (!e.target?.result) {
            throw new Error('Failed to read file content');
          }
          
          const savedFileData = JSON.parse(e.target.result as string) as GridData;
          
          // Validate the imported data (only support new format)
          if (!savedFileData.activeNotes || !savedFileData.gridSize) {
            throw new Error('Invalid or unsupported grid data format');
          }
          
          // Reconstruct the noteGrid from activeNotes
          // Create a properly sized grid with all cells initialized to 0
          const reconstructedGrid: NoteGrid = [];
          for (let i = 0; i < savedFileData.gridSize.rows; i++) {
            reconstructedGrid[i] = [];
            for (let j = 0; j < savedFileData.gridSize.cols; j++) {
              reconstructedGrid[i][j] = 0;
            }
          }
          
          // Set active notes with duration support
          savedFileData.activeNotes.forEach((note) => {
            // Handle both old format [row, col] and new format [row, col, duration]
            const row = note[0];
            const col = note[1];
            const duration = note[2] ?? 1; // Default to 1 for old format files

            // Ensure the row and column are valid
            if (row >= 0 && row < savedFileData.gridSize.rows && col >= 0 && col < savedFileData.gridSize.cols) {
              // Set the start cell with duration
              reconstructedGrid[row][col] = duration;
              // Set continuation cells (-1) for multi-column notes
              for (let i = 1; i < duration; i++) {
                if (col + i < savedFileData.gridSize.cols) {
                  reconstructedGrid[row][col + i] = -1;
                }
              }
            }
          });
          
          localStorage.clear();
          localStorage.setItem('songName', JSON.stringify(savedFileData.songName));
          localStorage.setItem('musicGrid', JSON.stringify(reconstructedGrid));
          localStorage.setItem('gridSize', JSON.stringify(savedFileData.gridSize));
          localStorage.setItem('notesPerMeasure', JSON.stringify(savedFileData.notesPerMeasure));
          localStorage.setItem('settings', JSON.stringify(savedFileData.settings));
          localStorage.setItem('middleCPosition', JSON.stringify(savedFileData.middleCPosition));
          localStorage.setItem('currentKey', JSON.stringify(savedFileData.currentKey ?? 0));
          localStorage.setItem('isMinor', JSON.stringify(savedFileData.isMinor ?? false));
          window.location.reload();
        } catch (error) {
          console.error('Error parsing imported file:', error);
          alert('The selected file contains invalid grid data. Please select a valid export file.');
        }
      };
      
      reader.onerror = () => {
        alert('Failed to read the file. Please try again.');
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('Error importing grid:', error);
      alert('Failed to import grid. Please try again.');
    }
    
    // Reset the file input
    if (event.target) {
      event.target.value = '';
    }
  };

  // Trigger file input click
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="song-settings">
      <h3>Save to File</h3>
      <div className="song-settings-content">
        <div className="song-name-container">
          <label htmlFor="song-name">Song Name:</label>
          <input
            type="text"
            id="song-name"
            value={songName}
            onChange={(e) => setSongName(e.target.value)}
            placeholder="Enter song name"
            className="song-name-input"
          />
        </div>
        <div className="export-import-buttons">
          <button className="export-button" onClick={exportGrid} title="Export grid to file">
            Export
          </button>
          <button className="import-button" onClick={handleImportClick} title="Import grid from file">
            Import
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={importGrid}
            accept=".json"
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </div>
  );
};

export default FileImportExport;
