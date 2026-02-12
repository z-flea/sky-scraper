/**
 * Phase Manager
 *
 * Manages game phases and difficulty progression
 */

export class PhaseManager {
  constructor() {
    this.phases = [
      { id: 1, name: 'City', minFloor: 0, maxFloor: 20, theme: 'modern' },
      { id: 2, name: 'Clouds', minFloor: 21, maxFloor: 50, theme: 'art-deco' },
      { id: 3, name: 'Stratosphere', minFloor: 51, maxFloor: 100, theme: 'cyberpunk' },
      { id: 4, name: 'Orbit', minFloor: 101, maxFloor: 200, theme: 'space' },
      { id: 5, name: 'Interstellar', minFloor: 201, maxFloor: Infinity, theme: 'cosmic' }
    ];
  }

  /**
   * Get current phase based on floor count
   */
  getCurrentPhase(floorCount) {
    for (let phase of this.phases) {
      if (floorCount >= phase.minFloor && floorCount <= phase.maxFloor) {
        return phase.id;
      }
    }
    return 1; // Default to phase 1
  }

  /**
   * Get phase configuration
   */
  getPhaseConfig(phaseId) {
    return this.phases.find(p => p.id === phaseId) || this.phases[0];
  }

  /**
   * Get difficulty parameters for current phase
   */
  getDifficultyParams(phaseId) {
    // 方案 B：平衡难度
    // - 振幅保持不变（2.5）
    // - 速度适度提升（每阶段 +0.5）
    const amplitude = 2.5;
    const baseAngularVelocity = 2.5;
    const angularVelocityIncrement = 0.5;

    // 角速度线性增长：2.5, 3.0, 3.5, 4.0, 4.5
    const angularVelocity = baseAngularVelocity + (phaseId - 1) * angularVelocityIncrement;

    // 噪声随角速度同步增长
    const noiseRange = 0.2 * (angularVelocity / baseAngularVelocity);

    // 楼层晃动基础参数（随阶段递增）
    // Phase 1: 1.0, Phase 2: 1.1, Phase 3: 1.2, Phase 4: 1.3, Phase 5: 1.5
    const wobbleAmplitude = phaseId <= 4 ? 1.0 + (phaseId - 1) * 0.1 : 1.5;
    const wobbleFrequency = phaseId <= 4 ? 1.0 + (phaseId - 1) * 0.1 : 1.5;

    return {
      amplitude: amplitude,
      angularVelocity: angularVelocity,
      noiseRange: noiseRange,
      wobbleAmplitude: wobbleAmplitude,
      wobbleFrequency: wobbleFrequency
    };
  }
}
