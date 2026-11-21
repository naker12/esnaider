import * as THREE from 'three';
import { ProceduralTextureSet } from './textures';
import { WorldMapId } from './types';

export const WORLD_RADIUS = 136;
export const PLAZA_WORLD_RADIUS = 56;
export const CHUNK_SIZE = 32;
export const CHUNK_SEGMENTS = 12;
export const CHUNK_LOAD_RADIUS = 2; // 5x5 = 25 active chunks around player
export const CHUNK_UNLOAD_RADIUS = 3; // Hysteresis prevents thrashing on chunk borders

export interface ChunkObstacle {
  x: number;
  z: number;
  r: number;
}

export interface LandmarkClearance {
  x: number;
  z: number;
  r: number;
}

interface LoadedChunk {
  key: string;
  cx: number;
  cz: number;
  group: THREE.Group;
  terrainGeo: THREE.BufferGeometry;
  instancedMeshes: THREE.InstancedMesh[];
  obstacles: ChunkObstacle[];
}

export function worldToChunkCoord(x: number, z: number): { cx: number; cz: number } {
  return {
    cx: Math.floor((x + CHUNK_SIZE * 0.5) / CHUNK_SIZE),
    cz: Math.floor((z + CHUNK_SIZE * 0.5) / CHUNK_SIZE),
  };
}

export function chunkKey(cx: number, cz: number): string {
  return `${cx},${cz}`;
}

export function isTempleSafeZone(x: number, z: number): boolean {
  return z > -10.2 && Math.hypot(x, z - 2) <= 16.5;
}

export function isPositionSafeZone(x: number, z: number, mapId: WorldMapId): boolean {
  if (mapId === 'plaza') return true;
  return isTempleSafeZone(x, z);
}

export function groundHeightAt(x: number, z: number, mapId: WorldMapId = 'templo'): number {
  const distFromCenter = Math.hypot(x, z);
  if (mapId === 'plaza') {
    if (distFromCenter < 27) return 0;
    const parkBlend = THREE.MathUtils.smoothstep(distFromCenter, 27, 46);
    const gentlePark =
      (Math.sin(x * 0.06) * Math.cos(z * 0.06) * 0.55 + Math.cos(x * 0.03) * 0.3) * parkBlend;
    const edgeRise = Math.max(0, (distFromCenter - (PLAZA_WORLD_RADIUS - 3)) * 0.45);
    return gentlePark + edgeRise;
  }

  if (distFromCenter < 12) return 0; // Flat Temple Sanctuary courtyard

  // Core valley rolling terrain (preserves original Templo -> Atrio -> Altar feel)
  const coreRoll =
    Math.sin(x * 0.08) * Math.cos(z * 0.08) * 0.45 +
    Math.sin(x * 0.035 + 1.2) * 0.35;

  // Extended frontier hills & ridges beyond core radius (~56m -> 136m)
  const frontierBlend = THREE.MathUtils.smoothstep(distFromCenter, 48, 84);
  const frontierHills =
    (Math.sin(x * 0.042 + 0.6) * Math.cos(z * 0.038 - 0.4) * 1.45 +
      Math.cos((x + z) * 0.028) * 0.85 +
      Math.sin(x * 0.11) * Math.sin(z * 0.09) * 0.28) *
    frontierBlend;

  // Northern Highlands gentle elevation gain
  const northSlope = z < -54 ? THREE.MathUtils.smoothstep(-z, 54, 118) * 2.1 : 0;

  // Natural mountain cliff perimeter beyond playable boundary
  const edgeRise = Math.max(0, (distFromCenter - (WORLD_RADIUS - 3)) * 0.42);

  return (
    coreRoll * Math.min(1, (distFromCenter - 12) / 14) +
    frontierHills +
    northSlope +
    edgeRise
  );
}

export function getZoneName(x: number, z: number, mapId: WorldMapId = 'templo'): string {
  if (mapId === 'plaza') {
    return 'Plaza del Alba (Zona Segura)';
  }
  if (isTempleSafeZone(x, z)) {
    return 'Templo del Velo (Zona Segura)';
  }
  if (z <= -56 && Math.abs(x) <= 58) return 'Tierras Altas del Norte';
  if (z >= 48) return 'Bosque Susurrante (Sur)';
  if (x >= 48 && z < 48) return 'Páramo de Ceniza (Este)';
  if (x <= -48 && z < 48) return 'Bruma de Occidente (Oeste)';
  if (z <= -32) return 'Altar del Wyvern (Norte)';
  if (z <= -16 && x > 8) return 'Cráter Basáltico';
  if (x < -14 && z < 6) return 'Santuario Sombrío';
  if (z <= -8) return 'Atrio Antiguo';
  return 'Ruinas Exteriores';
}

function createChunkRng(cx: number, cz: number): () => number {
  let seed = (Math.imul(cx, 73856093) ^ Math.imul(cz, 19349663) ^ 0x9e3779b9) >>> 0;
  return () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const _tmpDummy = new THREE.Object3D();
const _tmpColor = new THREE.Color();

export class WorldChunkManager {
  private scene: THREE.Scene;
  private isSoftwareGl: boolean;
  private landmarks: LandmarkClearance[];
  private mapId: WorldMapId;
  private activeChunks = new Map<string, LoadedChunk>();
  private lastCenterCx = Number.NaN;
  private lastCenterCz = Number.NaN;

  // Shared materials & base prop geometries (zero per-chunk shader/geometry duplication)
  private groundMat: THREE.MeshStandardMaterial;
  private trunkGeo: THREE.CylinderGeometry;
  private trunkMat: THREE.MeshStandardMaterial;
  private canopyGeo: THREE.ConeGeometry;
  private canopyMat: THREE.MeshStandardMaterial;
  private rockGeo: THREE.DodecahedronGeometry;
  private rockMat: THREE.MeshStandardMaterial;
  private ruinStoneGeo: THREE.BoxGeometry;
  private ruinStoneMat: THREE.MeshStandardMaterial;
  private tuftGeo: THREE.ConeGeometry;
  private tuftMat: THREE.MeshStandardMaterial;

  constructor(
    scene: THREE.Scene,
    textures: ProceduralTextureSet,
    isSoftwareGl: boolean,
    landmarks: LandmarkClearance[],
    initialMapId: WorldMapId = 'plaza'
  ) {
    this.scene = scene;
    this.isSoftwareGl = isSoftwareGl;
    this.landmarks = landmarks;
    this.mapId = initialMapId;

    // World-space UV scaling across seamless chunks
    textures.groundColor.repeat.set(1, 1);
    textures.groundBump.repeat.set(1, 1);

    this.groundMat = new THREE.MeshStandardMaterial({
      map: textures.groundColor,
      bumpMap: textures.groundBump,
      bumpScale: 0.08,
      roughness: 0.92,
      metalness: 0.04,
      vertexColors: true,
    });

    this.trunkGeo = new THREE.CylinderGeometry(0.24, 0.36, 2.2, 7);
    this.trunkGeo.translate(0, 1.1, 0);
    this.trunkMat = new THREE.MeshStandardMaterial({ color: 0x3b281c, roughness: 0.9 });

    this.canopyGeo = new THREE.ConeGeometry(1.75, 4.8, 7);
    this.canopyGeo.translate(0, 4.0, 0);
    this.canopyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 });

    this.rockGeo = new THREE.DodecahedronGeometry(1.0, 0);
    this.rockMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.92,
      flatShading: true,
    });

    this.ruinStoneGeo = new THREE.BoxGeometry(1.0, 1.0, 1.0);
    this.ruinStoneMat = new THREE.MeshStandardMaterial({
      map: textures.stoneColor,
      bumpMap: textures.stoneBump,
      bumpScale: 0.03,
      roughness: 0.88,
      metalness: 0.04,
    });

    this.tuftGeo = new THREE.ConeGeometry(0.22, 0.52, 4);
    this.tuftGeo.translate(0, 0.24, 0);
    this.tuftMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.92,
    });
  }

  public getMapId(): WorldMapId {
    return this.mapId;
  }

  public setMapId(nextMapId: WorldMapId, playerX: number, playerZ: number): void {
    if (this.mapId === nextMapId && this.activeChunks.size > 0) return;
    this.mapId = nextMapId;
    for (const [key, chunk] of [...this.activeChunks.entries()]) {
      this.unloadChunk(key, chunk);
    }
    this.lastCenterCx = Number.NaN;
    this.lastCenterCz = Number.NaN;
    this.update(playerX, playerZ, true);
  }

  public isWorldPosLoaded(x: number, z: number): boolean {
    const { cx, cz } = worldToChunkCoord(x, z);
    return this.activeChunks.has(chunkKey(cx, cz));
  }

  public getLoadedChunkCount(): number {
    return this.activeChunks.size;
  }

  public forEachObstacleNear(
    x: number,
    z: number,
    callback: (obs: ChunkObstacle) => void
  ): void {
    const { cx, cz } = worldToChunkCoord(x, z);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const chunk = this.activeChunks.get(chunkKey(cx + dx, cz + dz));
        if (!chunk) continue;
        for (let i = 0; i < chunk.obstacles.length; i++) {
          callback(chunk.obstacles[i]);
        }
      }
    }
  }

  public collectNearbyObstacles(x: number, z: number, maxDist: number): ChunkObstacle[] {
    const out: ChunkObstacle[] = [];
    const maxDistSq = maxDist * maxDist;
    const { cx, cz } = worldToChunkCoord(x, z);
    const chunkRange = Math.ceil(maxDist / CHUNK_SIZE);
    for (let dx = -chunkRange; dx <= chunkRange; dx++) {
      for (let dz = -chunkRange; dz <= chunkRange; dz++) {
        const chunk = this.activeChunks.get(chunkKey(cx + dx, cz + dz));
        if (!chunk) continue;
        for (let i = 0; i < chunk.obstacles.length; i++) {
          const o = chunk.obstacles[i];
          const ox = o.x - x;
          const oz = o.z - z;
          if (ox * ox + oz * oz <= maxDistSq) {
            out.push(o);
          }
        }
      }
    }
    return out;
  }

  /**
   * Streams in nearby chunks (closest first) and disposes distant chunks outside CHUNK_UNLOAD_RADIUS.
   * Returns true if at least one chunk was loaded or unloaded this frame.
   */
  public update(playerX: number, playerZ: number, immediate = false): boolean {
    const { cx, cz } = worldToChunkCoord(playerX, playerZ);
    const centerMoved = cx !== this.lastCenterCx || cz !== this.lastCenterCz;
    let changed = false;

    if (centerMoved || immediate) {
      this.lastCenterCx = cx;
      this.lastCenterCz = cz;
      for (const [key, chunk] of this.activeChunks.entries()) {
        const chebyshev = Math.max(Math.abs(chunk.cx - cx), Math.abs(chunk.cz - cz));
        if (chebyshev > CHUNK_UNLOAD_RADIUS) {
          this.unloadChunk(key, chunk);
          changed = true;
        }
      }
    }

    const missing: { cx: number; cz: number; distSq: number }[] = [];
    for (let dx = -CHUNK_LOAD_RADIUS; dx <= CHUNK_LOAD_RADIUS; dx++) {
      for (let dz = -CHUNK_LOAD_RADIUS; dz <= CHUNK_LOAD_RADIUS; dz++) {
        const tcx = cx + dx;
        const tcz = cz + dz;
        const key = chunkKey(tcx, tcz);
        if (!this.activeChunks.has(key)) {
          missing.push({ cx: tcx, cz: tcz, distSq: dx * dx + dz * dz });
        }
      }
    }

    if (missing.length === 0) return changed;
    missing.sort((a, b) => a.distSq - b.distSq);

    const budget = immediate ? missing.length : 2;
    for (let i = 0; i < Math.min(budget, missing.length); i++) {
      const target = missing[i];
      const loaded = this.buildChunk(target.cx, target.cz);
      this.activeChunks.set(loaded.key, loaded);
      this.scene.add(loaded.group);
      changed = true;
    }

    return changed;
  }

  private unloadChunk(key: string, chunk: LoadedChunk): void {
    this.scene.remove(chunk.group);
    chunk.terrainGeo.dispose();
    for (let i = 0; i < chunk.instancedMeshes.length; i++) {
      chunk.instancedMeshes[i].dispose();
    }
    this.activeChunks.delete(key);
  }

  private isClearOfLandmarks(wx: number, wz: number, extraPad = 0): boolean {
    const distCenter = Math.hypot(wx, wz);
    if (this.mapId === 'plaza') {
      return distCenter >= 29 + extraPad;
    }

    // Flat Templo del Velo courtyard
    if (distCenter < 15.2 + extraPad) return false;

    // Keep central Templo -> Atrio -> Altar road walkable
    if (Math.abs(wx) < 3.6 + extraPad && wz > -46 && wz < 16) return false;

    for (let i = 0; i < this.landmarks.length; i++) {
      const lm = this.landmarks[i];
      const minD = lm.r + extraPad;
      const dx = wx - lm.x;
      const dz = wz - lm.z;
      if (dx * dx + dz * dz < minD * minD) return false;
    }
    return true;
  }

  private buildChunk(cx: number, cz: number): LoadedChunk {
    const key = chunkKey(cx, cz);
    const group = new THREE.Group();
    const originX = cx * CHUNK_SIZE;
    const originZ = cz * CHUNK_SIZE;
    group.position.set(originX, 0, originZ);
    const activeRadius = this.mapId === 'plaza' ? PLAZA_WORLD_RADIUS : WORLD_RADIUS;

    // 1. Seamless Terrain Mesh with Analytical Normals, World UVs & Biome Vertex Tints
    const terrainGeo = new THREE.PlaneGeometry(
      CHUNK_SIZE,
      CHUNK_SIZE,
      CHUNK_SEGMENTS,
      CHUNK_SEGMENTS
    );
    terrainGeo.rotateX(-Math.PI / 2);

    const posAttr = terrainGeo.attributes.position as THREE.BufferAttribute;
    const normAttr = terrainGeo.attributes.normal as THREE.BufferAttribute;
    const uvAttr = terrainGeo.attributes.uv as THREE.BufferAttribute;
    const vCount = posAttr.count;
    const colors = new Float32Array(vCount * 3);

    const eps = 0.35;
    for (let i = 0; i < vCount; i++) {
      const lx = posAttr.getX(i);
      const lz = posAttr.getZ(i);
      const wx = originX + lx;
      const wz = originZ + lz;

      const y = groundHeightAt(wx, wz, this.mapId);
      posAttr.setY(i, y);

      const hL = groundHeightAt(wx - eps, wz, this.mapId);
      const hR = groundHeightAt(wx + eps, wz, this.mapId);
      const hD = groundHeightAt(wx, wz - eps, this.mapId);
      const hU = groundHeightAt(wx, wz + eps, this.mapId);
      const nx = hL - hR;
      const ny = 2 * eps;
      const nz = hD - hU;
      const invLen = 1 / Math.hypot(nx, ny, nz);
      normAttr.setXYZ(i, nx * invLen, ny * invLen, nz * invLen);

      uvAttr.setXY(i, wx * 0.13, wz * 0.13);

      let r = 1.0;
      let g = 1.0;
      let b = 1.0;

      if (this.mapId === 'plaza') {
        const parkTint = THREE.MathUtils.smoothstep(Math.hypot(wx, wz), 24, 42);
        r = THREE.MathUtils.lerp(0.95, 0.82, parkTint);
        g = THREE.MathUtils.lerp(1.02, 1.12, parkTint);
        b = THREE.MathUtils.lerp(0.92, 0.80, parkTint);
      } else {
        // Southern Whispering Forest (lush green moss)
        const southForest = THREE.MathUtils.smoothstep(wz, 36, 66);
        if (southForest > 0) {
          r = THREE.MathUtils.lerp(r, 0.84, southForest);
          g = THREE.MathUtils.lerp(g, 1.08, southForest);
          b = THREE.MathUtils.lerp(b, 0.80, southForest);
        }

        // Eastern Basalt & Ashlands
        const eastAsh =
          THREE.MathUtils.smoothstep(wx, 14, 52) *
          (1 - THREE.MathUtils.smoothstep(wz, 34, 56));
        if (eastAsh > 0) {
          r = THREE.MathUtils.lerp(r, 0.82, eastAsh);
          g = THREE.MathUtils.lerp(g, 0.68, eastAsh);
          b = THREE.MathUtils.lerp(b, 0.62, eastAsh);
        }

        // Western Veil Mists
        const westMist =
          THREE.MathUtils.smoothstep(-wx, 16, 52) *
          (1 - THREE.MathUtils.smoothstep(wz, 34, 56));
        if (westMist > 0) {
          r = THREE.MathUtils.lerp(r, 0.75, westMist);
          g = THREE.MathUtils.lerp(g, 0.80, westMist);
          b = THREE.MathUtils.lerp(b, 1.02, westMist);
        }

        // Northern Highlands / Altar
        const northHigh = THREE.MathUtils.smoothstep(-wz, 32, 72);
        if (northHigh > 0) {
          const peakSnow = THREE.MathUtils.smoothstep(y, 1.6, 4.2);
          r = THREE.MathUtils.lerp(r, 0.92 + peakSnow * 0.14, northHigh);
          g = THREE.MathUtils.lerp(g, 0.86 + peakSnow * 0.18, northHigh);
          b = THREE.MathUtils.lerp(b, 0.88 + peakSnow * 0.22, northHigh);
        }
      }

      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    terrainGeo.computeBoundingBox();
    terrainGeo.computeBoundingSphere();

    const terrainMesh = new THREE.Mesh(terrainGeo, this.groundMat);
    terrainMesh.receiveShadow = true;
    group.add(terrainMesh);

    // 2. Deterministic Seeded Props inside this Chunk
    const instancedMeshes: THREE.InstancedMesh[] = [];
    const obstacles: ChunkObstacle[] = [];

    const chunkCenterDist = Math.hypot(originX, originZ);
    if (chunkCenterDist > activeRadius + 62) {
      return { key, cx, cz, group, terrainGeo, instancedMeshes, obstacles };
    }

    const rng = createChunkRng(cx, cz);

    interface TreeSpec {
      lx: number;
      ly: number;
      lz: number;
      rotY: number;
      scale: number;
      hue: number;
      light: number;
    }
    interface RockSpec {
      lx: number;
      ly: number;
      lz: number;
      rx: number;
      ry: number;
      rz: number;
      sx: number;
      sy: number;
      sz: number;
      tint: number;
    }
    interface RuinSpec {
      lx: number;
      ly: number;
      lz: number;
      rotY: number;
      sx: number;
      sy: number;
      sz: number;
    }
    interface TuftSpec {
      lx: number;
      ly: number;
      lz: number;
      rotY: number;
      scale: number;
      hue: number;
      sat: number;
      light: number;
    }

    const trees: TreeSpec[] = [];
    const rocks: RockSpec[] = [];
    const ruins: RuinSpec[] = [];
    const tufts: TuftSpec[] = [];

    const treeAttempts = this.mapId === 'plaza' ? 14 : 18;
    for (let i = 0; i < treeAttempts; i++) {
      const lx = (rng() - 0.5) * (CHUNK_SIZE - 2.4);
      const lz = (rng() - 0.5) * (CHUNK_SIZE - 2.4);
      const wx = originX + lx;
      const wz = originZ + lz;
      const dist = Math.hypot(wx, wz);

      if (dist > activeRadius + 34) continue;

      const isPerimeterForest = dist >= activeRadius - 1.5;
      let spawnChance = 0.22;
      if (this.mapId === 'plaza') {
        spawnChance = isPerimeterForest ? 0.78 : dist >= 29 ? 0.44 : 0;
      } else if (isPerimeterForest) {
        spawnChance = 0.85;
      } else if (wz >= 42) {
        spawnChance = 0.62;
      } else if (wx <= -44 && wz < 42) {
        spawnChance = 0.36;
      } else if (wx >= 44 && wz < 42) {
        spawnChance = 0.14;
      } else if (dist < 52) {
        spawnChance = 0.16;
      }

      if (rng() > spawnChance) continue;
      if (!this.isClearOfLandmarks(wx, wz, 1.4)) continue;

      const sc = isPerimeterForest ? 0.92 + rng() * 0.52 : 0.78 + rng() * 0.44;
      const ly = groundHeightAt(wx, wz, this.mapId) - 0.12;
      const isAsh = this.mapId === 'templo' && wx >= 44 && wz < 42;
      const isWest = this.mapId === 'templo' && wx <= -44 && wz < 42;
      trees.push({
        lx,
        ly,
        lz,
        rotY: rng() * Math.PI * 2,
        scale: sc,
        hue:
          this.mapId === 'plaza'
            ? 0.34 + (rng() - 0.5) * 0.04
            : isAsh
            ? 0.09 + rng() * 0.04
            : isWest
            ? 0.44 + rng() * 0.06
            : 0.35 + (rng() - 0.5) * 0.05,
        light: isAsh ? 0.14 + rng() * 0.04 : 0.16 + rng() * 0.07,
      });
      if (dist <= activeRadius + 1) {
        obstacles.push({ x: wx, z: wz, r: 0.44 * sc });
      }
    }

    const rockAttempts = this.mapId === 'plaza' ? 7 : 12;
    for (let i = 0; i < rockAttempts; i++) {
      const lx = (rng() - 0.5) * (CHUNK_SIZE - 3.0);
      const lz = (rng() - 0.5) * (CHUNK_SIZE - 3.0);
      const wx = originX + lx;
      const wz = originZ + lz;
      const dist = Math.hypot(wx, wz);

      if (dist > activeRadius + 24) continue;
      const isRim = dist >= activeRadius - 2;
      const isRockyBiome = this.mapId === 'templo' && ((wx >= 20 && wz < 32) || wz <= -46);
      const chance = isRim ? 0.75 : isRockyBiome ? 0.42 : this.mapId === 'plaza' ? 0.12 : 0.2;
      if (rng() > chance) continue;
      if (!this.isClearOfLandmarks(wx, wz, 1.8)) continue;

      const baseScale = isRim ? 2.1 + rng() * 1.9 : 0.75 + rng() * 1.15;
      const sx = baseScale * (0.85 + rng() * 0.45);
      const sy = baseScale * (0.75 + rng() * 0.75);
      const sz = baseScale * (0.85 + rng() * 0.45);
      const ly = groundHeightAt(wx, wz, this.mapId) + sy * 0.28;

      const isVolcanic = this.mapId === 'templo' && wx >= 20 && wz < 32;
      rocks.push({
        lx,
        ly,
        lz,
        rx: rng() * Math.PI,
        ry: rng() * Math.PI,
        rz: rng() * Math.PI,
        sx,
        sy,
        sz,
        tint: isVolcanic ? 0x262328 : 0x383e48,
      });

      if (dist <= activeRadius + 1 && Math.max(sx, sz) > 0.75) {
        obstacles.push({ x: wx, z: wz, r: Math.max(sx, sz) * 0.72 });
      }
    }

    if (this.mapId === 'templo') {
      const ruinAttempts = 5;
      for (let i = 0; i < ruinAttempts; i++) {
        const lx = (rng() - 0.5) * (CHUNK_SIZE - 4.0);
        const lz = (rng() - 0.5) * (CHUNK_SIZE - 4.0);
        const wx = originX + lx;
        const wz = originZ + lz;
        const dist = Math.hypot(wx, wz);
        if (dist > activeRadius - 6 || dist < 18) continue;
        if (rng() > 0.36) continue;
        if (!this.isClearOfLandmarks(wx, wz, 1.6)) continue;

        const sx = 0.8 + rng() * 1.1;
        const sy = 0.9 + rng() * 1.9;
        const sz = 0.8 + rng() * 1.0;
        ruins.push({
          lx,
          ly: groundHeightAt(wx, wz, this.mapId) + sy * 0.45,
          lz,
          rotY: rng() * Math.PI,
          sx,
          sy,
          sz,
        });
        obstacles.push({ x: wx, z: wz, r: Math.max(sx, sz) * 0.58 });
      }
    }

    const tuftAttempts = 22;
    const clearInnerTufts = this.mapId === 'plaza' ? 23.5 : 12.2;
    for (let i = 0; i < tuftAttempts; i++) {
      const lx = (rng() - 0.5) * (CHUNK_SIZE - 1.2);
      const lz = (rng() - 0.5) * (CHUNK_SIZE - 1.2);
      const wx = originX + lx;
      const wz = originZ + lz;
      const dist = Math.hypot(wx, wz);
      if (dist < clearInnerTufts || dist > activeRadius + 8) continue;
      const isAsh = this.mapId === 'templo' && wx >= 44 && wz < 42;
      if (isAsh && rng() > 0.25) continue;

      tufts.push({
        lx,
        ly: groundHeightAt(wx, wz, this.mapId) - 0.04,
        lz,
        rotY: rng() * Math.PI * 2,
        scale: 0.7 + rng() * 0.85,
        hue:
          this.mapId === 'plaza'
            ? 0.33 + (rng() - 0.5) * 0.05
            : isAsh
            ? 0.09
            : wx <= -42
            ? 0.45
            : 0.31 + (rng() - 0.5) * 0.06,
        sat: isAsh ? 0.22 : 0.42,
        light: isAsh ? 0.22 : 0.24 + rng() * 0.1,
      });
    }

    if (trees.length > 0) {
      const trunkInst = new THREE.InstancedMesh(this.trunkGeo, this.trunkMat, trees.length);
      const canopyInst = new THREE.InstancedMesh(this.canopyGeo, this.canopyMat, trees.length);
      trunkInst.castShadow = !this.isSoftwareGl;
      canopyInst.castShadow = !this.isSoftwareGl;

      for (let i = 0; i < trees.length; i++) {
        const t = trees[i];
        _tmpDummy.position.set(t.lx, t.ly, t.lz);
        _tmpDummy.rotation.set(0, t.rotY, 0);
        _tmpDummy.scale.setScalar(t.scale);
        _tmpDummy.updateMatrix();
        trunkInst.setMatrixAt(i, _tmpDummy.matrix);
        canopyInst.setMatrixAt(i, _tmpDummy.matrix);
        _tmpColor.setHSL(t.hue, 0.32, t.light);
        canopyInst.setColorAt(i, _tmpColor);
      }
      trunkInst.instanceMatrix.needsUpdate = true;
      canopyInst.instanceMatrix.needsUpdate = true;
      if (canopyInst.instanceColor) canopyInst.instanceColor.needsUpdate = true;
      trunkInst.computeBoundingSphere();
      canopyInst.computeBoundingSphere();
      group.add(trunkInst, canopyInst);
      instancedMeshes.push(trunkInst, canopyInst);
    }

    if (rocks.length > 0) {
      const rockInst = new THREE.InstancedMesh(this.rockGeo, this.rockMat, rocks.length);
      rockInst.castShadow = !this.isSoftwareGl;
      rockInst.receiveShadow = true;
      for (let i = 0; i < rocks.length; i++) {
        const rk = rocks[i];
        _tmpDummy.position.set(rk.lx, rk.ly, rk.lz);
        _tmpDummy.rotation.set(rk.rx, rk.ry, rk.rz);
        _tmpDummy.scale.set(rk.sx, rk.sy, rk.sz);
        _tmpDummy.updateMatrix();
        rockInst.setMatrixAt(i, _tmpDummy.matrix);
        _tmpColor.setHex(rk.tint);
        rockInst.setColorAt(i, _tmpColor);
      }
      rockInst.instanceMatrix.needsUpdate = true;
      if (rockInst.instanceColor) rockInst.instanceColor.needsUpdate = true;
      rockInst.computeBoundingSphere();
      group.add(rockInst);
      instancedMeshes.push(rockInst);
    }

    if (ruins.length > 0) {
      const ruinInst = new THREE.InstancedMesh(this.ruinStoneGeo, this.ruinStoneMat, ruins.length);
      ruinInst.castShadow = !this.isSoftwareGl;
      ruinInst.receiveShadow = true;
      for (let i = 0; i < ruins.length; i++) {
        const rn = ruins[i];
        _tmpDummy.position.set(rn.lx, rn.ly, rn.lz);
        _tmpDummy.rotation.set(0, rn.rotY, 0);
        _tmpDummy.scale.set(rn.sx, rn.sy, rn.sz);
        _tmpDummy.updateMatrix();
        ruinInst.setMatrixAt(i, _tmpDummy.matrix);
      }
      ruinInst.instanceMatrix.needsUpdate = true;
      ruinInst.computeBoundingSphere();
      group.add(ruinInst);
      instancedMeshes.push(ruinInst);
    }

    if (tufts.length > 0) {
      const tuftInst = new THREE.InstancedMesh(this.tuftGeo, this.tuftMat, tufts.length);
      for (let i = 0; i < tufts.length; i++) {
        const tf = tufts[i];
        _tmpDummy.position.set(tf.lx, tf.ly, tf.lz);
        _tmpDummy.rotation.set(0, tf.rotY, 0);
        _tmpDummy.scale.setScalar(tf.scale);
        _tmpDummy.updateMatrix();
        tuftInst.setMatrixAt(i, _tmpDummy.matrix);
        _tmpColor.setHSL(tf.hue, tf.sat, tf.light);
        tuftInst.setColorAt(i, _tmpColor);
      }
      tuftInst.instanceMatrix.needsUpdate = true;
      if (tuftInst.instanceColor) tuftInst.instanceColor.needsUpdate = true;
      tuftInst.computeBoundingSphere();
      group.add(tuftInst);
      instancedMeshes.push(tuftInst);
    }

    return {
      key,
      cx,
      cz,
      group,
      terrainGeo,
      instancedMeshes,
      obstacles,
    };
  }

  public dispose(): void {
    for (const [key, chunk] of [...this.activeChunks.entries()]) {
      this.unloadChunk(key, chunk);
    }
    this.groundMat.dispose();
    this.trunkGeo.dispose();
    this.trunkMat.dispose();
    this.canopyGeo.dispose();
    this.canopyMat.dispose();
    this.rockGeo.dispose();
    this.rockMat.dispose();
    this.ruinStoneGeo.dispose();
    this.ruinStoneMat.dispose();
    this.tuftGeo.dispose();
    this.tuftMat.dispose();
  }
}
