/**
 * Judgment Feedback System
 *
 * 显示判定文字提示和动效
 */

export class JudgmentFeedback {
  constructor() {
    this.container = null
    this.activeElements = []
    this.init()
  }

  init() {
    // 创建判定反馈容器
    this.container = document.createElement('div')
    this.container.id = 'judgment-feedback-container'
    this.container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 100;
    `
    document.body.appendChild(this.container)
  }

  /**
   * 显示判定反馈
   * @param {string} grade - 判定等级 ('Perfect', 'Great', 'Okay', 'Miss')
   * @param {object} position - 屏幕位置 {x, y}（可选，默认居中）
   * @param {number} points - 获得的分数（可选）
   * @param {number} perfectCombo - Perfect 连击数（可选，仅用于 Perfect 判定）
   */
  show(grade, position = null, points = null, perfectCombo = 0) {
    const config = this.getGradeConfig(grade)

    // 创建判定文字元素
    const element = document.createElement('div')
    element.className = `judgment-text judgment-${grade.toLowerCase()}`

    // 如果是 Perfect 且有连击数，显示 PERFECT×N
    if (grade === 'Perfect' && perfectCombo > 1) {
      element.textContent = `${config.text}×${perfectCombo}`
    } else {
      element.textContent = config.text
    }

    // 设置位置（默认居中偏上）
    const x = position ? position.x : window.innerWidth / 2
    const y = position ? position.y : window.innerHeight * 0.4

    element.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      transform: translate(-50%, -50%);
      font-size: 64px;
      font-weight: bold;
      color: ${config.color};
      text-shadow: 0 0 20px ${config.glowColor}, 0 4px 8px rgba(0,0,0,0.3);
      animation: ${config.animation} ${config.duration}s ease-out forwards;
      pointer-events: none;
      z-index: 1000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      letter-spacing: 2px;
    `

    this.container.appendChild(element)
    this.activeElements.push(element)

    // 显示分数飘字
    if (points !== null && points > 0) {
      this.showPoints(points, x, y + 60, config.color)
    }

    // 创建粒子效果
    if (config.particles) {
      this.createParticles(grade, x, y)
    }

    // Miss 判定触发屏幕震动
    if (grade === 'Miss') {
      this.shakeScreen()
    }

    // 自动移除元素
    setTimeout(() => {
      element.remove()
      const index = this.activeElements.indexOf(element)
      if (index > -1) {
        this.activeElements.splice(index, 1)
      }
    }, config.duration * 1000)
  }

  /**
   * 获取判定等级配置
   */
  getGradeConfig(grade) {
    const configs = {
      Perfect: {
        text: 'PERFECT!',
        color: '#FFD700',
        glowColor: '#FFA500',
        animation: 'judgment-perfect',
        duration: 1.5,
        particles: true
      },
      Great: {
        text: 'GREAT!',
        color: '#4A90E2',
        glowColor: '#1E90FF',
        animation: 'judgment-great',
        duration: 1.5,
        particles: true
      },
      Okay: {
        text: 'OKAY',
        color: '#FFA500',
        glowColor: '#FF8C00',
        animation: 'judgment-okay',
        duration: 1.5,
        particles: false
      },
      Miss: {
        text: 'MISS!',
        color: '#FF4444',
        glowColor: '#FF0000',
        animation: 'judgment-miss',
        duration: 1.5,
        particles: true
      }
    }

    return configs[grade] || configs.Okay
  }

  /**
   * 创建粒子效果
   */
  createParticles(grade, x, y) {
    const particleCount = grade === 'Perfect' ? 20 : grade === 'Miss' ? 15 : 10
    const colors = {
      Perfect: ['#FFD700', '#FFA500', '#FFFF00'],
      Great: ['#4A90E2', '#1E90FF', '#87CEEB'],
      Miss: ['#FF4444', '#FF0000', '#FF6666']
    }

    const particleColors = colors[grade] || colors.Great

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div')
      const angle = (Math.PI * 2 * i) / particleCount
      const velocity = 100 + Math.random() * 100
      const size = 4 + Math.random() * 8

      particle.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: ${size}px;
        height: ${size}px;
        background: ${particleColors[Math.floor(Math.random() * particleColors.length)]};
        border-radius: 50%;
        pointer-events: none;
        animation: particle-burst-${grade.toLowerCase()} 0.8s ease-out forwards;
        --angle: ${angle}rad;
        --velocity: ${velocity}px;
      `

      this.container.appendChild(particle)

      setTimeout(() => particle.remove(), 800)
    }
  }

  /**
   * 清除所有活动元素
   */
  clear() {
    this.activeElements.forEach(el => el.remove())
    this.activeElements = []
  }

  /**
   * 显示分数飘字
   */
  showPoints(points, x, y, color) {
    const pointsElement = document.createElement('div')
    pointsElement.textContent = `+${points}`
    pointsElement.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      transform: translate(-50%, -50%);
      font-size: 32px;
      font-weight: bold;
      color: ${color};
      text-shadow: 0 0 10px ${color}, 0 2px 4px rgba(0,0,0,0.3);
      animation: points-float 1.5s ease-out forwards;
      pointer-events: none;
      z-index: 999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `

    this.container.appendChild(pointsElement)
    setTimeout(() => pointsElement.remove(), 1500)
  }

  /**
   * 屏幕震动效果
   */
  shakeScreen() {
    const canvas = document.getElementById('game-canvas')
    if (!canvas) return

    canvas.style.animation = 'screen-shake 0.5s ease-out'
    setTimeout(() => {
      canvas.style.animation = ''
    }, 500)
  }
}

// 注入 CSS 动画
const style = document.createElement('style')
style.textContent = `
  @keyframes judgment-perfect {
    0% {
      transform: translate(-50%, -50%) scale(0.5) rotate(-10deg);
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
    100% {
      transform: translate(-50%, -80%) scale(1.0) rotate(0deg);
      opacity: 0;
    }
  }

  @keyframes judgment-great {
    0% {
      transform: translate(-50%, -50%) scale(0.8);
      opacity: 0;
    }
    30% {
      transform: translate(-50%, -50%) scale(1.2);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -100%) scale(1.0);
      opacity: 0;
    }
  }

  @keyframes judgment-okay {
    0% {
      transform: translate(-50%, -50%) scale(0.9);
      opacity: 0;
    }
    20% {
      transform: translate(-48%, -50%) scale(1.0);
      opacity: 1;
    }
    40% {
      transform: translate(-52%, -50%) scale(1.0);
    }
    60% {
      transform: translate(-48%, -50%) scale(1.0);
    }
    80% {
      transform: translate(-50%, -50%) scale(1.0);
    }
    100% {
      transform: translate(-50%, -70%) scale(0.9);
      opacity: 0;
    }
  }

  @keyframes judgment-miss {
    0% {
      transform: translate(-50%, -50%) scale(1.2);
      opacity: 0;
    }
    10% {
      transform: translate(-50%, -50%) scale(1.3);
      opacity: 1;
    }
    20% {
      transform: translate(-48%, -48%) scale(1.3);
    }
    30% {
      transform: translate(-52%, -52%) scale(1.3);
    }
    40% {
      transform: translate(-48%, -52%) scale(1.3);
    }
    50% {
      transform: translate(-52%, -48%) scale(1.3);
    }
    60% {
      transform: translate(-50%, -50%) scale(1.2);
    }
    100% {
      transform: translate(-50%, 20%) scale(0.8);
      opacity: 0;
    }
  }

  @keyframes particle-burst-perfect {
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

  @keyframes particle-burst-great {
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

  @keyframes particle-burst-miss {
    0% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
    100% {
      transform: translate(
        calc(-50% + cos(var(--angle)) * var(--velocity) * 0.5),
        calc(-50% + sin(var(--angle)) * var(--velocity) * 0.5 + 100px)
      ) scale(0);
      opacity: 0;
    }
  }

  @keyframes points-float {
    0% {
      transform: translate(-50%, -50%) scale(0.8);
      opacity: 0;
    }
    20% {
      transform: translate(-50%, -50%) scale(1.2);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) scale(1.0);
      opacity: 0;
    }
  }

  @keyframes screen-shake {
    0%, 100% {
      transform: translate(0, 0);
    }
    10% {
      transform: translate(-10px, 5px);
    }
    20% {
      transform: translate(10px, -5px);
    }
    30% {
      transform: translate(-8px, 8px);
    }
    40% {
      transform: translate(8px, -8px);
    }
    50% {
      transform: translate(-5px, 5px);
    }
    60% {
      transform: translate(5px, -5px);
    }
    70% {
      transform: translate(-3px, 3px);
    }
    80% {
      transform: translate(3px, -3px);
    }
    90% {
      transform: translate(-1px, 1px);
    }
  }
`
document.head.appendChild(style)
