/**
 * Scene Manager
 *
 * Manages Three.js scene, renderer, and floor rendering
 */

import * as THREE from 'three';

// 楼层显示缩放比例
const FLOOR_DISPLAY_SCALE = 0.51;

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
    // 背景将使用背景图片，不设置纯色背景
    // this.scene.background = new THREE.Color(0x87CEEB); // Sky blue

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

    // Background sprite
    this.backgroundSprites = []; // 改为数组，支持多张背景
    this.isAddingBackground = false; // 防止重复添加背景的标记

    // Cloud sprites
    this.cloudSprites = [];

    // Balloon sprites
    this.balloonSprites = [];

    // Satellite sprites
    this.satelliteSprites = [];

    // Star sprites
    this.starSprites = [];

    // Saturn sprite
    this.saturnSprite = null;

    // Texture loader
    this.textureLoader = new THREE.TextureLoader();
    this.floorTextures = []; // 存储四种楼层纹理
    this.foundationTexture = null; // 地基纹理
    this.isTextureLoaded = false;
    this.texturesLoadedCount = 0;

    // Initialize crane visualization
    this.createCrane();

    // Initialize background
    this.createBackground();

    // Initialize clouds
    this.createClouds();

    // Initialize balloons
    this.createBalloons();

    // Initialize satellites
    this.createSatellites();

    // Initialize Saturn
    this.createSaturn();

    // Initialize stars
    this.createStars();
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
      '/assets/sprites/dom/dom1.PNG',
      '/assets/sprites/dom/dom2.PNG',
      '/assets/sprites/dom/dom3.PNG',
      '/assets/sprites/dom/dom4.PNG',
      '/assets/sprites/dom/dom5.PNG',
      '/assets/sprites/dom/dom6.PNG'
    ];

    const totalTextures = textureFiles.length + 1; // +1 for foundation texture

    // Load foundation texture
    this.textureLoader.load(
      '/assets/sprites/dom/foundation.png',
      (texture) => {
        console.log('地基纹理加载成功');
        texture.premultipliedAlpha = false;
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;

        // 裁剪纹理，只显示底部的草地平台部分，使顶部对应视觉中心
        const contentRatioY = 0.35;
        texture.repeat.set(1.0, contentRatioY);
        texture.offset.set(0, 0); // 从底部开始（纹理坐标 y=0 是底部）

        this.foundationTexture = texture;
        this.texturesLoadedCount++;

        if (this.texturesLoadedCount === totalTextures) {
          this.isTextureLoaded = true;
          if (onComplete) onComplete();
        }
      },
      undefined,
      (error) => {
        console.error('地基纹理加载失败:', error);
        this.texturesLoadedCount++;
        if (this.texturesLoadedCount === totalTextures) {
          this.isTextureLoaded = true;
          if (onComplete) onComplete();
        }
      }
    );

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
   * 创建缓冲背景（用于视差滚动时避免露出底部）
   * 加载 bg0.JPG 图片作为缓冲背景
   */
  createBufferBackground(width, height, baseY) {
    const parallaxFactor = 0.3;

    // 创建 sprite material（先不设置纹理）
    const material = new THREE.SpriteMaterial({
      transparent: false,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.z = -10;

    // 异步加载纹理
    this.textureLoader.load(
      '/assets/sprites/dom/bg0.JPG',
      (texture) => {
        console.log('缓冲背景纹理加载成功: bg0.JPG');
        material.map = texture;
        material.needsUpdate = true;

        // 设置 sprite 尺寸
        sprite.scale.set(width, height, 1);
        sprite.userData.baseY = baseY;
        sprite.userData.height = height;

        // 立即更新位置（基于当前相机位置）
        const cameraOffsetY = this.camera.position.y * parallaxFactor;
        sprite.position.y = baseY + cameraOffsetY;

        console.log(`缓冲背景创建: baseY=${baseY.toFixed(2)}, height=${height.toFixed(2)}, 当前Y=${sprite.position.y.toFixed(2)}`);
      },
      undefined,
      (error) => {
        console.error('缓冲背景纹理加载失败:', error);
        // 加载失败时使用天蓝色作为后备
        material.color.set(0x87CEEB);
        sprite.scale.set(width, height, 1);
        sprite.userData.baseY = baseY;
        sprite.userData.height = height;

        const cameraOffsetY = this.camera.position.y * parallaxFactor;
        sprite.position.y = baseY + cameraOffsetY;
      }
    );

    return sprite;
  }

  /**
   * Create background sprite
   */
  createBackground() {
    // 背景图片列表（按数字顺序拼接）
    const bgImages = [
      '/assets/sprites/dom/bg1.png',
      '/assets/sprites/dom/bg2.png',
      '/assets/sprites/dom/bg3.png',
      '/assets/sprites/dom/bg4.jpg',
      '/assets/sprites/dom/bg5.jpg',
      '/assets/sprites/dom/bg6.jpg'
    ];

    // bg6 需要循环显示，预先计算需要多少个 bg6 实例
    // 游戏可能达到 400+ 层，相机最高位置约 2000
    // bg6 从 bg5 之后开始，需要足够多的 bg6 实例
    const bg6RepeatCount = 40;
    for (let i = 0; i < bg6RepeatCount; i++) {
      bgImages.push('/assets/sprites/dom/bg6.jpg');
    }

    const viewSize = 20;
    const screenAspect = window.innerWidth / window.innerHeight;
    const bgWidth = viewSize * screenAspect;

    // 计算需要的缓冲高度（支持 400+ 层）
    const maxCameraY = 2000; // 预估最高相机位置（400层 × 5 + 余量）
    const bufferHeight = maxCameraY * 0.7; // 速度差 70%

    // 创建缓冲背景（使用 bg0.JPG 图片）
    const bufferCenterY = -viewSize / 2 - bufferHeight / 2;
    const bufferBg = this.createBufferBackground(bgWidth, bufferHeight, bufferCenterY);

    this.scene.add(bufferBg);
    this.backgroundSprites.push(bufferBg);

    // 使用 Promise 链确保背景按顺序加载和定位
    // 第一张背景的底部应该从相机视野底部开始
    const cameraBottom = -viewSize / 2; // 相机视野底部 y = -10
    let loadPromise = Promise.resolve(cameraBottom); // 初始 Y 位置为相机底部

    bgImages.forEach((imagePath, index) => {
      // Create background sprite
      const bgMaterial = new THREE.SpriteMaterial({
        transparent: false,
        depthWrite: false
      });
      const bgSprite = new THREE.Sprite(bgMaterial);

      // 放置在最后面
      bgSprite.position.z = -10;

      this.scene.add(bgSprite);
      this.backgroundSprites.push(bgSprite);

      // 链式加载，确保顺序
      loadPromise = loadPromise.then((currentY) => {
        return new Promise((resolve) => {
          this.textureLoader.load(
            imagePath,
            (texture) => {
              console.log(`背景纹理 ${index} 加载成功: ${imagePath}`);
              bgMaterial.map = texture;
              bgMaterial.needsUpdate = true;

              // 根据纹理实际尺寸和相机视野来设置背景大小
              const textureAspect = texture.image.width / texture.image.height;

              // 背景宽度刚好适配屏幕宽度
              const bgHeight = bgWidth / textureAspect;

              bgSprite.scale.set(bgWidth, bgHeight, 1);

              // 设置垂直位置数据
              // 注意：Sprite 的 position 是其中心点
              // currentY 是上一张背景的底部位置
              // 当前背景的中心应该在：currentY + bgHeight / 2
              const centerY = currentY + bgHeight / 2;
              bgSprite.userData.baseY = centerY;
              bgSprite.userData.height = bgHeight;

              // 立即更新位置（基于当前相机位置）
              const parallaxFactor = 0.3;
              const cameraOffsetY = this.camera.position.y * parallaxFactor;
              bgSprite.position.y = bgSprite.userData.baseY + cameraOffsetY;

              console.log(`背景 ${index} 尺寸设置: 宽=${bgWidth.toFixed(2)}, 高=${bgHeight.toFixed(2)}, centerY=${centerY.toFixed(2)}, 当前Y=${bgSprite.position.y.toFixed(2)}`);

              // 返回下一张背景的起始 Y 位置（当前背景的底部）
              resolve(currentY + bgHeight);
            },
            undefined,
            (error) => {
              console.error(`背景纹理 ${index} 加载失败:`, error);
              // 加载失败时使用天蓝色作为后备
              bgMaterial.color.set(0x87CEEB);
              // 设置默认尺寸
              const bgHeight = bgWidth;
              bgSprite.scale.set(bgWidth, bgHeight, 1);
              bgSprite.userData.baseY = currentY;
              bgSprite.userData.height = bgHeight;
              resolve(currentY + bgHeight);
            }
          );
        });
      });
    });
  }

  /**
   * Create clouds that move horizontally across the screen
   */
  createClouds() {
    // 延迟创建云，等待背景图片加载完成
    // 使用 setTimeout 确保背景图片的 userData 已经设置
    setTimeout(() => {
      this._createCloudsInternal();
    }, 1000);
  }

  _createCloudsInternal() {
    const viewSize = 20;
    const screenAspect = window.innerWidth / window.innerHeight;
    const viewWidth = viewSize * screenAspect;

    // 从 backgroundSprites 中获取 bg2 和 bg3 的实际位置
    // backgroundSprites[0] 是缓冲背景 (bg0)
    // backgroundSprites[1] 是 bg1
    // backgroundSprites[2] 是 bg2
    // backgroundSprites[3] 是 bg3
    const bg2 = this.backgroundSprites[2];
    const bg3 = this.backgroundSprites[3];

    // 如果背景还没加载完成，再次延迟
    if (!bg2 || !bg3 || !bg2.userData.baseY || !bg3.userData.baseY) {
      console.log('背景图片还未加载完成，延迟创建云');
      setTimeout(() => {
        this._createCloudsInternal();
      }, 500);
      return;
    }

    // Load cloud texture
    this.textureLoader.load(
      '/assets/sprites/dom/cloud.PNG',
      (texture) => {
        console.log('云纹理加载成功');
        texture.premultipliedAlpha = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const textureAspect = texture.image.width / texture.image.height;

        // 使用实际的背景图片位置来定义云的生成区域
        const cloudRegions = [
          {
            name: 'bg2',
            startY: bg2.userData.baseY - bg2.userData.height / 2,
            endY: bg2.userData.baseY + bg2.userData.height / 2,
            rangeStart: 0.5,
            rangeEnd: 1.0,
            count: 4
          },
          {
            name: 'bg3',
            startY: bg3.userData.baseY - bg3.userData.height / 2,
            endY: bg3.userData.baseY + bg3.userData.height / 2,
            rangeStart: 0.0,
            rangeEnd: 1.0,
            count: 6
          }
        ];

        let totalClouds = 0;

        cloudRegions.forEach((region) => {
          const regionHeight = region.endY - region.startY;
          const cloudRangeStart = region.startY + regionHeight * region.rangeStart;
          const cloudRangeEnd = region.startY + regionHeight * region.rangeEnd;
          const cloudRangeHeight = cloudRangeEnd - cloudRangeStart;

          for (let i = 0; i < region.count; i++) {
            const cloudMaterial = new THREE.SpriteMaterial({
              map: texture,
              transparent: true,
              opacity: 0.6 + Math.random() * 0.2,
              depthWrite: false
            });
            const cloudSprite = new THREE.Sprite(cloudMaterial);

            const sizeVariation = 0.8 + Math.random() * 0.4;
            const cloudWidth = viewWidth * 0.25 * sizeVariation;
            const cloudHeight = cloudWidth / textureAspect;
            cloudSprite.scale.set(cloudWidth, cloudHeight, 1);

            const segmentHeight = cloudRangeHeight / region.count;
            const segmentStart = cloudRangeStart + i * segmentHeight;
            const segmentEnd = segmentStart + segmentHeight;
            const startY = segmentStart + Math.random() * (segmentEnd - segmentStart);

            const startX = -viewWidth / 2 - cloudWidth + (i * viewWidth * 1.5 / region.count);
            cloudSprite.position.set(startX, startY, -6);

            cloudSprite.userData.speed = 0.3 + Math.random() * 0.3;
            cloudSprite.userData.viewWidth = viewWidth;
            cloudSprite.userData.cloudWidth = cloudWidth;
            cloudSprite.userData.baseY = startY;

            this.scene.add(cloudSprite);
            this.cloudSprites.push(cloudSprite);
            totalClouds++;
          }

          console.log(`在 ${region.name} 创建了 ${region.count} 个云精灵，Y 位置范围: ${cloudRangeStart.toFixed(1)} - ${cloudRangeEnd.toFixed(1)}`);
        });

        console.log(`总共创建了 ${totalClouds} 个云精灵`);
      },
      undefined,
      (error) => {
        console.error('云纹理加载失败:', error);
      }
    );
  }

  /**
   * Create balloons that move vertically (up and down)
   */
  createBalloons() {
    const viewSize = 20;
    const screenAspect = window.innerWidth / window.innerHeight;
    const viewWidth = viewSize * screenAspect;

    // Load balloon texture
    this.textureLoader.load(
      '/assets/sprites/dom/balloon.PNG',
      (texture) => {
        console.log('热气球纹理加载成功');
        texture.premultipliedAlpha = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        // Create multiple balloon sprites at different positions
        const balloonCount = 3;
        const textureAspect = texture.image.width / texture.image.height;

        // 估算 bg3 的 Y 位置范围
        // bg1 高度约 35.6，bg2 高度约 37.5
        // bg3 从 bg2 顶部开始，高度约 37.5，所以 bg3 范围约为 y = 63 到 100.5
        const bg3StartY = 63;
        const bg3EndY = 101;
        const bg3Height = bg3EndY - bg3StartY;

        // 热气球在 bg3 的中部出现（从 30% 到 70% 高度）
        const balloonRangeStart = bg3StartY + bg3Height * 0.3;
        const balloonRangeEnd = bg3StartY + bg3Height * 0.7;

        for (let i = 0; i < balloonCount; i++) {
          const balloonMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.8 + Math.random() * 0.2,
            depthWrite: false
          });
          const balloonSprite = new THREE.Sprite(balloonMaterial);

          // Balloon size (smaller, varied sizes)
          const sizeVariation = 0.7 + Math.random() * 0.3;
          const balloonHeight = viewSize * 0.15 * sizeVariation;
          const balloonWidth = balloonHeight * textureAspect;
          balloonSprite.scale.set(balloonWidth, balloonHeight, 1);

          // Position balloons at different horizontal positions within bg3 range
          // z = -6 places balloons between background (-10) and floors (0)
          const startX = -viewWidth / 3 + (i * viewWidth * 0.5);
          const centerY = (balloonRangeStart + balloonRangeEnd) / 2;
          balloonSprite.position.set(startX, centerY, -6);

          // Store initial data for animation
          balloonSprite.userData.speed = 0.8 + Math.random() * 0.4;
          balloonSprite.userData.amplitude = 3 + Math.random() * 2;
          balloonSprite.userData.phase = Math.random() * Math.PI * 2;
          balloonSprite.userData.centerY = centerY;
          balloonSprite.userData.time = 0;

          this.scene.add(balloonSprite);
          this.balloonSprites.push(balloonSprite);
        }

        console.log(`创建了 ${balloonCount} 个热气球精灵，Y 位置范围: ${balloonRangeStart.toFixed(1)} - ${balloonRangeEnd.toFixed(1)} (bg3 中部)`);
      },
      undefined,
      (error) => {
        console.error('热气球纹理加载失败:', error);
      }
    );
  }

  /**
   * Create satellites that rotate around Earth (bg4)
   */
  createSatellites() {
    const viewSize = 20;
    const screenAspect = window.innerWidth / window.innerHeight;
    const viewWidth = viewSize * screenAspect;

    // Load satellite texture
    this.textureLoader.load(
      '/assets/sprites/dom/satellite.PNG',
      (texture) => {
        console.log('卫星纹理加载成功');
        texture.premultipliedAlpha = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const textureAspect = texture.image.width / texture.image.height;

        // 估算 bg4 的 Y 位置范围
        // bg1 + bg2 + bg3 约为 110，bg4 从这里开始
        // bg4 是地球背景，卫星应该在地球附近
        const bg4StartY = 101;
        const bg4Height = 40; // 估算值
        const bg4CenterY = bg4StartY + bg4Height / 2;

        // 创建 2 个卫星，左右对称
        const satelliteCount = 2;
        const satellitePositions = [
          { x: -viewWidth * 0.15, y: bg4CenterY + 3 },  // 左侧卫星，稍微偏上
          { x: viewWidth * 0.15, y: bg4CenterY - 2 }    // 右侧卫星，稍微偏下
        ];

        satellitePositions.forEach((pos, i) => {
          const satelliteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.9,
            depthWrite: false
          });
          const satelliteSprite = new THREE.Sprite(satelliteMaterial);

          // Satellite size
          const satelliteHeight = viewSize * 0.12;
          const satelliteWidth = satelliteHeight * textureAspect;
          satelliteSprite.scale.set(satelliteWidth, satelliteHeight, 1);

          // Position satellites
          // z = -6 places satellites between background (-10) and floors (0)
          satelliteSprite.position.set(pos.x, pos.y, -6);

          // Store initial data for animation
          satelliteSprite.userData.baseY = pos.y;
          satelliteSprite.userData.rotationSpeed = (i === 0 ? 0.3 : -0.25); // 左右旋转方向相反
          satelliteSprite.userData.rotation = 0;

          this.scene.add(satelliteSprite);
          this.satelliteSprites.push(satelliteSprite);
        });

        console.log(`创建了 ${satelliteCount} 个卫星精灵，位置: bg4 区域 (地球附近)`);
      },
      undefined,
      (error) => {
        console.error('卫星纹理加载失败:', error);
      }
    );
  }

  /**
   * Create Saturn that rotates in bg5 (space background)
   */
  createSaturn() {
    const viewSize = 20;

    // Load Saturn texture
    this.textureLoader.load(
      '/assets/sprites/dom/Saturn.PNG',
      (texture) => {
        console.log('土星纹理加载成功');
        texture.premultipliedAlpha = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const textureAspect = texture.image.width / texture.image.height;

        // 估算 bg5 的 Y 位置范围
        // bg1 + bg2 + bg3 + bg4 约为 180，bg5 从这里开始
        const bg5StartY = 180;
        const bg5Height = 60; // 估算值
        const bg5CenterY = bg5StartY + bg5Height / 2;

        const saturnMaterial = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          opacity: 1.0,
          depthWrite: false
        });
        this.saturnSprite = new THREE.Sprite(saturnMaterial);

        // Saturn size (larger than stars)
        const saturnHeight = viewSize * 0.35;
        const saturnWidth = saturnHeight * textureAspect;
        this.saturnSprite.scale.set(saturnWidth, saturnHeight, 1);

        // Position Saturn at center of bg5
        // z = -7 places Saturn between background (-10) and other decorations (-6)
        this.saturnSprite.position.set(0, bg5CenterY, -7);

        // Store initial data for animation
        this.saturnSprite.userData.baseY = bg5CenterY;
        this.saturnSprite.userData.rotation = 0;
        this.saturnSprite.userData.rotationSpeed = 0.3; // 顺时针旋转速度

        this.scene.add(this.saturnSprite);

        console.log(`创建了土星精灵，位置: Y = ${bg5CenterY.toFixed(1)} (bg5 中心)`);
      },
      undefined,
      (error) => {
        console.error('土星纹理加载失败:', error);
      }
    );
  }

  /**
   * Create stars that twinkle in bg5 and bg6 (space backgrounds)
   */
  createStars() {
    const viewSize = 20;
    const screenAspect = window.innerWidth / window.innerHeight;
    const viewWidth = viewSize * screenAspect;

    // Load star texture
    this.textureLoader.load(
      '/assets/sprites/dom/littlestar.PNG',
      (texture) => {
        console.log('星星纹理加载成功');
        texture.premultipliedAlpha = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const textureAspect = texture.image.width / texture.image.height;

        // 估算 bg6 的 Y 位置范围（星星只在 bg6 区域显示，不在 bg5）
        // bg1 + bg2 + bg3 + bg4 + bg5 约为 240，bg6 从这里开始
        // 40个bg6 总高度约 2200，所以星星覆盖 Y = 240 到 Y = 2440
        const starStartY = 240;
        const starEndY = 2440;
        const starRangeHeight = starEndY - starStartY;

        // 创建更多星星（250-300颗）以覆盖更大的区域
        const starCount = 250 + Math.floor(Math.random() * 51);

        for (let i = 0; i < starCount; i++) {
          const starMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.5 + Math.random() * 0.5,
            depthWrite: false
          });
          const starSprite = new THREE.Sprite(starMaterial);

          // Star size (varied sizes)
          const sizeVariation = 0.3 + Math.random() * 0.5;
          const starSize = viewSize * 0.08 * sizeVariation;
          const starWidth = starSize * textureAspect;
          const starHeight = starSize;
          starSprite.scale.set(starWidth, starHeight, 1);

          // Random position within star range
          const x = -viewWidth / 2 + Math.random() * viewWidth;
          const y = starStartY + Math.random() * starRangeHeight;
          // z = -7 places stars between background (-10) and other decorations (-6)
          starSprite.position.set(x, y, -7);

          // Store initial data for animation
          starSprite.userData.baseOpacity = 0.6 + Math.random() * 0.4;
          starSprite.userData.twinkleSpeed = 2.0 + Math.random() * 3.0;
          starSprite.userData.twinklePhase = Math.random() * Math.PI * 2;
          starSprite.userData.baseY = y;
          starSprite.userData.time = 0;
          starSprite.userData.baseScale = { x: starWidth, y: starHeight };

          this.scene.add(starSprite);
          this.starSprites.push(starSprite);
        }

        console.log(`创建了 ${starCount} 个星星精灵，Y 位置范围: ${starStartY.toFixed(1)} - ${starEndY.toFixed(1)} (bg6 区域)`);
      },
      undefined,
      (error) => {
        console.error('星星纹理加载失败:', error);
      }
    );
  }

  /**
   * Update cloud positions (horizontal movement)
   */
  updateClouds(deltaTime) {
    this.cloudSprites.forEach((cloud) => {
      // Move cloud to the right
      cloud.position.x += cloud.userData.speed * deltaTime;

      // Wrap around when cloud goes off screen
      const viewWidth = cloud.userData.viewWidth;
      const cloudWidth = cloud.userData.cloudWidth;
      if (cloud.position.x > viewWidth / 2 + cloudWidth) {
        cloud.position.x = -viewWidth / 2 - cloudWidth;
      }

      // Apply parallax effect to Y position (clouds follow camera slower than background)
      const parallaxFactor = 0.15;
      const cameraOffsetY = this.camera.position.y * parallaxFactor;
      cloud.position.y = cloud.userData.baseY + cameraOffsetY;
    });
  }

  /**
   * Update balloon positions (vertical movement - up and down)
   */
  updateBalloons(deltaTime) {
    this.balloonSprites.forEach((balloon) => {
      // Update time for sine wave motion
      balloon.userData.time += deltaTime * balloon.userData.speed;

      // Calculate vertical offset using sine wave
      const verticalOffset = Math.sin(balloon.userData.time + balloon.userData.phase) * balloon.userData.amplitude;

      // Apply parallax effect to Y position (balloons follow camera slower than background)
      const parallaxFactor = 0.15;
      const cameraOffsetY = this.camera.position.y * parallaxFactor;
      balloon.position.y = balloon.userData.centerY + verticalOffset + cameraOffsetY;
    });
  }

  /**
   * Update satellite positions (rotation animation)
   */
  updateSatellites(deltaTime) {
    this.satelliteSprites.forEach((satellite) => {
      // Update rotation
      satellite.userData.rotation += deltaTime * satellite.userData.rotationSpeed;
      satellite.material.rotation = satellite.userData.rotation;

      // Apply parallax effect to Y position (satellites follow camera slower than background)
      const parallaxFactor = 0.15;
      const cameraOffsetY = this.camera.position.y * parallaxFactor;
      satellite.position.y = satellite.userData.baseY + cameraOffsetY;
    });
  }

  /**
   * Update star positions (twinkling animation)
   */
  updateStars(deltaTime) {
    this.starSprites.forEach((star) => {
      // Update time for twinkle effect
      star.userData.time += deltaTime * star.userData.twinkleSpeed;

      // Calculate opacity using sine wave for twinkling effect (stronger effect)
      const twinkle = Math.sin(star.userData.time + star.userData.twinklePhase);
      star.material.opacity = star.userData.baseOpacity + twinkle * 0.5;

      // Add scale animation for more dynamic twinkling
      const scaleFactor = 1.0 + twinkle * 0.2;
      star.scale.set(
        star.userData.baseScale.x * scaleFactor,
        star.userData.baseScale.y * scaleFactor,
        1
      );

      // Apply parallax effect to Y position (stars follow camera slower than background)
      const parallaxFactor = 0.15;
      const cameraOffsetY = this.camera.position.y * parallaxFactor;
      star.position.y = star.userData.baseY + cameraOffsetY;
    });
  }

  /**
   * Update Saturn position (rotation animation)
   */
  updateSaturn(deltaTime) {
    if (!this.saturnSprite) return;

    // Update rotation (clockwise)
    this.saturnSprite.userData.rotation += deltaTime * this.saturnSprite.userData.rotationSpeed;
    this.saturnSprite.material.rotation = this.saturnSprite.userData.rotation;

    // Apply parallax effect to Y position (Saturn follows camera slower than background)
    const parallaxFactor = 0.15;
    const cameraOffsetY = this.camera.position.y * parallaxFactor;
    this.saturnSprite.position.y = this.saturnSprite.userData.baseY + cameraOffsetY;
  }

  /**
   * Update crane position
   */
  updateCrane(craneX, craneY, floorY) {
    if (!this.craneCable) return;

    // 调试日志
    console.log('[updateCrane] craneX:', craneX, 'craneY:', craneY, 'floorY:', floorY);

    // 楼层显示高度 = 4.0 * 0.51 = 2.04
    const floorDisplayHeight = 2.04;

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
    // 根据楼层类型选择纹理
    let floorTexture = null;
    let textureIndex = -1;

    if (floor.id === 0) {
      // 地基使用专用纹理
      floorTexture = this.foundationTexture;
      console.log(`[楼层纹理] 楼层 ID: ${floor.id} (地基), 使用地基纹理, 纹理已加载: ${!!floorTexture}`);
    } else if (this.floorTextures.length > 0) {
      // 普通楼层使用对应纹理
      textureIndex = this.getTextureIndexByFloorNumber(floor.id);
      floorTexture = this.floorTextures[textureIndex];
      console.log(`[楼层纹理] 楼层 ID: ${floor.id}, 纹理索引: ${textureIndex}, 纹理文件: dom${textureIndex + 1}.PNG, 纹理已加载: ${!!floorTexture}`);
    } else {
      console.log(`[楼层纹理] 楼层 ID: ${floor.id}, 纹理未加载，使用纯色`);
    }

    const material = new THREE.SpriteMaterial({
      map: floorTexture,
      color: floorTexture ? 0xffffff : this.getFloorColor(floor.phase),
      transparent: true,
      alphaTest: 0.9
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
   * 为 Perfect 窗口内的房子添加星星粒子效果
   */
  addPerfectWindowGlow(floor) {
    if (!floor.sprite) {
      console.warn(`[Perfect Window] 楼层 ${floor.id} 没有 sprite，无法添加星星粒子`);
      return;
    }

    console.log(`[Perfect Window] 开始为楼层 ${floor.id} 添加星星粒子`);

    // 只添加星星粒子效果
    this.addStarParticles(floor);

    console.log(`[Perfect Window] 楼层 ${floor.id} 星星粒子添加完成`);
  }

  /**
   * 为房子添加星星粒子效果
   */
  addStarParticles(floor) {
    if (!this.starTexture) {
      // 加载星星纹理
      this.textureLoader.load(
        'assets/sprites/dom/star.PNG',
        (texture) => {
          this.starTexture = texture;
          this.createStarParticlesForFloor(floor, texture);
        },
        undefined,
        (error) => {
          console.error('星星纹理加载失败:', error);
        }
      );
    } else {
      this.createStarParticlesForFloor(floor, this.starTexture);
    }
  }

  /**
   * 创建星星粒子
   */
  createStarParticlesForFloor(floor, starTexture) {
    const particleCount = 5;
    const particles = [];

    console.log(`[Perfect Window] 开始创建 ${particleCount} 个星星粒子`);

    for (let i = 0; i < particleCount; i++) {
      const particleMaterial = new THREE.SpriteMaterial({
        map: starTexture,
        transparent: true,
        opacity: 0.9,
        depthWrite: false
      });

      const particle = new THREE.Sprite(particleMaterial);
      const size = 0.5 + Math.random() * 0.3;
      particle.scale.set(size, size, 1);

      // 围绕房子的圆形轨道
      const angle = (Math.PI * 2 * i) / particleCount;
      const radius = floor.width * FLOOR_DISPLAY_SCALE * 0.7;
      particle.position.set(
        floor.position.x + Math.cos(angle) * radius,
        floor.position.y + Math.sin(angle) * radius,
        1.0
      );

      // 存储轨道信息
      particle.userData = {
        angle: angle,
        radius: radius,
        speed: 0.5 + Math.random() * 0.5,
        centerX: floor.position.x,
        centerY: floor.position.y
      };

      this.scene.add(particle);
      particles.push(particle);
    }

    floor.starParticles = particles;
    console.log(`[Perfect Window] 星星粒子创建完成，共 ${particles.length} 个`);
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

    // 更新所有背景尺寸
    const bgWidth = viewSize * aspect;
    const cameraBottom = -viewSize / 2; // 相机视野底部

    let currentBottomY = cameraBottom; // 从相机底部开始

    this.backgroundSprites.forEach((bgSprite) => {
      if (bgSprite.material.map) {
        const texture = bgSprite.material.map;
        const textureAspect = texture.image.width / texture.image.height;

        // 背景宽度刚好适配屏幕宽度
        const bgHeight = bgWidth / textureAspect;

        bgSprite.scale.set(bgWidth, bgHeight, 1);

        // 更新垂直位置（中心点）
        const centerY = currentBottomY + bgHeight / 2;
        bgSprite.userData.baseY = centerY;
        bgSprite.userData.height = bgHeight;

        // 下一张背景的底部位置
        currentBottomY += bgHeight;
      }
    });
  }

  /**
   * Update background position to follow camera with parallax effect
   */
  updateBackground() {
    if (this.backgroundSprites.length === 0) return;

    // 背景跟随相机 Y 轴移动，但速度稍慢（视差效果）
    // parallaxFactor = 0.3 表示背景移动速度是相机的 30%
    const parallaxFactor = 0.3;
    const cameraOffsetY = this.camera.position.y * parallaxFactor;

    // 更新所有背景的位置（包括缓冲背景）
    this.backgroundSprites.forEach((bgSprite) => {
      const baseY = bgSprite.userData.baseY || 0;
      bgSprite.position.y = baseY + cameraOffsetY;
    });
  }

  /**
   * Render the scene
   */
  render() {
    this.updateBackground();
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Update animations (called from game loop with deltaTime)
   */
  updateAnimations(deltaTime, floors, windowActive) {
    this.updateClouds(deltaTime);
    this.updateBalloons(deltaTime);
    this.updateSatellites(deltaTime);
    this.updateSaturn(deltaTime);
    this.updateStars(deltaTime);
    this.updatePerfectWindowEffects(deltaTime, floors, windowActive);
  }

  /**
   * 更新 Perfect 窗口效果（星星粒子）
   */
  updatePerfectWindowEffects(deltaTime, floors, windowActive) {
    if (!floors) return;

    floors.forEach((floor) => {
      // 如果时间窗口关闭且房子有星星粒子，清理它们
      if (!windowActive && floor.starParticles) {
        floor.starParticles.forEach((particle) => {
          this.scene.remove(particle);
        });
        floor.starParticles = null;
        floor.inPerfectWindow = false;
        console.log(`[Perfect Window] 清理楼层 ${floor.id} 的星星粒子`);
        return;
      }

      // 只更新有星星粒子的房子
      if (!floor || !floor.inPerfectWindow || !floor.starParticles) return;

      // 更新星星粒子旋转
      if (floor.sprite) {
        floor.starParticles.forEach((particle) => {
          particle.userData.angle += particle.userData.speed * deltaTime;

          // 使用房子的当前位置作为中心
          particle.position.x = floor.sprite.position.x + Math.cos(particle.userData.angle) * particle.userData.radius;
          particle.position.y = floor.sprite.position.y + Math.sin(particle.userData.angle) * particle.userData.radius;

          // 星星闪烁效果
          const time = Date.now() * 0.001;
          particle.material.opacity = 0.6 + Math.sin(time * 5 + particle.userData.angle) * 0.3;
        });
      }
    });
  }
}
