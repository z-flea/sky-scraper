/**
 * Combo Display System
 *
 * 显示 Perfect 时间窗口进度条
 */

export class ComboDisplay {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    this.container = document.createElement('div');
    this.container.id = 'combo-display-container';
    this.container.style.cssText = `
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      pointer-events: none;
      z-index: 200;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    `;

    // 星星图标容器
    this.starContainer = document.createElement('div');
    this.starContainer.id = 'perfect-star-container';
    this.starContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      opacity: 0;
      transition: opacity 0.3s;
    `;

    this.starIcon = document.createElement('img');
    this.starIcon.src = 'assets/sprites/dom/star.PNG';
    this.starIcon.style.cssText = `
      width: 24px;
      height: 24px;
      filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.8));
      animation: star-pulse 1s ease-in-out infinite;
    `;

    this.starText = document.createElement('div');
    this.starText.textContent = 'PERFECT WINDOW';
    this.starText.style.cssText = `
      font-size: 16px;
      font-weight: bold;
      color: #FFD700;
      text-shadow: 0 0 8px rgba(255, 215, 0, 0.8), 0 2px 4px rgba(0,0,0,0.5);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      letter-spacing: 1px;
    `;

    this.starContainer.appendChild(this.starIcon);
    this.starContainer.appendChild(this.starText);

    // Perfect 时间条容器
    this.perfectTimerContainer = document.createElement('div');
    this.perfectTimerContainer.id = 'perfect-timer-container';
    this.perfectTimerContainer.style.cssText = `
      width: 400px;
      height: 16px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      overflow: hidden;
      opacity: 0;
      transition: opacity 0.3s;
    `;

    this.perfectTimerBar = document.createElement('div');
    this.perfectTimerBar.id = 'perfect-timer-bar';
    this.perfectTimerBar.style.cssText = `
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, #FFD700, #FFA500);
      box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
      transition: width 0.1s linear;
    `;

    this.perfectTimerContainer.appendChild(this.perfectTimerBar);
    this.container.appendChild(this.starContainer);
    this.container.appendChild(this.perfectTimerContainer);
    document.body.appendChild(this.container);
  }

  /**
   * 显示连击里程碑提示
   * @param {object} milestone - 里程碑信息
   */
  showMilestone(milestone) {
    const config = this.getMilestoneConfig(milestone.type);

    const milestoneElement = document.createElement('div');
    milestoneElement.className = `combo-milestone combo-milestone-${milestone.type}`;
    milestoneElement.innerHTML = `
      <div class="milestone-title">${milestone.name}</div>
      <div class="milestone-description">${milestone.description}</div>
    `;

    milestoneElement.style.cssText = `
      position: absolute;
      left: 50%;
      top: 30%;
      transform: translate(-50%, -50%);
      text-align: center;
      pointer-events: none;
      z-index: 1000;
      animation: milestone-appear ${config.duration}s ease-out forwards;
    `;

    const titleStyle = `
      font-size: 48px;
      font-weight: bold;
      color: ${config.color};
      text-shadow: 0 0 20px ${config.glowColor}, 0 4px 8px rgba(0,0,0,0.5);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      letter-spacing: 3px;
      margin-bottom: 8px;
    `;

    const descStyle = `
      font-size: 24px;
      font-weight: bold;
      color: ${config.descColor};
      text-shadow: 0 0 12px ${config.glowColor}, 0 2px 4px rgba(0,0,0,0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    milestoneElement.querySelector('.milestone-title').style.cssText = titleStyle;
    milestoneElement.querySelector('.milestone-description').style.cssText = descStyle;

    document.body.appendChild(milestoneElement);

    if (config.particles) {
      this.createMilestoneParticles(milestone.type);
    }

    setTimeout(() => {
      milestoneElement.remove();
    }, config.duration * 1000);
  }

  /**
   * 获取里程碑配置
   */
  getMilestoneConfig(type) {
    const configs = {
      steady: {
        color: '#4A90E2',
        glowColor: '#1E90FF',
        descColor: '#87CEEB',
        duration: 2.0,
        particles: true
      },
      reinforced: {
        color: '#9B59B6',
        glowColor: '#8E44AD',
        descColor: '#BB8FCE',
        duration: 2.0,
        particles: true
      },
      architect: {
        color: '#FFD700',
        glowColor: '#FFA500',
        descColor: '#FFEB3B',
        duration: 2.5,
        particles: true
      }
    };

    return configs[type] || configs.steady;
  }

  /**
   * 创建里程碑粒子效果
   */
  createMilestoneParticles(type) {
    const colors = {
      steady: ['#4A90E2', '#1E90FF', '#87CEEB'],
      reinforced: ['#9B59B6', '#8E44AD', '#BB8FCE'],
      architect: ['#FFD700', '#FFA500', '#FFEB3B']
    };

    const particleColors = colors[type] || colors.steady;
    const particleCount = type === 'architect' ? 30 : 20;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight * 0.3;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = 150 + Math.random() * 150;
      const size = 6 + Math.random() * 10;

      particle.style.cssText = `
        position: absolute;
        left: ${centerX}px;
        top: ${centerY}px;
        width: ${size}px;
        height: ${size}px;
        background: ${particleColors[Math.floor(Math.random() * particleColors.length)]};
        border-radius: 50%;
        pointer-events: none;
        animation: milestone-particle-burst 1.2s ease-out forwards;
        --angle: ${angle}rad;
        --velocity: ${velocity}px;
        z-index: 999;
      `;

      document.body.appendChild(particle);
      setTimeout(() => particle.remove(), 1200);
    }
  }

  /**
   * 更新 Perfect 时间条
   * @param {object} windowStatus - Perfect 窗口状态
   */
  updatePerfectTimer(windowStatus) {
    if (windowStatus.active) {
      this.starContainer.style.opacity = '1';
      this.perfectTimerContainer.style.opacity = '1';
      const progress = windowStatus.progress * 100;
      this.perfectTimerBar.style.width = `${progress}%`;

      // 时间快结束时变红
      if (progress < 30) {
        this.perfectTimerBar.style.background = 'linear-gradient(90deg, #FF4444, #FF0000)';
        this.perfectTimerBar.style.boxShadow = '0 0 20px rgba(255, 68, 68, 0.8)';
        this.starIcon.style.filter = 'drop-shadow(0 0 10px rgba(255, 68, 68, 0.8))';
        this.starText.style.color = '#FF4444';
        this.starText.style.textShadow = '0 0 10px rgba(255, 68, 68, 0.8), 0 2px 4px rgba(0,0,0,0.5)';
      } else {
        this.perfectTimerBar.style.background = 'linear-gradient(90deg, #FFD700, #FFA500)';
        this.perfectTimerBar.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.8)';
        this.starIcon.style.filter = 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.8))';
        this.starText.style.color = '#FFD700';
        this.starText.style.textShadow = '0 0 10px rgba(255, 215, 0, 0.8), 0 2px 4px rgba(0,0,0,0.5)';
      }
    } else {
      this.starContainer.style.opacity = '0';
      this.perfectTimerContainer.style.opacity = '0';
    }
  }

  /**
   * 清除所有显示
   */
  clear() {
    this.starContainer.style.opacity = '0';
    this.perfectTimerContainer.style.opacity = '0';
  }
}

const style = document.createElement('style');
style.textContent = `
  @keyframes star-pulse {
    0%, 100% {
      transform: scale(1);
      filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.8));
    }
    50% {
      transform: scale(1.2);
      filter: drop-shadow(0 0 20px rgba(255, 215, 0, 1));
    }
  }

  @keyframes milestone-appear {
    0% {
      transform: translate(-50%, -50%) scale(0.3) rotate(-10deg);
      opacity: 0;
    }
    20% {
      transform: translate(-50%, -50%) scale(1.3) rotate(5deg);
      opacity: 1;
    }
    40% {
      transform: translate(-50%, -50%) scale(1.1) rotate(-2deg);
    }
    60% {
      transform: translate(-50%, -50%) scale(1.2) rotate(0deg);
    }
    80% {
      transform: translate(-50%, -50%) scale(1.0) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -80%) scale(0.8) rotate(0deg);
      opacity: 0;
    }
  }

  @keyframes milestone-particle-burst {
    0% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
    100% {
      transform: translate(
        calc(-50% + cos(var(--angle)) * var(--velocity)),
        calc(-50% + sin(var(--angle)) * var(--velocity))
      ) scale(0);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
