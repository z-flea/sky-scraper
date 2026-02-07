# Sky Scraper (摩天大楼)

A physics-based tower stacking game built with Three.js.

## Project Structure

```
game3/
├── src/
│   ├── core/              # Core game logic
│   │   ├── floor.js       # Floor class
│   │   ├── crane.js       # Mechanical arm system
│   │   ├── physics.js     # Physics calculations
│   │   └── game.js        # Main game loop
│   ├── systems/           # Game systems
│   │   ├── judgment.js    # Judgment system
│   │   ├── combo.js       # Combo system
│   │   └── phase.js       # Phase progression
│   ├── rendering/         # Rendering
│   │   ├── scene.js       # Three.js scene setup
│   │   ├── camera.js      # Camera controller
│   │   └── effects.js     # Post-processing effects
│   ├── ui/                # User interface
│   │   ├── hud.js         # In-game UI
│   │   └── menu.js        # Menu system
│   ├── assets/            # Asset loading
│   │   ├── sprite_loader.js
│   │   └── audio_manager.js
│   └── main.js            # Entry point
├── assets/                # Asset files
│   ├── sprites/           # 2D sprite images
│   ├── textures/          # Texture atlases
│   ├── audio/             # Sound effects and music
│   └── fonts/             # Font files
├── index.html             # HTML entry point
├── package.json           # Dependencies
├── CLAUDE.md              # AI context documentation
├── 策划.md                # Game design document (Chinese)
└── README.md              # This file
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

### Development

Start the development server:
```bash
npm run dev
```

The game will be available at `http://localhost:5173` (or another port if 5173 is in use).

### Build

Build for production:
```bash
npm run build
```

The built files will be in the `dist/` directory.

## Controls

- **Space** or **Left Click**: Release floor
- **ESC**: Pause game
- **R**: Quick restart

## Game Mechanics

### Judgment System
- **Perfect** (< 5% offset): +100 points, magnetic correction, -10 instability
- **Great** (5-20% offset): +50 points, +5 instability
- **Okay** (20-50% offset): +10 points, +20 instability
- **Miss** (≥ 50% offset): Game over

### Combo System
- **3 Combo**: Reduces instability by 50%
- **5 Combo**: Next floor width +10%
- **10 Combo**: Miracle repair - aligns last 10 floors

### Phases
1. **City** (0-20 floors): Modern city theme
2. **Clouds** (21-50 floors): Art Deco style
3. **Stratosphere** (51-100 floors): Cyberpunk theme
4. **Orbit** (101-200 floors): Space station
5. **Interstellar** (200+ floors): Cosmic theme

## Development Status

✅ Project structure initialized
✅ Core game systems implemented (placeholder)
⏳ Art assets (using colored rectangles as placeholders)
⏳ Sound effects and music
⏳ Visual effects and polish

## Documentation

- [CLAUDE.md](CLAUDE.md) - Technical documentation for AI assistants
- [策划.md](策划.md) - Complete game design document (Chinese)

## License

MIT
