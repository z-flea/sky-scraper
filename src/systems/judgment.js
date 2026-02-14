/**
 * Judgment System
 *
 * Handles floor placement judgment and scoring
 */

export class JudgmentSystem {
  constructor() {
    // 方案 B1：温和增强不稳定度惩罚（+50%）
    // Great: 5 → 8, Okay: 20 → 30
    this.judgmentRules = {
      Perfect: { points: 10, instabilityChange: -10 },
      Great: { points: 5, instabilityChange: 8 },
      Okay: { points: 3, instabilityChange: 30 },
      Miss: { points: 0, instabilityChange: 0 }
    };
  }

  /**
   * Judge floor placement and apply effects
   */
  judge(grade, currentFloor, previousFloor) {
    const rule = this.judgmentRules[grade];

    if (!rule) {
      console.error('Invalid judgment grade:', grade);
      return { grade: 'Miss', points: 0 };
    }

    // Apply instability change
    currentFloor.instability += rule.instabilityChange;

    // Perfect judgment: magnetic correction
    if (grade === 'Perfect') {
      currentFloor.position.x = previousFloor.position.x;
      console.log('Perfect! Magnetic correction applied');
    }

    // Miss judgment: game over
    if (grade === 'Miss') {
      console.log('Miss! Game Over');
    }

    return {
      grade,
      points: rule.points
    };
  }
}
