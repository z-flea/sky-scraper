/**
 * Game Class
 *
 * Main game loop and state management
 */

import * as THREE from 'three';
import { Floor } from './floor.js';
import { Crane } from './crane.js';
import { Physics } from './physics.js';
import { SceneManager } from '../rendering/scene.js';
import { CameraController } from '../rendering/camera.js';
import { JudgmentSystem } from '../systems/judgment.js';
import { ComboSystem } from '../systems/combo.js';
import { PhaseManager } from '../systems/phase.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.isRunning = false;
    this.isPaused = false;

    // Game state
    this.floors = [];
    this.score = 0;
    this.currentFloorId = 0;
    this.fallingFloor = null;

    // Tower sway state (global physics)
    this.towerSwayAngle = 0;
    this.towerSwayVelocity = 0;

    // Game systems
    this.crane = new Crane();
    this.sceneManager = new SceneManager(canvas);
    this.cameraController = new CameraController(this.sceneManager.camera);
    this.judgmentSystem = new JudgmentSystem();
    this.comboSystem = new ComboSystem();
    this.phaseManager = new PhaseManager();

    // Timing
    this.lastTime = 0;

    // Input handling
    this.setupInputHandlers();
  }

  /**
   * Setup input event listeners
   */
  setupInputHandlers() {
    // Space or Left Click to release floor
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !this.isPaused) {
        this.releaseFloor();
      } else if (e.code === 'Escape') {
        this.togglePause();
      } else if (e.code === 'KeyR') {
        this.restart();
      }
    });

    this.canvas.addEventListener('click', () => {
      if (!this.isPaused) {
        this.releaseFloor();
      }
    });

    // Restart button
    const restartButton = document.getElementById('restart-button');
    if (restartButton) {
      restartButton.addEventListener('click', () => {
        this.restart();
      });
    }
  }

  /**
   * Start the game
   */
  start() {
    console.log('Game starting...');
    this.isRunning = true;

    // Place first floor at ground center
    this.placeFirstFloor();

    // Start game loop
    this.lastTime = performance.now();
    this.gameLoop();
  }

  /**
   * Place the first floor (id = 0)
   */
  placeFirstFloor() {
    const firstFloor = new Floor(0, { x: 0, y: 0 }, 4.0, 0.5, 1);
    firstFloor.isStable = true;
    this.floors.push(firstFloor);
    this.sceneManager.addFloor(firstFloor);
    this.currentFloorId = 1;

    // Prepare next floor on crane
    this.prepareNextFloor();
  }

  /**
   * Prepare next floor on the crane
   */
  prepareNextFloor() {
    const prevFloor = this.floors[this.floors.length - 1];
    const phase = this.phaseManager.getCurrentPhase(this.floors.length);
    const newFloor = new Floor(
      this.currentFloorId,
      { x: prevFloor.position.x, y: prevFloor.position.y + 5 },
      prevFloor.width,
      0.5,
      phase
    );
    this.crane.attachFloor(newFloor);

    // Add floor to scene immediately so it's visible while swinging
    this.sceneManager.addFloor(newFloor);
  }

  /**
   * Release floor from crane
   */
  releaseFloor() {
    const floor = this.crane.releaseFloor();
    if (!floor) return;

    // Set floor position to crane position
    floor.position.x = this.crane.position.x;

    // Get previous floor for judgment
    const prevFloor = this.floors[this.floors.length - 1];

    // Calculate judgment
    const result = Physics.calculateOverlap(floor, prevFloor);
    const judgment = this.judgmentSystem.judge(result.grade, floor, prevFloor);

    // Update combo
    this.comboSystem.update(judgment.grade);

    // Update score
    this.score += judgment.points;

    // Handle Miss judgment - floor falls
    if (judgment.grade === 'Miss') {
      this.handleMissFloor(floor);
      return;
    }

    // Note: Sway is now calculated based on real-time CoM, not triggered here

    // Set floor Y position to stack on top of previous floor
    floor.position.y = prevFloor.position.y + prevFloor.height;

    // Update sprite position
    if (floor.sprite) {
      floor.sprite.position.x = floor.position.x;
      floor.sprite.position.y = floor.position.y;
    }

    // Add floor to tower
    this.floors.push(floor);

    // Check for collapse
    const collapseResult = Physics.checkCollapse(this.floors);
    if (collapseResult.collapse) {
      this.handleCollapse(collapseResult.breakPoint);
      return;
    }

    // Check for sway collapse
    const swayCollapseResult = Physics.checkSwayCollapse(
      this.towerSwayAngle,
      this.floors.length
    );
    if (swayCollapseResult.collapse) {
      console.log('Tower collapsed due to excessive sway!');
      this.handleCollapse(this.floors.length - 1);
      return;
    }

    // Prepare next floor
    this.currentFloorId++;
    this.prepareNextFloor();

    // Update UI
    this.updateUI();
  }

  /**
   * Handle Miss judgment - floor falls
   */
  handleMissFloor(floor) {
    console.log('Miss! Floor is falling...');

    // Add floor to scene so we can see it fall
    if (!floor.sprite) {
      this.sceneManager.addFloor(floor);
    }

    // Set initial position
    const prevFloor = this.floors[this.floors.length - 1];
    floor.position.y = prevFloor.position.y + prevFloor.height;

    if (floor.sprite) {
      floor.sprite.position.x = floor.position.x;
      floor.sprite.position.y = floor.position.y;
    }

    // Create falling animation
    this.fallingFloor = {
      floor: floor,
      velocity: 0,
      gravity: 20
    };
  }

  /**
   * Handle tower collapse
   */
  handleCollapse(breakPoint) {
    console.log('Tower collapsed at floor', breakPoint);
    this.gameOver();
  }

  /**
   * Game over
   */
  gameOver() {
    this.isRunning = false;
    console.log('Game Over! Final score:', this.score, 'Floors:', this.floors.length);

    // Show game over overlay
    const gameOverOverlay = document.getElementById('game-over-overlay');
    const finalScore = document.getElementById('final-score');
    const finalFloors = document.getElementById('final-floors');

    if (gameOverOverlay && finalScore && finalFloors) {
      finalScore.textContent = this.score;
      finalFloors.textContent = this.floors.length;
      gameOverOverlay.classList.add('show');
    }
  }

  /**
   * Toggle pause
   */
  togglePause() {
    this.isPaused = !this.isPaused;
    console.log(this.isPaused ? 'Paused' : 'Resumed');
  }

  /**
   * Restart game
   */
  restart() {
    console.log('Restarting game...');

    // Hide game over overlay
    const gameOverOverlay = document.getElementById('game-over-overlay');
    if (gameOverOverlay) {
      gameOverOverlay.classList.remove('show');
    }

    // Reset game state
    this.floors = [];
    this.score = 0;
    this.currentFloorId = 0;
    this.isRunning = true;
    this.isPaused = false;

    // Reset tower sway
    this.towerSwayAngle = 0;
    this.towerSwayVelocity = 0;

    // Clear scene
    this.sceneManager.floorSprites.forEach(sprite => {
      this.sceneManager.scene.remove(sprite);
    });
    this.sceneManager.floorSprites = [];

    // Reset combo
    this.comboSystem.resetCombo();

    // Reset camera
    this.cameraController.reset();

    // Place first floor and start
    this.placeFirstFloor();

    // Update UI
    this.updateUI();
  }

  /**
   * Update camera to follow tower
   */
  updateUI() {
    document.getElementById('score-display').textContent = `Score: ${this.score}`;
    document.getElementById('floor-count').textContent = `Floor: ${this.floors.length}`;
  }

  /**
   * Apply sway visuals using pivot rotation
   * Floors below pivot: no rotation
   * Floors above pivot: increasing rotation (simulates bending)
   */
  applySwayVisuals() {
    if (this.floors.length === 0) return;

    // Determine pivot point: 10 floors down from top
    const pivotIndex = Math.max(0, this.floors.length - 10);

    this.floors.forEach((floor, index) => {
      if (!floor.sprite) return;

      if (index < pivotIndex) {
        // Below pivot: no rotation
        floor.sprite.rotation.z = 0;
      } else {
        // Above pivot: increasing rotation (simulates bending)
        const heightRatio = (index - pivotIndex) / 10;
        floor.sprite.rotation.z = this.towerSwayAngle * heightRatio;

        // Adjust position to simulate bending (increased for more visible effect)
        const bendOffset = Math.sin(this.towerSwayAngle) * heightRatio * 1.0;
        floor.sprite.position.x = floor.position.x + bendOffset;
      }
    });
  }

  /**
   * Main game loop
   */
  gameLoop() {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = currentTime;

    if (!this.isPaused) {
      this.update(deltaTime);
    }

    this.render();

    requestAnimationFrame(() => this.gameLoop());
  }

  /**
   * Update game state
   */
  update(deltaTime) {
    // Update falling floor if exists
    if (this.fallingFloor) {
      this.updateFallingFloor(deltaTime);
      return;
    }

    // Update tower sway physics based on real-time center of mass
    if (this.floors.length > 0) {
      // Calculate center of mass offset
      const comOffset = Physics.calculateTowerCenterOfMassOffset(this.floors);

      // Calculate target angle based on CoM offset
      const targetAngle = Physics.calculateTargetSwayAngle(comOffset, this.floors.length);

      // Calculate stiffness
      const stiffness = Physics.calculateStiffness(this.floors.length);

      // Update sway angle (smooth transition to target)
      const swayResult = Physics.updateTowerSway(
        this.towerSwayAngle,
        this.towerSwayVelocity,
        targetAngle,
        stiffness,
        deltaTime
      );
      this.towerSwayAngle = swayResult.angle;
      this.towerSwayVelocity = swayResult.velocity;

      // Apply pivot rotation visual effect
      this.applySwayVisuals();
    }

    // Update crane position
    const prevFloor = this.floors[this.floors.length - 1];
    this.crane.update(deltaTime, prevFloor.position.x, prevFloor.position.y);

    // Update crane floor position if attached
    if (this.crane.currentFloor) {
      this.crane.currentFloor.position.x = this.crane.position.x;

      // Update sprite position to match floor position
      if (this.crane.currentFloor.sprite) {
        this.crane.currentFloor.sprite.position.x = this.crane.currentFloor.position.x;
        this.crane.currentFloor.sprite.position.y = this.crane.currentFloor.position.y;
      }

      // Update crane visualization
      this.sceneManager.updateCrane(
        this.crane.position.x,
        this.crane.position.y,
        this.crane.currentFloor.position.y
      );
    }

    // Update camera to follow tower
    this.cameraController.update(this.floors);
  }

  /**
   * Update falling floor animation
   */
  updateFallingFloor(deltaTime) {
    const falling = this.fallingFloor;

    // Apply gravity
    falling.velocity += falling.gravity * deltaTime;
    falling.floor.position.y -= falling.velocity * deltaTime;

    // Update sprite position
    if (falling.floor.sprite) {
      falling.floor.sprite.position.y = falling.floor.position.y;
    }

    // Check if floor has fallen off screen
    if (falling.floor.position.y < -20) {
      // Remove floor from scene
      if (falling.floor.sprite) {
        this.sceneManager.scene.remove(falling.floor.sprite);
      }

      // Game over
      this.fallingFloor = null;
      this.gameOver();
    }
  }

  /**
   * Render the scene
   */
  render() {
    this.sceneManager.render();
  }
}
