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
import { AudioManager } from '../assets/audio_manager.js';
import { SettingsManager } from '../ui/settings.js';
import { SNAKE_WOBBLE, VERTICAL_OSCILLATION, LANDING_ROTATION } from '../../config/physics_params.js';

// 楼层显示缩放比例
const FLOOR_DISPLAY_SCALE = 0.6;

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
    this.hp = 3;  // 生命值系统
    this.maxHp = 3;

    // Snake wobble state (cumulative offset based wobble)
    this.snakeWobbleTime = 0;
    this.accumulatedOffset = 0;

    // Instability jitter state (high instability visual effect)
    this.jitterTime = 0;  // Timer for jitter updates
    this.jitterOffset = { x: 0, y: 0, rotation: 0 };  // Current jitter offset

    // Game systems
    this.crane = new Crane();
    this.sceneManager = new SceneManager(canvas);
    this.cameraController = new CameraController(this.sceneManager.camera);
    this.judgmentSystem = new JudgmentSystem();
    this.comboSystem = new ComboSystem();
    this.phaseManager = new PhaseManager();
    this.audioManager = new AudioManager();
    this.settingsManager = new SettingsManager(this.audioManager);
    this.bgmStarted = false;

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
      } else if (e.code === 'KeyT' && !this.isPaused) {
        // 测试模式：快速添加 10 层
        this.addTestFloors(10);
      } else if (e.code === 'Digit1') {
        // 跳到第 5 层（测试 Phase 1）
        this.jumpToFloor(5);
      } else if (e.code === 'Digit2') {
        // 跳到第 20 层（测试 Phase 2）
        this.jumpToFloor(20);
      } else if (e.code === 'Digit3') {
        // 跳到第 40 层（测试 Phase 3）
        this.jumpToFloor(40);
      } else if (e.code === 'Digit4') {
        // 跳到第 65 层（测试 Phase 4）
        this.jumpToFloor(65);
      } else if (e.code === 'Digit5') {
        // 跳到第 100 层（测试 Phase 5）
        this.jumpToFloor(100);
      } else if (e.code === 'Digit6') {
        // 跳到第 125 层（测试 Phase 6）
        this.jumpToFloor(125);
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
    console.log('Loading assets...');

    // Load textures first
    this.sceneManager.loadFloorTexture(() => {
      console.log('Assets loaded, starting game...');
      this.isRunning = true;

      // Place first floor at ground center
      this.placeFirstFloor();

      // Start game loop
      this.lastTime = performance.now();
      this.gameLoop();
    });
  }

  /**
   * Place the first floor (id = 0)
   */
  placeFirstFloor() {
    // 地基位置：画面底部 1/5 位置（相机范围 -10 到 10，总高度 20）
    const groundY = -10 + 20 * 0.2; // = -6
    const firstFloor = new Floor(0, { x: 0, y: groundY }, 4.0, 0.5, 1);
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

    // Update crane difficulty based on current phase
    const difficultyParams = this.phaseManager.getDifficultyParams(phase);
    this.crane.updateDifficulty(difficultyParams);

    const newFloor = new Floor(
      this.currentFloorId,
      { x: prevFloor.position.x, y: prevFloor.position.y + 5 },
      4.0,
      4.0,
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
    // Start background music on first interaction (browser autoplay policy)
    if (!this.bgmStarted) {
      this.audioManager.playBGM('assets/audio/BGM.mp3', 0.3);
      this.bgmStarted = true;
      console.log('Background music started');
    }

    const floor = this.crane.releaseFloor();
    if (!floor) return;

    // Set floor position to crane position
    floor.position.x = this.crane.position.x;

    // Get previous floor for judgment
    const prevFloor = this.floors[this.floors.length - 1];

    // Dual judgment system: relative position + absolute overlap
    // 1. Relative position judgment (tracking visual position)
    const towerTopVisualX = this.getTowerTopVisualPosition();
    const relativeOffset = Math.abs(this.crane.position.x - towerTopVisualX);

    // Calculate average instability of top 5 floors for judgment strictness
    let avgInstability = 0;
    if (this.floors.length >= 5) {
      const topFloors = this.floors.slice(-5);
      avgInstability = topFloors.reduce((sum, f) => sum + (f.instability || 0), 0) / topFloors.length;
    } else if (this.floors.length > 0) {
      avgInstability = this.floors.reduce((sum, f) => sum + (f.instability || 0), 0) / this.floors.length;
    }

    const relativeResult = Physics.calculateOverlapByOffset(relativeOffset, prevFloor.width, avgInstability);

    // 2. Absolute overlap judgment (physical reasonableness)
    const absoluteResult = Physics.calculateOverlap(floor, prevFloor);

    // 3. Take the worse grade of the two
    const finalGrade = this.getWorseGrade(relativeResult.grade, absoluteResult.grade);

    // Debug logging
    console.log(`[Judgment] Relative: ${relativeResult.grade} (offset: ${relativeOffset.toFixed(3)}), Absolute: ${absoluteResult.grade} (overlap: ${absoluteResult.overlap_width.toFixed(3)}), Instability: ${avgInstability.toFixed(1)}, Final: ${finalGrade}`);

    const judgment = this.judgmentSystem.judge(finalGrade, floor, prevFloor);

    // Update combo
    this.comboSystem.update(judgment.grade);

    // Update score
    this.score += judgment.points;

    // Handle Miss judgment - floor falls
    if (judgment.grade === 'Miss') {
      this.handleMissFloor(floor);
      return;
    }

    // Calculate offset for landing rotation (use logical position offset)
    const logicalOffset = floor.position.x - prevFloor.position.x;

    // Apply landing rotation (impact rotation when landing)
    // Rotation direction: left offset = counter-clockwise (negative), right offset = clockwise (positive)
    // Contact point: if floor lands on left, pivot is on right edge; if lands on right, pivot is on left edge

    // 改变初始条件：从"大角度+零速度"改为"零角度+大速度"
    // 楼层从水平状态开始，但有很大的旋转动量，产生"砸下"的冲击感

    // Calculate instability factor for landing rotation amplification
    const prevInstability = prevFloor ? (prevFloor.instability || 0) : 0;
    const instabilityFactor = Physics.calculateInstabilityFactor(prevInstability);

    floor.landingRotation = 0;  // 水平着地（无初始倾斜）
    floor.landingRotationVelocity = logicalOffset * LANDING_ROTATION.SENSITIVITY * instabilityFactor;  // 放大旋转速度
    floor.landingRotationStable = false;

    // Calculate contact point for pivot rotation
    // If logicalOffset > 0 (lands on right), contact point is on left edge (-W/2)
    // If logicalOffset < 0 (lands on left), contact point is on right edge (+W/2)
    floor.landingContactPointX = logicalOffset > 0 ? -floor.width / 2 : floor.width / 2;

    // Initialize rotation offset (will be calculated in updateFloorLandingRotations)
    floor.landingRotationOffset = { x: 0, y: 0 };

    // Apply vertical impact (downward push when landing)
    // This creates the bounce effect
    floor.verticalVelocity = VERTICAL_OSCILLATION.INITIAL_IMPACT;

    // Also apply smaller impact to floors below (propagate impact)
    const impactPropagationCount = Math.min(VERTICAL_OSCILLATION.PROPAGATION_LAYERS, this.floors.length);
    for (let i = 0; i < impactPropagationCount; i++) {
      const floorIndex = this.floors.length - 1 - i;
      const impactedFloor = this.floors[floorIndex];
      const propagationFactor = 1.0 - (i / impactPropagationCount); // Decay with distance
      impactedFloor.verticalVelocity += VERTICAL_OSCILLATION.INITIAL_IMPACT * propagationFactor * VERTICAL_OSCILLATION.PROPAGATION_STRENGTH;
    }

    // Set floor Y position to stack on top of previous floor
    // Sprite 基于中心点定位，需要考虑两个楼层的半高
    floor.position.y = prevFloor.position.y + (prevFloor.height + floor.height) * FLOOR_DISPLAY_SCALE / 2;

    // Update sprite position
    if (floor.sprite) {
      floor.sprite.position.x = floor.position.x;
      floor.sprite.position.y = floor.position.y;
    }

    // Add floor to tower
    this.floors.push(floor);

    // Center of mass collapse disabled - using difficulty scaling instead
    // const collapseResult = Physics.checkCollapse(this.floors);
    // if (collapseResult.collapse) {
    //   this.handleCollapse(collapseResult.breakPoint);
    //   return;
    // }

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
    floor.position.y = prevFloor.position.y + (prevFloor.height + floor.height) * FLOOR_DISPLAY_SCALE / 2;

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
   * Handle tower collapse (已废弃 - 移除质心倒塌机制)
   */
  // handleCollapse(breakPoint) {
  //   console.log('Tower collapsed at floor', breakPoint);
  //   this.gameOver();
  // }

  /**
   * Game over
   */
  gameOver() {
    this.isRunning = false;
    console.log('Game Over! Final score:', this.score, 'Floors:', this.floors.length);

    this.settingsManager.saveGameRecord(this.score, this.floors.length);

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
    this.hp = this.maxHp;  // 重置 HP
    this.bgmStarted = false;
    this.fallingFloor = null;  // 重置掉落楼层

    // Reset tower sway
    this.towerSwayAngle = 0;
    this.towerSwayVelocity = 0;

    // Reset snake wobble state
    this.snakeWobbleTime = 0;
    this.accumulatedOffset = 0;

    // Reset instability jitter state
    this.jitterTime = 0;
    this.jitterOffset = { x: 0, y: 0, rotation: 0 };

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

    // Restart game loop
    this.lastTime = performance.now();
    this.gameLoop();
  }

  /**
   * Update camera to follow tower
   */
  updateUI() {
    document.getElementById('score-display').textContent = `Score: ${this.score}`;
    document.getElementById('floor-count').textContent = `Floor: ${this.floors.length}`;

    // 更新 HP 显示
    const hpDisplay = document.getElementById('hp-display');
    if (hpDisplay) {
      hpDisplay.textContent = `HP: ${this.hp}`;
    }
  }

  /**
   * 测试方法：快速添加多层楼
   */
  addTestFloors(count) {
    console.log(`测试模式：快速添加 ${count} 层`);
    for (let i = 0; i < count; i++) {
      const prevFloor = this.floors[this.floors.length - 1];
      const phase = this.phaseManager.getCurrentPhase(this.floors.length);
      const newFloor = new Floor(
        this.currentFloorId,
        {
          x: prevFloor.position.x,
          y: prevFloor.position.y + (prevFloor.height + 4.0) * FLOOR_DISPLAY_SCALE / 2
        },
        4.0,
        4.0,
        phase
      );
      newFloor.isStable = true;
      this.floors.push(newFloor);
      this.sceneManager.addFloor(newFloor);
      this.currentFloorId++;
    }
    this.prepareNextFloor();
    this.updateUI();
    console.log(`当前楼层：${this.floors.length}`);
  }

  /**
   * 测试方法：跳到指定楼层
   */
  jumpToFloor(targetFloor) {
    console.log(`测试模式：跳到第 ${targetFloor} 层`);
    const currentFloors = this.floors.length;
    if (targetFloor > currentFloors) {
      this.addTestFloors(targetFloor - currentFloors);
    }
  }

  /**
   * Get tower top visual position (including all visual offsets)
   * Used for relative position judgment
   *
   * @returns {number} Tower top visual X position
   */
  getTowerTopVisualPosition() {
    if (this.floors.length === 0) return 0;

    const topFloor = this.floors[this.floors.length - 1];

    // Logical position
    let visualX = topFloor.position.x;

    // Add snake wobble offset
    visualX += topFloor.snakeWobbleOffset?.x || 0;

    // Add landing rotation offset
    visualX += topFloor.landingRotationOffset?.x || 0;

    return visualX;
  }

  /**
   * Get the worse grade between two judgment grades
   * Used for dual judgment system (relative + absolute)
   *
   * @param {string} grade1 - First grade ('Perfect', 'Great', 'Okay', 'Miss')
   * @param {string} grade2 - Second grade
   * @returns {string} The worse grade
   */
  getWorseGrade(grade1, grade2) {
    const gradeOrder = { 'Perfect': 0, 'Great': 1, 'Okay': 2, 'Miss': 3 };
    return gradeOrder[grade1] > gradeOrder[grade2] ? grade1 : grade2;
  }

  /**
   * Calculate instability factor based on top 5 floors alignment
   * Returns a multiplier (1.0 - 2.0) based on how well aligned the top floors are
   */
  calculateInstabilityFactor() {
    if (this.floors.length < 5) return 1.0;

    // Get top 5 floors
    const topFloors = this.floors.slice(-5);

    // Calculate average absolute offset from center (x=0)
    const avgOffset = topFloors.reduce((sum, floor) => {
      return sum + Math.abs(floor.position.x);
    }, 0) / topFloors.length;

    // Convert to instability factor (1.0 - 2.0) - 加强权重
    // avgOffset = 0 → factor = 1.0 (perfect alignment)
    // avgOffset = 1.0 → factor = 1.5 (moderate misalignment)
    // avgOffset = 2.0 → factor = 2.0 (severe misalignment, wobble doubles)
    const factor = 1.0 + Math.min(avgOffset / 2.0, 1.0) * 1.0;

    return factor;
  }

  /**
   * Apply sway visuals using snake wobble effect
   * Each floor has independent phase, creating a snake-like twisting motion
   */
  applySwayVisuals() {
    if (this.floors.length === 0) return;

    this.floors.forEach((floor, index) => {
      if (!floor.sprite) return;

      // 新手保护：前2层（index 0-1）不应用任何晃动和偏移效果
      if (index < 2) {
        floor.sprite.rotation.z = 0;
        floor.sprite.position.x = floor.position.x;
        floor.sprite.position.y = floor.position.y;
        return;
      }

      // Base position and rotation (landing rotation)
      const landingRotation = floor.landingRotation || 0;
      const landingOffsetX = floor.landingRotationOffset?.x || 0;
      const landingOffsetY = floor.landingRotationOffset?.y || 0;

      // Snake wobble offset
      const snakeOffsetX = floor.snakeWobbleOffset?.x || 0;
      const snakeRotation = floor.snakeWobbleOffset?.rotation || 0;

      // Apply combined effects
      floor.sprite.rotation.z = landingRotation + snakeRotation;
      floor.sprite.position.x = floor.position.x + landingOffsetX + snakeOffsetX;
      floor.sprite.position.y = floor.position.y + landingOffsetY;

      // Apply instability jitter effect (only to top 5 floors)
      if (index >= this.floors.length - 5) {
        floor.sprite.position.x += this.jitterOffset.x;
        floor.sprite.position.y += this.jitterOffset.y;
        floor.sprite.rotation.z += this.jitterOffset.rotation;
      }
    });
  }

  /**
   * Update vertical oscillation for all floors
   * Creates bounce effect when floors land
   */
  updateFloorOscillations(deltaTime) {
    this.floors.forEach((floor, index) => {
      if (!floor.sprite) return;

      // 新手保护：前2层（index 0-1）不产生垂直振荡
      if (index < 2) {
        floor.verticalOffset = 0;
        floor.verticalVelocity = 0;
        floor.isStable = true;
        return;
      }

      // Skip if floor is already stable and has no oscillation
      if (floor.isStable && Math.abs(floor.verticalOffset) < 0.001) return;

      // Update oscillation physics
      const result = Physics.updateFloorVerticalOscillation(floor, deltaTime);
      floor.verticalOffset = result.offset;
      floor.verticalVelocity = result.velocity;

      // Mark as stable if oscillation has stopped
      if (result.isStable) {
        floor.isStable = true;
      }

      // Apply vertical offset to sprite
      floor.sprite.position.y = floor.position.y + floor.verticalOffset;
    });
  }

  /**
   * Update landing rotation for all floors
   * Creates impact rotation effect when floors land
   */
  updateFloorLandingRotations(deltaTime) {
    this.floors.forEach((floor, index) => {
      if (!floor.sprite) return;

      // 新手保护：前2层（index 0-1）不产生着陆旋转
      if (index < 2) {
        floor.landingRotation = 0;
        floor.landingRotationVelocity = 0;
        floor.landingRotationStable = true;
        floor.landingRotationOffset = { x: 0, y: 0 };
        return;
      }

      // Skip if floor rotation is already stable
      if (floor.landingRotationStable) return;

      // Update landing rotation physics
      const result = Physics.updateFloorLandingRotation(floor, deltaTime);
      floor.landingRotation = result.rotation;
      floor.landingRotationVelocity = result.velocity;

      // Mark as stable if rotation has stopped
      if (result.isStable) {
        floor.landingRotationStable = true;
      }

      // Calculate position offset for pivot rotation around contact point
      // When rotating around a point other than center, the center position needs to shift
      const contactPointX = floor.landingContactPointX;
      const contactPointY = -floor.height / 2; // Bottom of the floor
      const angle = floor.landingRotation;

      // Calculate how much the center moves when rotating around contact point
      // Using rotation matrix: new_pos = contact_point + R(angle) * (center - contact_point)
      // Simplified: offset = contact_point * (1 - cos(angle)) - perpendicular * sin(angle)
      const dx = contactPointX * (1 - Math.cos(angle)) - contactPointY * Math.sin(angle);
      const dy = contactPointX * Math.sin(angle) + contactPointY * (1 - Math.cos(angle));

      // Store the offset for later use (will be combined with sway offset)
      floor.landingRotationOffset.x = -dx;
      floor.landingRotationOffset.y = -dy;

      // Note: Rotation and position will be applied in applySwayVisuals() to combine with sway effects
    });
  }

  /**
   * Update instability jitter effect (high instability visual feedback)
   * Creates random trembling when instability is high
   */
  updateInstabilityJitter(deltaTime) {
    this.jitterTime += deltaTime;

    // Update jitter every 0.1 seconds
    if (this.jitterTime >= 0.1) {
      this.jitterTime = 0;

      // Calculate average instability from top 5 floors (user preference)
      const topFloors = this.floors.slice(-5);
      const avgInstability = topFloors.reduce((sum, f) => sum + (f.instability || 0), 0) / topFloors.length;

      // Only apply jitter when instability > 60 (user preference)
      if (avgInstability > 60) {
        const jitterIntensity = (avgInstability - 60) / 40;  // 0.0 to 1.0

        this.jitterOffset.x = (Math.random() - 0.5) * 0.04 * jitterIntensity;
        this.jitterOffset.y = (Math.random() - 0.5) * 0.02 * jitterIntensity;
        this.jitterOffset.rotation = (Math.random() - 0.5) * 0.02 * jitterIntensity;
      } else {
        this.jitterOffset.x = 0;
        this.jitterOffset.y = 0;
        this.jitterOffset.rotation = 0;
      }
    }
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

    // Update tower visuals and physics
    if (this.floors.length > 0) {
      // Update snake wobble effect
      if (SNAKE_WOBBLE.ENABLED) {
        // Update snake wobble time
        this.snakeWobbleTime += deltaTime;

        // Get current phase and base wobble parameters
        const phase = this.phaseManager.getCurrentPhase(this.floors.length);
        const difficultyParams = this.phaseManager.getDifficultyParams(phase);

        // Calculate instability factor based on top 5 floors alignment
        const instabilityFactor = this.calculateInstabilityFactor();

        // Calculate dynamic wobble parameters
        // Final = Base (from phase) × Instability Factor (from alignment)
        const dynamicAmplitude = SNAKE_WOBBLE.AMPLITUDE * difficultyParams.wobbleAmplitude * instabilityFactor;
        const dynamicFrequency = SNAKE_WOBBLE.FREQUENCY * difficultyParams.wobbleFrequency * instabilityFactor;

        // Calculate accumulated offset
        this.accumulatedOffset = Physics.calculateAccumulatedOffset(
          this.floors,
          SNAKE_WOBBLE.WINDOW_SIZE
        );

        // Calculate snake wobble offset for each floor
        this.floors.forEach((floor, index) => {
          // 新手保护：前2层（index 0-1）减弱蛇形扭动效果（30%强度）
          const protectionFactor = index < 2 ? 0.3 : 1.0;

          const wobbleOffset = Physics.calculateSnakeWobbleOffset(
            index,
            this.floors.length,
            this.accumulatedOffset,
            this.snakeWobbleTime,
            {
              amplitude: dynamicAmplitude,
              frequency: dynamicFrequency,
              phaseDelta: SNAKE_WOBBLE.PHASE_DELTA
            }
          );

          // 应用保护系数
          floor.snakeWobbleOffset = {
            x: wobbleOffset.x * protectionFactor,
            rotation: wobbleOffset.rotation * protectionFactor
          };
        });

        // Debug logging (every 5 floors)
        if (this.floors.length % 5 === 0 && Math.abs(this.accumulatedOffset) > 0.01) {
          console.log(`[Snake Wobble] Floors: ${this.floors.length}, Phase: ${phase}, InstabilityFactor: ${instabilityFactor.toFixed(2)}, DynamicAmp: ${dynamicAmplitude.toFixed(2)}, DynamicFreq: ${dynamicFrequency.toFixed(2)}, AccumulatedOffset: ${this.accumulatedOffset.toFixed(3)}`);
        }
      }

      // Apply visual effects
      this.applySwayVisuals();

      // Update vertical oscillation for all floors
      this.updateFloorOscillations(deltaTime);

      // Update landing rotation for all floors
      this.updateFloorLandingRotations(deltaTime);

      // Update instability jitter effect
      this.updateInstabilityJitter(deltaTime);
    }

    // Update crane position with instability factor
    const prevFloor = this.floors[this.floors.length - 1];
    const instabilityFactor = this.calculateInstabilityFactor();
    this.crane.update(deltaTime, prevFloor.position.y, instabilityFactor);

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

      this.fallingFloor = null;

      // 扣除 1 HP
      this.hp--;
      this.updateUI();

      // 检查是否 Game Over
      if (this.hp <= 0) {
        this.gameOver();
      } else {
        // HP > 0，继续游戏
        this.prepareNextFloor();
      }
    }
  }

  /**
   * Render the scene
   */
  render() {
    this.sceneManager.render();
  }
}
