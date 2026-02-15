/**
 * 性能配置模块
 * 根据设备类型自动调整性能参数
 */

import { deviceDetector } from '../utils/device_detector.js';

class PerformanceConfig {
  constructor() {
    this.deviceType = deviceDetector.getDeviceType();
    this.config = this._getConfigForDevice();
  }

  _getConfigForDevice() {
    if (this.deviceType === 'mobile') {
      return this._getMobileConfig();
    } else if (this.deviceType === 'tablet') {
      return this._getTabletConfig();
    } else {
      return this._getDesktopConfig();
    }
  }

  _getMobileConfig() {
    return {
      renderer: {
        antialias: false,
        pixelRatio: Math.min(window.devicePixelRatio, 2),
        shadowMap: false,
      },
      particles: {
        enabled: true,
        maxParticles: 50,
        density: 0.3,
      },
      postProcessing: {
        enabled: false,
        bloom: false,
        ssao: false,
        colorGrading: false,
      },
      physics: {
        updateRate: 30,
      },
      difficulty: {
        craneSpeedMultiplier: 1.0,
        judgmentLeniency: 1.0,
      },
    };
  }

  _getTabletConfig() {
    return {
      renderer: {
        antialias: true,
        pixelRatio: Math.min(window.devicePixelRatio, 2),
        shadowMap: false,
      },
      particles: {
        enabled: true,
        maxParticles: 100,
        density: 0.5,
      },
      postProcessing: {
        enabled: true,
        bloom: true,
        ssao: false,
        colorGrading: true,
      },
      physics: {
        updateRate: 60,
      },
      difficulty: {
        craneSpeedMultiplier: 0.9,
        judgmentLeniency: 1.1,
      },
    };
  }

  _getDesktopConfig() {
    return {
      renderer: {
        antialias: true,
        pixelRatio: Math.min(window.devicePixelRatio, 2),
        shadowMap: true,
      },
      particles: {
        enabled: true,
        maxParticles: 200,
        density: 1.0,
      },
      postProcessing: {
        enabled: true,
        bloom: true,
        ssao: true,
        colorGrading: true,
      },
      physics: {
        updateRate: 60,
      },
      difficulty: {
        craneSpeedMultiplier: 1.0,
        judgmentLeniency: 1.0,
      },
    };
  }

  getConfig() {
    return this.config;
  }

  getRendererConfig() {
    return this.config.renderer;
  }

  getParticlesConfig() {
    return this.config.particles;
  }

  getPostProcessingConfig() {
    return this.config.postProcessing;
  }

  getPhysicsConfig() {
    return this.config.physics;
  }

  getDifficultyConfig() {
    return this.config.difficulty;
  }
}

export const performanceConfig = new PerformanceConfig();
