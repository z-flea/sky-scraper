/**
 * Audio Manager
 *
 * Handles audio loading and playback
 */

export class AudioManager {
  constructor() {
    this.sounds = new Map();
    this.bgm = null;
    this.isMuted = false;
    this.bgmVolume = 0.3; // 默认音量 30%
  }

  /**
   * Load a sound effect
   */
  async loadSound(name, path) {
    try {
      const audio = new Audio(path);
      this.sounds.set(name, audio);
      console.log('Loaded sound:', name);
    } catch (error) {
      console.error('Error loading sound:', name, error);
    }
  }

  /**
   * Play a sound effect
   */
  playSound(name, volume = 1.0) {
    if (this.isMuted) return;

    const sound = this.sounds.get(name);
    if (sound) {
      sound.volume = volume;
      sound.currentTime = 0;
      sound.play().catch(e => console.error('Error playing sound:', e));
    }
  }

  /**
   * Play background music
   */
  playBGM(path, volume = null) {
    if (this.isMuted) return;

    if (this.bgm) {
      this.bgm.pause();
    }

    this.bgm = new Audio(path);
    if (volume !== null) {
      this.bgmVolume = volume;
    }
    this.bgm.volume = this.bgmVolume;
    this.bgm.loop = true;
    this.bgm.play().catch(e => console.error('Error playing BGM:', e));
  }

  /**
   * Stop background music
   */
  stopBGM() {
    if (this.bgm) {
      this.bgm.pause();
      this.bgm = null;
    }
  }

  /**
   * Toggle mute
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.bgm) {
      this.bgm.muted = this.isMuted;
    }
  }

  /**
   * Set BGM volume
   */
  setBGMVolume(volume) {
    this.bgmVolume = Math.max(0, Math.min(1, volume));
    if (this.bgm) {
      this.bgm.volume = this.bgmVolume;
    }
  }

  /**
   * Get current BGM volume
   */
  getBGMVolume() {
    return this.bgmVolume;
  }
}
