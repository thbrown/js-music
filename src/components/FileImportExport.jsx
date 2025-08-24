import React, { useRef, useState } from 'react';
import './FileImportExport.css';

const DEFAULT_SONG_NAME = 'My Composition';

const FileImportExport = ({ noteGrid, gridSize, notesPerMeasure, settings, middleCPosition }) => {
  const fileInputRef = useRef(null);
  const [songName, setSongName] = useState(DEFAULT_SONG_NAME);

  // Export grid data to a JSON file
  const exportGrid = () => {
    try {
      // Collect only active notes to make the export file smaller
      const activeNotes = [];
      for (let row = 1; row < noteGrid.length; row++) {
        if (noteGrid[row]) {
          for (let col = 0; col < noteGrid[row].length; col++) {
            if (noteGrid[row][col]) {
              activeNotes.push([row, col]);
            }
          }
        }
      }

      // Use default name if empty
      const finalSongName = songName.trim() || DEFAULT_SONG_NAME;
      
      // Create a compact data object with only necessary information
      const gridData = {
        songName: finalSongName,
        activeNotes,
        gridSize,
        notesPerMeasure,
        version: '2.0',
        settings,
        middleCPosition,
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
  const importGrid = (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const savedFileData = JSON.parse(e.target.result);
          
          // Validate the imported data (only support new format)
          if (!savedFileData.activeNotes || !savedFileData.gridSize) {
            throw new Error('Invalid or unsupported grid data format');
          }
          
          // Reconstruct the noteGrid from activeNotes
          // Create a properly sized grid with all cells initialized to 0
          const reconstructedGrid = [];
          for (let i = 0; i < savedFileData.gridSize.rows; i++) {
            reconstructedGrid[i] = [];
            for (let j = 0; j < savedFileData.gridSize.cols; j++) {
              reconstructedGrid[i][j] = 0;
            }
          }
          
          // Set active notes
          savedFileData.activeNotes.forEach(([row, col]) => {
            // Ensure the row and column are valid
            if (row >= 0 && row < savedFileData.gridSize.rows && col >= 0 && col < savedFileData.gridSize.cols) {
              reconstructedGrid[row][col] = 1;
            }
          });
          
          localStorage.clear();
          localStorage.setItem('songName', JSON.stringify(savedFileData.songName));
          localStorage.setItem('musicGrid', JSON.stringify(reconstructedGrid))
          localStorage.setItem('gridSize', JSON.stringify(savedFileData.gridSize))
          localStorage.setItem('notesPerMeasure', JSON.stringify(savedFileData.notesPerMeasure));
          localStorage.setItem('settings', JSON.stringify(savedFileData.settings));
          localStorage.setItem('middleCPosition', JSON.stringify(savedFileData.middleCPosition));
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
    event.target.value = null;
  };

  // Trigger file input click
  const handleImportClick = () => {
    fileInputRef.current.click();
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
