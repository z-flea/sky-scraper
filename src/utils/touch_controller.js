/**
 * 触摸控制器
 * 处理移动端触摸事件
 */

import { deviceDetector } from './device_detector.js';

export class TouchController {
  constructor(canvas, onTap, onDoubleTap) {
    this.canvas = canvas;
    this.onTap = onTap;
    this.onDoubleTap = onDoubleTap;

    this.lastTapTime = 0;
    this.doubleTapDelay = 300;
    this.tapPending = false;
    this.tapTimeout = null;

    this.setupTouchHandlers();
  }

  setupTouchHandlers() {
    if (!deviceDetector.isTouchDevice) return;

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleTouchStart(e);
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.handleTouchEnd(e);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });
  }

  handleTouchStart(e) {
    // 记录触摸开始时间
    this.touchStartTime = Date.now();
  }

  handleTouchEnd(e) {
    const now = Date.now();
    const touchDuration = now - this.touchStartTime;

    if (touchDuration > 500) return;

    const timeSinceLastTap = now - this.lastTapTime;

    if (timeSinceLastTap < this.doubleTapDelay && this.tapPending) {
      clearTimeout(this.tapTimeout);
      this.tapPending = false;

      if (this.onDoubleTap) {
        this.onDoubleTap();
      }
    } else {
      this.tapPending = true;
      this.lastTapTime = now;

      this.tapTimeout = setTimeout(() => {
        this.tapPending = false;

        if (this.onTap) {
          this.onTap();
        }
      }, this.doubleTapDelay);
    }
  }

  destroy() {
    if (this.tapTimeout) {
      clearTimeout(this.tapTimeout);
    }
  }
}
