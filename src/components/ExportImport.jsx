import React, { useRef, useState } from 'react';
import './ExportImport.css';

const ExportImport = ({ noteGrid, gridSize, middleCPosition, notesPerMeasure, onImport }) => {
  const fileInputRef = useRef(null);
  const [songName, setSongName] = useState('My Composition');

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
      const finalSongName = songName.trim() || 'My Composition';
      
      // Create a compact data object with only necessary information
      const gridData = {
        songName: finalSongName,
        activeNotes,  // Only store active notes instead of entire grid
        gridSize,
        middleCPosition,
        notesPerMeasure,
        version: '2.0', // Updated version for new format
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
          const gridData = JSON.parse(e.target.result);
          
          // Validate the imported data (only support new format)
          if (!gridData.activeNotes || !gridData.gridSize || !gridData.middleCPosition) {
            throw new Error('Invalid or unsupported grid data format');
          }
          
          // Reconstruct the noteGrid from activeNotes
          const reconstructedGrid = Array(gridData.gridSize.rows).fill().map(() => Array(gridData.gridSize.cols).fill(0));
          
          // Set active notes
          gridData.activeNotes.forEach(([row, col]) => {
            if (reconstructedGrid[row]) {
              reconstructedGrid[row][col] = 1;
            }
          });
          
          // Update song name if available
          if (gridData.songName) {
            setSongName(gridData.songName);
          }
          
          // Pass the reconstructed data to the parent component
          onImport(
            reconstructedGrid,
            gridData.gridSize,
            gridData.middleCPosition,
            gridData.notesPerMeasure || 8
          );
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
    <div className="export-import-container">
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
  );
};

export default ExportImport;
