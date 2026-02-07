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
    const baseAmplitude = 3.0;
    const baseAngularVelocity = 2.0;
    const baseNoise = 0.2;

    // Increase difficulty with phase
    const multiplier = 1 + (phaseId - 1) * 0.2;

    return {
      amplitude: baseAmplitude * multiplier,
      angularVelocity: baseAngularVelocity * multiplier,
      noiseRange: baseNoise * multiplier
    };
  }
}
