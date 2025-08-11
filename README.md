# React Music Grid

An interactive music grid application built with React that allows you to create and play musical sequences.

## Features

- Interactive grid for creating musical patterns
- Play button to hear your composition
- Shaded black keys for better visual reference
- Adjustable grid size (both notes and length)
- Persistent storage of your composition
- Reset button to clear all notes

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```
4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```
5. Open your browser and navigate to `http://localhost:5173`

## Testing the Features

### Black Key Shading

- The black keys (corresponding to the black keys on a piano) are now shaded with a grey color throughout the entire grid
- This makes it easier to visualize the piano keyboard layout
- Black keys appear in rows 1, 3, 6, 8, 11, 13, 15, 18, 20, and 23

### Grid Size Controls

- **Notes Control**: Use the "+" and "-" buttons next to "Notes:" to increase or decrease the number of available notes (vertical expansion)
- **Length Control**: Use the "+" and "-" buttons next to "Length:" to increase or decrease the length of the song (horizontal expansion)
- The grid will automatically adjust to the new dimensions while preserving your existing notes

### LocalStorage Persistence

- Your composition is automatically saved to the browser's localStorage
- To test this feature:
  1. Create a pattern on the grid
  2. Refresh the page
  3. Your pattern should still be visible on the grid
- The grid size settings are also saved, so your custom grid dimensions will persist

### Reset Button

- Click the "Reset Notes" button to clear all notes from the grid
- This will maintain your current grid size settings
- After resetting, the empty grid state will be saved to localStorage

## Development

This project is built with React and Vite. The main components are:

- `MusicGrid.jsx`: Handles the grid rendering and interaction
- `PlayButton.jsx`: Handles the audio playback
- `ExportCode.jsx`: Provides functionality to export your composition

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
