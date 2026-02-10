/**
 * Physics System
 *
 * Handles collision detection, center of mass calculation, and collapse detection
 */

import {
  TOWER_SWAY,
  VERTICAL_OSCILLATION,
  LANDING_ROTATION,
  calculateStiffness,
  calculateSensitivity,
  calculateCollapseThreshold
} from '../../config/physics_params.js';

export class Physics {
  /**
   * Calculate instability factor based on instability value
   * Higher instability amplifies visual effects
   *
   * @param {number} instability - Current instability value (0-100+)
   * @returns {number} Amplification factor (1.0 to 1.5)
   */
  static calculateInstabilityFactor(instability) {
    // Normalize instability to 0-1 range (assuming max 100)
    // 0 → 1.0 (normal)
    // 50 → 1.25 (amplify 25%)
    // 100+ → 1.5 (amplify 50%, conservative)
    const normalizedInstability = Math.min(instability / 100, 1.0);
    return 1.0 + normalizedInstability * 0.5;
  }

  /**
   * Calculate overlap between current floor and previous floor
   * Returns judgment grade and overlap width
   */
  static calculateOverlap(currentFloor, previousFloor) {
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

  /**
   * Calculate center of mass for a set of floors
   */
  static calculateLocalCenterOfMass(topFloors) {
    let totalMass = 0;
    let weightedX = 0;

    for (let floor of topFloors) {
      totalMass += floor.mass;
      weightedX += floor.position.x * floor.mass;
    }

    return weightedX / totalMass;
  }

  /**
   * Check if the tower should collapse
   * Uses sliding window method (top 5 floors when available)
   */
  static checkCollapse(floors) {
    // Need at least 2 floors to check collapse (base + one on top)
    if (floors.length < 2) return { collapse: false };

    let floorsToCheck;
    let baseFloor;

    if (floors.length <= 5) {
      // 5 floors or less: check all floors except the base
      floorsToCheck = floors.slice(1); // All floors except floor 0
      baseFloor = floors[0]; // Base floor is floor 0
    } else {
      // More than 5 floors: check top 5 floors
      floorsToCheck = floors.slice(-5);
      baseFloor = floors[floors.length - 6];
    }

    const CoM = Physics.calculateLocalCenterOfMass(floorsToCheck);
    const base_left = baseFloor.position.x - baseFloor.width / 2;
    const base_right = baseFloor.position.x + baseFloor.width / 2;

    if (CoM < base_left || CoM > base_right) {
      return { collapse: true, breakPoint: baseFloor.id };
    }

    return { collapse: false };
  }

  /**
   * Calculate the center of mass offset for the tower
   * Returns the horizontal offset from the base center
   *
   * @param {Array} floors - All floors in the tower
   * @returns {number} CoM offset (positive = right, negative = left)
   */
  static calculateTowerCenterOfMassOffset(floors) {
    if (floors.length === 0) return 0;

    // Use configured window size for CoM calculation
    const windowSize = TOWER_SWAY.WINDOW_SIZE;
    const floorsToCheck = floors.length <= windowSize ? floors : floors.slice(-windowSize);

    let totalMass = 0;
    let weightedX = 0;

    for (let floor of floorsToCheck) {
      totalMass += floor.mass;
      weightedX += floor.position.x * floor.mass;
    }

    const CoM = weightedX / totalMass;

    // Calculate offset from base floor center
    const baseFloor = floors.length <= windowSize ? floors[0] : floors[floors.length - windowSize - 1];
    const offset = CoM - baseFloor.position.x;

    return offset;
  }

  /**
   * Calculate target sway angle based on center of mass offset
   * The tower leans towards the direction of the center of mass
   *
   * @param {number} comOffset - Center of mass offset
   * @param {number} floorCount - Number of floors
   * @param {number} instabilityFactor - Amplification factor from instability (default 1.0)
   * @returns {number} Target angle in radians
   */
  static calculateTargetSwayAngle(comOffset, floorCount, instabilityFactor = 1.0) {
    // Use configured sensitivity calculation
    const baseSensitivity = calculateSensitivity(floorCount);
    const sensitivity = baseSensitivity * instabilityFactor;  // Amplify sensitivity
    return comOffset * sensitivity;
  }

  /**
   * Update tower sway angle using spring-damper physics
   * Creates oscillation effect when tower is impacted
   *
   * @param {number} currentAngle - Current sway angle (radians)
   * @param {number} currentVelocity - Current angular velocity (radians/s)
   * @param {number} targetAngle - Target sway angle based on CoM offset
   * @param {number} deltaTime - Time step
   * @param {number} floorCount - Number of floors (affects stiffness)
   * @param {number} instabilityFactor - Amplification factor from instability (default 1.0)
   * @returns {object} New angle and velocity
   */
  static updateTowerSway(currentAngle, currentVelocity, targetAngle, deltaTime, floorCount, instabilityFactor = 1.0) {
    // Use configured stiffness and damping
    const stiffness = calculateStiffness(floorCount);
    const damping = TOWER_SWAY.DAMPING / instabilityFactor;  // Lower damping = more persistent sway

    // Calculate forces
    const displacement = targetAngle - currentAngle;
    const springForce = displacement * stiffness;
    const dampingForce = -currentVelocity * damping;

    // Total acceleration
    const acceleration = springForce + dampingForce;

    // Update velocity and angle using semi-implicit Euler integration
    const newVelocity = currentVelocity + acceleration * deltaTime;
    const newAngle = currentAngle + newVelocity * deltaTime;

    return { angle: newAngle, velocity: newVelocity };
  }

  /**
   * Update floor vertical oscillation (bounce effect)
   * Uses spring-damper physics for realistic bounce
   *
   * @param {Floor} floor - Floor object to update
   * @param {number} deltaTime - Time step
   * @returns {object} New vertical offset and velocity
   */
  static updateFloorVerticalOscillation(floor, deltaTime) {
    // Use configured vertical oscillation parameters
    const stiffness = VERTICAL_OSCILLATION.STIFFNESS;
    const damping = VERTICAL_OSCILLATION.DAMPING;

    // Target position is 0 (no offset)
    const displacement = 0 - floor.verticalOffset;
    const springForce = displacement * stiffness;
    const dampingForce = -floor.verticalVelocity * damping;

    // Total acceleration
    const acceleration = springForce + dampingForce;

    // Update velocity and offset
    const newVelocity = floor.verticalVelocity + acceleration * deltaTime;
    const newOffset = floor.verticalOffset + newVelocity * deltaTime;

    // Stop oscillation if amplitude is very small (stabilized)
    if (Math.abs(newOffset) < VERTICAL_OSCILLATION.STABILITY_OFFSET_THRESHOLD &&
        Math.abs(newVelocity) < VERTICAL_OSCILLATION.STABILITY_VELOCITY_THRESHOLD) {
      return { offset: 0, velocity: 0, isStable: true };
    }

    return { offset: newOffset, velocity: newVelocity, isStable: false };
  }

  /**
   * Check if sway angle causes collapse
   *
   * @param {number} swayAngle - Current sway angle (radians)
   * @param {number} floorCount - Number of floors
   * @returns {object} Collapse result
   */
  static checkSwayCollapse(swayAngle, floorCount) {
    // Use configured collapse threshold calculation
    const maxAngle = calculateCollapseThreshold(floorCount);

    if (Math.abs(swayAngle) > maxAngle) {
      return { collapse: true, reason: 'sway' };
    }

    return { collapse: false };
  }

  /**
   * Update floor landing rotation (impact rotation when landing)
   * Uses spring-damper physics for realistic rotation and quick stabilization
   *
   * @param {Floor} floor - Floor object to update
   * @param {number} deltaTime - Time step
   * @returns {object} New rotation angle and velocity
   */
  static updateFloorLandingRotation(floor, deltaTime) {
    // Use configured landing rotation parameters
    const stiffness = LANDING_ROTATION.STIFFNESS;
    const damping = LANDING_ROTATION.DAMPING;

    // Target rotation is 0 (no rotation)
    const displacement = 0 - floor.landingRotation;
    const springForce = displacement * stiffness;
    const dampingForce = -floor.landingRotationVelocity * damping;

    // Total acceleration
    const acceleration = springForce + dampingForce;

    // Update velocity and rotation
    const newVelocity = floor.landingRotationVelocity + acceleration * deltaTime;
    const newRotation = floor.landingRotation + newVelocity * deltaTime;

    // Stop rotation if amplitude is very small (stabilized)
    if (Math.abs(newRotation) < LANDING_ROTATION.STABILITY_ANGLE_THRESHOLD &&
        Math.abs(newVelocity) < LANDING_ROTATION.STABILITY_VELOCITY_THRESHOLD) {
      return { rotation: 0, velocity: 0, isStable: true };
    }

    return { rotation: newRotation, velocity: newVelocity, isStable: false };
  }
}
