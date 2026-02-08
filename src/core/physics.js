/**
 * Physics System
 *
 * Handles collision detection, center of mass calculation, and collapse detection
 */

export class Physics {
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
   * Uses sliding window method (top 10 floors when available)
   */
  static checkCollapse(floors) {
    // Need at least 2 floors to check collapse (base + one on top)
    if (floors.length < 2) return { collapse: false };

    let floorsToCheck;
    let baseFloor;

    if (floors.length <= 10) {
      // 10 floors or less: check all floors except the base
      floorsToCheck = floors.slice(1); // All floors except floor 0
      baseFloor = floors[0]; // Base floor is floor 0
    } else {
      // More than 10 floors: check top 10 floors
      floorsToCheck = floors.slice(-10);
      baseFloor = floors[floors.length - 11];
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
   * Calculate stiffness based on floor count
   * Level 1-20: 0.4 (moderate stiffness for slower sway)
   * Level 100+: 0.1 (very flexible, like a tree branch)
   */
  static calculateStiffness(floorCount) {
    if (floorCount <= 20) return 0.4;
    if (floorCount >= 100) return 0.1;

    // Linear interpolation between 20 and 100 floors
    return 0.4 - ((floorCount - 20) * 0.3) / 80;
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

    // Use top 10 floors for CoM calculation (or all if less than 10)
    const floorsToCheck = floors.length <= 10 ? floors : floors.slice(-10);

    let totalMass = 0;
    let weightedX = 0;

    for (let floor of floorsToCheck) {
      totalMass += floor.mass;
      weightedX += floor.position.x * floor.mass;
    }

    const CoM = weightedX / totalMass;

    // Calculate offset from base floor center
    const baseFloor = floors.length <= 10 ? floors[0] : floors[floors.length - 11];
    const offset = CoM - baseFloor.position.x;

    return offset;
  }

  /**
   * Calculate target sway angle based on center of mass offset
   * The tower leans towards the direction of the center of mass
   *
   * @param {number} comOffset - Center of mass offset
   * @param {number} floorCount - Number of floors
   * @returns {number} Target angle in radians
   */
  static calculateTargetSwayAngle(comOffset, floorCount) {
    // Sensitivity: how much the tower leans per unit of CoM offset
    // Higher floors are more sensitive (less stable)
    let sensitivity = 0.15; // Base sensitivity

    if (floorCount > 20) {
      // Increase sensitivity as tower gets taller
      sensitivity = 0.15 + ((floorCount - 20) * 0.002);
      sensitivity = Math.min(0.35, sensitivity); // Cap at 0.35
    }

    return comOffset * sensitivity;
  }

  /**
   * Update tower sway physics (smooth transition to target angle)
   *
   * @param {number} currentAngle - Current sway angle (radians)
   * @param {number} currentVelocity - Current angular velocity
   * @param {number} targetAngle - Target sway angle based on CoM
   * @param {number} stiffness - Tower stiffness
   * @param {number} deltaTime - Time step
   * @returns {object} New angle and velocity
   */
  static updateTowerSway(currentAngle, currentVelocity, targetAngle, stiffness, deltaTime) {
    const damping = 0.08; // Damping coefficient

    // Spring force towards target angle
    const angleDiff = targetAngle - currentAngle;
    const acceleration = stiffness * angleDiff - damping * currentVelocity;

    // Update velocity and angle
    let newVelocity = currentVelocity + acceleration * deltaTime;
    let newAngle = currentAngle + newVelocity * deltaTime;

    return { angle: newAngle, velocity: newVelocity };
  }

  /**
   * Check if sway angle causes collapse
   *
   * @param {number} swayAngle - Current sway angle (radians)
   * @param {number} floorCount - Number of floors
   * @returns {object} Collapse result
   */
  static checkSwayCollapse(swayAngle, floorCount) {
    // Base threshold: 15 degrees (0.26 radians)
    let maxAngle = 0.26;

    // Decrease threshold as tower gets taller
    if (floorCount > 20) {
      maxAngle = 0.26 - ((floorCount - 20) * 0.001);
      // Minimum threshold: 7 degrees (0.12 radians) at 100+ floors
      maxAngle = Math.max(0.12, maxAngle);
    }

    if (Math.abs(swayAngle) > maxAngle) {
      return { collapse: true, reason: 'sway' };
    }

    return { collapse: false };
  }
}
