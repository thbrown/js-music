// Define core types for the application

export interface GridSize {
  rows: number;
  cols: number;
}

export interface Settings {
  frequency: number;
  tempo: number;
  oscillatorType: string;
}

// Type for the note grid (2D array of numbers)
export type NoteGrid = number[][];

// Props for components
export interface MusicGridProps {
  noteGrid: NoteGrid;
  setNoteGrid: React.Dispatch<React.SetStateAction<NoteGrid>>;
  middleCPosition: number;
  setMiddleCPosition: React.Dispatch<React.SetStateAction<number>>;
  settings: Settings;
  gridSize: GridSize;
  notesPerMeasure: number;
  setGridSize: React.Dispatch<React.SetStateAction<GridSize>>;
  setNotesPerMeasure: React.Dispatch<React.SetStateAction<number>>;
  resetGrid: () => void;
}

export interface ControlsProps {
  onControlChange: (newSettings: Settings) => void;
}

export interface FileImportExportProps {
  noteGrid: NoteGrid;
  gridSize: GridSize;
  notesPerMeasure: number;
  settings: Settings;
  middleCPosition: number;
  setMiddleCPosition: React.Dispatch<React.SetStateAction<number>>;
  currentKey: number;
  setCurrentKey: React.Dispatch<React.SetStateAction<number>>;
  isMinor: boolean;
  setIsMinor: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface ExportCodeProps {
  noteGrid: NoteGrid;
  settings: Settings;
}

export interface PlayButtonProps {
  noteGrid: NoteGrid;
  setCurrentColumn: React.Dispatch<React.SetStateAction<number>>;
  settings: Settings;
  currentColumn: number;
  startColumn: number;
  setStartColumn: React.Dispatch<React.SetStateAction<number>>;
  middleCPosition: number;
  onReset: () => void;
}
