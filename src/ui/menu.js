/**
 * Menu System
 *
 * Handles main menu, pause menu, and game over screen
 */

export class Menu {
  constructor() {
    this.currentMenu = null;
  }

  /**
   * Show main menu
   */
  showMainMenu() {
    console.log('Showing main menu');
    // TODO: Create and display main menu UI
  }

  /**
   * Show pause menu
   */
  showPauseMenu() {
    console.log('Showing pause menu');
    // TODO: Create and display pause menu UI
  }

  /**
   * Show game over screen
   */
  showGameOver(score, floors) {
    console.log('Game Over - Score:', score, 'Floors:', floors);
    // TODO: Create and display game over screen
  }

  /**
   * Hide current menu
   */
  hide() {
    console.log('Hiding menu');
    // TODO: Hide current menu
  }
}
