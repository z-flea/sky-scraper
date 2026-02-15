/**
 * 设备检测工具
 * 用于检测设备类型、屏幕尺寸、触摸支持等
 */

class DeviceDetector {
  constructor() {
    this.isMobile = this._detectMobile();
    this.isTablet = this._detectTablet();
    this.isTouchDevice = this._detectTouch();
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;
    this.pixelRatio = window.devicePixelRatio;
    this.orientation = this._getOrientation();

    this._setupListeners();
  }

  _detectMobile() {
    const userAgent = navigator.userAgent.toLowerCase();
    return /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  }

  _detectTablet() {
    const userAgent = navigator.userAgent.toLowerCase();
    return /ipad|android(?!.*mobile)|tablet/i.test(userAgent);
  }

  _detectTouch() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  _getOrientation() {
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  }

  _setupListeners() {
    window.addEventListener('resize', () => {
      this.screenWidth = window.innerWidth;
      this.screenHeight = window.innerHeight;
      this.orientation = this._getOrientation();
    });
  }

  isDesktop() {
    return !this.isMobile && !this.isTablet;
  }

  isMobileDevice() {
    return this.isMobile || this.isTablet;
  }

  getDeviceType() {
    if (this.isMobile) return 'mobile';
    if (this.isTablet) return 'tablet';
    return 'desktop';
  }
}

export const deviceDetector = new DeviceDetector();
