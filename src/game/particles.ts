import * as THREE from 'three';

export type ParticleBurstKind = 'hit' | 'crit' | 'burn' | 'poison' | 'shrine';

const MAX_PARTICLES = 320;

function createSoftParticleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.85)');
  grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.25)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export class CombatParticleSystem {
  private points: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private texture: THREE.CanvasTexture;

  private positions = new Float32Array(MAX_PARTICLES * 3);
  private colors = new Float32Array(MAX_PARTICLES * 3);
  private vx = new Float32Array(MAX_PARTICLES);
  private vy = new Float32Array(MAX_PARTICLES);
  private vz = new Float32Array(MAX_PARTICLES);
  private gravity = new Float32Array(MAX_PARTICLES);
  private age = new Float32Array(MAX_PARTICLES);
  private maxLife = new Float32Array(MAX_PARTICLES);
  private baseR = new Float32Array(MAX_PARTICLES);
  private baseG = new Float32Array(MAX_PARTICLES);
  private baseB = new Float32Array(MAX_PARTICLES);
  private cursor = 0;

  constructor(scene: THREE.Scene) {
    // Park inactive slots far below world
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.positions[i * 3 + 1] = -999;
      this.age[i] = 1;
      this.maxLife[i] = 1;
    }

    this.geometry = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(this.positions, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    const colAttr = new THREE.BufferAttribute(this.colors, 3);
    colAttr.setUsage(THREE.DynamicDrawUsage);

    this.geometry.setAttribute('position', posAttr);
    this.geometry.setAttribute('color', colAttr);

    this.texture = createSoftParticleTexture();
    this.material = new THREE.PointsMaterial({
      size: 0.34,
      map: this.texture,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 10;
    scene.add(this.points);
  }

  public emitBurst(kind: ParticleBurstKind, x: number, y: number, z: number, countOverride?: number): void {
    const count =
      countOverride ??
      (kind === 'crit' ? 28 : kind === 'shrine' ? 26 : kind === 'hit' ? 10 : 8);

    for (let n = 0; n < count; n++) {
      const idx = this.cursor;
      this.cursor = (this.cursor + 1) % MAX_PARTICLES;

      const angle = Math.random() * Math.PI * 2;
      let speed = 1.5;
      let upVel = 1.5;
      let grav = 5.0;
      let life = 0.45;
      let r = 1;
      let g = 1;
      let b = 1;
      let spread = 0.25;

      if (kind === 'crit') {
        speed = 2.6 + Math.random() * 3.8;
        upVel = 1.8 + Math.random() * 3.4;
        grav = 6.5;
        life = 0.42 + Math.random() * 0.28;
        spread = 0.22;
        const hot = Math.random();
        if (hot > 0.65) {
          // Bright white-gold core spark
          r = 1.0;
          g = 0.96;
          b = 0.72;
        } else {
          // Amber-gold burst
          r = 1.0;
          g = 0.72 + Math.random() * 0.2;
          b = 0.14;
        }
      } else if (kind === 'hit') {
        speed = 1.4 + Math.random() * 2.2;
        upVel = 0.9 + Math.random() * 1.8;
        grav = 6.0;
        life = 0.24 + Math.random() * 0.16;
        spread = 0.18;
        r = 1.0;
        g = 0.85;
        b = 0.7;
      } else if (kind === 'burn') {
        speed = 0.4 + Math.random() * 0.95;
        upVel = 1.6 + Math.random() * 1.8;
        grav = -1.1; // Rises like fire embers
        life = 0.48 + Math.random() * 0.32;
        spread = 0.45;
        r = 1.0;
        g = 0.28 + Math.random() * 0.42;
        b = 0.05;
      } else if (kind === 'poison') {
        speed = 0.35 + Math.random() * 0.85;
        upVel = 0.85 + Math.random() * 1.15;
        grav = -0.35; // Gently floats upward
        life = 0.6 + Math.random() * 0.35;
        spread = 0.5;
        r = 0.28 + Math.random() * 0.22;
        g = 0.95;
        b = 0.22 + Math.random() * 0.15;
      } else if (kind === 'shrine') {
        speed = 0.7 + Math.random() * 1.8;
        upVel = 1.9 + Math.random() * 2.5;
        grav = -0.85; // Spirals upward with arcane energy
        life = 0.55 + Math.random() * 0.35;
        spread = 0.75;
        const bright = Math.random() > 0.55;
        r = bright ? 0.72 : 0.22;
        g = bright ? 0.95 : 0.78;
        b = 1.0;
      }

      this.positions[idx * 3] = x + (Math.random() - 0.5) * spread;
      this.positions[idx * 3 + 1] = y + (Math.random() - 0.5) * spread;
      this.positions[idx * 3 + 2] = z + (Math.random() - 0.5) * spread;

      this.vx[idx] = Math.cos(angle) * speed;
      this.vy[idx] = upVel;
      this.vz[idx] = Math.sin(angle) * speed;
      this.gravity[idx] = grav;
      this.age[idx] = 0;
      this.maxLife[idx] = life;

      this.baseR[idx] = r;
      this.baseG[idx] = g;
      this.baseB[idx] = b;
      this.colors[idx * 3] = r;
      this.colors[idx * 3 + 1] = g;
      this.colors[idx * 3 + 2] = b;
    }
  }

  public update(dt: number): void {
    let anyActive = false;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const life = this.maxLife[i];
      if (this.age[i] >= life) continue;

      anyActive = true;
      this.age[i] += dt;
      const t = this.age[i] / life;

      if (t >= 1) {
        this.positions[i * 3 + 1] = -999;
        this.colors[i * 3] = 0;
        this.colors[i * 3 + 1] = 0;
        this.colors[i * 3 + 2] = 0;
        continue;
      }

      this.vy[i] -= this.gravity[i] * dt;
      this.positions[i * 3] += this.vx[i] * dt;
      this.positions[i * 3 + 1] += this.vy[i] * dt;
      this.positions[i * 3 + 2] += this.vz[i] * dt;

      // Fade intensity smoothly toward end of life
      const fade = 1 - t * t;
      this.colors[i * 3] = this.baseR[i] * fade;
      this.colors[i * 3 + 1] = this.baseG[i] * fade;
      this.colors[i * 3 + 2] = this.baseB[i] * fade;
    }

    if (anyActive) {
      (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (this.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    }
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.texture.dispose();
  }
}
