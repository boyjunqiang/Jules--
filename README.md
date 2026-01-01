# Mini CS 3D Prototype
This is a simple web-based 3D FPS prototype inspired by Counter-Strike, built with [Three.js](https://threejs.org/).

## Features
- **3D Movement**: WASD to move, Mouse to look.
- **Shooting**: Left click to shoot. Raycasting hit detection.
- **Targets**: Red cubes act as enemies. They have health and disappear when destroyed.
- **Environment**: Procedurally placed crates and targets.
- **Collision**: Basic wall and floor collision detection.

## How to Run

### Prerequisites
- Node.js installed.

### Steps
1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Play**
   Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`).
   Click on the screen to capture the mouse and start playing. Press `Esc` to release the mouse.

## Controls
- **W, A, S, D**: Move
- **Space**: Jump
- **Mouse**: Look around
- **Left Click**: Shoot
- **Esc**: Pause / Release Mouse
