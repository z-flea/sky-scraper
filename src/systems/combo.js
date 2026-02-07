/**
 * Combo System
 *
 * Tracks consecutive successful placements and provides bonuses
 */

export class ComboSystem {
  constructor() {
    this.comboCount = 0;
    this.lastGrade = null;
  }

  /**
   * Update combo based on judgment grade
   */
  update(grade) {
    if (grade === 'Perfect' || grade === 'Great') {
      this.comboCount++;
      this.checkComboMilestones();
    } else {
      this.resetCombo();
    }

    this.lastGrade = grade;
  }

  /**
   * Check for combo milestones and apply bonuses
   */
  checkComboMilestones() {
    if (this.comboCount === 3) {
      console.log('3 Combo - Steady! Instability reduced by 50%');
      // TODO: Apply instability reduction
    } else if (this.comboCount === 5) {
      console.log('5 Combo - Reinforced! Next floor width +10%');
      // TODO: Apply width bonus
    } else if (this.comboCount === 10) {
      console.log('10 Combo - Architect! Miracle repair activated');
      // TODO: Align last 10 floors to center
    }
  }

  /**
   * Reset combo count
   */
  resetCombo() {
    if (this.comboCount > 0) {
      console.log('Combo broken at', this.comboCount);
    }
    this.comboCount = 0;
  }

  /**
   * Get current combo count
   */
  getComboCount() {
    return this.comboCount;
  }
}
