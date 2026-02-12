/**
 * Crane (Mechanical Arm) System
 *
 * Handles the swinging mechanical arm that carries floors
 */

export class Crane {
  constructor() {
    this.position = { x: 0, y: 10 }; // Starting position
    this.amplitude = 3.0; // Initial swing amplitude
    this.angularVelocity = 2.0; // Initial angular velocity (rad/s)
    this.noiseRange = 0.2; // Noise range (will be multiplied by 2 for [-range, +range])
    this.time = 0;
    this.noise = 0;
    this.noiseUpdateInterval = 0.5; // Update noise every 0.5s
    this.noiseTimer = 0;
    this.currentFloor = null; // Floor being carried
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

    // Update noise periodically
    if (this.noiseTimer >= this.noiseUpdateInterval) {
      this.noise = (Math.random() - 0.5) * this.noiseRange * 2; // Range: [-noiseRange, +noiseRange]
      this.noiseTimer = 0;
    }

    // Calculate arm position with dynamic angular velocity based on instability
    // Higher instability = faster swing = harder to track
    const dynamicAngularVelocity = this.angularVelocity * instabilityFactor;
    this.position.x = 0 + this.amplitude * Math.sin(dynamicAngularVelocity * this.time) + this.noise;

    // Update Y position to stay above the current floor
    // 吊臂应该在当前楼层上方，当前楼层在 prevFloorY + 5，所以吊臂在 prevFloorY + 8
    this.position.y = prevFloorY + 8; // 8 units above the previous floor (3 units above current floor)
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
