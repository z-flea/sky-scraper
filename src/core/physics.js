/**
 * Physics System
 *
 * Handles collision detection, center of mass calculation, and collapse detection
 */

import {
  SNAKE_WOBBLE,
  VERTICAL_OSCILLATION,
  LANDING_ROTATION
} from '../../config/physics_params.js';

export class Physics {
  /**
   * Calculate accumulated offset using sliding window method
   * Returns the average offset of recent floors
   *
   * @param {Array} floors - All floors in the tower
   * @param {number} windowSize - Number of recent floors to consider (default 10)
   * @returns {number} Cumulative accumulated offset
   */
  static calculateAccumulatedOffset(floors, windowSize = 10) {
    if (floors.length <= 1) return 0;

    // Only consider recent windowSize floors
    const recentFloors = floors.slice(-Math.min(windowSize, floors.length));
    let totalOffset = 0;

    // Sum up offsets between adjacent floors
    for (let i = 1; i < recentFloors.length; i++) {
      const offset = recentFloors[i].position.x - recentFloors[i-1].position.x;
      totalOffset += offset;
    }

    // Return cumulative offset (not divided by floor count)
    const cumulativeOffset = totalOffset;

    // Clamp to max accumulated offset
    const maxOffset = SNAKE_WOBBLE.MAX_ACCUMULATED_OFFSET;
    return Math.max(-maxOffset, Math.min(maxOffset, cumulativeOffset));
  }

  /**
   * Calculate snake wobble offset for a specific floor
   * Each floor has independent phase, creating snake-like twisting motion
   *
   * @param {number} floorIndex - Floor index (0-based from bottom)
   * @param {number} totalFloors - Total number of floors
   * @param {number} accumulatedOffset - Accumulated offset from calculateAccumulatedOffset
   * @param {number} time - Current time (seconds)
   * @param {object} params - Wobble parameters {amplitude, frequency, phaseDelta}
   * @returns {object} {x: horizontal offset, rotation: rotation angle}
   */
  static calculateSnakeWobbleOffset(floorIndex, totalFloors, accumulatedOffset, time, params) {
    const { amplitude, frequency, phaseDelta } = params;

    // Phase = ωt + i×δ
    const phase = frequency * time + floorIndex * phaseDelta;

    // Horizontal offset
    const wobbleX = accumulatedOffset * amplitude * Math.sin(phase);

    // Rotation angle (based on adjacent floor offset difference)
    const wobbleRotation = accumulatedOffset * amplitude * Math.cos(phase) * phaseDelta;

    return { x: wobbleX, rotation: wobbleRotation };
  }

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
   * Calculate overlap by offset (for relative position judgment)
   * Returns judgment grade based on offset and base width
   *
   * @param {number} offset - Absolute offset between block and tower top
   * @param {number} baseWidth - Width of the base floor
   * @returns {object} {grade: 'Perfect'|'Great'|'Okay'|'Miss'}
   */
  static calculateOverlapByOffset(offset, baseWidth) {
    const W = baseWidth;

    if (offset < 0.05 * W) return { grade: 'Perfect' };
    if (offset < 0.20 * W) return { grade: 'Great' };
    if (offset < 0.50 * W) return { grade: 'Okay' };
    return { grade: 'Miss' };
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
