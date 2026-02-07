# Sky Scraper (摩天大楼) - AI Context Documentation

## Project Overview

**Sky Scraper** is a physics-based tower stacking game built with Three.js. Players must carefully time the release of building floors from a swinging mechanical arm to construct the tallest possible skyscraper while maintaining balance.

### Core Concept
- **Genre**: Physics Simulation / Stacking / Reaction Game
- **Platform**: PC Desktop only (Web-based Browser)
- **Dimension**: 2D game (using Three.js with OrthographicCamera for 2D rendering)
- **Tech Stack**: Three.js (2D rendering) + Custom lightweight physics engine
- **Target**: Casual players seeking quick, skill-based gameplay sessions (3-5 minutes)

## Technical Architecture

### Technology Stack
- **Rendering**: Three.js with OrthographicCamera (2D rendering in WebGL)
- **Physics**: Custom lightweight physics logic (not a full physics engine)
- **Language**: JavaScript/TypeScript
- **File Format**: PNG/WebP for 2D sprites and textures
- **Audio**: MP3 (BGM) / OGG (sound effects)

### Core Systems

#### 1. Floor Object Structure
```javascript
class Floor {
  id: number;              // Floor number (starting from 0)
  position: {x, y};        // 2D position (no z-axis)
  width: number;           // Floor width (game units)
  height: number;          // Floor thickness (fixed: 0.5)
  mass: number;            // Mass (affects center of mass)
  instability: number;     // Accumulated instability value
  sprite: THREE.Sprite;    // Three.js sprite object (2D)
  phase: number;           // Phase (1-5)
  isStable: boolean;       // Whether stabilized
}
```

#### 2. Mechanical Arm System
- **Motion Formula**: `X_arm(t) = X_prev_floor + A·sin(ω·t) + Noise(t)`
- **Key Feature**: Arm center tracks the top floor, forcing players to manually correct tilt
- **Parameters**:
  - Initial amplitude A₀ = 3.0
  - Initial angular velocity ω₀ = 2.0 rad/s
  - Noise range: [-0.2, +0.2], updates every 0.5s

#### 3. Judgment System
- **Perfect** (< 5% offset): +100 points, magnetic correction, -10 instability
- **Great** (5-20% offset): +50 points, +5 instability
- **Okay** (20-50% offset): +10 points, +20 instability
- **Miss** (≥ 50% offset): Game over

#### 4. Physics & Collapse
- **Sliding Window Method**: Only calculates center of mass for top 10 floors
- **Collapse Condition**: When local CoM exceeds base floor edges
- **Break Point**: Between 11th and 12th floors from top
- **Protection**: First 5 floors won't collapse (newbie protection)

#### 5. Combo System
- **3 Combo (Steady)**: Reduces instability by 50%
- **5 Combo (Reinforced)**: Next floor width +10%
- **10 Combo (Architect)**: Miracle repair - aligns last 10 floors to center

## Game Progression

### Phase System (5 Phases)
1. **Phase 1: City** (0-20 floors) - Modern city, slow speed, no interference
2. **Phase 2: Clouds** (21-50 floors) - Art Deco style, side wind
3. **Phase 3: Stratosphere** (51-100 floors) - Cyberpunk, variable speed
4. **Phase 4: Orbit** (101-200 floors) - Space station, low gravity
5. **Phase 5: Interstellar** (200+ floors) - Energy crystals, rotation chaos

### Difficulty Scaling
- Amplitude, angular velocity, and noise increase with phases
- Phase 5 introduces random rotation (±15°) during floor drop (2D plane rotation)

## Performance Optimization

### Rendering (2D Optimizations)
- **Sprite Batching**: Group similar sprites into batches to reduce draw calls
- **Texture Atlas**: Combine all floor sprites into texture atlases
- **Object Pool**: Pre-create 100 floor sprite objects, reuse
- **Culling**: Only render floors within visible viewport

### Physics
- Only calculate CoM for top 10 floors (sliding window)
- Stable floors (isStable = true) skip physics calculations
- Collision detection: Only check current falling floor vs top floor

### Memory
- Delete bottom floors after 200 floors (keep data for stats)
- Texture Atlas: All floor sprites in one 2048×2048 texture
- Progressive loading: Low-res first, then high-res

## Art Assets Summary

### 2D Sprites & Textures
- **Floor Sprites**: ~25 variants (one sprite per phase variant)
- **Crane System**: Arm sprite, cable sprite, hook sprite, base platform sprite
- **Environment**: Background layers (parallax scrolling), clouds, aurora, Earth, nebula

### Textures
- Floor Sprite Atlas: 2048×2048 (all floor sprites combined)
- Special Effects: Glow overlays, holographic effects, energy crystal animations
- UI Textures: Buttons, judgment text, plumb line, combo numbers

### Effects
- **Particles**: Judgment feedback (Perfect/Great/Okay), environment, collapse
- **Post-Processing**: Bloom, SSAO, color grading, vignette, chromatic aberration
- **Screen Effects**: Camera shake, slow motion, flash, radial blur

### Audio
- **Judgment SFX**: 4 types (Perfect/Great/Okay/Miss)
- **Environment SFX**: Arm swing, floor drop, collapse, combo
- **BGM**: 6 tracks (5 phases + main menu)

## Development Guidelines

### Code Organization
```
game3/
├── src/
│   ├── core/           # Core game logic
│   │   ├── Floor.js    # Floor class
│   │   ├── Crane.js    # Mechanical arm
│   │   ├── Physics.js  # Physics calculations
│   │   └── Game.js     # Main game loop
│   ├── systems/        # Game systems
│   │   ├── Judgment.js # Judgment system
│   │   ├── Combo.js    # Combo system
│   │   └── Phase.js    # Phase progression
│   ├── rendering/      # Rendering
│   │   ├── Scene.js    # Three.js scene setup
│   │   ├── Camera.js   # Camera controller
│   │   └── Effects.js  # Post-processing
│   ├── ui/             # User interface
│   │   ├── HUD.js      # In-game UI
│   │   └── Menu.js     # Menus
│   └── assets/         # Asset loading
│       ├── ModelLoader.js
│       └── AudioManager.js
├── assets/             # Asset files
│   ├── sprites/        # 2D sprite images
│   ├── textures/       # Texture atlases
│   ├── audio/
│   └── fonts/
├── 策划.md             # Game design document (Chinese)
└── CLAUDE.md           # This file
```

### Key Implementation Notes

#### 1. Collision Detection Algorithm
```javascript
function calculateOverlap(currentFloor, previousFloor) {
  const curr_left = currentFloor.position.x - currentFloor.width / 2;
  const curr_right = currentFloor.position.x + currentFloor.width / 2;
  const prev_left = previousFloor.position.x - previousFloor.width / 2;
  const prev_right = previousFloor.position.x + previousFloor.width / 2;

  const overlap_left = Math.max(curr_left, prev_left);
  const overlap_right = Math.min(curr_right, prev_right);
  const overlap_width = Math.max(0, overlap_right - overlap_left);

  const offset = Math.abs(currentFloor.position.x - previousFloor.position.x);
  const W = previousFloor.width;

  if (offset < 0.05 * W) return { grade: 'Perfect', overlap_width };
  if (offset < 0.20 * W) return { grade: 'Great', overlap_width };
  if (offset < 0.50 * W) return { grade: 'Okay', overlap_width };
  return { grade: 'Miss', overlap_width: 0 };
}
```

#### 2. Center of Mass Calculation
```javascript
function calculateLocalCenterOfMass(topFloors) {
  let totalMass = 0;
  let weightedX = 0;

  for (let floor of topFloors) {
    totalMass += floor.mass;
    weightedX += floor.position.x * floor.mass;
  }

  return weightedX / totalMass;
}

function checkCollapse(floors) {
  if (floors.length <= 10) return false;

  const topTen = floors.slice(-10);
  const baseFloor = floors[floors.length - 11];

  const CoM = calculateLocalCenterOfMass(topTen);
  const base_left = baseFloor.position.x - baseFloor.width / 2;
  const base_right = baseFloor.position.x + baseFloor.width / 2;

  if (CoM < base_left || CoM > base_right) {
    return { collapse: true, breakPoint: floors.length - 11 };
  }

  return { collapse: false };
}
```

### Edge Cases to Handle

1. **First Floor (id = 0)**
   - Place at ground center (x=0, y=0)
   - Auto-judge as Perfect
   - Use initial width W₀ = 4.0

2. **Boundary Values**
   - offset = 5.00% × W → Great (use >= rule)
   - offset = 20.00% × W → Okay
   - offset = 50.00% × W → Miss

3. **Combo Interruption**
   - Combo count resets to 0
   - Instability value persists (doesn't reset)
   - Temporary width bonus immediately expires

4. **Perfect Magnetic Correction**
   - Trigger: offset < 5% × W
   - Action: Force current floor x = prev_floor.position.x
   - Visual: Small "snap" animation (0.1s easing)
   - Physics: Completely eliminates offset, instability -10

5. **Phase 5 Rotation**
   - Floor rotates in 2D plane during drop
   - Rotation angle: Random ±15° (completes in 0.8s drop time)
   - Judgment: Use rotated bounding box for overlap calculation

## Balance Targets

### Player Skill Tiers
- **Newbie** (first playthrough): Reach Phase 2 (20 floors)
- **Casual** (familiar with mechanics): Reach Phase 3 (50 floors)
- **Skilled** (mastered rhythm): Reach Phase 4 (100 floors)
- **Expert** (combo mastery): Reach Phase 5 (150+ floors)
- **Theoretical Limit**: Infinite height (but exponentially harder)

### Key Metrics
- Average session: 3-5 minutes
- Perfect rate: Newbie 10-20%, Expert 40-60%
- Average combo: Newbie 2-3, Expert 5-8
- Collapse causes: 60% Miss, 30% CoM imbalance, 10% Phase 5 mechanics

## Controls

### Desktop (PC Only)
- **Left Click / Space**: Release floor
- **ESC**: Pause
- **R**: Quick restart
- **Mouse Wheel**: Zoom view (optional)

Note: This is a PC-only game. No mobile or gamepad support.

## Performance Targets

- **Frame Rate**: Stable 60 FPS on PC
- **Load Time**: First load < 3s, retry < 0.5s
- **Memory**: PC < 500MB
- **Network**: Offline playable (leaderboard requires network)
- **Asset Size**: ~30 MB total (~10 MB preload, reduced from 3D version)

## Important Notes for AI Assistants

### When Working on This Project

1. **This is a 2D Game Using Three.js**
   - Use OrthographicCamera, not PerspectiveCamera
   - Use Sprites or Planes, not 3D Meshes
   - All positioning is in 2D (x, y), no z-axis movement

2. **Physics is Custom, Not a Library**
   - Don't suggest using physics engines like Cannon.js or Ammo.js
   - The physics is intentionally simplified for gameplay feel
   - Focus on the sliding window CoM calculation

3. **Performance is Critical**
   - Always consider sprite batching and texture atlases
   - Avoid creating/destroying objects during gameplay
   - Use texture atlases, not individual textures

4. **Game Feel Over Realism**
   - The "magnetic correction" on Perfect is intentional
   - The sliding window (10 floors) is a gameplay choice, not a limitation
   - Phase 5 rotation is for difficulty, not realism

5. **PC Desktop Only**
   - No mobile optimization needed
   - No touch controls
   - Target modern desktop browsers (Chrome, Firefox, Edge)

6. **Refer to 策划.md for Details**
   - The Chinese planning document (策划.md) is the source of truth
   - This CLAUDE.md is a technical summary
   - When in doubt, check the planning document

### Common Pitfalls to Avoid

- ❌ Don't calculate CoM for all floors (only top 10)
- ❌ Don't use real physics for floor stacking (use custom logic)
- ❌ Don't create new floor objects every frame (use object pool)
- ❌ Don't load all phase assets at once (lazy load)
- ❌ Don't make the first 5 floors collapse (newbie protection)

### Recommended Development Order

1. **MVP (Phase 1 only)**
   - Basic floor dropping (2D sprites)
   - Judgment system
   - Simple collapse detection
   - Basic UI

2. **Alpha (All 5 phases)**
   - Phase progression
   - Combo system
   - Full 2D art assets
   - Sound effects

3. **Beta (Polish)**
   - Performance optimization
   - Visual effects (particles, post-processing)
   - Accessibility features
   - Leaderboards

## References

- **Planning Document**: [策划.md](策划.md) - Complete game design (Chinese)
- **Three.js Docs**: https://threejs.org/docs/
- **glTF Format**: https://www.khronos.org/gltf/

---

**Last Updated**: 2026-02-07
**Project Status**: Planning Complete, Ready for Development
**Primary Language**: Chinese (planning), English (code/comments)
