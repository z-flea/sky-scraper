/**
 * Scene Manager
 *
 * Manages Three.js scene, renderer, and floor rendering
 */

import * as THREE from 'three';

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
    this.craneArm = null;
    this.craneCable = null;
    this.craneHook = null;

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
   * Create crane visualization
   */
  createCrane() {
    // Create crane arm (horizontal beam)
    const armGeometry = new THREE.PlaneGeometry(0.3, 8);
    const armMaterial = new THREE.MeshBasicMaterial({
      color: 0x333333,
      side: THREE.DoubleSide
    });
    this.craneArm = new THREE.Mesh(armGeometry, armMaterial);
    this.craneArm.rotation.z = Math.PI / 2; // Rotate to horizontal
    this.scene.add(this.craneArm);

    // Create cable (vertical line)
    const cableMaterial = new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 2 });
    const cableGeometry = new THREE.BufferGeometry();
    const cablePositions = new Float32Array([
      0, 0, 0,  // Start point
      0, -5, 0  // End point
    ]);
    cableGeometry.setAttribute('position', new THREE.BufferAttribute(cablePositions, 3));
    this.craneCable = new THREE.Line(cableGeometry, cableMaterial);
    this.scene.add(this.craneCable);

    // Create hook (small box)
    const hookGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const hookMaterial = new THREE.MeshBasicMaterial({ color: 0x444444 });
    this.craneHook = new THREE.Mesh(hookGeometry, hookMaterial);
    this.scene.add(this.craneHook);
  }

  /**
   * Update crane position
   */
  updateCrane(craneX, craneY, floorY) {
    if (!this.craneArm || !this.craneCable || !this.craneHook) return;

    // Update arm position (fixed Y, follows crane X)
    this.craneArm.position.set(craneX, craneY + 1, 0.1);

    // Update cable position and length
    const cableLength = craneY - floorY;
    const cablePositions = this.craneCable.geometry.attributes.position.array;
    cablePositions[0] = craneX;
    cablePositions[1] = craneY;
    cablePositions[2] = 0.1;
    cablePositions[3] = craneX;
    cablePositions[4] = floorY;
    cablePositions[5] = 0.1;
    this.craneCable.geometry.attributes.position.needsUpdate = true;

    // Update hook position
    this.craneHook.position.set(craneX, floorY - 0.3, 0.1);
  }

  /**
   * Add a floor to the scene
   */
  addFloor(floor) {
    // Create a simple colored rectangle as placeholder
    const geometry = new THREE.PlaneGeometry(floor.width, floor.height);
    const material = new THREE.MeshBasicMaterial({
      color: this.getFloorColor(floor.phase),
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(floor.position.x, floor.position.y, 0);

    // Add outline
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x000000 })
    );
    mesh.add(line);

    this.scene.add(mesh);
    floor.sprite = mesh;
    this.floorSprites.push(mesh);
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
