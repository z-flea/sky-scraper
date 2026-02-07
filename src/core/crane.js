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
    this.time = 0;
    this.noise = 0;
    this.noiseUpdateInterval = 0.5; // Update noise every 0.5s
    this.noiseTimer = 0;
    this.currentFloor = null; // Floor being carried
  }

  /**
   * Update crane position based on physics formula
   * X_arm(t) = X_prev_floor + A·sin(ω·t) + Noise(t)
   */
  update(deltaTime, prevFloorX, prevFloorY) {
    this.time += deltaTime;
    this.noiseTimer += deltaTime;

    // Update noise periodically
    if (this.noiseTimer >= this.noiseUpdateInterval) {
      this.noise = (Math.random() - 0.5) * 0.4; // Range: [-0.2, +0.2]
      this.noiseTimer = 0;
    }

    // Calculate arm position
    this.position.x = prevFloorX + this.amplitude * Math.sin(this.angularVelocity * this.time) + this.noise;

    // Update Y position to stay above the current floor
    this.position.y = prevFloorY + 5; // 5 units above the previous floor
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
}
