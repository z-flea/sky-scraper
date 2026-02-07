/**
 * Sky Scraper (摩天大楼) - Main Entry Point
 *
 * This is a 2D physics-based tower stacking game built with Three.js
 */

import * as THREE from 'three';
import { Game } from './core/game.js';

// Initialize the game when DOM is ready
const init = () => {
  console.log('Sky Scraper - Initializing...');

  // Get canvas element
  const canvas = document.getElementById('game-canvas');

  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }

  // Create and start the game
  const game = new Game(canvas);
  game.start();

  console.log('Sky Scraper - Game started!');
};

// Start the game
init();
