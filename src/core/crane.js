/**
 * Crane (Mechanical Arm) System
 *
 * Handles the swinging mechanical arm that carries floors
 */

import { performanceConfig } from '../config/performance_config.js';

export class Crane {
  constructor() {
    this.position = { x: 0, y: 10 };
    this.amplitude = 3.0;
    this.angularVelocity = 2.0;
    this.noiseRange = 0.2;
    this.time = 0;
    this.noise = 0;
    this.noiseUpdateInterval = 0.5;
    this.noiseTimer = 0;
    this.currentFloor = null;

    this.difficultyMultiplier = performanceConfig.getDifficultyConfig().craneSpeedMultiplier;
  }

  /**
   * Update crane position based on physics formula
   * X_arm(t) = 0 + A·sin(ω·t) + Noise(t)
   * 摆动中心固定在 x=0，不受楼层位置影响
   *
   * @param {number} deltaTime - Time step
   * @param {number} prevFloorY - Previous floor Y position
   * @param {number} instabilityFactor - Instability multiplier (1.0 - 2.0)
   */
  update(deltaTime, prevFloorY, instabilityFactor = 1.0) {
    this.time += deltaTime;
    this.noiseTimer += deltaTime;

    if (this.noiseTimer >= this.noiseUpdateInterval) {
      this.noise = (Math.random() - 0.5) * this.noiseRange * 2;
      this.noiseTimer = 0;
    }

    const dynamicAngularVelocity = this.angularVelocity * instabilityFactor * this.difficultyMultiplier;
    this.position.x = 0 + this.amplitude * Math.sin(dynamicAngularVelocity * this.time) + this.noise;

    this.position.y = prevFloorY + 8;
  }

  /**
   * Release the current floor
   */
  releaseFloor() {
    const floor = this.currentFloor;
    this.currentFloor = null;
    return floor;
  }

  /**
   * Attach a new floor to the crane
   */
  attachFloor(floor) {
    this.currentFloor = floor;
  }

  /**
   * Update difficulty parameters based on current phase
   */
  updateDifficulty(params) {
    this.amplitude = params.amplitude;
    this.angularVelocity = params.angularVelocity;
    // Update noise range (stored as half range for random calculation)
    this.noiseRange = params.noiseRange;
  }
}
