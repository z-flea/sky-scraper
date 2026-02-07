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
