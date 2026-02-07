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

    this.camera.position.y = newY;
  }

  /**
   * Reset camera to initial position
   */
  reset() {
    this.camera.position.y = 0;
    this.targetY = 0;
  }
}
