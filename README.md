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

3. Deploy to GitHub Pages using one of these methods:

   **Option 1: Manual Deployment**
   - Copy all files from the `dist` folder to the `docs` folder in your repository:
     ```bash
     # Create docs folder if it doesn't exist
     mkdir -p docs
     # Copy dist contents to docs
     cp -r dist/* docs/
     ```
   - Commit and push the changes to your GitHub repository
   - Go to your repository settings on GitHub
   - Under "GitHub Pages", select the "main" branch and "/docs" folder as the source

   **Option 2: GitHub Actions (Automated)**
   - Create a `.github/workflows/deploy.yml` file with the following content:
     ```yml
     name: Deploy to GitHub Pages

     on:
       push:
         branches: [main]

     jobs:
       build-and-deploy:
         runs-on: ubuntu-latest
         steps:
           - name: Checkout
             uses: actions/checkout@v3

           - name: Set up Node.js
             uses: actions/setup-node@v3
             with:
               node-version: 16

           - name: Install dependencies
             run: npm ci

           - name: Build
             run: npm run build

           - name: Deploy to GitHub Pages
             uses: JamesIves/github-pages-deploy-action@v4
             with:
               folder: dist
               branch: gh-pages
     ```
   - Commit and push this file to your repository
   - GitHub Actions will automatically build and deploy your site
   - Go to your repository settings and ensure GitHub Pages is set to use the `gh-pages` branch

4. Your site will be available at: `https://yourusername.github.io/your-repo-name/`

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
