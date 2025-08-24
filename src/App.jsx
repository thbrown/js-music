import { useEffect, useState } from 'react'
import './App.css'
import Controls from './components/Controls'
import ExportCode from './components/ExportCode'
import FileImportExport from './components/FileImportExport'
import MusicGrid from './components/MusicGrid'

const DEFAULT_MIDDLE_C_POSITION = 13;
const DEFAULT_NOTES_PER_MEASURE = 8;
const DEFAULT_GRID_SIZE = { rows: 26, cols: 50 };

function App() {
  useEffect(() => {
    const savedGrid = localStorage.getItem('musicGrid');
    const savedGridSize = localStorage.getItem('gridSize');
    const savedNotesPerMeasure = localStorage.getItem('notesPerMeasure');
    const settings = localStorage.getItem('settings');
    const middleCPosition = localStorage.getItem('middleCPosition');

    if (savedGrid != null && savedGrid != 'undefined') {
      setNoteGrid(JSON.parse(savedGrid));
    }
    if (savedGridSize != null && savedGridSize != 'undefined') {
      setGridSize(JSON.parse(savedGridSize));
    }
    if (savedNotesPerMeasure != null && savedNotesPerMeasure != 'undefined') {
      setNotesPerMeasure(JSON.parse(savedNotesPerMeasure));
    }
    if (settings != null && settings != 'undefined') {
      setSettings(JSON.parse(settings));
    }
    if (middleCPosition != null && middleCPosition != 'undefined') {
      setMiddleCPosition(JSON.parse(middleCPosition));
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
  const [noteGrid, setNoteGrid] = useState(Array(DEFAULT_GRID_SIZE.rows).fill().map(() => Array(DEFAULT_GRID_SIZE.cols).fill(0)))
  
  // State for grid dimensions and middle C position
  const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE)
  const [notesPerMeasure, setNotesPerMeasure] = useState(DEFAULT_NOTES_PER_MEASURE)
  const [middleCPosition, setMiddleCPosition] = useState(DEFAULT_MIDDLE_C_POSITION);
  
  // State for control settings
  const [settings, setSettings] = useState({
    frequency: 440,
    tempo: 100,
    oscillatorType: 'sine'
  })

  // Handle control changes
  const handleControlChange = (newSettings) => {
    setSettings(newSettings)
  }

  // Reset the grid to default size and clear all notes
  const resetGrid = () => {
    // Reset to default grid size
    const newGrid = Array(DEFAULT_GRID_SIZE.rows).fill().map(() => Array(DEFAULT_GRID_SIZE.cols).fill(0));
    setNoteGrid(newGrid);
    setGridSize(DEFAULT_GRID_SIZE);
    setMiddleCPosition(DEFAULT_MIDDLE_C_POSITION);
    
    localStorage.setItem('musicGrid', JSON.stringify(newGrid));
    localStorage.setItem('gridSize', JSON.stringify(DEFAULT_GRID_SIZE));
    localStorage.setItem('middleCPosition', JSON.stringify(DEFAULT_MIDDLE_C_POSITION));
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
        <Controls onControlChange={handleControlChange} />
        <FileImportExport
          noteGrid={noteGrid}
          gridSize={gridSize}
          notesPerMeasure={notesPerMeasure}
          settings={settings}
          middleCPosition={middleCPosition}
          setMiddleCPosition={setMiddleCPosition}
        />
        <ExportCode 
          noteGrid={noteGrid} 
          settings={settings}
        />
      </div>
    </div>
  )
}

export default App
