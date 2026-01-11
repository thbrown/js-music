import { useEffect, useState } from 'react'
import './App.css'
import Controls from './components/Controls'
import ExportCode from './components/ExportCode'
import FileImportExport from './components/FileImportExport'
import KeyTranspose from './components/KeyTranspose'
import MusicGrid from './components/MusicGrid'
import { GridSize, NoteGrid, Settings } from './types'

const DEFAULT_MIDDLE_C_POSITION = 13;
const DEFAULT_NOTES_PER_MEASURE = 8;
const DEFAULT_GRID_SIZE: GridSize = { rows: 26, cols: 50 };

function App() {
  useEffect(() => {
    const savedGrid = localStorage.getItem('musicGrid');
    const savedGridSize = localStorage.getItem('gridSize');
    const savedNotesPerMeasure = localStorage.getItem('notesPerMeasure');
    const settings = localStorage.getItem('settings');
    const middleCPosition = localStorage.getItem('middleCPosition');
    const savedCurrentKey = localStorage.getItem('currentKey');
    const savedIsMinor = localStorage.getItem('isMinor');

    if (savedGrid != null && savedGrid !== 'undefined') {
      setNoteGrid(JSON.parse(savedGrid));
    }
    if (savedGridSize != null && savedGridSize !== 'undefined') {
      setGridSize(JSON.parse(savedGridSize));
    }
    if (savedNotesPerMeasure != null && savedNotesPerMeasure !== 'undefined') {
      setNotesPerMeasure(JSON.parse(savedNotesPerMeasure));
    }
    if (settings != null && settings !== 'undefined') {
      setSettings(JSON.parse(settings));
    }
    if (middleCPosition != null && middleCPosition !== 'undefined') {
      setMiddleCPosition(JSON.parse(middleCPosition));
    }
    if (savedCurrentKey != null && savedCurrentKey !== 'undefined') {
      setCurrentKey(JSON.parse(savedCurrentKey));
    }
    if (savedIsMinor != null && savedIsMinor !== 'undefined') {
      setIsMinor(JSON.parse(savedIsMinor));
    }
  }, []);

  /*
  useEffect(() => {
    async function setupRoom() {
      const room = joinRoom({ appId: "https://crooked-yams-web-rtc-default-rtdb.firebaseio.com", password: "some-top-secret-pswd" }, "djshdhsje", (error) => console.log("PIZZA join error", error));
      //console.log("PIZZA ROOM OCCUPANTS", await getOccupants("https://crooked-yams-web-rtc-default-rtdb.firebaseio.com", "djshdhsje"));
      console.log("PIZZA ROOM DATA", room);

      room.onPeerJoin(peerId => console.log(`PIZZA ${peerId} joined`));
      room.onPeerLeave(peerId => console.log(`PIZZA ${peerId} left`));
      const [sendDrink, getDrink, onDrinkProgress] = room.makeAction("drink");

      onDrinkProgress((percent, peerId, metadata) =>
        console.log(
          `PIZZA ${percent * 100}% done receiving ${metadata.filename} from ${peerId}`
        )
      )

      // listen for drinks sent to you
      getDrink((data, peerId) =>
          console.log(`PIZZA got a ${data.drink} with${data.withIce ? "" : "out"} ice from ${peerId}`),
      );

      try {
          // buy drink for a friend
          await sendDrink({ drink: "negroni", withIce: true }, null, null, (percent, peerId) => {console.log("PIZAZ PROGRESS A", percent, peerId)});

          // buy round for the house (second argument omitted)
          await sendDrink({ drink: "mezcal", withIce: false }, null, null, (percent, peerId) => {console.log("PIZZA PROGRESS B", percent, peerId)});
      } catch (error) {
          console.error("PIZZA Error buying drink", error);
      }
      console.log("PIZZA Drinks sent!!");
    }
    
    setupRoom();
  }, []);
  */

  // State for the note grid
  const [noteGrid, setNoteGrid] = useState<NoteGrid>(
    Array(DEFAULT_GRID_SIZE.rows).fill(null).map(() => Array(DEFAULT_GRID_SIZE.cols).fill(0))
  );
  
  // State for grid dimensions and middle C position
  const [gridSize, setGridSize] = useState<GridSize>(DEFAULT_GRID_SIZE);
  const [notesPerMeasure, setNotesPerMeasure] = useState<number>(DEFAULT_NOTES_PER_MEASURE);
  const [middleCPosition, setMiddleCPosition] = useState<number>(DEFAULT_MIDDLE_C_POSITION);
  
  // State for control settings
  const [settings, setSettings] = useState<Settings>({
    frequency: 440,
    tempo: 100,
    oscillatorType: 'sine'
  });

  // State for key/transpose settings
  const [currentKey, setCurrentKey] = useState<number>(0);
  const [isMinor, setIsMinor] = useState<boolean>(false);

  // Reset trigger - increment to trigger reset in child components
  const [resetTrigger, setResetTrigger] = useState<number>(0);

  // Handle control changes
  const handleControlChange = (newSettings: Settings) => {
    setSettings(newSettings);
  };

  // Reset the grid to default size and clear all notes
  const resetGrid = () => {
    // Reset to default grid size
    const newGrid = Array(DEFAULT_GRID_SIZE.rows).fill(null).map(() => Array(DEFAULT_GRID_SIZE.cols).fill(0));
    setNoteGrid(newGrid);
    setGridSize(DEFAULT_GRID_SIZE);
    setMiddleCPosition(DEFAULT_MIDDLE_C_POSITION);

    // Reset key settings
    setCurrentKey(0);
    setIsMinor(false);

    // Trigger reset in child components (Controls, KeyTranspose)
    setResetTrigger(prev => prev + 1);

    localStorage.setItem('musicGrid', JSON.stringify(newGrid));
    localStorage.setItem('gridSize', JSON.stringify(DEFAULT_GRID_SIZE));
    localStorage.setItem('middleCPosition', JSON.stringify(DEFAULT_MIDDLE_C_POSITION));
    localStorage.setItem('currentKey', JSON.stringify(0));
    localStorage.setItem('isMinor', JSON.stringify(false));
  };

  return (
    <div className="music-grid-app">
      <h1>"Vibe" Coder</h1>
      
      <div className="grid-wrapper">
        <MusicGrid 
          noteGrid={noteGrid}
          setNoteGrid={setNoteGrid} 
          middleCPosition={middleCPosition}
          setMiddleCPosition={setMiddleCPosition}
          settings={settings}
          gridSize={gridSize}
          notesPerMeasure={notesPerMeasure}
          setGridSize={setGridSize}
          setNotesPerMeasure={setNotesPerMeasure}
          resetGrid={resetGrid}
        />
      </div>
      
      <div className="controls-container">
        <Controls onControlChange={handleControlChange} resetTrigger={resetTrigger} />
        <KeyTranspose
          noteGrid={noteGrid}
          setNoteGrid={setNoteGrid}
          gridSize={gridSize}
          setGridSize={setGridSize}
          middleCPosition={middleCPosition}
          setMiddleCPosition={setMiddleCPosition}
          currentKey={currentKey}
          setCurrentKey={setCurrentKey}
          isMinor={isMinor}
          setIsMinor={setIsMinor}
        />
        <FileImportExport
          noteGrid={noteGrid}
          gridSize={gridSize}
          notesPerMeasure={notesPerMeasure}
          settings={settings}
          middleCPosition={middleCPosition}
          setMiddleCPosition={setMiddleCPosition}
          currentKey={currentKey}
          setCurrentKey={setCurrentKey}
          isMinor={isMinor}
          setIsMinor={setIsMinor}
        />
        <ExportCode 
          noteGrid={noteGrid} 
          settings={settings}
        />
      </div>
    </div>
  );
}

export default App;
