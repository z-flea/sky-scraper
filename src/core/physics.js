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
}
