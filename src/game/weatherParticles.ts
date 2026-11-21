import * as THREE from 'three';
import { WeatherType } from './types';

const VOLUME_XZ = 46;
const HALF_XZ = VOLUME_XZ * 0.5;
const VOLUME_Y = 21;

const RAIN_COUNT = 1100;
const SPLASH_COUNT = 260;
const SNOW_COUNT = 900;
const ASH_COUNT = 960;

function createSnowflakeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(32, 32, 1, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.28, 'rgba(235, 246, 255, 0.92)');
  grad.addColorStop(0.62, 'rgba(198, 226, 255, 0.35)');
  grad.addColorStop(1, 'rgba(180, 215, 255, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  // Subtle 6-point crystal gleam at center
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(32 - Math.cos(a) * 14, 32 - Math.sin(a) * 14);
    ctx.lineTo(32 + Math.cos(a) * 14, 32 + Math.sin(a) * 14);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createAshEmberTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 28);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.38, 'rgba(255, 232, 200, 0.78)');
  grad.addColorStop(0.75, 'rgba(255, 175, 120, 0.22)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function wrapCoord(val: number, center: number, span: number): number {
  const half = span * 0.5;
  let rel = val - center;
  if (rel > half) {
    rel = ((rel + half) % span) - half;
  } else if (rel < -half) {
    rel = span - ((-rel - half) % span) - half;
  }
  return center + rel;
}

export class WeatherParticleSystem {
  private pixelRatio: number;

  // Rain streaks + ground splash drops
  private rainGroup: THREE.Group;
  private rainLines: THREE.LineSegments;
  private rainLineGeom: THREE.BufferGeometry;
  private rainLineMat: THREE.LineBasicMaterial;
  private rainPositions = new Float32Array(RAIN_COUNT * 2 * 3);
  private rainBaseX = new Float32Array(RAIN_COUNT);
  private rainBaseY = new Float32Array(RAIN_COUNT);
  private rainBaseZ = new Float32Array(RAIN_COUNT);
  private rainSpeed = new Float32Array(RAIN_COUNT);
  private rainLength = new Float32Array(RAIN_COUNT);

  private splashPoints: THREE.Points;
  private splashGeom: THREE.BufferGeometry;
  private splashMat: THREE.PointsMaterial;
  private splashPositions = new Float32Array(SPLASH_COUNT * 3);
  private splashAge = new Float32Array(SPLASH_COUNT);
  private splashLife = new Float32Array(SPLASH_COUNT);
  private splashVelY = new Float32Array(SPLASH_COUNT);
  private splashVelX = new Float32Array(SPLASH_COUNT);
  private splashVelZ = new Float32Array(SPLASH_COUNT);

  // Snowflakes
  private snowTexture: THREE.CanvasTexture;
  private snowGeom: THREE.BufferGeometry;
  private snowMat: THREE.ShaderMaterial;
  private snowPoints: THREE.Points;
  private snowPositions = new Float32Array(SNOW_COUNT * 3);
  private snowSpeed = new Float32Array(SNOW_COUNT);
  private snowPhase = new Float32Array(SNOW_COUNT);
  private snowSwayAmp = new Float32Array(SNOW_COUNT);
  private snowSizes = new Float32Array(SNOW_COUNT);
  private snowAlpha = new Float32Array(SNOW_COUNT);

  // Ash & Embers (Tormenta de Ceniza)
  private ashTexture: THREE.CanvasTexture;
  private ashGeom: THREE.BufferGeometry;
  private ashMat: THREE.ShaderMaterial;
  private ashPoints: THREE.Points;
  private ashPositions = new Float32Array(ASH_COUNT * 3);
  private ashColors = new Float32Array(ASH_COUNT * 3);
  private ashVelY = new Float32Array(ASH_COUNT);
  private ashDriftScale = new Float32Array(ASH_COUNT);
  private ashPhase = new Float32Array(ASH_COUNT);
  private ashSizes = new Float32Array(ASH_COUNT);
  private ashIsEmber = new Uint8Array(ASH_COUNT);
  private ashAlpha = new Float32Array(ASH_COUNT);

  private rainIntensity = 0;
  private snowIntensity = 0;
  private ashIntensity = 0;

  constructor(scene: THREE.Scene, pixelRatio = 1) {
    this.pixelRatio = pixelRatio;

    // ------------------------------------------------------------
    // 1. RAIN SYSTEM (3D LineSegments + Ground Splash Points)
    // ------------------------------------------------------------
    this.rainGroup = new THREE.Group();
    this.rainGroup.visible = false;
    scene.add(this.rainGroup);

    const rainColors = new Float32Array(RAIN_COUNT * 2 * 3);
    for (let i = 0; i < RAIN_COUNT; i++) {
      const rx = (Math.random() - 0.5) * VOLUME_XZ;
      const ry = Math.random() * VOLUME_Y;
      const rz = (Math.random() - 0.5) * VOLUME_XZ;
      this.rainBaseX[i] = rx;
      this.rainBaseY[i] = ry;
      this.rainBaseZ[i] = rz;
      this.rainSpeed[i] = 22 + Math.random() * 10;
      this.rainLength[i] = 0.72 + Math.random() * 0.65;

      // Top vertex slightly dimmer, bottom tip crisp pale sky-blue
      const i6 = i * 6;
      rainColors[i6] = 0.52;
      rainColors[i6 + 1] = 0.68;
      rainColors[i6 + 2] = 0.88;
      rainColors[i6 + 3] = 0.82;
      rainColors[i6 + 4] = 0.92;
      rainColors[i6 + 5] = 1.0;
    }

    this.rainLineGeom = new THREE.BufferGeometry();
    const rainPosAttr = new THREE.BufferAttribute(this.rainPositions, 3);
    rainPosAttr.setUsage(THREE.DynamicDrawUsage);
    this.rainLineGeom.setAttribute('position', rainPosAttr);
    this.rainLineGeom.setAttribute('color', new THREE.BufferAttribute(rainColors, 3));

    this.rainLineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    this.rainLines = new THREE.LineSegments(this.rainLineGeom, this.rainLineMat);
    this.rainLines.frustumCulled = false;
    this.rainLines.renderOrder = 8;
    this.rainGroup.add(this.rainLines);

    // Rain ground splashes
    this.snowTexture = createSnowflakeTexture();
    for (let i = 0; i < SPLASH_COUNT; i++) {
      this.splashPositions[i * 3] = (Math.random() - 0.5) * 28;
      this.splashPositions[i * 3 + 1] = -999;
      this.splashPositions[i * 3 + 2] = (Math.random() - 0.5) * 28;
      this.splashAge[i] = Math.random() * 0.45;
      this.splashLife[i] = 0.25 + Math.random() * 0.25;
      this.splashVelY[i] = 1.4 + Math.random() * 1.4;
      this.splashVelX[i] = (Math.random() - 0.5) * 1.5;
      this.splashVelZ[i] = (Math.random() - 0.5) * 1.5;
    }
    this.splashGeom = new THREE.BufferGeometry();
    const splashPosAttr = new THREE.BufferAttribute(this.splashPositions, 3);
    splashPosAttr.setUsage(THREE.DynamicDrawUsage);
    this.splashGeom.setAttribute('position', splashPosAttr);

    this.splashMat = new THREE.PointsMaterial({
      size: 0.16,
      map: this.snowTexture,
      color: 0xbfe2ff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.splashPoints = new THREE.Points(this.splashGeom, this.splashMat);
    this.splashPoints.frustumCulled = false;
    this.splashPoints.renderOrder = 9;
    this.rainGroup.add(this.splashPoints);

    // ------------------------------------------------------------
    // 2. SNOW SYSTEM (Drifting Soft 3D Snowflakes Shader)
    // ------------------------------------------------------------
    for (let i = 0; i < SNOW_COUNT; i++) {
      this.snowPositions[i * 3] = (Math.random() - 0.5) * VOLUME_XZ;
      this.snowPositions[i * 3 + 1] = Math.random() * VOLUME_Y;
      this.snowPositions[i * 3 + 2] = (Math.random() - 0.5) * VOLUME_XZ;
      this.snowSpeed[i] = 1.85 + Math.random() * 1.95;
      this.snowPhase[i] = Math.random() * Math.PI * 2;
      this.snowSwayAmp[i] = 0.55 + Math.random() * 1.15;
      this.snowSizes[i] = 12 + Math.random() * 18;
      this.snowAlpha[i] = 0.55 + Math.random() * 0.45;
    }

    this.snowGeom = new THREE.BufferGeometry();
    const snowPosAttr = new THREE.BufferAttribute(this.snowPositions, 3);
    snowPosAttr.setUsage(THREE.DynamicDrawUsage);
    const snowAlphaAttr = new THREE.BufferAttribute(this.snowAlpha, 1);
    snowAlphaAttr.setUsage(THREE.DynamicDrawUsage);
    this.snowGeom.setAttribute('position', snowPosAttr);
    this.snowGeom.setAttribute('aSize', new THREE.BufferAttribute(this.snowSizes, 1));
    this.snowGeom.setAttribute('aAlpha', snowAlphaAttr);

    this.snowMat = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: this.snowTexture },
        uPixelRatio: { value: this.pixelRatio },
        uOpacity: { value: 0 },
      },
      vertexShader: /* glsl */ `
        attribute float aSize;
        attribute float aAlpha;
        uniform float uPixelRatio;
        varying float vAlpha;
        void main() {
          vAlpha = aAlpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * uPixelRatio * (18.0 / max(1.5, -mvPosition.z));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap;
        uniform float uOpacity;
        varying float vAlpha;
        void main() {
          vec4 tex = texture2D(uMap, gl_PointCoord);
          float alpha = tex.a * vAlpha * uOpacity;
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(vec3(0.92, 0.96, 1.0) * tex.rgb, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    this.snowPoints = new THREE.Points(this.snowGeom, this.snowMat);
    this.snowPoints.frustumCulled = false;
    this.snowPoints.visible = false;
    this.snowPoints.renderOrder = 9;
    scene.add(this.snowPoints);

    // ------------------------------------------------------------
    // 3. ASH STORM SYSTEM (Tormenta de Ceniza: Volcanic Ash + Embers)
    // ------------------------------------------------------------
    this.ashTexture = createAshEmberTexture();
    for (let i = 0; i < ASH_COUNT; i++) {
      this.ashPositions[i * 3] = (Math.random() - 0.5) * VOLUME_XZ;
      this.ashPositions[i * 3 + 1] = Math.random() * VOLUME_Y;
      this.ashPositions[i * 3 + 2] = (Math.random() - 0.5) * VOLUME_XZ;
      this.ashPhase[i] = Math.random() * Math.PI * 2;
      this.ashDriftScale[i] = 0.75 + Math.random() * 0.9;

      const isEmber = Math.random() < 0.34 ? 1 : 0;
      this.ashIsEmber[i] = isEmber;

      if (isEmber) {
        // Hot orange/amber glowing cinder rising in updrafts
        this.ashVelY[i] = 1.4 + Math.random() * 2.6;
        this.ashSizes[i] = 12 + Math.random() * 14;
        this.ashAlpha[i] = 0.9;
        const hotTone = Math.random();
        this.ashColors[i * 3] = 1.0;
        this.ashColors[i * 3 + 1] = 0.35 + hotTone * 0.45;
        this.ashColors[i * 3 + 2] = 0.06 + hotTone * 0.14;
      } else {
        // Swirling dark slate/charcoal volcanic ash flake
        this.ashVelY[i] = -(1.4 + Math.random() * 2.2);
        this.ashSizes[i] = 15 + Math.random() * 18;
        this.ashAlpha[i] = 0.78;
        const shade = 0.22 + Math.random() * 0.18;
        this.ashColors[i * 3] = shade + 0.06;
        this.ashColors[i * 3 + 1] = shade + 0.02;
        this.ashColors[i * 3 + 2] = shade;
      }
    }

    this.ashGeom = new THREE.BufferGeometry();
    const ashPosAttr = new THREE.BufferAttribute(this.ashPositions, 3);
    ashPosAttr.setUsage(THREE.DynamicDrawUsage);
    const ashAlphaAttr = new THREE.BufferAttribute(this.ashAlpha, 1);
    ashAlphaAttr.setUsage(THREE.DynamicDrawUsage);
    this.ashGeom.setAttribute('position', ashPosAttr);
    this.ashGeom.setAttribute('color', new THREE.BufferAttribute(this.ashColors, 3));
    this.ashGeom.setAttribute('aSize', new THREE.BufferAttribute(this.ashSizes, 1));
    this.ashGeom.setAttribute('aAlpha', ashAlphaAttr);

    this.ashMat = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: this.ashTexture },
        uPixelRatio: { value: this.pixelRatio },
        uOpacity: { value: 0 },
      },
      vertexShader: /* glsl */ `
        attribute float aSize;
        attribute float aAlpha;
        attribute vec3 color;
        uniform float uPixelRatio;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = color;
          vAlpha = aAlpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * uPixelRatio * (18.0 / max(1.5, -mvPosition.z));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap;
        uniform float uOpacity;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec4 tex = texture2D(uMap, gl_PointCoord);
          float alpha = tex.a * vAlpha * uOpacity;
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(vColor * tex.rgb, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    this.ashPoints = new THREE.Points(this.ashGeom, this.ashMat);
    this.ashPoints.frustumCulled = false;
    this.ashPoints.visible = false;
    this.ashPoints.renderOrder = 9;
    scene.add(this.ashPoints);
  }

  public update(
    dt: number,
    elapsed: number,
    weather: WeatherType,
    playerPos: THREE.Vector3,
    getGroundHeight: (x: number, z: number) => number
  ): void {
    const targetRain = weather === 'lluvia' ? 1 : 0;
    const targetSnow = weather === 'nieve' ? 1 : 0;
    const targetAsh = weather === 'tormenta_ceniza' ? 1 : 0;

    this.rainIntensity = THREE.MathUtils.damp(this.rainIntensity, targetRain, 3.6, dt);
    this.snowIntensity = THREE.MathUtils.damp(this.snowIntensity, targetSnow, 3.0, dt);
    this.ashIntensity = THREE.MathUtils.damp(this.ashIntensity, targetAsh, 3.2, dt);

    const px = playerPos.x;
    const pz = playerPos.z;
    const baseFloorY = getGroundHeight(px, pz) - 1.5;
    const ceilingY = baseFloorY + VOLUME_Y;

    // 1. Update Rain
    if (this.rainIntensity > 0.015) {
      this.rainGroup.visible = true;
      this.rainLineMat.opacity = 0.56 * this.rainIntensity;
      this.splashMat.opacity = 0.65 * this.rainIntensity;

      const windX = -3.8;
      const windZ = -1.9;
      for (let i = 0; i < RAIN_COUNT; i++) {
        const spd = this.rainSpeed[i];
        let x = this.rainBaseX[i] + windX * dt;
        let y = this.rainBaseY[i] - spd * dt;
        let z = this.rainBaseZ[i] + windZ * dt;

        x = wrapCoord(x, px, VOLUME_XZ);
        z = wrapCoord(z, pz, VOLUME_XZ);
        const groundY = getGroundHeight(x, z);
        if (y < groundY) {
          y = ceilingY - Math.random() * 2.5;
        } else if (y > ceilingY + 2) {
          y = baseFloorY + Math.random() * VOLUME_Y;
        }

        this.rainBaseX[i] = x;
        this.rainBaseY[i] = y;
        this.rainBaseZ[i] = z;

        const len = this.rainLength[i];
        const i6 = i * 6;
        // Top of streak
        this.rainPositions[i6] = x - (windX / spd) * len;
        this.rainPositions[i6 + 1] = y + len;
        this.rainPositions[i6 + 2] = z - (windZ / spd) * len;
        // Bottom tip of streak
        this.rainPositions[i6 + 3] = x;
        this.rainPositions[i6 + 4] = y;
        this.rainPositions[i6 + 5] = z;
      }

      // Ground splash droplets
      for (let i = 0; i < SPLASH_COUNT; i++) {
        this.splashAge[i] += dt;
        if (this.splashAge[i] >= this.splashLife[i]) {
          this.splashAge[i] = 0;
          this.splashLife[i] = 0.2 + Math.random() * 0.22;
          const sx = px + (Math.random() - 0.5) * 30;
          const sz = pz + (Math.random() - 0.5) * 30;
          const sy = getGroundHeight(sx, sz) + 0.06;
          this.splashPositions[i * 3] = sx;
          this.splashPositions[i * 3 + 1] = sy;
          this.splashPositions[i * 3 + 2] = sz;
          this.splashVelY[i] = 1.2 + Math.random() * 1.5;
          this.splashVelX[i] = (Math.random() - 0.5) * 1.4;
          this.splashVelZ[i] = (Math.random() - 0.5) * 1.4;
        } else {
          this.splashVelY[i] -= 7.8 * dt;
          this.splashPositions[i * 3] += this.splashVelX[i] * dt;
          this.splashPositions[i * 3 + 1] += this.splashVelY[i] * dt;
          this.splashPositions[i * 3 + 2] += this.splashVelZ[i] * dt;
        }
      }

      (this.rainLineGeom.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (this.splashGeom.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    } else {
      this.rainGroup.visible = false;
    }

    // 2. Update Snow
    if (this.snowIntensity > 0.015) {
      this.snowPoints.visible = true;
      this.snowMat.uniforms.uOpacity.value = 0.9 * this.snowIntensity;

      for (let i = 0; i < SNOW_COUNT; i++) {
        const i3 = i * 3;
        const phase = this.snowPhase[i];
        const amp = this.snowSwayAmp[i];
        const swayX = Math.sin(elapsed * 1.35 + phase) * amp + 0.75;
        const swayZ = Math.cos(elapsed * 1.15 + phase * 1.3) * amp + 0.35;

        let x = wrapCoord(this.snowPositions[i3] + swayX * dt, px, VOLUME_XZ);
        let z = wrapCoord(this.snowPositions[i3 + 2] + swayZ * dt, pz, VOLUME_XZ);
        let y = this.snowPositions[i3 + 1] - this.snowSpeed[i] * dt;

        const gY = getGroundHeight(x, z);
        if (y < gY + 0.05) {
          y = ceilingY - Math.random() * 1.8;
        } else if (y > ceilingY + 2) {
          y = gY + Math.random() * (VOLUME_Y - 1);
        }

        this.snowPositions[i3] = x;
        this.snowPositions[i3 + 1] = y;
        this.snowPositions[i3 + 2] = z;

        // Soft fade at floor/ceiling
        const heightAboveGround = Math.max(0, y - gY);
        const topDist = Math.max(0, ceilingY - y);
        const edgeFade = Math.min(1, heightAboveGround * 0.7) * Math.min(1, topDist * 0.35);
        this.snowAlpha[i] = (0.55 + 0.45 * Math.sin(elapsed * 1.8 + phase) * 0.5) * edgeFade;
      }

      (this.snowGeom.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (this.snowGeom.attributes.aAlpha as THREE.BufferAttribute).needsUpdate = true;
    } else {
      this.snowPoints.visible = false;
    }

    // 3. Update Volcanic Ash Storm (Tormenta de Ceniza)
    if (this.ashIntensity > 0.015) {
      this.ashPoints.visible = true;
      this.ashMat.uniforms.uOpacity.value = 0.94 * this.ashIntensity;

      const gustWave = Math.sin(elapsed * 0.85) * 2.2;
      const windX = 7.4 + gustWave;
      const windZ = 4.2 + Math.cos(elapsed * 0.65) * 1.6;

      for (let i = 0; i < ASH_COUNT; i++) {
        const i3 = i * 3;
        const phase = this.ashPhase[i];
        const drift = this.ashDriftScale[i];
        const turbX = Math.sin(elapsed * 2.8 + phase) * 2.1;
        const turbZ = Math.cos(elapsed * 2.4 + phase * 1.1) * 1.9;

        let x = wrapCoord(this.ashPositions[i3] + (windX * drift + turbX) * dt, px, VOLUME_XZ);
        let z = wrapCoord(this.ashPositions[i3 + 2] + (windZ * drift + turbZ) * dt, pz, VOLUME_XZ);
        let y = this.ashPositions[i3 + 1] + this.ashVelY[i] * dt;

        const gY = getGroundHeight(x, z);
        if (this.ashIsEmber[i]) {
          // Embers rise from ground and wrap back down once hitting ceiling
          if (y > ceilingY) {
            y = gY + Math.random() * 2.2;
          } else if (y < gY) {
            y = gY + 0.25;
          }
          const emberPulse = 0.65 + 0.35 * Math.sin(elapsed * 9.0 + phase);
          const topFade = Math.min(1, Math.max(0, (ceilingY - y) * 0.28));
          this.ashAlpha[i] = emberPulse * topFade;
        } else {
          // Ash flakes fall diagonally and wrap back to sky
          if (y < gY + 0.05) {
            y = ceilingY - Math.random() * 2.0;
          } else if (y > ceilingY + 2) {
            y = gY + Math.random() * (VOLUME_Y - 1);
          }
          const bottomFade = Math.min(1, Math.max(0, (y - gY) * 0.8));
          this.ashAlpha[i] = 0.82 * bottomFade;
        }

        this.ashPositions[i3] = x;
        this.ashPositions[i3 + 1] = y;
        this.ashPositions[i3 + 2] = z;
      }

      (this.ashGeom.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (this.ashGeom.attributes.aAlpha as THREE.BufferAttribute).needsUpdate = true;
    } else {
      this.ashPoints.visible = false;
    }
  }

  public dispose(): void {
    this.rainLineGeom.dispose();
    this.rainLineMat.dispose();
    this.splashGeom.dispose();
    this.splashMat.dispose();
    this.snowGeom.dispose();
    this.snowMat.dispose();
    this.snowTexture.dispose();
    this.ashGeom.dispose();
    this.ashMat.dispose();
    this.ashTexture.dispose();
  }
}
