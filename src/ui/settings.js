/**
 * Settings Manager
 *
 * Manages settings panel, game history, and volume control
 */

export class SettingsManager {
  constructor(audioManager) {
    this.audioManager = audioManager;
    this.setupEventListeners();
    this.loadSettings();
  }

  /**
   * Setup event listeners for settings panel
   */
  setupEventListeners() {
    const settingsButton = document.getElementById('settings-button');
    const closeButton = document.getElementById('close-settings-button');
    const settingsOverlay = document.getElementById('settings-overlay');
    const volumeSlider = document.getElementById('bgm-volume-slider');
    const volumeValue = document.getElementById('bgm-volume-value');

    if (settingsButton) {
      settingsButton.addEventListener('click', () => {
        this.showSettings();
      });
    }

    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.hideSettings();
      });
    }

    if (settingsOverlay) {
      settingsOverlay.addEventListener('click', (e) => {
        if (e.target === settingsOverlay) {
          this.hideSettings();
        }
      });
    }

    if (volumeSlider && volumeValue) {
      volumeSlider.addEventListener('input', (e) => {
        const volume = parseInt(e.target.value);
        volumeValue.textContent = `${volume}%`;
        this.audioManager.setBGMVolume(volume / 100);
        this.saveSettings();
      });
    }
  }

  /**
   * Show settings panel
   */
  showSettings() {
    const settingsOverlay = document.getElementById('settings-overlay');
    if (settingsOverlay) {
      settingsOverlay.classList.add('show');
      this.refreshHistory();
    }
  }

  /**
   * Hide settings panel
   */
  hideSettings() {
    const settingsOverlay = document.getElementById('settings-overlay');
    if (settingsOverlay) {
      settingsOverlay.classList.remove('show');
    }
  }

  /**
   * Load settings from localStorage
   */
  loadSettings() {
    const savedVolume = localStorage.getItem('bgm_volume');
    if (savedVolume !== null) {
      const volume = parseInt(savedVolume);
      const volumeSlider = document.getElementById('bgm-volume-slider');
      const volumeValue = document.getElementById('bgm-volume-value');

      if (volumeSlider && volumeValue) {
        volumeSlider.value = volume;
        volumeValue.textContent = `${volume}%`;
        this.audioManager.setBGMVolume(volume / 100);
      }
    }
  }

  /**
   * Save settings to localStorage
   */
  saveSettings() {
    const volumeSlider = document.getElementById('bgm-volume-slider');
    if (volumeSlider) {
      localStorage.setItem('bgm_volume', volumeSlider.value);
    }
  }

  /**
   * Save game record to history
   */
  saveGameRecord(score, floors) {
    const history = this.getGameHistory();
    const record = {
      date: new Date().toISOString(),
      score: score,
      floors: floors
    };

    history.unshift(record);

    if (history.length > 50) {
      history.splice(50);
    }

    localStorage.setItem('game_history', JSON.stringify(history));
  }

  /**
   * Get game history from localStorage
   */
  getGameHistory() {
    const historyJson = localStorage.getItem('game_history');
    if (historyJson) {
      try {
        return JSON.parse(historyJson);
      } catch (e) {
        console.error('Error parsing game history:', e);
        return [];
      }
    }
    return [];
  }

  /**
   * Refresh history display
   */
  refreshHistory() {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;

    const history = this.getGameHistory();

    if (history.length === 0) {
      historyList.innerHTML = '<div class="no-history">暂无游玩记录</div>';
      return;
    }

    historyList.innerHTML = history.map((record, index) => {
      const date = new Date(record.date);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

      return `
        <div class="history-item">
          <div class="history-item-date">${dateStr}</div>
          <div class="history-item-stats">分数: ${record.score} | 楼层: ${record.floors}</div>
        </div>
      `;
    }).join('');
  }
}
