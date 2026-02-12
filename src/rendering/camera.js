/**
 * Camera Controller
 *
 * Handles camera movement to follow the tower
 */

export class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.targetY = 0;
    this.smoothing = 0.1; // Camera smoothing factor
    this.shakeOffset = { x: 0, y: 0 };
    this.shakeTime = 0;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeElapsed = 0;
  }

  /**
   * Update camera position to follow tower
   */
  update(floors) {
    if (floors.length === 0) return;

    // Get the top floor
    const topFloor = floors[floors.length - 1];

    // 当楼层数量较少时（<= 3 层），相机保持在初始位置 y=0
    // 这样地基会保持在画面底部，不会"弹回"中间
    if (floors.length <= 3) {
      this.targetY = 0;
    } else {
      // 楼层较多时，相机跟随顶层楼层
      this.targetY = topFloor.position.y;
    }

    // Smooth camera movement
    const currentY = this.camera.position.y;
    const newY = currentY + (this.targetY - currentY) * this.smoothing;

    // 更新震动
    this.updateShake(0.016);  // 假设 60 FPS

    // 应用震动
    this.camera.position.x = 0 + this.shakeOffset.x;
    this.camera.position.y = newY + this.shakeOffset.y;
  }

  /**
   * 触发相机震动
   */
  triggerShake(intensity, duration) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeElapsed = 0;
  }

  /**
   * 更新震动效果
   */
  updateShake(deltaTime) {
    if (this.shakeElapsed >= this.shakeDuration) {
      this.shakeOffset = { x: 0, y: 0 };
      return;
    }

    this.shakeElapsed += deltaTime;
    const progress = this.shakeElapsed / this.shakeDuration;
    const currentIntensity = this.shakeIntensity * (1 - progress);

    this.shakeOffset.x = (Math.random() - 0.5) * currentIntensity;
    this.shakeOffset.y = (Math.random() - 0.5) * currentIntensity;
  }

  /**
   * Calculate camera shake based on tower instability
   */
  calculateShake(floors) {
    // Calculate total instability from recent floors
    let totalInstability = 0;
    const recentFloors = floors.slice(-10); // Check last 10 floors

    for (let floor of recentFloors) {
      totalInstability += floor.instability || 0;
    }

    // Normalize instability (0-100 range)
    const normalizedInstability = Math.min(totalInstability / 100, 1.0);

    // Calculate shake intensity
    const shakeIntensity = normalizedInstability * 0.3; // Max shake of 0.3 units

    // Generate random shake offset
    if (shakeIntensity > 0.01) {
      this.shakeTime += 0.1;
      this.shakeOffset.x = Math.sin(this.shakeTime * 10) * shakeIntensity;
      this.shakeOffset.y = Math.cos(this.shakeTime * 8) * shakeIntensity * 0.5;
    } else {
      this.shakeOffset.x = 0;
      this.shakeOffset.y = 0;
      this.shakeTime = 0;
    }
  }

  /**
   * Reset camera to initial position
   */
  reset() {
    this.camera.position.x = 0;
    this.camera.position.y = 0;
    this.targetY = 0;
    this.shakeOffset = { x: 0, y: 0 };
    this.shakeTime = 0;
  }
}
