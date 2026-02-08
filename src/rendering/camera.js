/**
 * Camera Controller
 *
 * Handles camera movement to follow the tower
 */

export class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.targetY = 0;
    this.smoothing = 0.1; // Camera smoothing factor
    this.shakeOffset = { x: 0, y: 0 };
    this.shakeTime = 0;
  }

  /**
   * Update camera position to follow tower
   */
  update(floors) {
    if (floors.length === 0) return;

    // Get the top floor
    const topFloor = floors[floors.length - 1];

    // Set target Y position to center on top floors
    this.targetY = topFloor.position.y;

    // Smooth camera movement
    const currentY = this.camera.position.y;
    const newY = currentY + (this.targetY - currentY) * this.smoothing;

    // Disable camera shake - only the building should sway, not the camera
    // this.calculateShake(floors);

    // Apply position without shake (camera stays stable)
    this.camera.position.x = 0;
    this.camera.position.y = newY;
  }

  /**
   * Calculate camera shake based on tower instability
   */
  calculateShake(floors) {
    // Calculate total instability from recent floors
    let totalInstability = 0;
    const recentFloors = floors.slice(-10); // Check last 10 floors

    for (let floor of recentFloors) {
      totalInstability += floor.instability || 0;
    }

    // Normalize instability (0-100 range)
    const normalizedInstability = Math.min(totalInstability / 100, 1.0);

    // Calculate shake intensity
    const shakeIntensity = normalizedInstability * 0.3; // Max shake of 0.3 units

    // Generate random shake offset
    if (shakeIntensity > 0.01) {
      this.shakeTime += 0.1;
      this.shakeOffset.x = Math.sin(this.shakeTime * 10) * shakeIntensity;
      this.shakeOffset.y = Math.cos(this.shakeTime * 8) * shakeIntensity * 0.5;
    } else {
      this.shakeOffset.x = 0;
      this.shakeOffset.y = 0;
      this.shakeTime = 0;
    }
  }

  /**
   * Reset camera to initial position
   */
  reset() {
    this.camera.position.x = 0;
    this.camera.position.y = 0;
    this.targetY = 0;
    this.shakeOffset = { x: 0, y: 0 };
    this.shakeTime = 0;
  }
}
