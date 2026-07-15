import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { LEVEL_COLUMNS } from "../core/Station.js";
import { CELL_WIDTH } from "./layout.js";

function buildStarfield() {
  const count = 1500;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const radius = 200 + Math.random() * 300;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi);
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0xaad4ff, size: 0.6, sizeAttenuation: true });
  return new THREE.Points(geometry, material);
}

export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x03050a);
    this.scene.fog = new THREE.FogExp2(0x03050a, 0.012);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(CELL_WIDTH * LEVEL_COLUMNS * 0.5, 2, 10);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(CELL_WIDTH * LEVEL_COLUMNS * 0.5, -1.5, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 60;
    this.controls.maxPolarAngle = Math.PI * 0.85;
    this.controls.update();

    this.stationGroup = new THREE.Group();
    this.scene.add(this.stationGroup);

    this._setupLighting();
    this.scene.add(buildStarfield());

    window.addEventListener("resize", () => this._onResize());

    this._clock = new THREE.Clock();
    this._tickCallbacks = [];
  }

  _setupLighting() {
    // Cool ambient fill — deep-space station interior, never fully dark.
    const hemi = new THREE.HemisphereLight(0x4a7ab0, 0x141a22, 0.9);
    this.scene.add(hemi);

    // Key light: low warm sun/emergency-light angle, casts the long moody shadows.
    const key = new THREE.DirectionalLight(0xffd9a0, 1.1);
    key.position.set(20, 25, 15);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -30;
    key.shadow.camera.right = 30;
    key.shadow.camera.top = 30;
    key.shadow.camera.bottom = -30;
    key.shadow.camera.far = 80;
    this.scene.add(key);

    // Rim light: cold blue-cyan, separates modules from the void behind them.
    const rim = new THREE.DirectionalLight(0x4fd8ff, 0.5);
    rim.position.set(-15, 5, -20);
    this.scene.add(rim);
  }

  onTick(fn) {
    this._tickCallbacks.push(fn);
  }

  start() {
    const loop = () => {
      requestAnimationFrame(loop);
      const dt = this._clock.getDelta();
      this.controls.update();
      for (const fn of this._tickCallbacks) fn(dt);
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
