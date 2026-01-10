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

## Deployment to GitHub Pages

### Building the Project

1. Update the `vite.config.js` file to include your repository name as the base path:
   ```js
   export default defineConfig({
     plugins: [react()],
     base: '/your-repo-name/',  // Replace with your actual repository name
   })
   ```

2. Build the project:
   ```bash
   npm run build
   # or
   yarn build
   ```
   This will create a `dist` folder with the production build.
