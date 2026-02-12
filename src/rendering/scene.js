/**
 * Scene Manager
 *
 * Manages Three.js scene, renderer, and floor rendering
 */

import * as THREE from 'three';

// 楼层显示缩放比例
const FLOOR_DISPLAY_SCALE = 0.6;

export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Sky blue

    // Create orthographic camera for 2D rendering
    const aspect = window.innerWidth / window.innerHeight;
    const viewSize = 20;
    this.camera = new THREE.OrthographicCamera(
      -viewSize * aspect / 2,
      viewSize * aspect / 2,
      viewSize / 2,
      -viewSize / 2,
      0.1,
      1000
    );
    this.camera.position.z = 10;

    // Add lighting
    this.setupLighting();

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());

    // Floor sprites
    this.floorSprites = [];

    // Crane visualization objects
    this.craneCable = null;
    this.craneHook = null;

    // Texture loader
    this.textureLoader = new THREE.TextureLoader();
    this.floorTextures = []; // 存储四种楼层纹理
    this.isTextureLoaded = false;
    this.texturesLoadedCount = 0;

    // Initialize crane visualization
    this.createCrane();
  }

  /**
   * Setup scene lighting
   */
  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 10, 5);
    this.scene.add(directionalLight);
  }

  /**
   * Load floor textures (all 6 types)
   */
  loadFloorTexture(onComplete) {
    const textureFiles = [
      '/assets/sprites/dom/domlevel.png',
      '/assets/sprites/dom/domlevel2.png',
      '/assets/sprites/dom/domlevel3.png',
      '/assets/sprites/dom/domlevel4.png',
      '/assets/sprites/dom/domlevel5.png',
      '/assets/sprites/dom/domlevel6.png'
    ];

    const totalTextures = textureFiles.length;

    textureFiles.forEach((file, index) => {
      this.textureLoader.load(
        file,
        (texture) => {
          console.log(`楼层纹理 ${index + 1} 加载成功`);

          // 禁用预乘 alpha，避免边缘颜色错误
          texture.premultipliedAlpha = false;

          // 使用最近邻过滤，避免透明边缘插值产生半透明像素
          texture.minFilter = THREE.NearestFilter;
          texture.magFilter = THREE.NearestFilter;

          // 裁剪纹理，只显示中心有内容的部分
          const contentRatio = 0.44;
          texture.repeat.set(contentRatio, contentRatio);
          texture.offset.set((1 - contentRatio) / 2, (1 - contentRatio) / 2);

          this.floorTextures[index] = texture;
          this.texturesLoadedCount++;

          // 所有纹理加载完成后调用回调
          if (this.texturesLoadedCount === totalTextures) {
            this.isTextureLoaded = true;
            if (onComplete) onComplete();
          }
        },
        undefined,
        (error) => {
          console.error(`楼层纹理 ${index + 1} 加载失败:`, error);
          this.texturesLoadedCount++;

          // 即使加载失败也继续
          if (this.texturesLoadedCount === totalTextures) {
            this.isTextureLoaded = true;
            if (onComplete) onComplete();
          }
        }
      );
    });
  }

  /**
   * Create crane visualization
   */
  createCrane() {
    // Create cable using a thin plane with texture
    // 宽度设为 1.0，让纹理有足够空间显示，透明部分会被 alphaTest 自动过滤
    const cableGeometry = new THREE.PlaneGeometry(1.0, 5);
    const cableMaterial = new THREE.MeshBasicMaterial({
      transparent: true, // 必须为 true 才能正确读取 alpha 通道
      side: THREE.DoubleSide,
      alphaTest: 0.9, // 提高到 0.9，只保留几乎完全不透明的像素
      depthWrite: true // 启用深度写入
    });
    this.craneCable = new THREE.Mesh(cableGeometry, cableMaterial);
    this.craneCable.visible = false; // 初始隐藏，等纹理加载完成
    this.scene.add(this.craneCable);

    // Load cable texture with callback
    this.textureLoader.load(
      '/assets/sprites/dom/cable.png',
      (texture) => {
        console.log('吊线纹理加载成功');

        // 禁用预乘 alpha，避免边缘颜色错误
        texture.premultipliedAlpha = false;

        // 使用最近邻过滤，避免透明边缘插值产生半透明像素
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;

        cableMaterial.map = texture;
        cableMaterial.needsUpdate = true;
        this.craneCable.visible = true; // 纹理加载完成后显示
      },
      undefined,
      (error) => {
        console.error('吊线纹理加载失败:', error);
        // 加载失败时使用纯色作为后备
        cableMaterial.color.set(0x333333);
        this.craneCable.visible = true;
      }
    );

    // Hook removed - no longer needed
  }

  /**
   * Update crane position
   */
  updateCrane(craneX, craneY, floorY) {
    if (!this.craneCable) return;

    // 调试日志
    console.log('[updateCrane] craneX:', craneX, 'craneY:', craneY, 'floorY:', floorY);

    // 楼层显示高度 = 4.0 * 0.6 = 2.4
    const floorDisplayHeight = 2.4;

    // 钩子位置：紧贴楼层顶部
    // 楼层顶部 = floorY + floorDisplayHeight / 2
    const floorTop = floorY + floorDisplayHeight / 2;
    // Hook removed - position update no longer needed
    // const hookY = floorTop;
    // this.craneHook.position.set(craneX, hookY, 0.1);

    // 吊线终点：楼层顶部（原本是钩子顶部）
    const cableEndY = floorTop;
    // 吊线起点：相机视野顶部（让吊线从画面顶部延伸下来）
    const viewSize = 20;
    const cameraTopY = this.camera.position.y + viewSize / 2;
    const cableStartY = cameraTopY;
    // 吊线长度
    const cableLength = cableStartY - cableEndY;
    // 吊线中心点
    const cableCenterY = (cableStartY + cableEndY) / 2;

    console.log('[updateCrane] cableEndY:', cableEndY, 'cameraTopY:', cameraTopY, 'cableLength:', cableLength, 'scale.y:', cableLength / 5);

    // Update cable position (center of the cable)
    this.craneCable.position.set(craneX, cableCenterY, 0.1);

    // Update cable scale to match the distance
    this.craneCable.scale.y = cableLength / 5;
  }

  /**
   * Get texture index based on floor number
   */
  getTextureIndexByFloorNumber(floorId) {
    if (floorId <= 10) return 0;
    if (floorId <= 30) return 1;
    if (floorId <= 50) return 2;
    if (floorId <= 80) return 3;
    if (floorId <= 120) return 4;
    return 5;
  }

  /**
   * Add a floor to the scene
   */
  addFloor(floor) {
    // 地基（第一个楼层）不使用纹理，使用纯色
    // 根据楼层数量选择对应的纹理
    let floorTexture = null;
    let textureIndex = -1;
    
    if (floor.id !== 0 && this.floorTextures.length > 0) {
      textureIndex = this.getTextureIndexByFloorNumber(floor.id);
      floorTexture = this.floorTextures[textureIndex];
      
      // 添加调试日志
      console.log(`[楼层纹理] 楼层 ID: ${floor.id}, 纹理索引: ${textureIndex}, 纹理文件: domlevel${textureIndex === 0 ? "" : textureIndex + 1}.png, 纹理已加载: ${!!floorTexture}`);
    } else if (floor.id === 0) {
      console.log(`[楼层纹理] 楼层 ID: ${floor.id} (地基), 使用纯色，不使用纹理`);
    } else {
      console.log(`[楼层纹理] 楼层 ID: ${floor.id}, 纹理未加载，使用纯色`);
    }

    const material = new THREE.SpriteMaterial({
      map: floorTexture,
      color: floorTexture ? 0xffffff : this.getFloorColor(floor.phase),
      transparent: true,
      alphaTest: 0.9 // 提高到 0.9，只保留几乎完全不透明的像素
    });

    const sprite = new THREE.Sprite(material);

    // 设置 sprite 的缩放以匹配楼层尺寸
    sprite.scale.set(floor.width * FLOOR_DISPLAY_SCALE, floor.height * FLOOR_DISPLAY_SCALE, 1);
    sprite.position.set(floor.position.x, floor.position.y, 0);

    this.scene.add(sprite);
    floor.sprite = sprite;
    this.floorSprites.push(sprite);
  }

  /**
   * Get floor color based on phase
   */
  getFloorColor(phase) {
    const colors = [
      0x4A90E2, // Phase 1: Blue
      0xE8B84D, // Phase 2: Gold
      0xE24A90, // Phase 3: Pink
      0x9B4AE2, // Phase 4: Purple
      0x4AE2B8  // Phase 5: Cyan
    ];
    return colors[phase - 1] || colors[0];
  }

  /**
   * Handle window resize
   */
  onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    const viewSize = 20;

    this.camera.left = -viewSize * aspect / 2;
    this.camera.right = viewSize * aspect / 2;
    this.camera.top = viewSize / 2;
    this.camera.bottom = -viewSize / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Render the scene
   */
  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
