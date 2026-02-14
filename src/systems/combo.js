/**
 * Combo System
 *
 * 双系统设计：
 * 1. Combo 连击：只有连续 Perfect 才计数
 * 2. Perfect 时间窗口：独立的时间限定机制
 */

export class ComboSystem {
  constructor() {
    // Combo 连击系统（只计算连续 Perfect）
    this.perfectComboCount = 0;
    this.lastGrade = null;
    this.widthBonus = 0;

    // Perfect 时间窗口系统
    this.perfectWindowActive = false;
    this.perfectWindowTimeLeft = 0;
    this.perfectWindowDuration = 3.0; // 3 秒
  }

  /**
   * Update combo based on judgment grade
   * @param {string|null} grade - Judgment grade (null for time update only)
   * @param {number} deltaTime - Time since last update (for window countdown)
   * @returns {object} Combo update result with milestone info
   */
  update(grade, deltaTime = 0) {
    // 如果时间窗口激活，先更新倒计时
    if (this.perfectWindowActive && deltaTime > 0) {
      this.perfectWindowTimeLeft -= deltaTime;

      if (this.perfectWindowTimeLeft <= 0) {
        this.deactivatePerfectWindow();
      }
    }

    // 如果 grade 为 null，只是时间更新，不处理判定
    if (grade === null) {
      return {
        perfectComboCount: this.perfectComboCount,
        milestone: null,
        broken: false,
        perfectWindowActive: this.perfectWindowActive,
        perfectWindowTimeLeft: this.perfectWindowTimeLeft,
        overrideGrade: null
      };
    }

    // 处理判定
    if (grade === 'Miss') {
      // Miss 直接打破连击和时间窗口
      const wasBroken = this.perfectComboCount > 0 || this.perfectWindowActive;
      this.resetCombo();
      this.lastGrade = grade;

      return {
        perfectComboCount: 0,
        milestone: null,
        broken: wasBroken,
        perfectWindowActive: false,
        perfectWindowTimeLeft: 0,
        overrideGrade: null
      };
    }

    // 如果时间窗口激活，任何非 Miss 判定都算 Perfect（但会打断 combo）
    if (this.perfectWindowActive && grade !== 'Perfect') {
      console.log(`[Combo] Window active, grade=${grade}, breaking combo from ${this.perfectComboCount} to 0`);
      this.perfectWindowTimeLeft = this.perfectWindowDuration; // 重置时间窗口

      // Great/Okay 打断 combo 连击
      const wasBroken = this.perfectComboCount > 0;
      this.perfectComboCount = 0;
      this.widthBonus = 0;

      this.lastGrade = 'Perfect';
      return {
        perfectComboCount: 0, // combo 被打断，清零
        milestone: null,
        broken: wasBroken,
        perfectWindowActive: true,
        perfectWindowTimeLeft: this.perfectWindowTimeLeft,
        overrideGrade: 'Perfect' // 覆盖原判定为 Perfect（只影响显示和分数）
      };
    }

    // Perfect 判定：增加 combo 并激活/重置时间窗口
    if (grade === 'Perfect') {
      console.log(`[Combo] Perfect! combo before: ${this.perfectComboCount}, after: ${this.perfectComboCount + 1}`);
      this.perfectComboCount++;

      if (!this.perfectWindowActive) {
        this.activatePerfectWindow();
      } else {
        this.perfectWindowTimeLeft = this.perfectWindowDuration; // 重置时间窗口
      }

      const milestone = this.checkComboMilestones();

      this.lastGrade = grade;
      return {
        perfectComboCount: this.perfectComboCount,
        milestone: milestone,
        broken: false,
        perfectWindowActive: true,
        perfectWindowTimeLeft: this.perfectWindowTimeLeft,
        overrideGrade: null
      };
    } else {
      // Great 或 Okay：打破 combo，但不影响时间窗口
      const wasBroken = this.perfectComboCount > 0;
      this.perfectComboCount = 0;
      this.widthBonus = 0;

      this.lastGrade = grade;
      return {
        perfectComboCount: 0,
        milestone: null,
        broken: wasBroken,
        perfectWindowActive: this.perfectWindowActive,
        perfectWindowTimeLeft: this.perfectWindowTimeLeft,
        overrideGrade: null
      };
    }
  }

  /**
   * 激活 Perfect 时间窗口
   */
  activatePerfectWindow() {
    this.perfectWindowActive = true;
    this.perfectWindowTimeLeft = this.perfectWindowDuration;
    console.log('[Combo] Perfect window activated! Duration:', this.perfectWindowDuration, 's');
  }

  /**
   * 停用 Perfect 时间窗口
   */
  deactivatePerfectWindow() {
    this.perfectWindowActive = false;
    this.perfectWindowTimeLeft = 0;
    console.log('[Combo] Perfect window expired');
  }

  /**
   * Check for combo milestones and apply bonuses
   * @returns {object|null} Milestone info if reached
   */
  checkComboMilestones() {
    if (this.perfectComboCount === 3) {
      console.log('3 Perfect Combo - Steady! Instability reduced by 50%');
      return {
        type: 'steady',
        count: 3,
        name: 'STEADY',
        description: '不稳定性 -50%'
      };
    } else if (this.perfectComboCount === 5) {
      console.log('5 Perfect Combo - Reinforced! Next floor width +10%');
      this.widthBonus = 0.1;
      return {
        type: 'reinforced',
        count: 5,
        name: 'REINFORCED',
        description: '下一层宽度 +10%'
      };
    } else if (this.perfectComboCount === 10) {
      console.log('10 Perfect Combo - Architect! Miracle repair activated');
      return {
        type: 'architect',
        count: 10,
        name: 'ARCHITECT',
        description: '奇迹修复！'
      };
    }

    return null;
  }

  /**
   * Apply 3 Combo effect: reduce instability by 50%
   * @param {Array} floors - Array of floor objects
   */
  applySteadyEffect(floors) {
    if (floors.length === 0) return;

    const topFloors = floors.slice(-Math.min(5, floors.length));
    topFloors.forEach(floor => {
      floor.instability *= 0.5;
    });

    console.log('[Combo] Steady effect applied: instability reduced by 50% for top floors');
  }

  /**
   * Get width bonus for next floor (5 Combo effect)
   * @returns {number} Width bonus multiplier (0.0 - 0.1)
   */
  getWidthBonus() {
    const bonus = this.widthBonus;
    this.widthBonus = 0;
    return bonus;
  }

  /**
   * Apply 10 Combo effect: align last 10 floors to center (including current floor)
   * @param {Array} floors - Array of floor objects
   */
  applyArchitectEffect(floors) {
    if (floors.length < 2) return;

    // 对齐最后 10 层（包括刚放置的当前层）
    const topFloors = floors.slice(-Math.min(10, floors.length));
    const centerX = 0;

    topFloors.forEach(floor => {
      floor.position.x = centerX;
      floor.instability = 0;

      if (floor.sprite) {
        floor.sprite.position.x = centerX;
      }
    });

    console.log('[Combo] Architect effect applied: aligned last', topFloors.length, 'floors to center');
  }

  /**
   * Reset combo count
   */
  resetCombo() {
    if (this.perfectComboCount > 0) {
      console.log('Perfect combo broken at', this.perfectComboCount);
    }
    this.perfectComboCount = 0;
    this.widthBonus = 0;
    this.deactivatePerfectWindow();
  }

  /**
   * Get current perfect combo count
   */
  getPerfectComboCount() {
    return this.perfectComboCount;
  }

  /**
   * Get perfect window status
   */
  getPerfectWindowStatus() {
    return {
      active: this.perfectWindowActive,
      timeLeft: this.perfectWindowTimeLeft,
      duration: this.perfectWindowDuration,
      progress: this.perfectWindowActive ? this.perfectWindowTimeLeft / this.perfectWindowDuration : 0
    };
  }
}
