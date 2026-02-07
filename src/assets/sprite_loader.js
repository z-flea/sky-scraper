/**
 * Sprite Loader
 *
 * Handles loading and managing 2D sprite assets
 */

import * as THREE from 'three';

export class SpriteLoader {
  constructor() {
    this.textureLoader = new THREE.TextureLoader();
    this.loadedTextures = new Map();
  }

  /**
   * Load a sprite texture
   */
  async loadTexture(path) {
    if (this.loadedTextures.has(path)) {
      return this.loadedTextures.get(path);
    }

    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        path,
        (texture) => {
          this.loadedTextures.set(path, texture);
          resolve(texture);
        },
        undefined,
        (error) => {
          console.error('Error loading texture:', path, error);
          reject(error);
        }
      );
    });
  }

  /**
   * Load texture atlas
   */
  async loadAtlas(atlasPath, dataPath) {
    // TODO: Implement texture atlas loading
    console.log('Loading atlas:', atlasPath, dataPath);
  }

  /**
   * Create sprite from texture
   */
  createSprite(texture, width, height) {
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(width, height, 1);
    return sprite;
  }
}
