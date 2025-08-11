import { useState } from 'react'
import './App.css'
import Controls from './components/Controls'
import ExportCode from './components/ExportCode'
import MusicGrid from './components/MusicGrid'
import SongSettings from './components/SongSettings'



function App() {

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
  const [noteGrid, setNoteGrid] = useState(Array(26).fill().map(() => Array(250).fill(0)))
  
  // State for grid dimensions and middle C position
  const [gridSize, setGridSize] = useState({ rows: 26, cols: 250 })
  const [offset, setOffset] = useState(13)
  const [notesPerMeasure, setNotesPerMeasure] = useState(8)
  
  // State for control settings
  const [settings, setSettings] = useState({
    frequency: 440,
    tempo: 100,
    oscillatorType: 'sine'
  })

  // Handle note grid changes
  const handleNoteToggle = (newGrid) => {
    setNoteGrid(newGrid)
  }
  
  // Handle import
  const handleImport = (newGrid, newGridSize, newOffset, newNotesPerMeasure) => {
    // Create a completely new grid with proper structure
    const properlyStructuredGrid = [];
    
    // Initialize the grid with the correct dimensions
    for (let i = 0; i < newGridSize.rows; i++) {
      properlyStructuredGrid[i] = [];
      for (let j = 0; j < newGridSize.cols; j++) {
        // Copy values from the imported grid if they exist, otherwise use 0
        properlyStructuredGrid[i][j] = (newGrid[i] && newGrid[i][j] === 1) ? 1 : 0;
      }
    }
    
    // Force a clean state update by clearing the grid first
    setNoteGrid([])
    
    // Use setTimeout to ensure the state update happens in separate render cycles
    setTimeout(() => {
      // Apply the new grid data
      setNoteGrid(properlyStructuredGrid)
      setGridSize(newGridSize)
      setOffset(newOffset)
      setNotesPerMeasure(newNotesPerMeasure)
      
      // Save to localStorage to ensure persistence
      localStorage.setItem('musicGrid', JSON.stringify(properlyStructuredGrid))
      localStorage.setItem('gridSize', JSON.stringify(newGridSize))
      localStorage.setItem('offset', JSON.stringify(newOffset))
      localStorage.setItem('notesPerMeasure', JSON.stringify(newNotesPerMeasure))
      
      // Force a reload of the page to ensure everything is properly initialized
      window.location.reload();
    }, 50)
  }

  // Handle control changes
  const handleControlChange = (newSettings) => {
    setSettings(newSettings)
  }

  return (
    <div className="music-grid-app">
      <h1>Music Grid Composer</h1>
      
      <div className="grid-wrapper">
        <MusicGrid 
          onNoteToggle={handleNoteToggle} 
          oscillatorType={settings.oscillatorType}
          frequency={settings.frequency}
          tempo={settings.tempo}
        />
      </div>
      
      <div className="controls-container">
        <Controls onControlChange={handleControlChange} />
        <SongSettings
          noteGrid={noteGrid}
          gridSize={gridSize}
          offset={offset}
          notesPerMeasure={notesPerMeasure}
          onImport={handleImport}
        />
      </div>
      
      <ExportCode 
        noteGrid={noteGrid} 
        oscillatorType={settings.oscillatorType}
        frequency={settings.frequency}
        tempo={settings.tempo}
      />
    </div>
  )
}

export default App
