import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Chord } from '../music/chords.ts';

interface ColumnState {
  height: number;
  target: number;
  baseBrightness: number;
  highlight: number;
}

export class SceneManager {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  private readonly renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  private readonly controls: OrbitControls;
  private readonly columns: THREE.InstancedMesh;
  private readonly states = new Map<string, ColumnState>();
  private readonly chords: Chord[];
  private readonly clock = new THREE.Clock();
  private animationFrame = 0;

  constructor(container: HTMLElement, chords: Chord[]) {
    this.chords = chords;
    this.scene.background = new THREE.Color('#090909');
    this.scene.fog = new THREE.Fog('#090909', 34, 70);

    const cameraTarget = this.getColumnCenter();
    this.camera.position.copy(cameraTarget.clone().add(new THREE.Vector3(21, 23, 26)));
    this.camera.lookAt(cameraTarget);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;
    this.controls.minDistance = 15;
    this.controls.maxDistance = 36;
    this.controls.target.copy(cameraTarget);
    this.controls.update();

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.scene.add(new THREE.HemisphereLight('#d7d7d7', '#141414', 1.35));
    const keyLight = new THREE.DirectionalLight('#ffffff', 2.8);
    keyLight.position.set(-10, 20, 12);
    this.scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight('#888888', 1.35);
    fillLight.position.set(12, 8, -15);
    this.scene.add(fillLight);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(31, 31),
      new THREE.MeshStandardMaterial({ color: '#111214', roughness: 0.96, metalness: 0 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.02;
    this.scene.add(floor);

    const geometry = new THREE.BoxGeometry(0.78, 1, 0.78);
    const material = new THREE.MeshStandardMaterial({ color: '#b0b0b0', roughness: 0.93, metalness: 0 });
    this.columns = new THREE.InstancedMesh(geometry, material, chords.length);
    this.columns.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.columns);

    chords.forEach((chord, index) => {
      this.states.set(chord.id, {
        height: 0,
        target: 0,
        baseBrightness: 0.16,
        highlight: 0,
      });
      this.setColumnTransform(index, chord, 0, this.gray(0.16));
    });
    this.resize();
    window.addEventListener('resize', this.resize);
    this.render();
  }

  activate(chord: Chord, brightness: number): void {
    const state = this.states.get(chord.id);
    if (!state) return;
    state.target = chord.height;
    state.baseBrightness = brightness;
    state.highlight = 1;
  }

  reset(): void {
    this.chords.forEach((chord, index) => {
      const state = this.states.get(chord.id);
      if (state) {
        state.height = 0;
        state.target = 0;
        state.baseBrightness = 0.16;
        state.highlight = 0;
        this.setColumnTransform(index, chord, 0, this.gray(0.16));
      }
    });
    this.columns.instanceMatrix.needsUpdate = true;
  }

  resetView(): void {
    const target = this.getColumnCenter();
    this.camera.position.copy(target.clone().add(new THREE.Vector3(-22, 24, 22)));
    this.controls.target.copy(target);
    this.controls.update();
  }

  dispose(): void {
    cancelAnimationFrame(this.animationFrame);
    window.removeEventListener('resize', this.resize);
    this.controls.dispose();
    this.renderer.dispose();
    this.columns.geometry.dispose();
    (this.columns.material as THREE.Material).dispose();
  }

  private readonly resize = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

  private readonly render = (): void => {
    this.animationFrame = requestAnimationFrame(this.render);
    const delta = Math.min(this.clock.getDelta(), 0.08);
    this.chords.forEach((chord, index) => {
      const state = this.states.get(chord.id);
      if (!state) return;
      state.height += (state.target - state.height) * Math.min(1, delta * 9);
      state.highlight = Math.max(0, state.highlight - delta * 3.2);
      const displayBrightness = state.baseBrightness + (1 - state.baseBrightness) * state.highlight;
      const displayColor = this.gray(displayBrightness);
      this.setColumnTransform(index, chord, state.height, displayColor);
    });
    this.columns.instanceMatrix.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
  };

  private setColumnTransform(index: number, chord: Chord, height: number, color: THREE.Color): void {
    const spacing = 1.38;
    const x = (chord.gridX - 6.5) * spacing;
    const z = (chord.gridY - 5.5) * spacing;
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(x, height / 2, z),
      new THREE.Quaternion(),
      new THREE.Vector3(1, Math.max(height, 0.002), 1),
    );
    this.columns.setMatrixAt(index, matrix);
    this.columns.setColorAt(index, color);
    if (this.columns.instanceColor) this.columns.instanceColor.needsUpdate = true;
  }

  private gray(brightness: number): THREE.Color {
    return new THREE.Color(brightness, brightness, brightness);
  }

  private getColumnCenter(): THREE.Vector3 {
    const center = new THREE.Vector3();
    this.chords.forEach((chord) => {
      center.x += (chord.gridX - 6.5) * 1.38;
      center.z += (chord.gridY - 5.5) * 1.38;
    });
    center.divideScalar(this.chords.length);
    center.y = 1;
    return center;
  }
}
