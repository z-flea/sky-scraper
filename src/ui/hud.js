/**
 * HUD (Heads-Up Display)
 *
 * Manages in-game UI elements
 */

export class HUD {
  constructor() {
    this.scoreElement = document.getElementById('score-display');
    this.floorCountElement = document.getElementById('floor-count');
  }

  /**
   * Update score display
   */
  updateScore(score) {
    if (this.scoreElement) {
      this.scoreElement.textContent = `Score: ${score}`;
    }
  }

  /**
   * Update floor count display
   */
  updateFloorCount(count) {
    if (this.floorCountElement) {
      this.floorCountElement.textContent = `Floor: ${count}`;
    }
  }

  /**
   * Show judgment feedback
   */
  showJudgment(grade, position) {
    // TODO: Create and animate judgment text
    console.log('Judgment:', grade, 'at', position);
  }

  /**
   * Show combo notification
   */
  showCombo(count) {
    // TODO: Create and animate combo display
    console.log('Combo:', count);
  }
}
