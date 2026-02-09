/**
 * Floor Class
 *
 * Represents a single floor in the tower
 */

import * as THREE from 'three';

export class Floor {
  constructor(id, position, width, height, phase) {
    this.id = id;
    this.position = position; // {x, y}
    this.width = width;
    this.height = height;
    this.mass = width * height; // Simple mass calculation
    this.instability = 0;
    this.sprite = null; // Will be set by rendering system
    this.phase = phase;
    this.isStable = false;

    // Vertical oscillation state (for bounce effect when landing)
    this.verticalOffset = 0; // Current vertical displacement
    this.verticalVelocity = 0; // Vertical velocity

    // Landing rotation state (for impact rotation when landing)
    this.landingRotation = 0; // Current rotation angle (radians)
    this.landingRotationVelocity = 0; // Rotation velocity
    this.landingRotationStable = true; // Whether rotation has stabilized
  }

  /**
   * Update floor state
   */
  update(deltaTime) {
    // Floor update logic will be implemented here
  }

  /**
   * Get floor bounds for collision detection
   */
  getBounds() {
    return {
      left: this.position.x - this.width / 2,
      right: this.position.x + this.width / 2,
      top: this.position.y + this.height / 2,
      bottom: this.position.y - this.height / 2
    };
  }
}
