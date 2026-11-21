import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import {
  CLAN_NPCS_CATALOG,
  CLAN_ROLE_INFO,
  CLASSES_CATALOG,
  DIFFICULTIES_CATALOG,
  ITEMS_CATALOG,
  JOURNAL_POI_CATALOG,
  MONSTER_SPECIES,
  PRESET_CLANS,
  RACES_CATALOG,
  WORLD_HERB_NODES,
  computeWorldScaling,
  getClanBadgeInfo,
  getEnemyEffectiveLevel,
  getNpcDynamicContext,
  getRebirthDamageMultiplier,
} from './data';
import { extensionRegistry } from './extensions';
import {
  createArchivistNpcModel,
  createChestModel,
  createClanNpcModel,
  createDimensionalPortalModel,
  createFirstPersonMountRig,
  createFirstPersonWeapon,
  createGateModel,
  createHerbNodeModel,
  createLoreRelicModel,
  createMerchantNpcModel,
  createMonsterModel,
  createPlazaBannerModel,
  createPlazaFountainModel,
  createPlazaLampPostModel,
  createRemoteHeroModel,
  createRuinPillar,
  createShrineModel,
  createTempleWardObeliskModel,
  setClanNpcVisualState,
  setLoreRelicVisualState,
  setMountRigVisual,
  setShrineVisualState,
  updateRemoteHeroNameplate,
} from './models';
import { soundEngine } from './audio';
import { CombatParticleSystem } from './particles';
import { createProceduralTextures } from './textures';
import { WeatherParticleSystem } from './weatherParticles';
import {
  ComputedAtmosphere,
  WEATHER_ORDER,
  WEATHER_PRESETS,
  WeatherPostShader,
  computeAtmosphereState,
  formatGameHour,
  getDayPhaseInfo,
} from './weatherShader';
import {
  BestiaryProgressEntry,
  ClanMemberState,
  ClanRole,
  ClassId,
  ComputedStats,
  DayPhase,
  DayTimeSnapshot,
  DifficultyDefinition,
  DifficultyId,
  FastTravelShrineInfo,
  FloatingDamage,
  MinimapEntity,
  MinimapSnapshot,
  MonsterSchedule,
  MonsterSpeciesId,
  OnlinePlayerState,
  PlayerStatusEffect,
  PlayerStatusEffectId,
  RaceId,
  TargetInfo,
  TravelerJournalEntry,
  WeatherType,
  WorldMapId,
  WorldScalingProfile,
} from './types';

import {
  CHUNK_SIZE,
  LandmarkClearance,
  PLAZA_WORLD_RADIUS,
  WORLD_RADIUS,
  WorldChunkManager,
  getZoneName,
  groundHeightAt,
  isPositionSafeZone,
  isTempleSafeZone,
} from './chunks';

export {
  CHUNK_SIZE,
  PLAZA_WORLD_RADIUS,
  WORLD_RADIUS,
  getZoneName,
  groundHeightAt,
  isPositionSafeZone,
  isTempleSafeZone,
};

// Pre-allocated math helpers (zero GC inside animation loop)
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _moveDir = new THREE.Vector3();
const _toEntity = new THREE.Vector3();
const _projVec = new THREE.Vector3();
const _rayDir = new THREE.Vector3();
const _dummy = new THREE.Object3D();
const _color = new THREE.Color();
const _targetSkyColor = new THREE.Color();
const _targetKeyColor = new THREE.Color();
const _targetHemiColor = new THREE.Color();
const _targetRimColor = new THREE.Color();

interface ActiveMonster {
  id: string;
  speciesId: MonsterSpeciesId;
  schedule: MonsterSchedule;
  scheduleActive: boolean;
  group: THREE.Group;
  spawnPos: THREE.Vector3;
  hp: number;
  maxHp: number;
  alive: boolean;
  isElite: boolean;
  baseScale: number;
  isDynamicEncounter?: boolean;
  pendingRemoval?: boolean;
  respawnTimer: number;
  attackTimer: number;
  hitFlashTimer: number;
  studyCooldown: number;
  patrolPhase: number;
  burnTimer: number;
  burnTickTimer: number;
  burnDamage: number;
  poisonTimer: number;
  poisonTickTimer: number;
  poisonDamage: number;
  statusParticleTimer: number;
}

interface ActiveChest {
  id: string;
  group: THREE.Group;
  opened: boolean;
  openProgress: number;
  lootItemIds: string[];
  gold: number;
}

interface ActiveDoor {
  id: string;
  name: string;
  group: THREE.Group;
  open: boolean;
  openProgress: number;
  x: number;
  z: number;
}

interface FireballProjectile {
  mesh: THREE.Mesh;
  light: THREE.PointLight;
  velocity: THREE.Vector3;
  life: number;
  damage: number;
  aoeRadius?: number;
  bonusVsDragons?: number;
  forceBurn?: boolean;
  forcePoison?: boolean;
}

interface PillarObstacle {
  x: number;
  z: number;
  r: number;
}

interface ActiveShrine {
  id: string;
  name: string;
  zoneName: string;
  x: number;
  z: number;
  arrivalX: number;
  arrivalZ: number;
  arrivalYaw: number;
  discovered: boolean;
  group: THREE.Group;
}

interface ActiveLoreObject {
  id: string;
  loreId: string;
  name: string;
  zoneName: string;
  x: number;
  z: number;
  discovered: boolean;
  group: THREE.Group;
}

interface ActiveClanNpc {
  id: string;
  name: string;
  title: string;
  rescueZone: string;
  rescueX: number;
  rescueZ: number;
  baseX: number;
  baseZ: number;
  baseRotY: number;
  rescued: boolean;
  invited: boolean;
  role: ClanRole;
  group: THREE.Group;
}

interface ActiveHerbNode {
  id: string;
  itemId: string;
  name: string;
  x: number;
  z: number;
  available: boolean;
  respawnTimer: number;
  group: THREE.Group;
}

interface ActivePortal {
  id: string;
  mapId: WorldMapId;
  destination: WorldMapId;
  name: string;
  subtitle: string;
  x: number;
  z: number;
  arrivalX: number;
  arrivalZ: number;
  arrivalYaw: number;
  group: THREE.Group;
}

interface ActiveRemotePlayer {
  uid: string;
  state: OnlinePlayerState;
  group: THREE.Group;
  targetX: number;
  targetZ: number;
  targetYaw: number;
  stridePhase: number;
}

export interface EngineCallbacks {
  getStats: () => ComputedStats;
  getPlayerLevel: () => number;
  getBestiary: () => Record<MonsterSpeciesId, BestiaryProgressEntry>;
  getEquippedMountId?: () => string | null;
  getDifficultyId?: () => DifficultyId;
  getRaceId?: () => RaceId;
  getClassId?: () => ClassId;
  getRebirths?: () => number;
  isDebuffImmune?: () => boolean;
  isModalOpen: () => boolean;
  onPointerLockChange: (locked: boolean) => void;
  onBlockStateChange?: (blocking: boolean) => void;
  onPlayerDamaged: (amount: number, attackerName: string, blocked?: boolean) => void;
  onPlayerHealed: (hp: number, mana: number) => void;
  onPlayerStatusesChange?: (statuses: PlayerStatusEffect[]) => void;
  onSpendMana: (amount: number) => boolean;
  onMonsterKilled: (speciesId: MonsterSpeciesId, xp: number, gold: number, drops: string[]) => void;
  onMonsterStudy: (speciesId: MonsterSpeciesId, points: number, sightedOnly?: boolean) => void;
  onChestOpened: (gold: number, items: string[]) => void;
  onShrineDiscovered?: (shrineId: string, shrineName: string, zoneName: string, discoveredCount: number) => void;
  onFastTravel?: (shrineId: string, shrineName: string, zoneName: string) => void;
  onLoreObjectInteract?: (loreId: string) => void;
  onClanNpcRescued?: (npcId: string) => void;
  onClanNpcBaseInteract?: (npcId: string) => void;
  onHerbHarvested?: (itemId: string, quantity: number, nodeName: string) => void;
  onZoneEntered?: (zoneName: string) => void;
  onMapChange?: (mapId: WorldMapId) => void;
  onNpcInteract: () => void;
  onMerchantInteract: () => void;
  onLog: (text: string, tone: 'info' | 'damage' | 'crit' | 'heal' | 'loot' | 'quest' | 'study') => void;
  onFloatingDamage: (dmg: FloatingDamage) => void;
  onTargetChange: (target: TargetInfo | null) => void;
  onMinimapUpdate: (snapshot: MinimapSnapshot) => void;
  onSkillCooldowns: (cooldowns: Record<number, number>) => void;
  onSkillTriggerKey: (slotIndex: number) => void;
  onWeatherChange?: (weather: WeatherType) => void;
  onDayTimeChange?: (dayTime: DayTimeSnapshot) => void;
  onNewDay?: (dayNumber: number) => void;
  onJournalSnapshotCaptured?: (entry: TravelerJournalEntry) => void;
}

export class FirstPersonRpgEngine {
  private container: HTMLElement;
  private callbacks: EngineCallbacks;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean;
  private frameId = 0;
  private destroyed = false;
  private clock = new THREE.Clock();

  // Dual-Map World State ('plaza' initial social hub -> 'templo' Temple + Valley)
  private currentMapId: WorldMapId = 'plaza';
  private plazaGroup = new THREE.Group();
  private templeGroup = new THREE.Group();
  private portals: ActivePortal[] = [];
  private plazaObstacles: PillarObstacle[] = [];
  private wardObelisks: THREE.Group[] = [];
  private remotePlayers = new Map<string, ActiveRemotePlayer>();
  private portalCooldown = 0;
  private isMovingLastFrame = false;

  // Player kinematic state (starts at Plaza del Alba facing North toward the Temple Portal)
  private playerPos = new THREE.Vector3(0, 0, 12);
  private playerVelY = 0;
  private grounded = true;
  private yaw = 0;
  private pitch = -0.04;
  private bobPhase = 0;
  private pointerLocked = false;
  private isDraggingLook = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

  // Input state
  private keys: Record<string, boolean> = {};

  // Combat, weapon & mount rig
  private weaponRig: THREE.Group;
  private mountRig: THREE.Group;
  private mountHeightOffset = 0;
  private mountBobPhase = 0;
  private lastMountId: string | null = null;
  private swingAnim = 0;
  private blockStance = 0;
  private isBlocking = false;
  private counterStrikeBuff = false;
  private attackCooldown = 0;
  private skillCooldowns: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  private projectiles: FireballProjectile[] = [];

  // World objects
  private monsters: ActiveMonster[] = [];
  private encounterTimer = 18;
  private dynamicEncounterCounter = 0;
  private chests: ActiveChest[] = [];
  private doors: ActiveDoor[] = [];
  private obstacles: PillarObstacle[] = [];
  private shrines: ActiveShrine[] = [];
  private loreObjects: ActiveLoreObject[] = [];
  private clanNpcs: ActiveClanNpc[] = [];
  private herbNodes: ActiveHerbNode[] = [];
  private npcGroup!: THREE.Group;
  private merchantGroup!: THREE.Group;
  private braziers: THREE.Group[] = [];
  private particles: CombatParticleSystem;
  private weatherParticles: WeatherParticleSystem;
  private chunkManager!: WorldChunkManager;
  private composer: EffectComposer | null = null;
  private weatherPass: ShaderPass | null = null;
  private hemiLight!: THREE.HemisphereLight;
  private keyLight!: THREE.DirectionalLight;
  private rimLight!: THREE.DirectionalLight;
  private playerLantern!: THREE.PointLight;
  private starPoints!: THREE.Points;
  private starMat!: THREE.PointsMaterial;
  private currentWeather: WeatherType = 'despejado';
  private weatherCycleTimer = 0;
  private weatherCycleDuration = 42;
  private timeOfDay = 9.5;
  private dayNumber = 1;
  private daySpeedHoursPerSec = 0.18;
  private currentPhase: DayPhase = 'dia';
  private timeSyncTimer = 0;
  private atmosphereState: ComputedAtmosphere = {
    phase: 'dia',
    phaseLabel: 'Día',
    isNight: false,
    skyColor: new THREE.Color(0x6c96c4),
    keyColor: new THREE.Color(0xfff1d6),
    keyIntensity: 2.0,
    hemiSkyColor: new THREE.Color(0x9dc2eb),
    hemiGroundColor: new THREE.Color(0x453b2c),
    hemiIntensity: 0.9,
    rimColor: new THREE.Color(0xfde68a),
    rimIntensity: 0.5,
    fogDensity: 0.009,
    visibilityMeters: 112,
    starOpacity: 0,
    nightMix: 0,
    sunsetMix: 0,
    rainMix: 0,
    snowMix: 0,
    ashMix: 0,
    fogOverlayMix: 0,
    lanternFactor: 0.15,
  };
  private lastReportedZone = 'Plaza del Alba (Zona Segura)';
  private minimapTimer = 0;
  private targetTimer = 0;
  private hudSyncTimer = 0;
  private statusSyncTimer = 0;
  private bootFrames = 0;
  private capturedPoiIds = new Set<string>();
  private pendingSnapshots: { poiId: string; x: number; z: number }[] = [];
  private snapshotCanvas: HTMLCanvasElement;
  private snapshotCtx: CanvasRenderingContext2D | null;
  private playerStatuses = {
    poison: { remaining: 0, duration: 6, tickTimer: 0, damage: 3 },
    burn: { remaining: 0, duration: 5, tickTimer: 0, damage: 4 },
    slow: { remaining: 0, duration: 4.5 },
  };

  constructor(container: HTMLElement, callbacks: EngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.snapshotCanvas = document.createElement('canvas');
    this.snapshotCanvas.width = 480;
    this.snapshotCanvas.height = 270;
    this.snapshotCtx = this.snapshotCanvas.getContext('2d');

    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const initW = container.clientWidth || window.innerWidth;
    const initH = container.clientHeight || window.innerHeight;
    this.renderer.setSize(initW, initH);

    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    const skyHex = WEATHER_PRESETS.despejado.skyHex;
    this.scene.background = new THREE.Color(skyHex);
    this.scene.fog = new THREE.FogExp2(skyHex, WEATHER_PRESETS.despejado.fogDensity);

    this.camera = new THREE.PerspectiveCamera(72, initW / initH, 0.1, 220);
    this.camera.rotation.order = 'YXZ';
    this.scene.add(this.camera);

    // Mandatory studio environment map for metallic/crystal PBR reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // First-person weapon & shield attached to camera
    this.weaponRig = createFirstPersonWeapon();
    this.camera.add(this.weaponRig);

    // First-person creature mount rig attached to camera (hidden until equipped)
    this.mountRig = createFirstPersonMountRig();
    this.camera.add(this.mountRig);

    this.particles = new CombatParticleSystem(this.scene);
    this.weatherParticles = new WeatherParticleSystem(this.scene, this.renderer.getPixelRatio());

    this.setupLighting();
    this.buildWorld();
    this.setupPostProcessing(initW, initH);
    this.applyImmediateAtmosphere();
    this.bindEvents();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.callbacks.onDayTimeChange?.(this.getDayTimeSnapshot());
    this.callbacks.onMapChange?.(this.currentMapId);
    this.pushMinimapSnapshot();
    this.tick();
  }

  private setupPostProcessing(width: number, height: number): void {
    if (this.isSoftwareGl) return;
    this.composer = new EffectComposer(this.renderer);
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.setSize(width, height);

    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.weatherPass = new ShaderPass(WeatherPostShader);
    this.weatherPass.uniforms.uResolution.value.set(width, height);
    this.composer.addPass(this.weatherPass);

    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
  }

  private setupLighting(): void {
    // Cool sky / warm earth hemisphere fill
    this.hemiLight = new THREE.HemisphereLight(0x88a8d8, 0x2b241d, 0.72);
    this.scene.add(this.hemiLight);

    // Warm moonlight / twilight sun key light
    this.keyLight = new THREE.DirectionalLight(0xffdfb0, 1.55);
    this.keyLight.position.set(28, 42, 22);
    this.keyLight.castShadow = !this.isSoftwareGl;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.camera.near = 5;
    this.keyLight.shadow.camera.far = 110;
    const d = 42;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);
    this.scene.add(this.keyLight.target);

    // Subtle cool rim light
    this.rimLight = new THREE.DirectionalLight(0x6366f1, 0.42);
    this.rimLight.position.set(-30, 20, -35);
    this.scene.add(this.rimLight);

    // Explorer lantern attached to player camera (dims during day, illuminates at night & heavy fog)
    this.playerLantern = new THREE.PointLight(0xffcf87, 0.0, 15, 1.35);
    this.playerLantern.position.set(0.24, -0.16, -0.35);
    this.camera.add(this.playerLantern);
  }

  private buildWorld(): void {
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    const textures = createProceduralTextures(maxAniso);
    const landmarks: LandmarkClearance[] = [];

    this.scene.add(this.plazaGroup);
    this.scene.add(this.templeGroup);
    this.plazaGroup.visible = this.currentMapId === 'plaza';
    this.templeGroup.visible = this.currentMapId === 'templo';

    // =========================================================================
    // MAP 1: PLAZA DEL ALBA (Initial Online Social Hub & Full Safe Zone)
    // =========================================================================
    const plazaMat = new THREE.MeshStandardMaterial({
      map: textures.stoneColor,
      bumpMap: textures.stoneBump,
      bumpScale: 0.04,
      roughness: 0.85,
      metalness: 0.05,
    });
    const plazaFloor = new THREE.Mesh(new THREE.CylinderGeometry(24, 24.5, 0.14, 36), plazaMat);
    plazaFloor.position.set(0, 0.02, 0);
    plazaFloor.receiveShadow = true;
    this.plazaGroup.add(plazaFloor);

    const plazaWalkway = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.12, 26), plazaMat);
    plazaWalkway.position.set(0, 0.04, -3);
    plazaWalkway.receiveShadow = true;
    this.plazaGroup.add(plazaWalkway);

    // Central Fountain in Plaza del Alba
    const fountain = createPlazaFountainModel(textures);
    fountain.position.set(0, 0, 0);
    this.plazaGroup.add(fountain);
    this.plazaObstacles.push({ x: 0, z: 0, r: 3.7 });

    // Clan Heraldic Banners around the Plaza
    const bannerCoords: { x: number; z: number; rotY: number }[] = [
      { x: -9.5, z: -6.5, rotY: 0.65 },
      { x: 9.5, z: -6.5, rotY: -0.65 },
      { x: -9.5, z: 6.5, rotY: 2.35 },
      { x: 9.5, z: 6.5, rotY: -2.35 },
      { x: 0, z: 18.5, rotY: Math.PI },
    ];
    bannerCoords.forEach((b, idx) => {
      const preset = PRESET_CLANS[idx % PRESET_CLANS.length];
      const hex = parseInt(preset.colorHex.replace('#', ''), 16) || 0xd4af5f;
      const banner = createPlazaBannerModel(hex);
      banner.position.set(b.x, 0, b.z);
      banner.rotation.y = b.rotY;
      this.plazaGroup.add(banner);
      this.plazaObstacles.push({ x: b.x, z: b.z, r: 0.55 });
    });

    // Warm Lamp Posts lighting the social Plaza
    const lampCoords: [number, number][] = [
      [-6.5, -10.5],
      [6.5, -10.5],
      [-14.5, 0],
      [14.5, 0],
      [-7.5, 11.5],
      [7.5, 11.5],
    ];
    lampCoords.forEach(([lx, lz]) => {
      const lamp = createPlazaLampPostModel(textures);
      lamp.position.set(lx, 0, lz);
      this.plazaGroup.add(lamp);
      this.plazaObstacles.push({ x: lx, z: lz, r: 0.5 });
    });

    // Main Dimensional Portal: Plaza del Alba -> Templo del Velo
    const plazaToTemplePortal = createDimensionalPortalModel('templo', textures);
    plazaToTemplePortal.position.set(0, 0, -14);
    plazaToTemplePortal.rotation.y = 0;
    this.plazaGroup.add(plazaToTemplePortal);
    this.plazaObstacles.push({ x: -1.65, z: -14, r: 0.5 });
    this.plazaObstacles.push({ x: 1.65, z: -14, r: 0.5 });
    this.portals.push({
      id: 'portal_to_templo',
      mapId: 'plaza',
      destination: 'templo',
      name: 'Portal al Templo del Velo',
      subtitle: 'Teletransporte al Santuario del Templo (Zona Segura) y el Valle',
      x: 0,
      z: -14,
      arrivalX: -5.2,
      arrivalZ: 7.5,
      arrivalYaw: -0.45,
      group: plazaToTemplePortal,
    });

    // =========================================================================
    // MAP 2: TEMPLO DEL VELO (Central Safe Zone Sanctuary) + HOSTILE VALLEY
    // =========================================================================
    const templeCourtyard = new THREE.Mesh(new THREE.CylinderGeometry(14.5, 15.0, 0.14, 32), plazaMat);
    templeCourtyard.position.set(0, 0.02, 2);
    templeCourtyard.receiveShadow = true;
    this.templeGroup.add(templeCourtyard);

    // Protective Ward Obelisks marking the Temple Safe Zone perimeter
    const wardCoords: [number, number][] = [
      [-11.8, -3.5],
      [11.8, -3.5],
      [-14.2, 4.8],
      [14.2, 4.8],
      [-8.5, 14.5],
      [8.5, 14.5],
    ];
    wardCoords.forEach(([wx, wz]) => {
      const obelisk = createTempleWardObeliskModel(textures);
      obelisk.position.set(wx, groundHeightAt(wx, wz, 'templo'), wz);
      this.templeGroup.add(obelisk);
      this.obstacles.push({ x: wx, z: wz, r: 0.6 });
      landmarks.push({ x: wx, z: wz, r: 2.2 });
      this.wardObelisks.push(obelisk);
    });

    // Return Portal inside Temple Safe Zone: Templo del Velo -> Plaza del Alba
    const templeToPlazaPortal = createDimensionalPortalModel('plaza', textures);
    templeToPlazaPortal.position.set(-7.5, groundHeightAt(-7.5, 7.5, 'templo'), 7.5);
    templeToPlazaPortal.rotation.y = Math.PI * 0.25;
    this.templeGroup.add(templeToPlazaPortal);
    landmarks.push({ x: -7.5, z: 7.5, r: 3.4 });
    this.portals.push({
      id: 'portal_to_plaza',
      mapId: 'templo',
      destination: 'plaza',
      name: 'Portal a la Plaza del Alba',
      subtitle: 'Regresa al punto de reunión inicial y hermandades (Zona Segura)',
      x: -7.5,
      z: 7.5,
      arrivalX: 0,
      arrivalZ: -9.8,
      arrivalYaw: Math.PI,
      group: templeToPlazaPortal,
    });

    // Fast-Travel Shrines across Core Valley & Expanded Outer Frontier
    const shrineSpecs: Omit<ActiveShrine, 'group'>[] = [
      {
        id: 'shrine_bastion',
        name: 'Santuario del Bastión',
        zoneName: 'Santuario del Bastión',
        x: -4.5,
        z: 2,
        arrivalX: -1.5,
        arrivalZ: 4.5,
        arrivalYaw: -0.35,
        discovered: true,
      },
      {
        id: 'shrine_atrio',
        name: 'Santuario del Atrio',
        zoneName: 'Atrio Antiguo',
        x: -4.5,
        z: -18,
        arrivalX: -1.8,
        arrivalZ: -16.5,
        arrivalYaw: 0.4,
        discovered: false,
      },
      {
        id: 'shrine_sombrio',
        name: 'Santuario Sombrío',
        zoneName: 'Santuario Sombrío',
        x: -20,
        z: -10,
        arrivalX: -17.2,
        arrivalZ: -9.5,
        arrivalYaw: 1.2,
        discovered: false,
      },
      {
        id: 'shrine_crater',
        name: 'Santuario del Cráter',
        zoneName: 'Cráter Basáltico',
        x: 15,
        z: -22,
        arrivalX: 12.2,
        arrivalZ: -21.0,
        arrivalYaw: -1.1,
        discovered: false,
      },
      {
        id: 'shrine_altar',
        name: 'Santuario del Altar Carmesí',
        zoneName: 'Altar del Wyvern',
        x: -6,
        z: -35,
        arrivalX: -3.4,
        arrivalZ: -35.8,
        arrivalYaw: -0.6,
        discovered: false,
      },
      {
        id: 'shrine_bosque_sur',
        name: 'Santuario del Bosque Susurrante',
        zoneName: 'Bosque Susurrante (Sur)',
        x: 12,
        z: 82,
        arrivalX: 10.2,
        arrivalZ: 79.0,
        arrivalYaw: 0.4,
        discovered: false,
      },
      {
        id: 'shrine_paramo_este',
        name: 'Santuario del Páramo de Ceniza',
        zoneName: 'Páramo de Ceniza (Este)',
        x: 84,
        z: -18,
        arrivalX: 81.0,
        arrivalZ: -16.5,
        arrivalYaw: -1.1,
        discovered: false,
      },
      {
        id: 'shrine_bruma_oeste',
        name: 'Santuario de la Bruma Occidental',
        zoneName: 'Bruma de Occidente (Oeste)',
        x: -84,
        z: -12,
        arrivalX: -81.0,
        arrivalZ: -10.8,
        arrivalYaw: 1.2,
        discovered: false,
      },
      {
        id: 'shrine_tierras_altas',
        name: 'Santuario de las Tierras Altas',
        zoneName: 'Tierras Altas del Norte',
        x: -10,
        z: -92,
        arrivalX: -7.5,
        arrivalZ: -89.2,
        arrivalYaw: -0.5,
        discovered: false,
      },
    ];

    shrineSpecs.forEach((spec) => {
      const group = createShrineModel(textures, spec.discovered);
      group.position.set(spec.x, groundHeightAt(spec.x, spec.z, 'templo'), spec.z);
      this.templeGroup.add(group);
      this.obstacles.push({ x: spec.x, z: spec.z, r: 1.4 });
      landmarks.push({ x: spec.x, z: spec.z, r: 4.5 });
      landmarks.push({ x: spec.arrivalX, z: spec.arrivalZ, r: 3.2 });
      this.shrines.push({ ...spec, group });
    });

    // Archivist Scholar NPC (Dynamic day/night positioning inside Temple Safe Zone)
    this.npcGroup = createArchivistNpcModel();
    this.npcGroup.position.set(4.5, groundHeightAt(4.5, 2, 'templo'), 2);
    this.npcGroup.rotation.y = -0.6;
    this.templeGroup.add(this.npcGroup);

    // Merchant Kael NPC (Dynamic day/night/rain shelter positioning inside Temple Safe Zone)
    this.merchantGroup = createMerchantNpcModel(textures);
    this.merchantGroup.position.set(5.5, groundHeightAt(5.5, 6.2, 'templo'), 6.2);
    this.merchantGroup.rotation.y = -1.1;
    this.templeGroup.add(this.merchantGroup);

    // Ancient Ruin Pillars & Braziers
    const pillarSpecs: { x: number; z: number; h: number; brazier: boolean }[] = [
      { x: -9, z: 9, h: 4.2, brazier: true },
      { x: 9, z: 9, h: 4.2, brazier: true },
      { x: -10, z: -7, h: 4.6, brazier: true },
      { x: 10, z: -7, h: 4.6, brazier: true },
      { x: -18, z: -18, h: 5.0, brazier: false },
      { x: 18, z: -18, h: 5.0, brazier: false },
      { x: -7, z: -26, h: 5.5, brazier: true },
      { x: 7, z: -26, h: 5.5, brazier: true },
      { x: -24, z: 4, h: 3.8, brazier: false },
      { x: 24, z: -4, h: 4.0, brazier: false },
      { x: -12, z: -40, h: 6.0, brazier: true },
      { x: 12, z: -40, h: 6.0, brazier: true },
    ];
    pillarSpecs.forEach((p) => {
      const pillar = createRuinPillar(textures, p.h, p.brazier);
      pillar.position.set(p.x, groundHeightAt(p.x, p.z, 'templo') - 0.05, p.z);
      this.templeGroup.add(pillar);
      this.obstacles.push({ x: p.x, z: p.z, r: 1.15 });
      landmarks.push({ x: p.x, z: p.z, r: 3.0 });
      if (p.brazier) this.braziers.push(pillar);
    });

    // Treasure Chests across Core Zones & Expanded Frontier
    const chestConfigs: { id: string; x: number; z: number; gold: number; items: string[] }[] = [
      { id: 'chest_1', x: -16, z: 14, gold: 35, items: ['pocion_vida', 'muestra_goblin', 'hierba_solar', 'piel_curtida'] },
      { id: 'chest_2', x: 19, z: -12, gold: 65, items: ['hoja_alba', 'elixir_mana', 'runa_menor'] },
      { id: 'chest_3', x: -24, z: -14, gold: 90, items: ['amuleto_rubi', 'muestra_espectro', 'flor_eterea'] },
      { id: 'chest_4', x: 16, z: -34, gold: 130, items: ['hacha_obsidiana', 'pocion_vida', 'runa_ignea'] },
      { id: 'chest_5', x: -18, z: 86, gold: 110, items: ['hierba_solar', 'pocion_furia_solar', 'runa_menor', 'piel_curtida'] },
      { id: 'chest_6', x: 92, z: -8, gold: 145, items: ['extracto_ceniza', 'runa_ignea', 'pocion_piel_basaltica'] },
      { id: 'chest_7', x: -92, z: -20, gold: 140, items: ['flor_eterea', 'extracto_espectral', 'pocion_paso_etereo'] },
      { id: 'chest_8', x: 14, z: -98, gold: 185, items: ['pocion_sangre_inmortal', 'runa_ignea', 'elixir_mana', 'piel_curtida'] },
    ];
    chestConfigs.forEach((cfg) => {
      const group = createChestModel(textures);
      const gy = groundHeightAt(cfg.x, cfg.z, 'templo');
      group.position.set(cfg.x, gy, cfg.z);
      group.rotation.y = Math.atan2(-cfg.x, -cfg.z);
      this.templeGroup.add(group);
      landmarks.push({ x: cfg.x, z: cfg.z, r: 3.2 });
      this.chests.push({
        id: cfg.id,
        group,
        opened: false,
        openProgress: 0,
        lootItemIds: cfg.items,
        gold: cfg.gold,
      });
    });

    // Interactive 3D Lore Relics across zones
    const loreSpecs: {
      id: string;
      loreId: string;
      name: string;
      zoneName: string;
      x: number;
      z: number;
      rotY: number;
    }[] = [
      {
        id: 'lore_obj_1',
        loreId: 'lore_fundacion',
        name: 'Acta Fundacional del Bastión',
        zoneName: 'Santuario del Bastión',
        x: 2.2,
        z: -3.2,
        rotY: 0.25,
      },
      {
        id: 'lore_obj_2',
        loreId: 'lore_estandarte',
        name: 'Estela de la Primera Guardia',
        zoneName: 'Atrio Antiguo',
        x: 6.4,
        z: -13.5,
        rotY: -0.6,
      },
      {
        id: 'lore_obj_3',
        loreId: 'lore_sombras',
        name: 'Diario del Cartógrafo Etéreo',
        zoneName: 'Santuario Sombrío',
        x: -16.5,
        z: -5.5,
        rotY: 0.9,
      },
      {
        id: 'lore_obj_4',
        loreId: 'lore_forja_crater',
        name: 'Tablilla del Crisol Basáltico',
        zoneName: 'Cráter Basáltico',
        x: 13.5,
        z: -28.0,
        rotY: -1.1,
      },
    ];
    loreSpecs.forEach((ls) => {
      const group = createLoreRelicModel(textures, false);
      group.position.set(ls.x, groundHeightAt(ls.x, ls.z, 'templo'), ls.z);
      group.rotation.y = ls.rotY;
      this.templeGroup.add(group);
      this.obstacles.push({ x: ls.x, z: ls.z, r: 0.72 });
      landmarks.push({ x: ls.x, z: ls.z, r: 3.0 });
      this.loreObjects.push({
        id: ls.id,
        loreId: ls.loreId,
        name: ls.name,
        zoneName: ls.zoneName,
        x: ls.x,
        z: ls.z,
        discovered: false,
        group,
      });
    });

    // Rescuable Clan NPCs in the 3D Valley (relocate to Santuario Bastión once invited)
    CLAN_NPCS_CATALOG.forEach((cSpec) => {
      const group = createClanNpcModel(cSpec.cloakHex, cSpec.accentHex);
      const ry = groundHeightAt(cSpec.rescueCoords.x, cSpec.rescueCoords.z, 'templo');
      group.position.set(cSpec.rescueCoords.x, ry, cSpec.rescueCoords.z);
      group.rotation.y = Math.atan2(-cSpec.rescueCoords.x, -cSpec.rescueCoords.z);
      this.templeGroup.add(group);
      landmarks.push({ x: cSpec.rescueCoords.x, z: cSpec.rescueCoords.z, r: 3.5 });
      this.clanNpcs.push({
        id: cSpec.id,
        name: cSpec.name,
        title: cSpec.title,
        rescueZone: cSpec.rescueZone,
        rescueX: cSpec.rescueCoords.x,
        rescueZ: cSpec.rescueCoords.z,
        baseX: cSpec.baseCoords.x,
        baseZ: cSpec.baseCoords.z,
        baseRotY: cSpec.baseCoords.rotY,
        rescued: false,
        invited: false,
        role: 'ninguno',
        group,
      });
    });

    // Harvestable Botanical Herbs & Alchemy Extracts across the Valley
    WORLD_HERB_NODES.forEach((hSpec) => {
      const group = createHerbNodeModel(hSpec.colorHex);
      group.position.set(hSpec.x, groundHeightAt(hSpec.x, hSpec.z, 'templo'), hSpec.z);
      this.templeGroup.add(group);
      landmarks.push({ x: hSpec.x, z: hSpec.z, r: 2.2 });
      this.herbNodes.push({
        id: hSpec.id,
        itemId: hSpec.itemId,
        name: hSpec.name,
        x: hSpec.x,
        z: hSpec.z,
        available: true,
        respawnTimer: 0,
        group,
      });
    });

    // Ancient Gate Doors at Atrio Antiguo & Altar Norte
    const gateSpecs: { id: string; name: string; x: number; z: number }[] = [
      { id: 'gate_atrio', name: 'Portón del Atrio Antiguo', x: 0, z: -10.5 },
      { id: 'gate_altar', name: 'Puerta del Altar Carmesí', x: 0, z: -33.5 },
    ];
    gateSpecs.forEach((g) => {
      const group = createGateModel(textures);
      const gy = groundHeightAt(g.x, g.z, 'templo');
      group.position.set(g.x, gy, g.z);
      this.templeGroup.add(group);
      this.obstacles.push({ x: g.x - 2.35, z: g.z, r: 0.7 });
      this.obstacles.push({ x: g.x + 2.35, z: g.z, r: 0.7 });
      landmarks.push({ x: g.x, z: g.z, r: 4.5 });
      this.doors.push({
        id: g.id,
        name: g.name,
        group,
        open: false,
        openProgress: 0,
        x: g.x,
        z: g.z,
      });
    });

    // Spawn Monsters across the valley with Diurnal / Nocturnal ecological schedules
    const initialPhaseInfo = getDayPhaseInfo(this.timeOfDay);
    const monsterSpawns: {
      id: string;
      speciesId: MonsterSpeciesId;
      x: number;
      z: number;
      schedule: MonsterSchedule;
    }[] = [
      // Ruinas Exteriores (Goblins diurnos + merodeador persistente)
      { id: 'mob_g1', speciesId: 'goblin_merodeador', x: -16, z: 18, schedule: 'diurno' },
      { id: 'mob_g2', speciesId: 'goblin_merodeador', x: 16, z: 17, schedule: 'diurno' },
      { id: 'mob_g3', speciesId: 'goblin_merodeador', x: 22, z: 4, schedule: 'diurno' },
      { id: 'mob_g4', speciesId: 'goblin_merodeador', x: -22, z: 8, schedule: 'siempre' },
      // Acechadores Nocturnos que invaden las Ruinas Exteriores tras el ocaso
      { id: 'mob_n_w1', speciesId: 'espectro_velo', x: -15, z: 19, schedule: 'nocturno' },
      { id: 'mob_n_w2', speciesId: 'espectro_velo', x: 17, z: 16, schedule: 'nocturno' },
      { id: 'mob_n_s1', speciesId: 'esqueleto_centinela', x: 19, z: 4, schedule: 'nocturno' },
      { id: 'mob_n_s2', speciesId: 'esqueleto_centinela', x: -19, z: -1, schedule: 'nocturno' },
      // Atrio Antiguo (Esqueletos)
      { id: 'mob_s1', speciesId: 'esqueleto_centinela', x: -8, z: -15, schedule: 'siempre' },
      { id: 'mob_s2', speciesId: 'esqueleto_centinela', x: 8, z: -17, schedule: 'siempre' },
      { id: 'mob_s3', speciesId: 'esqueleto_centinela', x: 0, z: -24, schedule: 'siempre' },
      // Santuario Sombrío Oeste (Espectros)
      { id: 'mob_w1', speciesId: 'espectro_velo', x: -26, z: -6, schedule: 'siempre' },
      { id: 'mob_w2', speciesId: 'espectro_velo', x: -28, z: -22, schedule: 'siempre' },
      // Cráter Basáltico Este (Gólems)
      { id: 'mob_go1', speciesId: 'golem_obsidiana', x: 24, z: -24, schedule: 'siempre' },
      { id: 'mob_go2', speciesId: 'golem_obsidiana', x: 20, z: -36, schedule: 'siempre' },
      // Altar del Dragón Norte (Jefe Wyvern)
      { id: 'mob_boss', speciesId: 'wyvern_ceniza', x: 0, z: -43, schedule: 'siempre' },
      // Frontera Sur: Bosque Susurrante
      { id: 'mob_ext_s1', speciesId: 'goblin_merodeador', x: 18, z: 72, schedule: 'diurno' },
      { id: 'mob_ext_s2', speciesId: 'goblin_merodeador', x: -16, z: 78, schedule: 'siempre' },
      { id: 'mob_ext_s3', speciesId: 'goblin_merodeador', x: 4, z: 96, schedule: 'siempre' },
      { id: 'mob_ext_s4', speciesId: 'espectro_velo', x: -24, z: 68, schedule: 'nocturno' },
      // Frontera Oeste: Bruma de Occidente
      { id: 'mob_ext_w1', speciesId: 'espectro_velo', x: -66, z: -6, schedule: 'siempre' },
      { id: 'mob_ext_w2', speciesId: 'esqueleto_centinela', x: -78, z: 16, schedule: 'siempre' },
      { id: 'mob_ext_w3', speciesId: 'espectro_velo', x: -92, z: -26, schedule: 'siempre' },
      { id: 'mob_ext_w4', speciesId: 'esqueleto_centinela', x: -72, z: -38, schedule: 'nocturno' },
      // Frontera Este: Páramo de Ceniza
      { id: 'mob_ext_e1', speciesId: 'golem_obsidiana', x: 68, z: -14, schedule: 'siempre' },
      { id: 'mob_ext_e2', speciesId: 'golem_obsidiana', x: 82, z: -34, schedule: 'siempre' },
      { id: 'mob_ext_e3', speciesId: 'esqueleto_centinela', x: 74, z: 14, schedule: 'siempre' },
      { id: 'mob_ext_e4', speciesId: 'golem_obsidiana', x: 96, z: -24, schedule: 'siempre' },
      // Frontera Norte: Tierras Altas
      { id: 'mob_ext_n1', speciesId: 'golem_obsidiana', x: -20, z: -78, schedule: 'siempre' },
      { id: 'mob_ext_n2', speciesId: 'espectro_velo', x: 18, z: -82, schedule: 'siempre' },
      { id: 'mob_ext_n3', speciesId: 'golem_obsidiana', x: 0, z: -104, schedule: 'siempre' },
      // 5 Dragones Elementales (Jefes de Renacimiento — sueltan Corazones de Dragón)
      { id: 'boss_dragon_rojo', speciesId: 'dragon_rojo_ardiente', x: 76, z: -20, schedule: 'siempre' },
      { id: 'boss_dragon_negro', speciesId: 'dragon_negro_oscuro', x: -78, z: -22, schedule: 'siempre' },
      { id: 'boss_dragon_verde', speciesId: 'dragon_verde_espiritual', x: 0, z: 92, schedule: 'siempre' },
      { id: 'boss_dragon_celeste', speciesId: 'dragon_celeste_hielo', x: 22, z: -96, schedule: 'siempre' },
      { id: 'boss_dragon_amarillo', speciesId: 'dragon_amarillo_divino', x: -34, z: -98, schedule: 'siempre' },
    ];

    landmarks.push(
      { x: 76, z: -20, r: 8.5 },
      { x: -78, z: -22, r: 8.5 },
      { x: 0, z: 92, r: 8.5 },
      { x: 22, z: -96, r: 8.5 },
      { x: -34, z: -98, r: 8.5 }
    );

    // Initialize Chunk Streaming Manager on Plaza del Alba (initial map)
    this.chunkManager = new WorldChunkManager(
      this.scene,
      textures,
      this.isSoftwareGl,
      landmarks,
      this.currentMapId
    );
    this.chunkManager.update(this.playerPos.x, this.playerPos.z, true);

    const initialScaling = this.getWorldScaling();
    monsterSpawns.forEach((sp) => {
      const spec = MONSTER_SPECIES[sp.speciesId];
      const model = createMonsterModel(sp.speciesId);
      const y = groundHeightAt(sp.x, sp.z, 'templo');
      const scheduleActive = this.isScheduleActive(sp.schedule, initialPhaseInfo.isNight);
      const isElite =
        !this.isDragonBoss(sp.speciesId) && Math.random() < initialScaling.eliteChance;
      const baseScale = isElite ? 1.16 : 1.0;
      const scaledMaxHp = Math.round(
        spec.baseHp * initialScaling.hpMult * (isElite ? 1.45 : 1.0)
      );
      model.position.set(sp.x, y, sp.z);
      model.scale.setScalar(baseScale);
      model.visible = scheduleActive && this.currentMapId === 'templo' && this.chunkManager.isWorldPosLoaded(sp.x, sp.z);
      this.templeGroup.add(model);
      this.monsters.push({
        id: sp.id,
        speciesId: sp.speciesId,
        schedule: sp.schedule,
        scheduleActive,
        group: model,
        spawnPos: new THREE.Vector3(sp.x, y, sp.z),
        hp: scaledMaxHp,
        maxHp: scaledMaxHp,
        alive: true,
        isElite,
        baseScale,
        respawnTimer: 0,
        attackTimer: 0.4,
        hitFlashTimer: 0,
        studyCooldown: 0,
        patrolPhase: Math.random() * Math.PI * 2,
        burnTimer: 0,
        burnTickTimer: 0,
        burnDamage: 0,
        poisonTimer: 0,
        poisonTickTimer: 0,
        poisonDamage: 0,
        statusParticleTimer: 0,
      });
    });

    // Dynamic starfield dome (follows player across expanded map; fades out at dawn)
    const starCount = 260;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.42;
      const r = 155;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi) + 10;
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    this.starMat = new THREE.PointsMaterial({
      color: 0xe2e8f0,
      size: 0.62,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0,
      fog: false,
    });
    this.starPoints = new THREE.Points(starGeo, this.starMat);
    this.starPoints.position.set(this.playerPos.x, 0, this.playerPos.z);
    this.scene.add(this.starPoints);
  }

  private bindEvents(): void {
    const canvas = this.renderer.domElement;

    const onResize = () => {
      if (this.destroyed) return;
      const w = this.container.clientWidth || window.innerWidth;
      const h = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      if (this.composer) {
        this.composer.setSize(w, h);
      }
      if (this.weatherPass) {
        this.weatherPass.uniforms.uResolution.value.set(w, h);
      }
    };
    window.addEventListener('resize', onResize);

    const onPointerLockChange = () => {
      this.pointerLocked = document.pointerLockElement === canvas;
      this.callbacks.onPointerLockChange(this.pointerLocked);
    };
    document.addEventListener('pointerlockchange', onPointerLockChange);

    const onMouseDown = (e: MouseEvent) => {
      if (this.callbacks.isModalOpen()) return;
      if (e.target !== canvas) return;

      if (!this.pointerLocked && e.button === 0) {
        // Attempt pointer lock, and also support drag-look / attack seamlessly
        try {
          canvas.requestPointerLock?.();
        } catch {
          // Ignore in restricted environments
        }
        this.isDraggingLook = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.performMeleeAttack();
      } else if (this.pointerLocked && e.button === 0) {
        this.performMeleeAttack();
      } else if (e.button === 2) {
        this.triggerSkill(1);
      }
    };

    const onMouseUp = () => {
      this.isDraggingLook = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (this.callbacks.isModalOpen()) return;
      if (this.pointerLocked) {
        this.yaw -= e.movementX * 0.0023;
        this.pitch = THREE.MathUtils.clamp(this.pitch - e.movementY * 0.0021, -1.25, 1.25);
      } else if (this.isDraggingLook) {
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.yaw -= dx * 0.004;
        this.pitch = THREE.MathUtils.clamp(this.pitch - dy * 0.004, -1.25, 1.25);
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      if (e.target === canvas) e.preventDefault();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const targetEl = e.target as HTMLElement | null;
      if (
        targetEl &&
        (targetEl.tagName === 'INPUT' ||
          targetEl.tagName === 'TEXTAREA' ||
          targetEl.tagName === 'SELECT')
      ) {
        return;
      }
      this.keys[e.code] = true;
      if (this.callbacks.isModalOpen()) return;

      if (e.code === 'KeyF') this.performMeleeAttack();
      if (e.code === 'KeyE') this.performInteract();
      if (e.code === 'KeyG' && !this.isBlocking) {
        this.isBlocking = true;
        this.callbacks.onBlockStateChange?.(true);
      }
      if (e.code === 'Digit1') this.callbacks.onSkillTriggerKey(1);
      if (e.code === 'Digit2') this.callbacks.onSkillTriggerKey(2);
      if (e.code === 'Digit3') this.callbacks.onSkillTriggerKey(3);
      if (e.code === 'Digit4') this.callbacks.onSkillTriggerKey(4);
      if (e.code === 'Digit5') this.callbacks.onSkillTriggerKey(5);
      if (e.code === 'Digit6') this.callbacks.onSkillTriggerKey(6);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      this.keys[e.code] = false;
      if (e.code === 'KeyG' && this.isBlocking) {
        this.isBlocking = false;
        this.callbacks.onBlockStateChange?.(false);
      }
    };

    const onWindowBlur = () => {
      this.keys = {};
      this.isDraggingLook = false;
      if (this.isBlocking) {
        this.isBlocking = false;
        this.callbacks.onBlockStateChange?.(false);
      }
    };

    const onContextLost = (e: Event) => {
      e.preventDefault();
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onWindowBlur);
    canvas.addEventListener('webglcontextlost', onContextLost);

    // Store cleanup on instance
    this.cleanupListeners = () => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
      canvas.removeEventListener('webglcontextlost', onContextLost);
    };
  }

  private cleanupListeners: () => void = () => {};

  public releasePointerLock(): void {
    if (document.pointerLockElement) {
      document.exitPointerLock?.();
    }
    this.isDraggingLook = false;
    this.isBlocking = false;
    this.callbacks.onBlockStateChange?.(false);
    this.keys = {};
  }

  public requestPointerLock(): void {
    try {
      this.renderer.domElement.requestPointerLock?.();
    } catch {
      // fallback
    }
  }

  public performMeleeAttack(bonusCritChance = 0, damageMultiplier = 1): void {
    if (this.attackCooldown > 0) return;
    if (isPositionSafeZone(this.playerPos.x, this.playerPos.z, this.currentMapId)) {
      this.swingAnim = 0.7;
      this.callbacks.onLog('Estás en Zona Segura: el combate está desactivado aquí.', 'info');
      return;
    }
    const stats = this.callbacks.getStats();
    this.attackCooldown = 0.46 / stats.velocidadAtaque;
    this.swingAnim = 1.0;
    soundEngine.playEvent('combat:swing');

    if (this.currentMapId !== 'templo') return;

    // Check forward cone / range hit
    _forward.set(0, 0, -1).applyAxisAngle(THREE.Object3D.DEFAULT_UP, this.yaw);
    let bestMonster: ActiveMonster | null = null;
    let bestDist = 4.2;

    for (const m of this.monsters) {
      if (!m.alive || !m.scheduleActive) continue;
      _toEntity.subVectors(m.group.position, this.playerPos);
      _toEntity.y = 0;
      const dist = _toEntity.length();
      if (dist > 4.2) continue;
      _toEntity.normalize();
      const dot = _forward.dot(_toEntity);
      if (dot > 0.42 && dist < bestDist) {
        bestDist = dist;
        bestMonster = m;
      }
    }

    if (bestMonster) {
      this.damageMonster(bestMonster, stats, bonusCritChance, damageMultiplier, false);
    }
  }

  private getActiveDifficulty(): DifficultyDefinition {
    const id = this.callbacks.getDifficultyId?.() ?? 'normal';
    return DIFFICULTIES_CATALOG.find((d) => d.id === id) ?? DIFFICULTIES_CATALOG[0];
  }

  private getWorldScaling(): WorldScalingProfile {
    const level = this.callbacks.getPlayerLevel();
    const rebirths = this.callbacks.getRebirths?.() ?? 0;
    const diffId = this.callbacks.getDifficultyId?.() ?? 'normal';
    return computeWorldScaling(level, rebirths, diffId);
  }

  private isDragonBoss(speciesId: MonsterSpeciesId): boolean {
    return speciesId === 'wyvern_ceniza' || speciesId.startsWith('dragon_');
  }

  public syncDifficultyScale(): void {
    const scaling = this.getWorldScaling();
    for (const m of this.monsters) {
      const spec = MONSTER_SPECIES[m.speciesId];
      const nextMax = Math.round(
        spec.baseHp * scaling.hpMult * (m.isElite ? 1.45 : 1.0)
      );
      const ratio = m.maxHp > 0 ? m.hp / m.maxHp : 1;
      m.maxHp = nextMax;
      if (m.alive) {
        m.hp = Math.max(1, Math.min(nextMax, Math.round(nextMax * ratio)));
      } else {
        m.hp = nextMax;
      }
    }
    this.encounterTimer = Math.min(this.encounterTimer, scaling.encounterIntervalSec);
  }

  private spendSkillMana(baseCost: number): boolean {
    const raceId = this.callbacks.getRaceId?.() ?? 'humano';
    const cost = raceId === 'elfo' ? Math.max(1, Math.round(baseCost * 0.75)) : baseCost;
    return this.callbacks.onSpendMana(cost);
  }

  private performAoeAttack(
    radius: number,
    damageMultiplier: number,
    bonusCrit: number,
    particleType: 'hit' | 'crit' | 'burn' | 'poison' | 'shrine',
    options?: {
      forwardOnly?: boolean;
      applyBurn?: boolean;
      applyPoison?: boolean;
      knockback?: number;
      bonusVsDragons?: number;
    }
  ): number {
    const stats = this.callbacks.getStats();
    _forward.set(0, 0, -1).applyAxisAngle(THREE.Object3D.DEFAULT_UP, this.yaw);
    let hits = 0;

    if (this.currentMapId === 'templo' && !isPositionSafeZone(this.playerPos.x, this.playerPos.z, this.currentMapId)) {
      for (const m of this.monsters) {
        if (!m.alive || !m.scheduleActive) continue;
        _toEntity.subVectors(m.group.position, this.playerPos);
        _toEntity.y = 0;
        const dist = _toEntity.length();
        if (dist > radius) continue;

      if (options?.forwardOnly && dist > 0.1) {
        _toEntity.normalize();
        if (_forward.dot(_toEntity) < 0.25) continue;
      }

      const mult =
        options?.bonusVsDragons && this.isDragonBoss(m.speciesId)
          ? damageMultiplier * options.bonusVsDragons
          : damageMultiplier;

      this.damageMonster(m, stats, bonusCrit, mult, particleType === 'burn' || particleType === 'shrine');
      hits++;

      if (m.alive && options?.applyBurn) {
        m.burnTimer = Math.max(m.burnTimer, 5.5);
        m.burnDamage = Math.max(m.burnDamage, Math.round(stats.danoMax * 0.35));
      }
      if (m.alive && options?.applyPoison) {
        m.poisonTimer = Math.max(m.poisonTimer, 6.0);
        m.poisonDamage = Math.max(m.poisonDamage, Math.round(stats.danoMax * 0.3));
      }
      if (m.alive && options?.knockback) {
        _toEntity.subVectors(m.group.position, this.playerPos);
        _toEntity.y = 0;
        if (_toEntity.lengthSq() > 0.01) {
          _toEntity.normalize();
          m.group.position.addScaledVector(_toEntity, options.knockback);
        }
      }
    }
    }

    this.particles.emitBurst(
      particleType,
      this.playerPos.x + _forward.x * 2.2,
      this.playerPos.y + 1.25,
      this.playerPos.z + _forward.z * 2.2,
      28
    );
    return hits;
  }

  public triggerSkill(slotIndex: number): void {
    if (this.skillCooldowns[slotIndex] > 0) return;
    const stats = this.callbacks.getStats();
    const raceId = this.callbacks.getRaceId?.() ?? 'humano';
    const classId = this.callbacks.getClassId?.() ?? 'caballero_runico';
    const rebirths = this.callbacks.getRebirths?.() ?? 0;
    const raceDef = RACES_CATALOG.find((r) => r.id === raceId) ?? RACES_CATALOG[0];
    const classDef = CLASSES_CATALOG.find((c) => c.id === classId) ?? CLASSES_CATALOG[0];

    const triggerPaladinHeal = () => {
      if (classId === 'paladin_solar') {
        const bonusHeal = Math.max(12, Math.round(stats.maxHp * 0.08));
        this.callbacks.onPlayerHealed(bonusHeal, 0);
      }
    };

    if (slotIndex === 1) {
      // Orbe Ígneo (Fireball projectile)
      if (!this.spendSkillMana(18)) {
        this.callbacks.onLog('Maná insuficiente para Orbe Ígneo.', 'info');
        return;
      }
      this.skillCooldowns[1] = 2.2;
      soundEngine.playEvent('spell:fireball');
      this.spawnFireball(stats);
      triggerPaladinHeal();
    } else if (slotIndex === 2) {
      // Luz Restauradora (Heal)
      if (!this.spendSkillMana(22)) {
        this.callbacks.onLog('Maná insuficiente para Luz Restauradora.', 'info');
        return;
      }
      this.skillCooldowns[2] = 6.0;
      const healAmount = Math.round(35 + stats.regenHp * 8 + this.callbacks.getPlayerLevel() * 5);
      soundEngine.playEvent('spell:heal');
      const cleansed = this.cleanseStatuses();
      this.callbacks.onPlayerHealed(healAmount, 0);
      this.callbacks.onLog(
        cleansed.length > 0
          ? `Luz Restauradora recupera +${healAmount} HP y purifica ${cleansed.join(', ')}.`
          : `Luz Restauradora recupera +${healAmount} HP.`,
        'heal'
      );
      this.callbacks.onFloatingDamage({
        id: `heal-${Date.now()}-${Math.random()}`,
        value: `+${healAmount} HP`,
        isCrit: false,
        isHeal: true,
        screenX: window.innerWidth * 0.5,
        screenY: window.innerHeight * 0.58,
      });
    } else if (slotIndex === 3) {
      // Tajo Ejecutor (High Crit Heavy Strike)
      if (!this.spendSkillMana(15)) {
        this.callbacks.onLog('Maná insuficiente para Tajo Ejecutor.', 'info');
        return;
      }
      this.skillCooldowns[3] = 4.5;
      this.attackCooldown = 0; // Override global melee delay
      this.performMeleeAttack(45, 1.65);
      triggerPaladinHeal();
    } else if (slotIndex === 4) {
      // Habilidad Activa Racial
      if (!this.spendSkillMana(raceDef.activeSkill.manaCost)) {
        this.callbacks.onLog(`Maná insuficiente para ${raceDef.activeSkill.name}.`, 'info');
        return;
      }
      this.skillCooldowns[4] = raceDef.activeSkill.cooldown;

      if (raceId === 'humano') {
        const healAmt = Math.round(stats.maxHp * 0.28);
        this.cleanseStatuses();
        this.callbacks.onPlayerHealed(healAmt, 0);
        const hits = this.performAoeAttack(5.2, 1.45, 15, 'shrine', { knockback: 1.4 });
        soundEngine.playEvent('spell:heal');
        this.callbacks.onLog(
          `Baluarte Imperial: +${healAmt} HP restaurados${hits > 0 ? ` e impactas a ${hits} enemigos` : ''}.`,
          'heal'
        );
      } else if (raceId === 'elfo') {
        soundEngine.playEvent('spell:fireball');
        [-0.14, 0, 0.14].forEach((spreadYaw) => {
          this.spawnProjectileVariant(stats, {
            yawOffset: spreadYaw,
            damageMult: 0.95,
            colorHex: 0x7dd3fc,
            emissiveHex: 0x0ea5e9,
            radius: 0.22,
            speed: 28,
          });
        });
        this.callbacks.onPlayerHealed(0, 18);
        this.callbacks.onLog('Lluvia Estelar: 3 proyectiles astrales lanzados (+18 Maná).', 'study');
      } else if (raceId === 'enano') {
        soundEngine.playEvent('combat:crit');
        const hits = this.performAoeAttack(6.2, 1.9, 25, 'hit', { knockback: 2.2 });
        this.callbacks.onLog(
          `Martillo Sísmico: sacudida terrestre impacta a ${hits} enemigo${hits === 1 ? '' : 's'}.`,
          'crit'
        );
      } else if (raceId === 'draconido') {
        soundEngine.playEvent('spell:fireball');
        const hits = this.performAoeAttack(6.8, 2.0, 20, 'burn', {
          forwardOnly: true,
          applyBurn: true,
        });
        this.callbacks.onLog(
          `Aliento Primordial: llamas dracónicas envuelven a ${hits} enemigo${hits === 1 ? '' : 's'}.`,
          'damage'
        );
      } else {
        // espectro_raza: Paso del Abismo
        _forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
        this.playerPos.addScaledVector(_forward, 4.5);
        this.callbacks.onPlayerHealed(30, 0);
        const hits = this.performAoeAttack(5.4, 1.65, 35, 'poison', { applyPoison: true });
        soundEngine.playEvent('combat:swing');
        this.callbacks.onLog(
          `Paso del Abismo: embistes entre sombras (+30 HP, ${hits} objetivo${hits === 1 ? '' : 's'} envenenado/s).`,
          'study'
        );
      }
      triggerPaladinHeal();
    } else if (slotIndex === 5) {
      // Habilidad Activa de Clase
      if (!this.spendSkillMana(classDef.activeSkill.manaCost)) {
        this.callbacks.onLog(`Maná insuficiente para ${classDef.activeSkill.name}.`, 'info');
        return;
      }
      this.skillCooldowns[5] = classDef.activeSkill.cooldown;

      if (classId === 'caballero_runico') {
        this.swingAnim = 1.0;
        soundEngine.playEvent('combat:crit');
        const hits = this.performAoeAttack(5.6, 1.85, 25, 'crit', { knockback: 1.5 });
        this.callbacks.onLog(
          `Torbellino Rúnico: hoja giratoria impacta a ${hits} enemigo${hits === 1 ? '' : 's'}.`,
          'crit'
        );
      } else if (classId === 'piromago') {
        soundEngine.playEvent('spell:fireball');
        this.spawnProjectileVariant(stats, {
          damageMult: 2.4,
          colorHex: 0xf97316,
          emissiveHex: 0xdc2626,
          radius: 0.44,
          speed: 22,
          aoeRadius: 5.0,
          forceBurn: true,
        });
        this.callbacks.onLog('Meteorito del Velo lanzado: explosión ígnea de 5m.', 'damage');
      } else if (classId === 'asesino_sombras') {
        soundEngine.playEvent('combat:crit');
        this.attackCooldown = 0;
        const hits = this.performAoeAttack(4.8, 2.3, 65, 'poison', {
          forwardOnly: true,
          applyPoison: true,
        });
        this.callbacks.onLog(
          `Ejecución Umbría: golpe tóxico crítico (${hits} objetivo${hits === 1 ? '' : 's'}).`,
          'crit'
        );
      } else if (classId === 'paladin_solar') {
        const healAmt = Math.round(stats.maxHp * 0.3);
        this.cleanseStatuses();
        this.callbacks.onPlayerHealed(healAmt, 0);
        const hits = this.performAoeAttack(6.0, 1.75, 20, 'shrine');
        soundEngine.playEvent('spell:heal');
        this.callbacks.onLog(
          `Consagración Solar: +${healAmt} HP purificados y ${hits} enemigo${hits === 1 ? '' : 's'} golpeado/s.`,
          'heal'
        );
      } else {
        // cazador_dragones: Lanza Matadragones
        soundEngine.playEvent('combat:crit');
        this.spawnProjectileVariant(stats, {
          damageMult: 2.2,
          colorHex: 0xfde047,
          emissiveHex: 0xea580c,
          radius: 0.28,
          speed: 32,
          bonusVsDragons: 1.4,
          forceBurn: true,
        });
        this.callbacks.onLog('Lanza Matadragones arrojada (+40% daño contra Dragones).', 'crit');
      }
      triggerPaladinHeal();
    } else if (slotIndex === 6) {
      // Slot 6: Nova Renacida (scales with Rebirths!)
      if (!this.spendSkillMana(28)) {
        this.callbacks.onLog('Maná insuficiente para Nova Renacida.', 'info');
        return;
      }
      this.skillCooldowns[6] = 11.0;
      const multBonus = 2.4 + rebirths * 0.35;
      soundEngine.playEvent('combat:crit');
      const hits = this.performAoeAttack(7.5, multBonus, 40, 'crit', {
        applyBurn: true,
        knockback: 2.4,
      });
      this.particles.emitBurst('shrine', this.playerPos.x, this.playerPos.y + 1.5, this.playerPos.z, 36);
      this.callbacks.onLog(
        `¡Nova Renacida (×${getRebirthDamageMultiplier(rebirths)} base)! Onda dracónica alcanza a ${hits} enemigo${hits === 1 ? '' : 's'}.`,
        'quest'
      );
      triggerPaladinHeal();
    }
  }

  private spawnFireball(stats: ComputedStats): void {
    this.spawnProjectileVariant(stats, {
      damageMult: 1.0,
      colorHex: 0xfb923c,
      emissiveHex: 0xf97316,
      radius: 0.24,
      speed: 24,
    });
  }

  private spawnProjectileVariant(
    stats: ComputedStats,
    opts: {
      yawOffset?: number;
      damageMult: number;
      colorHex: number;
      emissiveHex: number;
      radius: number;
      speed: number;
      aoeRadius?: number;
      bonusVsDragons?: number;
      forceBurn?: boolean;
      forcePoison?: boolean;
    }
  ): void {
    const geo = new THREE.SphereGeometry(opts.radius, 10, 10);
    const mat = new THREE.MeshStandardMaterial({
      color: opts.colorHex,
      emissive: opts.emissiveHex,
      emissiveIntensity: 3.0,
      roughness: 0.1,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const light = new THREE.PointLight(opts.emissiveHex, 5.5, 11);
    mesh.add(light);

    _rayDir.set(0, 0, -1).applyEuler(this.camera.rotation).normalize();
    if (opts.yawOffset) {
      _rayDir.applyAxisAngle(THREE.Object3D.DEFAULT_UP, opts.yawOffset);
    }
    mesh.position.copy(this.camera.position).addScaledVector(_rayDir, 0.9);
    this.scene.add(mesh);

    const dmg = Math.round(((stats.danoMin + stats.danoMax) * 0.8 + stats.regenMana * 4) * opts.damageMult);
    this.projectiles.push({
      mesh,
      light,
      velocity: _rayDir.clone().multiplyScalar(opts.speed),
      life: 1.9,
      damage: dmg,
      aoeRadius: opts.aoeRadius,
      bonusVsDragons: opts.bonusVsDragons,
      forceBurn: opts.forceBurn,
      forcePoison: opts.forcePoison,
    });
  }

  private damageMonster(
    m: ActiveMonster,
    stats: ComputedStats,
    bonusCritChance: number,
    multiplier: number,
    isSpell: boolean,
    flatSpellDamage?: number
  ): void {
    const spec = MONSTER_SPECIES[m.speciesId];
    const bestiaryEntry = this.callbacks.getBestiary()[m.speciesId];
    const mastered = bestiaryEntry && bestiaryEntry.studyPoints >= 100;
    const raceId = this.callbacks.getRaceId?.() ?? 'humano';
    const classId = this.callbacks.getClassId?.() ?? 'caballero_runico';

    let rawDmg =
      flatSpellDamage !== undefined
        ? flatSpellDamage
        : THREE.MathUtils.randInt(stats.danoMin, stats.danoMax) * multiplier;

    // Bestiary Mastery Bonus (+12% to +15% damage)
    if (mastered) {
      rawDmg *= m.speciesId === 'golem_obsidiana' || this.isDragonBoss(m.speciesId) ? 1.15 : 1.12;
    }

    // Racial Uniques
    if (raceId === 'elfo' && isSpell) {
      rawDmg *= 1.22;
    }
    if (raceId === 'draconido' && this.isDragonBoss(m.speciesId)) {
      rawDmg *= 1.25;
    }
    if (raceId === 'espectro_raza' && (this.currentPhase === 'noche' || this.currentPhase === 'ocaso')) {
      rawDmg *= 1.25;
    }

    // Class Uniques
    if (classId === 'caballero_runico' && this.counterStrikeBuff) {
      this.counterStrikeBuff = false;
      rawDmg *= 1.45;
      this.callbacks.onLog('¡Contraataque Rúnico (+45% daño)!', 'crit');
    }
    if (classId === 'piromago' && m.burnTimer > 0) {
      rawDmg *= 1.3;
    }
    if (classId === 'asesino_sombras' && m.poisonTimer > 0) {
      rawDmg *= 1.3;
    }
    if (
      classId === 'paladin_solar' &&
      (m.speciesId === 'esqueleto_centinela' || m.speciesId === 'espectro_velo')
    ) {
      rawDmg *= 1.35;
    }
    if (classId === 'cazador_dragones' && this.isDragonBoss(m.speciesId)) {
      rawDmg *= 1.35;
    }

    const critRoll = Math.random() * 100;
    const isCrit = critRoll < stats.probCritico + bonusCritChance;
    if (isCrit) {
      rawDmg *= stats.danoCritico / 100;
    }

    // Apply modular extension damage hooks
    rawDmg = extensionRegistry.applyDamageHooks({
      playerLevel: this.callbacks.getPlayerLevel(),
      stats,
      targetSpeciesId: m.speciesId,
      baseDamage: rawDmg,
      isCrit,
    });

    const scaling = this.getWorldScaling();
    const scaledBaseDef =
      spec.baseDef * scaling.defMult * (m.isElite ? 1.25 : 1.0);
    const effectiveDef =
      mastered && m.speciesId === 'golem_obsidiana'
        ? scaledBaseDef * 0.75
        : scaledBaseDef;
    const finalDmg = Math.max(2, Math.round(rawDmg - effectiveDef * (isSpell ? 0.35 : 0.65)));

    m.hp = Math.max(0, m.hp - finalDmg);
    m.hitFlashTimer = 0.16;

    // Espectro Sombreado lifesteal on melee hits
    if (raceId === 'espectro_raza' && !isSpell) {
      const steal = Math.max(2, Math.round(finalDmg * 0.1));
      this.callbacks.onPlayerHealed(steal, 0);
    }

    // Knockback
    _toEntity.subVectors(m.group.position, this.playerPos);
    _toEntity.y = 0;
    if (_toEntity.lengthSq() > 0.01) {
      _toEntity.normalize();
      m.group.position.addScaledVector(
        _toEntity,
        m.speciesId === 'golem_obsidiana' || this.isDragonBoss(m.speciesId) ? 0.25 : 0.65
      );
    }

    soundEngine.playEvent(isCrit ? 'combat:crit' : 'combat:hit');

    // Emit impact particles (dramatic gold burst on crit, sparks on hit)
    const hitX = m.group.position.x;
    const hitY = m.group.position.y + 1.25;
    const hitZ = m.group.position.z;
    this.particles.emitBurst(isCrit ? 'crit' : 'hit', hitX, hitY, hitZ);

    // Apply burn / poison status effects if monster survived the hit
    if (m.hp > 0) {
      const burnMult = raceId === 'draconido' ? 1.35 : 1.0;
      const burnDur = classId === 'piromago' ? 6.0 : 4.0;
      if (isSpell) {
        const wasBurning = m.burnTimer > 0;
        m.burnTimer = burnDur;
        m.burnTickTimer = 1.0;
        m.burnDamage = Math.max(4, Math.round(finalDmg * 0.25 * burnMult));
        this.particles.emitBurst('burn', hitX, hitY, hitZ, 12);
        if (!wasBurning) {
          this.callbacks.onLog(`¡${spec.name} arde por Quemadura!`, 'damage');
        }
      } else {
        if (isCrit || classId === 'asesino_sombras' || Math.random() < 0.35) {
          const wasPoisoned = m.poisonTimer > 0;
          m.poisonTimer = 5.0;
          m.poisonTickTimer = 1.0;
          m.poisonDamage = Math.max(3, Math.round(finalDmg * 0.18));
          this.particles.emitBurst('poison', hitX, hitY, hitZ, 12);
          if (!wasPoisoned) {
            this.callbacks.onLog(`¡${spec.name} ha sido Envenenado!`, 'study');
          }
        }
        if (isCrit && Math.random() < 0.45) {
          const wasBurning = m.burnTimer > 0;
          m.burnTimer = 3.2;
          m.burnTickTimer = 1.0;
          m.burnDamage = Math.max(4, Math.round(finalDmg * 0.2 * burnMult));
          this.particles.emitBurst('burn', hitX, hitY, hitZ, 10);
          if (!wasBurning) {
            this.callbacks.onLog(`¡Impacto ígneo! ${spec.name} sufre Quemadura.`, 'crit');
          }
        }
      }
    }

    // Project floating damage to screen
    _projVec.copy(m.group.position);
    _projVec.y += 1.9;
    _projVec.project(this.camera);
    const sx = ((_projVec.x + 1) / 2) * window.innerWidth;
    const sy = ((-_projVec.y + 1) / 2) * window.innerHeight;
    if (_projVec.z < 1) {
      this.callbacks.onFloatingDamage({
        id: `dmg-${Date.now()}-${Math.random()}`,
        value: isCrit ? `${finalDmg}!` : `${finalDmg}`,
        isCrit,
        screenX: sx,
        screenY: sy,
      });
    }

    this.callbacks.onLog(
      `${isCrit ? '¡CRÍTICO! ' : ''}Infliges ${finalDmg} de daño a ${spec.name}.`,
      isCrit ? 'crit' : 'damage'
    );

    if (m.hp <= 0) {
      this.handleMonsterDeath(m);
    }
  }

  private handleMonsterDeath(m: ActiveMonster): void {
    const spec = MONSTER_SPECIES[m.speciesId];
    const bestiaryEntry = this.callbacks.getBestiary()[m.speciesId];
    const mastered = bestiaryEntry && bestiaryEntry.studyPoints >= 100;
    const diff = this.getActiveDifficulty();
    const scaling = this.getWorldScaling();
    const raceId = this.callbacks.getRaceId?.() ?? 'humano';
    const classId = this.callbacks.getClassId?.() ?? 'caballero_runico';
    const humanRewardMult = raceId === 'humano' ? 1.15 : 1.0;
    const eliteRewardMult = m.isElite ? 1.75 : 1.0;

    m.alive = false;
    m.burnTimer = 0;
    m.poisonTimer = 0;
    m.group.visible = false;
    if (m.isDynamicEncounter) {
      m.pendingRemoval = true;
      m.respawnTimer = 9999;
    } else {
      const baseRespawn = m.speciesId.startsWith('dragon_')
        ? 35
        : m.speciesId === 'wyvern_ceniza'
        ? 45
        : 22;
      m.respawnTimer = Math.max(6, baseRespawn * scaling.respawnTimeMult);
    }

    const baseGold = THREE.MathUtils.randInt(spec.goldReward[0], spec.goldReward[1]);
    const finalGold = Math.round(
      baseGold * scaling.goldMult * humanRewardMult * eliteRewardMult
    );
    const finalXp = Math.round(
      spec.xpReward * scaling.xpMult * humanRewardMult * eliteRewardMult
    );

    const drops: string[] = [];
    spec.dropTable.forEach((d) => {
      let chance = mastered ? Math.min(1, d.chance + 0.15) : d.chance;
      if (m.isElite) {
        chance = Math.min(1, chance + 0.12);
      }
      if (d.itemId.startsWith('corazon_dragon_')) {
        chance = Math.min(
          1,
          chance + diff.heartDropBonus + (classId === 'cazador_dragones' ? 0.2 : 0)
        );
      }
      if (Math.random() < chance) {
        drops.push(d.itemId);
      }
    });

    this.callbacks.onMonsterKilled(m.speciesId, finalXp, finalGold, drops);
  }

  public performInteract(): void {
    const target = this.findFocusedTarget();
    if (!target) return;

    if (target.type === 'portal') {
      const portal = this.portals.find((p) => p.id === target.id && p.mapId === this.currentMapId);
      if (portal) {
        this.switchMap(portal.destination, portal.arrivalX, portal.arrivalZ, portal.arrivalYaw);
      }
      return;
    }

    if (target.type === 'remote_player') {
      const rp = this.remotePlayers.get(target.id);
      if (rp) {
        const badge = `[${rp.state.clanTag}] ${rp.state.playerName}`;
        this.callbacks.onLog(
          `${badge} · Clan: ${rp.state.clanName} · Nv. ${rp.state.level}${rp.state.rebirths > 0 ? ` (R${rp.state.rebirths})` : ''}.`,
          'info'
        );
      }
      return;
    }

    if (this.currentMapId !== 'templo') return;

    if (target.type === 'shrine') {
      const shrine = this.shrines.find((s) => s.id === target.id);
      if (shrine) {
        const stats = this.callbacks.getStats();
        this.cleanseStatuses();
        this.callbacks.onPlayerHealed(stats.maxHp, stats.maxMana);
        const sy = groundHeightAt(shrine.x, shrine.z, 'templo');
        if (!shrine.discovered) {
          shrine.discovered = true;
          setShrineVisualState(shrine.group, true);
          soundEngine.playEvent('world:shrine_activate');
          this.particles.emitBurst('shrine', shrine.x, sy + 1.9, shrine.z, 34);
          const count = this.shrines.filter((s) => s.discovered).length;
          this.callbacks.onShrineDiscovered?.(shrine.id, shrine.name, shrine.zoneName, count);
          this.queuePoiSnapshot(`poi_${shrine.id}`, shrine.x, shrine.z);
          this.pushMinimapSnapshot();
        } else {
          soundEngine.playEvent('spell:heal');
          this.particles.emitBurst('shrine', shrine.x, sy + 1.8, shrine.z, 14);
          this.callbacks.onLog(
            `${shrine.name}: Salud y Maná restaurados. Pulsa [T] o haz clic en el minimapa para viajar rápido.`,
            'heal'
          );
        }
      }
    } else if (target.type === 'npc') {
      soundEngine.playEvent('study:discover');
      if (target.id === 'npc_kael') {
        this.callbacks.onMerchantInteract();
      } else {
        this.callbacks.onNpcInteract();
      }
    } else if (target.type === 'chest') {
      const chest = this.chests.find((c) => c.id === target.id);
      if (chest && !chest.opened) {
        chest.opened = true;
        soundEngine.playEvent('world:chest_open');
        this.callbacks.onChestOpened(chest.gold, chest.lootItemIds);
      }
    } else if (target.type === 'lore') {
      const loreObj = this.loreObjects.find((l) => l.id === target.id);
      if (loreObj) {
        const wasDiscovered = loreObj.discovered;
        loreObj.discovered = true;
        setLoreRelicVisualState(loreObj.group, true);
        soundEngine.playEvent('study:discover');
        if (!wasDiscovered) {
          this.particles.emitBurst(
            'crit',
            loreObj.x,
            groundHeightAt(loreObj.x, loreObj.z) + 1.5,
            loreObj.z,
            18
          );
          this.queuePoiSnapshot(`poi_${loreObj.loreId}`, loreObj.x, loreObj.z);
          this.pushMinimapSnapshot();
        }
        this.callbacks.onLoreObjectInteract?.(loreObj.loreId);
      }
    } else if (target.type === 'door') {
      const door = this.doors.find((d) => d.id === target.id);
      if (door) {
        door.open = !door.open;
        soundEngine.playEvent('world:door_open');
        this.callbacks.onLog(
          door.open ? `Abres ${door.name}.` : `Cierras ${door.name}.`,
          'info'
        );
      }
    } else if (target.type === 'clan_npc') {
      const clanNpc = this.clanNpcs.find((c) => c.id === target.id);
      if (clanNpc) {
        soundEngine.playEvent('study:discover');
        if (!clanNpc.rescued) {
          clanNpc.rescued = true;
          setClanNpcVisualState(clanNpc.group, true, clanNpc.invited, clanNpc.role);
          this.particles.emitBurst(
            'shrine',
            clanNpc.group.position.x,
            clanNpc.group.position.y + 1.5,
            clanNpc.group.position.z,
            24
          );
          this.callbacks.onClanNpcRescued?.(clanNpc.id);
          this.pushMinimapSnapshot();
        } else {
          this.callbacks.onClanNpcBaseInteract?.(clanNpc.id);
        }
      }
    } else if (target.type === 'herb') {
      const herb = this.herbNodes.find((h) => h.id === target.id);
      if (herb && herb.available) {
        herb.available = false;
        herb.respawnTimer = 42;
        herb.group.visible = false;
        soundEngine.playEvent('study:discover');
        this.particles.emitBurst(
          'poison',
          herb.x,
          groundHeightAt(herb.x, herb.z) + 0.55,
          herb.z,
          12
        );
        const qty = THREE.MathUtils.randInt(1, 2);
        this.callbacks.onHerbHarvested?.(herb.itemId, qty, herb.name);
        this.pushMinimapSnapshot();
      }
    } else if (target.type === 'monster') {
      const m = this.monsters.find((mob) => mob.id === target.id);
      if (m && m.alive) {
        if (m.studyCooldown > 0) {
          this.callbacks.onLog('Ya analizaste a esta criatura recientemente. Espera un momento o derrótala.', 'info');
          return;
        }
        m.studyCooldown = 6.0;
        soundEngine.playEvent('study:discover');
        this.callbacks.onMonsterStudy(m.speciesId, 28, false);
      }
    }
  }

  private findFocusedTarget(): TargetInfo | null {
    _forward.set(0, 0, -1).applyEuler(this.camera.rotation).normalize();

    // 0. Check Dimensional Portals in current map
    for (const p of this.portals) {
      if (p.mapId !== this.currentMapId) continue;
      const dist = Math.hypot(this.playerPos.x - p.x, this.playerPos.z - p.z);
      if (dist < 5.8) {
        _toEntity
          .set(
            p.x - this.camera.position.x,
            groundHeightAt(p.x, p.z, this.currentMapId) + 2.3 - this.camera.position.y,
            p.z - this.camera.position.z
          )
          .normalize();
        if (_forward.dot(_toEntity) > 0.65) {
          return {
            type: 'portal',
            id: p.id,
            name: p.name,
            subtitle: p.subtitle,
            canInteract: true,
            interactLabel: '[E] o camina por el portal para teletransportarte',
          };
        }
      }
    }

    // 0.5 Check Remote Online Players in the same map
    let bestRemote: ActiveRemotePlayer | null = null;
    let bestRemoteDot = 0.78;
    for (const rp of this.remotePlayers.values()) {
      if (rp.state.mapId !== this.currentMapId) continue;
      const dist = this.playerPos.distanceTo(rp.group.position);
      if (dist > 15) continue;
      _toEntity.copy(rp.group.position);
      _toEntity.y += 1.45;
      _toEntity.sub(this.camera.position).normalize();
      const dot = _forward.dot(_toEntity);
      if (dot > bestRemoteDot) {
        bestRemoteDot = dot;
        bestRemote = rp;
      }
    }
    if (bestRemote) {
      const st = bestRemote.state;
      return {
        type: 'remote_player',
        id: st.uid,
        name: `[${st.clanTag}] ${st.playerName}`,
        subtitle: `Clan: ${st.clanName} · Nv. ${st.level}${st.rebirths > 0 ? ` · R${st.rebirths}` : ''}`,
        canInteract: true,
        interactLabel: '[E] Inspeccionar aventurero en línea',
      };
    }

    if (this.currentMapId !== 'templo') {
      return null;
    }

    // 1. Check Fast-Travel Shrines
    for (const s of this.shrines) {
      const shrineDist = this.playerPos.distanceTo(s.group.position);
      if (shrineDist < 4.7) {
        _toEntity.subVectors(s.group.position, this.camera.position).normalize();
        if (_forward.dot(_toEntity) > 0.7) {
          return {
            type: 'shrine',
            id: s.id,
            name: s.name,
            subtitle: s.discovered
              ? 'Viaje Rápido Activo · Restaura Salud y Maná'
              : 'Santuario Latente · Activa punto de teletransporte',
            canInteract: true,
            interactLabel: s.discovered
              ? '[E] Canalizar Santuario (Curar · Minimapa [T])'
              : '[E] Activar Santuario de Viaje Rápido',
          };
        }
      }
    }

    // 2. Check NPCs (Valen & Merchant Kael with dynamic phase/weather context)
    const npcDist = this.playerPos.distanceTo(this.npcGroup.position);
    if (npcDist < 4.2) {
      _toEntity.subVectors(this.npcGroup.position, this.camera.position).normalize();
      if (_forward.dot(_toEntity) > 0.72) {
        const valenCtx = getNpcDynamicContext('npc_valen', this.currentPhase, this.currentWeather);
        return {
          type: 'npc',
          id: 'npc_valen',
          name: 'Archivista Valen',
          subtitle: valenCtx.statusLabel,
          canInteract: true,
          interactLabel: '[E] Conversar con Valen',
        };
      }
    }

    const merchDist = this.playerPos.distanceTo(this.merchantGroup.position);
    if (merchDist < 4.4) {
      _toEntity.subVectors(this.merchantGroup.position, this.camera.position).normalize();
      if (_forward.dot(_toEntity) > 0.7) {
        const kaelCtx = getNpcDynamicContext('npc_kael', this.currentPhase, this.currentWeather);
        return {
          type: 'npc',
          id: 'npc_kael',
          name: 'Mercader Kael',
          subtitle: kaelCtx.statusLabel,
          canInteract: true,
          interactLabel: '[E] Conversar / Comerciar con Kael',
        };
      }
    }

    // 2.5 Check Interactive 3D Lore Relics
    for (const l of this.loreObjects) {
      const dist = this.playerPos.distanceTo(l.group.position);
      if (dist < 4.3) {
        _toEntity.subVectors(l.group.position, this.camera.position).normalize();
        if (_forward.dot(_toEntity) > 0.7) {
          return {
            type: 'lore',
            id: l.id,
            name: l.name,
            subtitle: l.discovered
              ? `${l.zoneName} · Registrado en el Códice`
              : `${l.zoneName} · Inscripción Histórica Sin Leer`,
            canInteract: true,
            interactLabel: l.discovered
              ? '[E] Releer Fragmento en el Códice'
              : '[E] Leer Inscripción (Códice de Historia)',
          };
        }
      }
    }

    // 2.6 Check Rescuable / Recruited Clan NPCs
    for (const c of this.clanNpcs) {
      const dist = this.playerPos.distanceTo(c.group.position);
      if (dist < 4.4) {
        _toEntity.subVectors(c.group.position, this.camera.position).normalize();
        if (_forward.dot(_toEntity) > 0.7) {
          const roleText =
            c.role !== 'ninguno'
              ? `Rol: ${CLAN_ROLE_INFO[c.role].label}`
              : c.invited
              ? 'En Base · Sin rol asignado'
              : c.rescued
              ? 'Rescatado · Listo para invitar al Clan [K]'
              : `${c.rescueZone} · Superviviente Atrapado`;
          return {
            type: 'clan_npc',
            id: c.id,
            name: c.name,
            subtitle: `${c.title} · ${roleText}`,
            canInteract: true,
            interactLabel: !c.rescued
              ? `[E] Rescatar a ${c.name.split(' ')[0]}`
              : `[E] Gestionar Clan y Roles [K]`,
          };
        }
      }
    }

    // 2.7 Check Harvestable Alchemy Herbs & Extracts
    for (const h of this.herbNodes) {
      if (!h.available) continue;
      const dist = this.playerPos.distanceTo(h.group.position);
      if (dist < 3.9) {
        _toEntity.subVectors(h.group.position, this.camera.position).normalize();
        if (_forward.dot(_toEntity) > 0.7) {
          return {
            type: 'herb',
            id: h.id,
            name: h.name,
            subtitle: 'Ingrediente Alquímico Silvestre',
            canInteract: true,
            interactLabel: '[E] Recolectar Ingrediente',
          };
        }
      }
    }

    // 3. Check Chests
    for (const c of this.chests) {
      if (c.opened) continue;
      const dist = this.playerPos.distanceTo(c.group.position);
      if (dist < 4.0) {
        _toEntity.subVectors(c.group.position, this.camera.position).normalize();
        if (_forward.dot(_toEntity) > 0.72) {
          return {
            type: 'chest',
            id: c.id,
            name: 'Cofre Antiguo Sellado',
            subtitle: 'Contiene oro y equipamiento',
            canInteract: true,
            interactLabel: '[E] Abrir Cofre',
          };
        }
      }
    }

    // 3.5 Check Gates / Doors
    for (const d of this.doors) {
      const dist = Math.hypot(this.playerPos.x - d.x, this.playerPos.z - d.z);
      if (dist < 4.6) {
        _toEntity
          .set(d.x - this.camera.position.x, d.group.position.y + 1.8 - this.camera.position.y, d.z - this.camera.position.z)
          .normalize();
        if (_forward.dot(_toEntity) > 0.65) {
          return {
            type: 'door',
            id: d.id,
            name: d.name,
            subtitle: d.open ? 'Puerta abierta' : 'Puerta cerrada de roble y hierro',
            canInteract: true,
            interactLabel: d.open ? '[E] Cerrar Puerta' : '[E] Abrir Puerta',
          };
        }
      }
    }

    // 4. Check Monsters (up to 14m for study & nameplate)
    let bestMob: ActiveMonster | null = null;
    let bestScore = 0.75;
    for (const m of this.monsters) {
      if (!m.alive || !m.scheduleActive) continue;
      const dist = this.playerPos.distanceTo(m.group.position);
      if (dist > 14.5) continue;
      _toEntity.copy(m.group.position);
      _toEntity.y += 1.2;
      _toEntity.sub(this.camera.position).normalize();
      const dot = _forward.dot(_toEntity);
      if (dot > bestScore) {
        bestScore = dot;
        bestMob = m;
      }
    }

    if (bestMob) {
      const spec = MONSTER_SPECIES[bestMob.speciesId];
      const scaling = this.getWorldScaling();
      const enemyLevel = getEnemyEffectiveLevel(
        spec.dangerLevel,
        scaling.playerLevel,
        scaling.rebirths,
        bestMob.isElite
      );
      // Mark sighted in bestiary on aim
      const bEntry = this.callbacks.getBestiary()[bestMob.speciesId];
      if (bEntry && !bEntry.sighted) {
        this.callbacks.onMonsterStudy(bestMob.speciesId, 10, true);
      }
      const dist = this.playerPos.distanceTo(bestMob.group.position);
      const statusTags: string[] = [];
      if (bestMob.burnTimer > 0) statusTags.push('Quemadura');
      if (bestMob.poisonTimer > 0) statusTags.push('Veneno');
      const scheduleTag =
        bestMob.schedule === 'nocturno'
          ? ' · Nocturno'
          : bestMob.schedule === 'diurno'
          ? ' · Diurno'
          : '';
      const eliteTag = bestMob.isElite ? ' · Élite' : '';
      const rebirthTag = scaling.rebirths > 0 ? ` · R${scaling.rebirths}` : '';
      const statusSuffix = statusTags.length > 0 ? ` · ${statusTags.join(', ')}` : '';
      return {
        type: 'monster',
        id: bestMob.id,
        name: bestMob.isElite ? `[Élite] ${spec.name}` : spec.name,
        subtitle: `Nv. ${enemyLevel}${rebirthTag}${eliteTag} · ${spec.category}${scheduleTag} · Peligro ${'★'.repeat(spec.dangerLevel)}${statusSuffix}`,
        hp: bestMob.hp,
        maxHp: bestMob.maxHp,
        level: enemyLevel,
        isElite: bestMob.isElite,
        speciesId: bestMob.speciesId,
        canInteract: dist < 11.5,
        interactLabel: dist < 11.5 ? '[E] Estudiar Criatura · [Clic] Atacar' : 'Acércate para estudiar',
      };
    }

    return null;
  }

  private tick = (): void => {
    if (this.destroyed) return;

    const dt = Math.min(0.05, this.clock.getDelta());
    const elapsed = this.clock.elapsedTime;
    const stats = this.callbacks.getStats();

    // Update Cooldowns
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    let cdChanged = false;
    for (let i = 1; i <= 6; i++) {
      if (this.skillCooldowns[i] > 0) {
        this.skillCooldowns[i] = Math.max(0, this.skillCooldowns[i] - dt);
        cdChanged = true;
      }
    }
    this.hudSyncTimer += dt;
    if (cdChanged || this.hudSyncTimer > 0.15) {
      this.hudSyncTimer = 0;
      this.callbacks.onSkillCooldowns({ ...this.skillCooldowns });
    }

    // Sync active creature mount visual
    const activeMountId = this.callbacks.getEquippedMountId?.() ?? null;
    if (activeMountId !== this.lastMountId) {
      this.lastMountId = activeMountId;
      const mountItem = activeMountId ? ITEMS_CATALOG[activeMountId] : null;
      if (mountItem?.mountVisual) {
        setMountRigVisual(
          this.mountRig,
          mountItem.mountVisual.bodyHex,
          mountItem.mountVisual.accentHex,
          mountItem.mountVisual.crestHex
        );
        this.mountRig.visible = true;
      } else {
        this.mountRig.visible = false;
      }
    }

    let isMoving = false;
    // Player movement & camera look (only when modal closed)
    if (!this.callbacks.isModalOpen()) {
      // Optional keyboard turn (ArrowLeft / ArrowRight)
      if (this.keys['ArrowLeft']) this.yaw += 2.1 * dt;
      if (this.keys['ArrowRight']) this.yaw -= 2.1 * dt;

      const forwardInput = (this.keys['KeyW'] || this.keys['ArrowUp'] ? 1 : 0) - (this.keys['KeyS'] || this.keys['ArrowDown'] ? 1 : 0);
      const strafeInput = (this.keys['KeyD'] ? 1 : 0) - (this.keys['KeyA'] ? 1 : 0);

      _forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
      _right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

      _moveDir.set(0, 0, 0);
      _moveDir.addScaledVector(_forward, forwardInput);
      _moveDir.addScaledVector(_right, strafeInput);
      isMoving = _moveDir.lengthSq() > 0.001;
      if (isMoving) {
        _moveDir.normalize();
        const sprint = this.keys['ShiftLeft'] || this.keys['ShiftRight'] ? 1.42 : 1.0;
        const slowMult = this.playerStatuses.slow.remaining > 0 ? 0.65 : 1.0;
        const speed = stats.velocidadMovimiento * sprint * slowMult;
        this.playerPos.x += _moveDir.x * speed * dt;
        this.playerPos.z += _moveDir.z * speed * dt;
        const stepRate = activeMountId ? (sprint > 1 ? 15 : 11.5) : (sprint > 1 ? 13 : 9.5);
        this.bobPhase += dt * stepRate * slowMult;
        if (activeMountId) {
          this.mountBobPhase += dt * stepRate * slowMult;
        }
      }

      // Jump
      if (this.keys['Space'] && this.grounded) {
        this.playerVelY = activeMountId ? 7.4 : 6.8;
        this.grounded = false;
      }

      // Update Player Status Effects (DoT & slow timers)
      this.updatePlayerStatuses(dt);
    }

    this.isMovingLastFrame = isMoving;

    // Gravity & terrain height (aware of active map terrain)
    const groundY = groundHeightAt(this.playerPos.x, this.playerPos.z, this.currentMapId);
    if (!this.grounded || this.playerPos.y > groundY + 0.01) {
      this.playerVelY -= 19 * dt;
      this.playerPos.y += this.playerVelY * dt;
      if (this.playerPos.y <= groundY) {
        this.playerPos.y = groundY;
        this.playerVelY = 0;
        this.grounded = true;
      }
    } else {
      this.playerPos.y = groundY;
    }

    // Stream nearby terrain & prop chunks dynamically around player (max 2 chunks/frame)
    this.chunkManager.update(this.playerPos.x, this.playerPos.z, false);

    // World boundary & landmark + loaded-chunk obstacle collision sliding
    const activeWorldRadius = this.currentMapId === 'plaza' ? PLAZA_WORLD_RADIUS : WORLD_RADIUS;
    const distCenter = Math.hypot(this.playerPos.x, this.playerPos.z);
    if (distCenter > activeWorldRadius - 1.5) {
      const ratio = (activeWorldRadius - 1.5) / distCenter;
      this.playerPos.x *= ratio;
      this.playerPos.z *= ratio;
    }

    if (this.currentMapId === 'plaza') {
      for (const obs of this.plazaObstacles) {
        this.resolveDynamicObstacle(obs.x, obs.z, obs.r);
      }
    } else {
      for (const obs of this.obstacles) {
        this.resolveDynamicObstacle(obs.x, obs.z, obs.r);
      }
      // Dynamic collision against moving NPCs & Clan members
      this.resolveDynamicObstacle(this.npcGroup.position.x, this.npcGroup.position.z, 0.8);
      this.resolveDynamicObstacle(this.merchantGroup.position.x, this.merchantGroup.position.z, 1.0);
      for (const c of this.clanNpcs) {
        this.resolveDynamicObstacle(c.group.position.x, c.group.position.z, 0.75);
      }
      // Closed door collision blocking
      for (const door of this.doors) {
        if (door.openProgress < 0.65) {
          const dz = this.playerPos.z - door.z;
          const dx = this.playerPos.x - door.x;
          if (Math.abs(dx) < 1.9 && Math.abs(dz) < 0.85) {
            this.playerPos.z = door.z + (dz >= 0 ? 0.85 : -0.85);
          }
        }
      }
    }

    this.chunkManager.forEachObstacleNear(this.playerPos.x, this.playerPos.z, (obs) => {
      this.resolveDynamicObstacle(obs.x, obs.z, obs.r);
    });

    // Portal vortex animation & proximity auto-teleport
    if (this.portalCooldown > 0) {
      this.portalCooldown = Math.max(0, this.portalCooldown - dt);
    }
    for (const portal of this.portals) {
      if (portal.mapId !== this.currentMapId) continue;
      const runeRing = portal.group.userData.runeRing as THREE.Mesh | undefined;
      const crestOrb = portal.group.userData.crestOrb as THREE.Mesh | undefined;
      const vortexDisc = portal.group.userData.vortexDisc as THREE.Mesh | undefined;
      if (runeRing) runeRing.rotation.z += dt * 1.1;
      if (crestOrb) crestOrb.rotation.y += dt * 1.6;
      if (vortexDisc) {
        const s = 0.96 + Math.sin(elapsed * 3.5) * 0.04;
        vortexDisc.scale.set(s, s, 1);
      }
      if (!this.callbacks.isModalOpen() && this.portalCooldown <= 0) {
        const dPortal = Math.hypot(this.playerPos.x - portal.x, this.playerPos.z - portal.z);
        if (dPortal < 2.1) {
          this.switchMap(portal.destination, portal.arrivalX, portal.arrivalZ, portal.arrivalYaw);
          break;
        }
      }
    }

    // Interpolate & animate online remote players in current map
    for (const rp of this.remotePlayers.values()) {
      const sameMap = rp.state.mapId === this.currentMapId;
      rp.group.visible = sameMap;
      if (!sameMap) continue;
      const prevX = rp.group.position.x;
      const prevZ = rp.group.position.z;
      const nextX = THREE.MathUtils.damp(prevX, rp.targetX, 7.5, dt);
      const nextZ = THREE.MathUtils.damp(prevZ, rp.targetZ, 7.5, dt);
      rp.group.position.set(nextX, groundHeightAt(nextX, nextZ, this.currentMapId), nextZ);

      const angleDiff = Math.atan2(
        Math.sin(rp.targetYaw - rp.group.rotation.y),
        Math.cos(rp.targetYaw - rp.group.rotation.y)
      );
      rp.group.rotation.y += angleDiff * Math.min(1, dt * 8.5);

      const movedDist = Math.hypot(nextX - prevX, nextZ - prevZ);
      const isStrideActive = rp.state.isMoving || movedDist > 0.01;
      const leftLeg = rp.group.userData.leftLeg as THREE.Mesh | undefined;
      const rightLeg = rp.group.userData.rightLeg as THREE.Mesh | undefined;
      if (leftLeg && rightLeg) {
        if (isStrideActive) {
          rp.stridePhase += dt * 10;
          const swing = Math.sin(rp.stridePhase) * 0.48;
          leftLeg.rotation.x = swing;
          rightLeg.rotation.x = -swing;
        } else {
          leftLeg.rotation.x = THREE.MathUtils.damp(leftLeg.rotation.x, 0, 8, dt);
          rightLeg.rotation.x = THREE.MathUtils.damp(rightLeg.rotation.x, 0, 8, dt);
        }
      }
    }

    // Camera placement with smooth bob, mounted height offset & subtle speed FOV
    const targetMountHeight = activeMountId ? 0.36 : 0;
    this.mountHeightOffset = THREE.MathUtils.damp(this.mountHeightOffset, targetMountHeight, 8, dt);
    const targetFov = activeMountId ? (isMoving ? 76.5 : 73.5) : 72;
    const nextFov = THREE.MathUtils.damp(this.camera.fov, targetFov, 7, dt);
    if (Math.abs(nextFov - this.camera.fov) > 0.02) {
      this.camera.fov = nextFov;
      this.camera.updateProjectionMatrix();
    }

    const bobOffset = this.grounded
      ? Math.sin(this.bobPhase) * (activeMountId ? 0.055 : 0.045)
      : 0;
    this.camera.position.set(
      this.playerPos.x,
      this.playerPos.y + 1.68 + this.mountHeightOffset + bobOffset,
      this.playerPos.z
    );
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');

    // Animate visible first-person mount head & stride sway
    if (this.mountRig.visible) {
      const headPivot = this.mountRig.userData.headPivot as THREE.Group | undefined;
      if (headPivot) {
        const gallop = isMoving ? Math.sin(this.mountBobPhase) * 0.045 : Math.sin(elapsed * 2.1) * 0.012;
        const sway = isMoving ? Math.cos(this.mountBobPhase * 0.5) * 0.025 : 0;
        headPivot.position.set(sway, gallop, 0);
        headPivot.rotation.set(
          (isMoving ? -0.04 : 0) + Math.sin(this.mountBobPhase) * (isMoving ? 0.055 : 0.01),
          sway * 0.8,
          -sway * 0.6
        );
      }
    }

    // First-person weapon & shield block stance animation
    const swordGroup = this.weaponRig.userData.swordGroup as THREE.Group;
    const offhandGroup = this.weaponRig.userData.offhandGroup as THREE.Group;
    if (this.swingAnim > 0) {
      this.swingAnim = Math.max(0, this.swingAnim - dt * 3.8);
      const s = Math.sin(this.swingAnim * Math.PI);
      swordGroup.position.set(0.42 - s * 0.34, -0.34 + s * 0.14, -0.62 - s * 0.22);
      swordGroup.rotation.set(0.18 - s * 1.15, -0.24 + s * 0.72, 0.14 + s * 0.45);
    } else {
      swordGroup.position.set(
        0.42,
        -0.34 + Math.sin(elapsed * 2.2) * 0.008 + bobOffset * 0.35,
        -0.62
      );
      swordGroup.rotation.set(0.18, -0.24, 0.14);
    }

    const targetBlock = this.isBlocking ? 1 : 0;
    this.blockStance = THREE.MathUtils.damp(this.blockStance, targetBlock, 12, dt);
    offhandGroup.position.set(
      THREE.MathUtils.lerp(-0.46, -0.18, this.blockStance),
      THREE.MathUtils.lerp(-0.38 + Math.cos(elapsed * 2.2) * 0.007 + bobOffset * 0.25, -0.16, this.blockStance),
      THREE.MathUtils.lerp(-0.58, -0.46, this.blockStance)
    );
    offhandGroup.rotation.set(
      THREE.MathUtils.lerp(0.25, 0.05, this.blockStance),
      THREE.MathUtils.lerp(0.45, 0.08, this.blockStance),
      THREE.MathUtils.lerp(-0.2, 0.0, this.blockStance)
    );

    if (this.currentMapId === 'templo') {
      // Temple Safe Zone Ward Obelisk crystals rotation
      for (let i = 0; i < this.wardObelisks.length; i++) {
        const c = this.wardObelisks[i].userData.crystal as THREE.Mesh | undefined;
        if (c) {
          c.rotation.y += dt * 1.1;
          c.position.y = 2.45 + Math.sin(elapsed * 2.2 + i) * 0.08;
        }
      }

      // Shrines crystal & rune halo idle motion (culled outside loaded chunks)
      for (let i = 0; i < this.shrines.length; i++) {
        const s = this.shrines[i];
        const inLoaded = this.chunkManager.isWorldPosLoaded(s.x, s.z);
        s.group.visible = inLoaded;
        if (!inLoaded) continue;
        const crystal = s.group.userData.crystal as THREE.Mesh | undefined;
        const runeRing = s.group.userData.runeRing as THREE.Mesh | undefined;
        const haloRing = s.group.userData.haloRing as THREE.Mesh | undefined;
        const speedMult = s.discovered ? 1.25 : 0.35;
        if (crystal) {
          crystal.rotation.y += dt * speedMult;
          crystal.position.y = (s.discovered ? 2.2 : 1.98) + Math.sin(elapsed * 2.4 + i) * (s.discovered ? 0.13 : 0.05);
        }
        if (runeRing) {
          runeRing.rotation.z -= dt * (s.discovered ? 0.42 : 0.1);
        }
        if (haloRing) {
          haloRing.rotation.z += dt * (s.discovered ? 0.9 : 0.15);
        }
      }

      for (let i = 0; i < this.loreObjects.length; i++) {
        const l = this.loreObjects[i];
        const inLoaded = this.chunkManager.isWorldPosLoaded(l.x, l.z);
        l.group.visible = inLoaded;
        if (!inLoaded) continue;
        const gem = l.group.userData.gem as THREE.Mesh | undefined;
        if (gem) {
          gem.rotation.y += dt * (l.discovered ? 0.6 : 1.5);
          gem.position.y = 1.62 + Math.sin(elapsed * 2.6 + i) * 0.08;
        }
      }

      for (const b of this.braziers) {
        const inLoaded = this.chunkManager.isWorldPosLoaded(b.position.x, b.position.z);
        b.visible = inLoaded;
        if (!inLoaded) continue;
        const flame = b.userData.flame as THREE.Mesh | undefined;
        if (flame) {
          flame.scale.y = 0.88 + Math.sin(elapsed * 14 + b.position.x) * 0.18;
        }
      }

      // Clan NPC positioning (rescue spot vs Sanctuary Base) & beacon pulse
      for (let i = 0; i < this.clanNpcs.length; i++) {
        const c = this.clanNpcs[i];
        const tx = c.invited ? c.baseX : c.rescueX;
        const tz = c.invited ? c.baseZ : c.rescueZ;
        const trot = c.invited ? c.baseRotY : Math.atan2(-c.rescueX, -c.rescueZ);
        c.group.position.x = THREE.MathUtils.damp(c.group.position.x, tx, 2.5, dt);
        c.group.position.z = THREE.MathUtils.damp(c.group.position.z, tz, 2.5, dt);
        c.group.position.y = groundHeightAt(c.group.position.x, c.group.position.z, 'templo');
        c.group.rotation.y = THREE.MathUtils.damp(c.group.rotation.y, trot, 3.0, dt);
        c.group.visible = this.chunkManager.isWorldPosLoaded(c.group.position.x, c.group.position.z);
        const ring = c.group.userData.beaconRing as THREE.Mesh | undefined;
        if (ring && c.group.visible) {
          const s = 1 + Math.sin(elapsed * 2.5 + i) * 0.08;
          ring.scale.set(s, s, 1);
        }
      }

      // Harvestable Alchemy Herb nodes respawn & glow animation (culled outside loaded chunks)
      for (let i = 0; i < this.herbNodes.length; i++) {
        const h = this.herbNodes[i];
        if (!h.available) {
          h.respawnTimer -= dt;
          if (h.respawnTimer <= 0) {
            h.available = true;
          }
        }
        const inLoaded = this.chunkManager.isWorldPosLoaded(h.x, h.z);
        h.group.visible = h.available && inLoaded;
        if (h.group.visible) {
          const blossom = h.group.userData.blossom as THREE.Mesh | undefined;
          if (blossom) {
            blossom.rotation.y += dt * 1.4;
            blossom.position.y = 0.44 + Math.sin(elapsed * 2.4 + i) * 0.05;
          }
        }
      }

      // Chest lid open animation & chunk visibility
      for (const c of this.chests) {
        const inLoaded = this.chunkManager.isWorldPosLoaded(c.group.position.x, c.group.position.z);
        c.group.visible = inLoaded;
        if (inLoaded && c.opened && c.openProgress < 1) {
          c.openProgress = Math.min(1, c.openProgress + dt * 3.2);
          const lid = c.group.userData.lidPivot as THREE.Group;
          lid.rotation.x = -c.openProgress * 1.45;
        }
      }

      // Gate door leaves swing animation
      for (const door of this.doors) {
        const targetOpen = door.open ? 1 : 0;
        if (Math.abs(door.openProgress - targetOpen) > 0.002) {
          door.openProgress = THREE.MathUtils.damp(door.openProgress, targetOpen, 6, dt);
          const lp = door.group.userData.leftPivot as THREE.Group;
          const rp = door.group.userData.rightPivot as THREE.Group;
          lp.rotation.y = door.openProgress * 1.45;
          rp.rotation.y = -door.openProgress * 1.45;
        }
      }
    }

    // Update Fireball & Elemental Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.mesh.position.addScaledVector(p.velocity, dt);

      let hit = false;
      if (this.currentMapId === 'templo') {
        for (const m of this.monsters) {
          if (!m.alive || !m.scheduleActive) continue;
          const hitDist = this.isDragonBoss(m.speciesId) ? 2.2 : 1.55;
          const d = p.mesh.position.distanceTo(
            _vec3Temp(m.group.position.x, m.group.position.y + 1.2, m.group.position.z)
          );
          if (d < hitDist) {
            if (!isPositionSafeZone(this.playerPos.x, this.playerPos.z, 'templo')) {
              if (p.aoeRadius) {
                this.particles.emitBurst('burn', p.mesh.position.x, p.mesh.position.y, p.mesh.position.z, 28);
                for (const targetMob of this.monsters) {
                  if (!targetMob.alive || !targetMob.scheduleActive) continue;
                  if (targetMob.group.position.distanceTo(p.mesh.position) <= p.aoeRadius) {
                    this.damageMonster(targetMob, stats, 10, 1, true, p.damage);
                  }
                }
              } else {
                const dmgScale =
                  p.bonusVsDragons && this.isDragonBoss(m.speciesId)
                    ? Math.round(p.damage * p.bonusVsDragons)
                    : p.damage;
                this.damageMonster(m, stats, 5, 1, true, dmgScale);
              }
            }
            hit = true;
            break;
          }
        }
      }

      if (hit || p.life <= 0 || p.mesh.position.y <= groundHeightAt(p.mesh.position.x, p.mesh.position.z, this.currentMapId)) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.projectiles.splice(i, 1);
      }
    }

    // Update Combat & Status Particles
    this.particles.update(dt);

    if (this.currentMapId === 'templo') {
      // Dynamic World Encounters (frequency, pack tier & elite rate scale with Level & Rebirths)
      const worldScaling = this.getWorldScaling();
      this.updateDynamicEncounters(dt, worldScaling);
      const playerInSafeZone = isTempleSafeZone(this.playerPos.x, this.playerPos.z);

      // Update Monsters AI & animations (simulation culled outside active loaded chunks)
      for (const m of this.monsters) {
        if (m.pendingRemoval) continue;
        const spec = MONSTER_SPECIES[m.speciesId];
        const inLoaded = m.alive
          ? this.chunkManager.isWorldPosLoaded(m.group.position.x, m.group.position.z)
          : this.chunkManager.isWorldPosLoaded(m.spawnPos.x, m.spawnPos.z);

        if (!m.alive) {
          m.respawnTimer -= dt;
          if (m.respawnTimer <= 0) {
            m.alive = true;
            m.isElite =
              !this.isDragonBoss(m.speciesId) && Math.random() < worldScaling.eliteChance;
            m.baseScale = m.isElite ? 1.16 : 1.0;
            m.maxHp = Math.round(
              spec.baseHp * worldScaling.hpMult * (m.isElite ? 1.45 : 1.0)
            );
            m.hp = m.maxHp;
            m.burnTimer = 0;
            m.poisonTimer = 0;
            m.group.position.copy(m.spawnPos);
            m.group.scale.setScalar(m.baseScale);
            m.group.visible = m.scheduleActive && inLoaded;
          }
          continue;
        }
        if (!m.scheduleActive || !inLoaded) {
          m.group.visible = false;
          continue;
        }
        m.group.visible = true;

        // Status effects (Burn & Poison particles + periodic DoT ticks)
        if (m.burnTimer > 0 || m.poisonTimer > 0) {
          m.statusParticleTimer -= dt;
          if (m.statusParticleTimer <= 0) {
            m.statusParticleTimer = 0.24;
            if (m.burnTimer > 0) {
              this.particles.emitBurst('burn', m.group.position.x, m.group.position.y + 1.15, m.group.position.z, 4);
            }
            if (m.poisonTimer > 0) {
              this.particles.emitBurst('poison', m.group.position.x, m.group.position.y + 1.05, m.group.position.z, 4);
            }
          }

          if (m.burnTimer > 0) {
            m.burnTimer = Math.max(0, m.burnTimer - dt);
            m.burnTickTimer -= dt;
            if (m.burnTickTimer <= 0) {
              m.burnTickTimer = 1.0;
              this.applyStatusTickDamage(m, m.burnDamage, 'burn');
              if (!m.alive) continue;
            }
          }

          if (m.poisonTimer > 0) {
            m.poisonTimer = Math.max(0, m.poisonTimer - dt);
            m.poisonTickTimer -= dt;
            if (m.poisonTickTimer <= 0) {
              m.poisonTickTimer = 1.0;
              this.applyStatusTickDamage(m, m.poisonDamage, 'poison');
              if (!m.alive) continue;
            }
          }
        }

        if (m.studyCooldown > 0) m.studyCooldown = Math.max(0, m.studyCooldown - dt);
        if (m.hitFlashTimer > 0) {
          m.hitFlashTimer -= dt;
          const scale = 1 + Math.sin((m.hitFlashTimer / 0.16) * Math.PI) * 0.08;
          m.group.scale.setScalar(m.baseScale * scale);
        } else {
          m.group.scale.setScalar(m.baseScale);
        }

        // Animate species-specific parts
        const parts = m.group.userData.parts;
        if (parts?.wispRing) parts.wispRing.rotation.y += dt * 2.4;
        if (parts?.floatBody) parts.floatBody.position.y = 0.25 + Math.sin(elapsed * 2.8 + m.patrolPhase) * 0.12;
        if (parts?.lWing && parts?.rWing) {
          const flap = Math.sin(elapsed * 4.5 + m.patrolPhase) * 0.22;
          parts.lWing.rotation.z = 1.25 + flap;
          parts.rWing.rotation.z = -1.25 - flap;
        }

        const distToPlayer = Math.hypot(
          this.playerPos.x - m.group.position.x,
          this.playerPos.z - m.group.position.z
        );

        const raceIdForBlock = this.callbacks.getRaceId?.() ?? 'humano';
        const classIdForBlock = this.callbacks.getClassId?.() ?? 'caballero_runico';
        const isNocturnalPowered =
          this.atmosphereState.isNight &&
          (m.schedule === 'nocturno' ||
            m.speciesId === 'espectro_velo' ||
            m.speciesId === 'esqueleto_centinela');
        const effectiveAggro =
          (isNocturnalPowered ? spec.aggroRadius * 1.35 : spec.aggroRadius) *
          worldScaling.aggroMult *
          (m.isElite ? 1.12 : 1.0);
        const effectiveSpeed =
          (isNocturnalPowered ? spec.moveSpeed * 1.15 : spec.moveSpeed) *
          worldScaling.speedMult *
          (m.isElite ? 1.06 : 1.0);

        if (!playerInSafeZone && distToPlayer < effectiveAggro && !this.callbacks.isModalOpen()) {
          // Face player
          const angle = Math.atan2(
            this.playerPos.x - m.group.position.x,
            this.playerPos.z - m.group.position.z
          );
          m.group.rotation.y = angle;

          if (distToPlayer > spec.attackRange) {
            _toEntity.set(
              this.playerPos.x - m.group.position.x,
              0,
              this.playerPos.z - m.group.position.z
            ).normalize();
            m.group.position.x += _toEntity.x * effectiveSpeed * dt;
            m.group.position.z += _toEntity.z * effectiveSpeed * dt;
          } else {
            // Attack player (check active guard [G] or passive parry block)
            m.attackTimer -= dt;
            if (m.attackTimer <= 0) {
              m.attackTimer = spec.attackCooldown * worldScaling.attackCooldownMult;
              if (parts?.weaponArm) {
                parts.weaponArm.rotation.x = -0.9;
              }
              const rawAtk = Math.round(
                spec.baseAtk * worldScaling.atkMult * (m.isElite ? 1.25 : 1.0)
              );
              const passiveParry = Math.random() < Math.min(0.28, 0.06 + stats.defensa * 0.008);
              const blocked = this.isBlocking || passiveParry;
              if (blocked) {
                const blockPassFactor = raceIdForBlock === 'enano' ? 0.15 : 0.28;
                const mitigated = Math.max(1, Math.round((rawAtk - stats.defensa * 0.55) * blockPassFactor));
                if (classIdForBlock === 'caballero_runico') {
                  this.counterStrikeBuff = true;
                }
                soundEngine.playEvent('combat:block');
                this.callbacks.onFloatingDamage({
                  id: `blk-${Date.now()}-${Math.random()}`,
                  value: `Bloqueado (-${mitigated})`,
                  isCrit: false,
                  screenX: window.innerWidth * 0.45,
                  screenY: window.innerHeight * 0.56,
                });
                this.callbacks.onPlayerDamaged(mitigated, spec.name, true);
              } else {
                const dmgTaken = Math.max(1, Math.round(rawAtk - stats.defensa * 0.45));
                soundEngine.playEvent('combat:hurt');
                this.callbacks.onPlayerDamaged(dmgTaken, spec.name, false);
                this.maybeApplyMonsterStatusToPlayer(m.speciesId, spec.name);
              }
            }
          }
        } else {
          // Gentle idle patrol around spawn
          m.patrolPhase += dt * 0.55;
          const targetX = m.spawnPos.x + Math.cos(m.patrolPhase) * 2.6;
          const targetZ = m.spawnPos.z + Math.sin(m.patrolPhase) * 2.6;
          m.group.position.x = THREE.MathUtils.damp(m.group.position.x, targetX, 1.5, dt);
          m.group.position.z = THREE.MathUtils.damp(m.group.position.z, targetZ, 1.5, dt);
          m.group.rotation.y = Math.atan2(targetX - m.group.position.x, targetZ - m.group.position.z);
        }

        // Strict Temple Safe Zone barrier: keep monsters outside the Sanctuary courtyard
        if (isTempleSafeZone(m.group.position.x, m.group.position.z)) {
          const sx = m.group.position.x;
          const sz = m.group.position.z - 2;
          const distSafe = Math.hypot(sx, sz) || 1;
          const pushRad = 16.9;
          m.group.position.x = (sx / distSafe) * pushRad;
          m.group.position.z = 2 + (sz / distSafe) * pushRad;
        }

        if (parts?.weaponArm) {
          parts.weaponArm.rotation.x = THREE.MathUtils.damp(parts.weaponArm.rotation.x, 0, 7, dt);
        }

        m.group.position.y = groundHeightAt(m.group.position.x, m.group.position.z, 'templo');
      }
    }

    // Throttled Target Raycast & Minimap Snapshot
    this.targetTimer += dt;
    if (this.targetTimer >= 0.09) {
      this.targetTimer = 0;
      this.callbacks.onTargetChange(this.findFocusedTarget());
    }

    this.minimapTimer += dt;
    if (this.minimapTimer >= 0.1) {
      this.minimapTimer = 0;
      const currentZone = getZoneName(this.playerPos.x, this.playerPos.z, this.currentMapId);
      if (currentZone !== this.lastReportedZone) {
        this.lastReportedZone = currentZone;
        this.callbacks.onZoneEntered?.(currentZone);
        if (this.currentMapId === 'templo') {
          const zonePoiId = this.getZonePoiId(currentZone);
          if (zonePoiId) {
            this.queuePoiSnapshot(zonePoiId, this.playerPos.x, this.playerPos.z);
          }
        }
      }
      this.pushMinimapSnapshot();
    }

    // Update Dynamic Day/Night Cycle, Atmosphere, NPC Schedules & Post-Processing Shader
    this.updateDayNightAndAtmosphere(dt, elapsed);

    if (this.composer && !this.isSoftwareGl) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }

    this.bootFrames += 1;
    if (this.currentMapId === 'templo' && this.bootFrames >= 2) {
      this.queuePoiSnapshot('poi_zone_bastion', this.playerPos.x, this.playerPos.z);
    }
    if (this.pendingSnapshots.length > 0) {
      this.flushPendingSnapshots();
    }

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private disposeObjectResources(obj: THREE.Object3D): void {
    obj.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat) => mat.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
  }

  private pickEncounterSpecies(scaling: WorldScalingProfile): MonsterSpeciesId {
    const { playerLevel, rebirths } = scaling;
    const isNight = this.atmosphereState.isNight;
    const zone = getZoneName(this.playerPos.x, this.playerPos.z);

    if (
      (playerLevel >= 25 || rebirths >= 1) &&
      Math.random() < Math.min(0.42, 0.14 + rebirths * 0.08 + Math.max(0, playerLevel - 25) * 0.004)
    ) {
      return 'wyvern_ceniza';
    }

    if (playerLevel < 5 && rebirths === 0) {
      if (isNight) return Math.random() < 0.5 ? 'espectro_velo' : 'esqueleto_centinela';
      return Math.random() < 0.65 ? 'goblin_merodeador' : 'esqueleto_centinela';
    }

    if (playerLevel < 15 && rebirths === 0) {
      if (zone.includes('Ceniza') || zone.includes('Tierras Altas')) {
        return Math.random() < 0.55 ? 'golem_obsidiana' : 'esqueleto_centinela';
      }
      if (isNight || zone.includes('Bruma')) {
        return Math.random() < 0.6 ? 'espectro_velo' : 'esqueleto_centinela';
      }
      const r = Math.random();
      if (r < 0.4) return 'esqueleto_centinela';
      if (r < 0.75) return 'espectro_velo';
      return 'goblin_merodeador';
    }

    const r = Math.random();
    if (r < 0.36) return 'golem_obsidiana';
    if (r < 0.72) return 'espectro_velo';
    return 'esqueleto_centinela';
  }

  private updateDynamicEncounters(dt: number, scaling: WorldScalingProfile): void {
    // 1. Clean up defeated or far-off dynamic encounters safely
    let activeDynamicCount = 0;
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const m = this.monsters[i];
      if (!m.isDynamicEncounter) continue;
      const dist = Math.hypot(
        this.playerPos.x - m.group.position.x,
        this.playerPos.z - m.group.position.z
      );
      const loaded = this.chunkManager.isWorldPosLoaded(
        m.group.position.x,
        m.group.position.z
      );
      if (m.pendingRemoval || !m.alive || !loaded || dist > 56) {
        this.scene.remove(m.group);
        this.disposeObjectResources(m.group);
        this.monsters.splice(i, 1);
      } else {
        activeDynamicCount++;
      }
    }

    if (this.callbacks.isModalOpen()) return;

    // 2. Temple Safe Zone protects against sudden ambushes
    if (isTempleSafeZone(this.playerPos.x, this.playerPos.z)) {
      this.encounterTimer = Math.max(this.encounterTimer, 8);
      return;
    }

    // 3. Countdown to next dynamic encounter scaled by Level, Rebirths & Difficulty
    this.encounterTimer -= dt;
    if (this.encounterTimer > 0) return;

    this.encounterTimer =
      scaling.encounterIntervalSec * THREE.MathUtils.randFloat(0.85, 1.15);

    if (activeDynamicCount >= scaling.maxDynamicEncounters) return;

    const room = scaling.maxDynamicEncounters - activeDynamicCount;
    const packTarget =
      scaling.playerLevel >= 12 || scaling.rebirths >= 1
        ? Math.random() < 0.5
          ? 2
          : 1
        : 1;
    const packSize = Math.min(room, packTarget);

    let spawnedElite = false;
    let firstSpeciesName = '';
    let firstEnemyLevel = 1;

    for (let i = 0; i < packSize; i++) {
      const angle = this.yaw + Math.PI + THREE.MathUtils.randFloat(-1.1, 1.1) + i * 0.45;
      const radius = THREE.MathUtils.randFloat(15.5, 23.5);
      const sx = THREE.MathUtils.clamp(
        this.playerPos.x + Math.sin(angle) * radius,
        -(WORLD_RADIUS - 8),
        WORLD_RADIUS - 8
      );
      const sz = THREE.MathUtils.clamp(
        this.playerPos.z + Math.cos(angle) * radius,
        -(WORLD_RADIUS - 8),
        WORLD_RADIUS - 8
      );

      // Avoid spawning inside Temple Safe Zone or unloaded chunks
      if (isTempleSafeZone(sx, sz)) continue;
      if (!this.chunkManager.isWorldPosLoaded(sx, sz)) continue;

      const speciesId = this.pickEncounterSpecies(scaling);
      const spec = MONSTER_SPECIES[speciesId];
      const isElite =
        !this.isDragonBoss(speciesId) && Math.random() < scaling.eliteChance;
      const baseScale = isElite ? 1.16 : 1.0;
      const sy = groundHeightAt(sx, sz, 'templo');
      const model = createMonsterModel(speciesId);
      const scaledMaxHp = Math.round(
        spec.baseHp * scaling.hpMult * (isElite ? 1.45 : 1.0)
      );

      model.position.set(sx, sy, sz);
      model.scale.setScalar(baseScale);
      this.templeGroup.add(model);
      this.particles.emitBurst(isElite ? 'crit' : 'poison', sx, sy + 1.2, sz, 12);

      this.dynamicEncounterCounter++;
      this.monsters.push({
        id: `enc_${this.dynamicEncounterCounter}`,
        speciesId,
        schedule: 'siempre',
        scheduleActive: true,
        group: model,
        spawnPos: new THREE.Vector3(sx, sy, sz),
        hp: scaledMaxHp,
        maxHp: scaledMaxHp,
        alive: true,
        isElite,
        baseScale,
        isDynamicEncounter: true,
        respawnTimer: 0,
        attackTimer: 0.7,
        hitFlashTimer: 0,
        studyCooldown: 0,
        patrolPhase: Math.random() * Math.PI * 2,
        burnTimer: 0,
        burnTickTimer: 0,
        burnDamage: 0,
        poisonTimer: 0,
        poisonTickTimer: 0,
        poisonDamage: 0,
        statusParticleTimer: 0,
      });

      if (isElite) spawnedElite = true;
      if (!firstSpeciesName) {
        firstSpeciesName = spec.name;
        firstEnemyLevel = getEnemyEffectiveLevel(
          spec.dangerLevel,
          scaling.playerLevel,
          scaling.rebirths,
          isElite
        );
      }
    }

    if (firstSpeciesName) {
      this.callbacks.onLog(
        spawnedElite
          ? `¡Encuentro de Élite! ${firstSpeciesName} (Nv. ${firstEnemyLevel}) acecha cerca de tu posición.`
          : `¡Encuentro del Velo! ${packSize > 1 ? `${packSize} amenazas` : firstSpeciesName} (Nv. ${firstEnemyLevel}) surgen en la zona.`,
        'damage'
      );
    }
  }

  private resolveDynamicObstacle(ox: number, oz: number, radius: number): void {
    const dx = this.playerPos.x - ox;
    const dz = this.playerPos.z - oz;
    const d = Math.hypot(dx, dz);
    const minD = radius + 0.65;
    if (d < minD && d > 0.001) {
      const push = (minD - d) / d;
      this.playerPos.x += dx * push;
      this.playerPos.z += dz * push;
    }
  }

  private isScheduleActive(schedule: MonsterSchedule, isNight: boolean): boolean {
    if (schedule === 'siempre') return true;
    return schedule === 'nocturno' ? isNight : !isNight;
  }

  private syncMonsterSchedules(isNight: boolean, announce: boolean): void {
    let spawnedNocturnal = 0;
    let retreatedDiurnal = 0;
    for (const m of this.monsters) {
      const shouldBeActive = this.isScheduleActive(m.schedule, isNight);
      if (shouldBeActive === m.scheduleActive) continue;
      m.scheduleActive = shouldBeActive;

      if (shouldBeActive) {
        if (m.alive) {
          m.group.position.copy(m.spawnPos);
          m.group.visible = true;
          this.particles.emitBurst(
            m.schedule === 'nocturno' ? 'poison' : 'hit',
            m.spawnPos.x,
            m.spawnPos.y + 1.2,
            m.spawnPos.z,
            8
          );
          if (m.schedule === 'nocturno') spawnedNocturnal++;
        }
      } else {
        m.group.visible = false;
        if (m.alive && m.schedule === 'diurno') retreatedDiurnal++;
      }
    }

    if (announce && (spawnedNocturnal > 0 || retreatedDiurnal > 0)) {
      this.callbacks.onLog(
        isNight
          ? 'Cae la noche: los Goblins se repliegan y emergen Espectros del Velo y Centinelas nocturnos en las ruinas.'
          : 'Despunta la luz diurna: los espectros nocturnos se desvanecen y los Goblins regresan a las ruinas exteriores.',
        isNight ? 'damage' : 'info'
      );
    }
  }

  private applyImmediateAtmosphere(): void {
    const atmo = computeAtmosphereState(this.timeOfDay, this.currentWeather, this.atmosphereState);
    this.currentPhase = atmo.phase;

    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.copy(atmo.skyColor);
    }
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(atmo.skyColor);
      this.scene.fog.density = atmo.fogDensity;
    }
    this.keyLight.color.copy(atmo.keyColor);
    this.keyLight.intensity = atmo.keyIntensity;
    this.hemiLight.color.copy(atmo.hemiSkyColor);
    this.hemiLight.groundColor.copy(atmo.hemiGroundColor);
    this.hemiLight.intensity = atmo.hemiIntensity;
    this.rimLight.color.copy(atmo.rimColor);
    this.rimLight.intensity = atmo.rimIntensity;
    if (this.starMat) {
      this.starMat.opacity = atmo.starOpacity;
    }
    if (this.weatherPass) {
      const u = this.weatherPass.uniforms;
      u.uRainMix.value = atmo.rainMix;
      u.uSnowMix.value = atmo.snowMix;
      u.uAshMix.value = atmo.ashMix;
      u.uFogMix.value = atmo.fogOverlayMix;
      u.uSunsetMix.value = atmo.sunsetMix;
      u.uNightMix.value = atmo.nightMix;
    }
  }

  private updateDayNightAndAtmosphere(dt: number, elapsed: number): void {
    let rolledOverDay = false;
    if (!this.callbacks.isModalOpen()) {
      const nextTime = this.timeOfDay + dt * this.daySpeedHoursPerSec;
      if (nextTime >= 24) {
        this.dayNumber += Math.floor(nextTime / 24);
        rolledOverDay = true;
      }
      this.timeOfDay = nextTime % 24;
      this.weatherCycleTimer += dt;
      if (this.weatherCycleTimer >= this.weatherCycleDuration) {
        this.cycleWeather();
      }
    }

    const atmo = computeAtmosphereState(this.timeOfDay, this.currentWeather, this.atmosphereState);
    const prevPhase = this.currentPhase;
    if (rolledOverDay) {
      this.callbacks.onNewDay?.(this.dayNumber);
    }
    if (atmo.phase !== prevPhase) {
      this.currentPhase = atmo.phase;
      // Synchronize sunset shader weather automatically with dusk transition
      if (atmo.phase === 'ocaso' && this.currentWeather === 'despejado') {
        this.setWeather('atardecer', true, false);
      } else if (prevPhase === 'ocaso' && atmo.phase !== 'ocaso' && this.currentWeather === 'atardecer') {
        this.setWeather('despejado', true, false);
      }
      this.syncMonsterSchedules(atmo.isNight, true);
      this.callbacks.onDayTimeChange?.(this.getDayTimeSnapshot());
      this.timeSyncTimer = 0;
    } else if (rolledOverDay) {
      this.callbacks.onDayTimeChange?.(this.getDayTimeSnapshot());
      this.timeSyncTimer = 0;
    } else {
      this.timeSyncTimer += dt;
      if (this.timeSyncTimer >= 0.25) {
        this.timeSyncTimer = 0;
        this.callbacks.onDayTimeChange?.(this.getDayTimeSnapshot());
      }
    }

    // Smooth atmospheric color, fog & shadow light blending
    const blend = 1 - Math.exp(-2.0 * dt);
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.lerp(atmo.skyColor, blend);
    }
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.lerp(atmo.skyColor, blend);
      this.scene.fog.density = THREE.MathUtils.damp(this.scene.fog.density, atmo.fogDensity, 2.0, dt);
    }

    this.keyLight.color.lerp(atmo.keyColor, blend);
    this.keyLight.intensity = THREE.MathUtils.damp(this.keyLight.intensity, atmo.keyIntensity, 2.0, dt);

    // Sun & Moon directional orbital arc (tracks player across expanded world)
    const sunAngle = ((this.timeOfDay - 6) / 24) * Math.PI * 2;
    const sunSin = Math.sin(sunAngle);
    this.keyLight.target.position.set(this.playerPos.x, 0, this.playerPos.z);
    this.keyLight.target.updateMatrixWorld();
    if (sunSin >= -0.05) {
      this.keyLight.position.set(
        this.playerPos.x + Math.cos(sunAngle) * 48,
        Math.max(8, sunSin * 52),
        this.playerPos.z + 18
      );
    } else {
      this.keyLight.position.set(
        this.playerPos.x - Math.cos(sunAngle) * 44,
        Math.max(14, -sunSin * 48),
        this.playerPos.z - 18
      );
    }

    this.hemiLight.color.lerp(atmo.hemiSkyColor, blend);
    this.hemiLight.groundColor.lerp(atmo.hemiGroundColor, blend);
    this.hemiLight.intensity = THREE.MathUtils.damp(this.hemiLight.intensity, atmo.hemiIntensity, 2.0, dt);

    this.rimLight.color.lerp(atmo.rimColor, blend);
    this.rimLight.intensity = THREE.MathUtils.damp(this.rimLight.intensity, atmo.rimIntensity, 2.0, dt);

    if (this.starPoints) {
      this.starPoints.position.set(this.playerPos.x, 0, this.playerPos.z);
    }
    if (this.starMat) {
      this.starMat.opacity = THREE.MathUtils.damp(this.starMat.opacity, atmo.starOpacity, 2.0, dt);
    }

    // Dynamic brazier, NPC lantern & player explorer lantern intensity
    const targetPlayerLantern = atmo.nightMix * 2.4 + atmo.fogOverlayMix * 0.9;
    this.playerLantern.intensity = THREE.MathUtils.damp(this.playerLantern.intensity, targetPlayerLantern, 3.0, dt);

    for (const b of this.braziers) {
      if (!b.visible) continue;
      const torch = b.userData.torchLight as THREE.PointLight | undefined;
      if (torch) {
        const flicker = Math.sin(elapsed * 12 + b.position.x) * 0.4;
        const targetTorch = 4.2 + atmo.lanternFactor * 4.2 + flicker;
        torch.intensity = THREE.MathUtils.damp(torch.intensity, targetTorch, 6, dt);
      }
    }

    const valenLight = this.npcGroup.userData.lanternLight as THREE.PointLight | undefined;
    const valenLanternMat = this.npcGroup.userData.lanternMat as THREE.MeshStandardMaterial | undefined;
    if (valenLight) {
      valenLight.intensity = THREE.MathUtils.damp(valenLight.intensity, 1.5 + atmo.lanternFactor * 3.4, 3.0, dt);
    }
    if (valenLanternMat) {
      valenLanternMat.emissiveIntensity = 0.85 + atmo.lanternFactor * 1.55;
    }

    const kaelLight = this.merchantGroup.userData.lanternLight as THREE.PointLight | undefined;
    const kaelLanternMat = this.merchantGroup.userData.lanternMat as THREE.MeshStandardMaterial | undefined;
    if (kaelLight) {
      kaelLight.intensity = THREE.MathUtils.damp(kaelLight.intensity, 1.3 + atmo.lanternFactor * 2.9, 3.0, dt);
    }
    if (kaelLanternMat) {
      kaelLanternMat.emissiveIntensity = 0.8 + atmo.lanternFactor * 1.45;
    }

    // NPC Behavioral Schedule: Valen & Kael move between Day Posts and Night/Storm Sanctuary Posts
    const isDuskOrNight = this.currentPhase === 'noche' || this.currentPhase === 'ocaso';
    const isShelterWeather =
      isDuskOrNight ||
      this.currentWeather === 'lluvia' ||
      this.currentWeather === 'nieve' ||
      this.currentWeather === 'tormenta_ceniza';

    const valenTargetX = isDuskOrNight ? 1.65 : 4.5;
    const valenTargetZ = isDuskOrNight ? 1.85 : 2.0;
    const valenTargetRot = isDuskOrNight ? -0.35 : -0.6;
    this.npcGroup.position.x = THREE.MathUtils.damp(this.npcGroup.position.x, valenTargetX, 2.2, dt);
    this.npcGroup.position.z = THREE.MathUtils.damp(this.npcGroup.position.z, valenTargetZ, 2.2, dt);
    this.npcGroup.position.y = groundHeightAt(this.npcGroup.position.x, this.npcGroup.position.z, 'templo');
    this.npcGroup.rotation.y = THREE.MathUtils.damp(this.npcGroup.rotation.y, valenTargetRot, 2.8, dt);

    const kaelTargetX = isShelterWeather ? 2.85 : 5.5;
    const kaelTargetZ = isShelterWeather ? 5.15 : 6.2;
    const kaelTargetRot = isShelterWeather ? -0.82 : -1.1;
    this.merchantGroup.position.x = THREE.MathUtils.damp(this.merchantGroup.position.x, kaelTargetX, 2.2, dt);
    this.merchantGroup.position.z = THREE.MathUtils.damp(this.merchantGroup.position.z, kaelTargetZ, 2.2, dt);
    this.merchantGroup.position.y = groundHeightAt(this.merchantGroup.position.x, this.merchantGroup.position.z, 'templo');
    this.merchantGroup.rotation.y = THREE.MathUtils.damp(this.merchantGroup.rotation.y, kaelTargetRot, 2.8, dt);

    // Update 3D Weather Particle System around player (rain, snow, ash storm)
    this.weatherParticles.update(
      dt,
      elapsed,
      this.currentWeather,
      this.playerPos,
      (x, z) => groundHeightAt(x, z, this.currentMapId)
    );

    if (this.weatherPass) {
      const u = this.weatherPass.uniforms;
      u.uTime.value = elapsed;
      u.uRainMix.value = THREE.MathUtils.damp(u.uRainMix.value, atmo.rainMix, 2.2, dt);
      u.uSnowMix.value = THREE.MathUtils.damp(u.uSnowMix.value, atmo.snowMix, 2.2, dt);
      u.uAshMix.value = THREE.MathUtils.damp(u.uAshMix.value, atmo.ashMix, 2.2, dt);
      u.uFogMix.value = THREE.MathUtils.damp(u.uFogMix.value, atmo.fogOverlayMix, 2.2, dt);
      u.uSunsetMix.value = THREE.MathUtils.damp(u.uSunsetMix.value, atmo.sunsetMix, 2.2, dt);
      u.uNightMix.value = THREE.MathUtils.damp(u.uNightMix.value, atmo.nightMix, 2.2, dt);
    }
  }

  public getDayTimeSnapshot(): DayTimeSnapshot {
    const info = getDayPhaseInfo(this.timeOfDay);
    return {
      dayNumber: this.dayNumber,
      hour: this.timeOfDay,
      formattedTime: formatGameHour(this.timeOfDay),
      phase: info.phase,
      phaseLabel: info.label,
      isNight: info.isNight,
      visibilityMeters: this.atmosphereState.visibilityMeters,
    };
  }

  public advanceDayPhase(): DayTimeSnapshot {
    const nextMap: Record<DayPhase, { hour: number; phase: DayPhase }> = {
      amanecer: { hour: 11.5, phase: 'dia' },
      dia: { hour: 18.25, phase: 'ocaso' },
      ocaso: { hour: 23.25, phase: 'noche' },
      noche: { hour: 6.25, phase: 'amanecer' },
    };
    const nextTarget = nextMap[this.currentPhase];
    const prevPhase = this.currentPhase;
    this.timeOfDay = nextTarget.hour;
    this.currentPhase = nextTarget.phase;

    if (prevPhase === 'noche' && nextTarget.phase === 'amanecer') {
      this.dayNumber += 1;
      this.callbacks.onNewDay?.(this.dayNumber);
    }

    if (nextTarget.phase === 'ocaso' && this.currentWeather === 'despejado') {
      this.setWeather('atardecer', true, false);
    } else if (prevPhase === 'ocaso' && nextTarget.phase !== 'ocaso' && this.currentWeather === 'atardecer') {
      this.setWeather('despejado', true, false);
    }

    const atmo = computeAtmosphereState(this.timeOfDay, this.currentWeather, this.atmosphereState);
    this.syncMonsterSchedules(atmo.isNight, true);
    const snap = this.getDayTimeSnapshot();
    this.callbacks.onDayTimeChange?.(snap);
    this.callbacks.onLog(
      `Día ${this.dayNumber} · El ciclo solar avanza a ${snap.phaseLabel} (${snap.formattedTime}).`,
      'info'
    );
    return snap;
  }

  public setWeather(weather: WeatherType, notify = true, syncTimeWithSunset = true): void {
    this.currentWeather = weather;
    this.weatherCycleTimer = 0;
    if (syncTimeWithSunset && weather === 'atardecer' && this.currentPhase !== 'ocaso') {
      this.timeOfDay = 18.25;
      this.currentPhase = 'ocaso';
      const atmo = computeAtmosphereState(this.timeOfDay, this.currentWeather, this.atmosphereState);
      this.syncMonsterSchedules(atmo.isNight, false);
      this.callbacks.onDayTimeChange?.(this.getDayTimeSnapshot());
    }
    if (notify) {
      this.callbacks.onWeatherChange?.(weather);
    }
  }

  public cycleWeather(): WeatherType {
    const idx = WEATHER_ORDER.indexOf(this.currentWeather);
    const next = WEATHER_ORDER[(idx + 1) % WEATHER_ORDER.length];
    this.setWeather(next, true, true);
    return next;
  }

  public getWeather(): WeatherType {
    return this.currentWeather;
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.destroyed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private pushMinimapSnapshot(): void {
    const entities: MinimapEntity[] = [];

    for (const portal of this.portals) {
      if (portal.mapId === this.currentMapId) {
        entities.push({
          id: portal.id,
          x: portal.x,
          z: portal.z,
          kind: 'portal',
          label: portal.name,
        });
      }
    }

    for (const rp of this.remotePlayers.values()) {
      if (rp.state.mapId === this.currentMapId) {
        entities.push({
          id: rp.uid,
          x: rp.group.position.x,
          z: rp.group.position.z,
          kind: 'remote_player',
          label: `[${rp.state.clanTag}] ${rp.state.playerName}`,
          colorHex: rp.state.clanColor,
        });
      }
    }

    if (this.currentMapId === 'templo') {
      entities.push(
        { id: 'npc', x: this.npcGroup.position.x, z: this.npcGroup.position.z, kind: 'npc', label: 'Valen' },
        { id: 'merchant', x: this.merchantGroup.position.x, z: this.merchantGroup.position.z, kind: 'npc', label: 'Kael' }
      );
    }

    const shrines: FastTravelShrineInfo[] = this.shrines.map((s) => {
      if (this.currentMapId === 'templo') {
        entities.push({
          id: s.id,
          x: s.x,
          z: s.z,
          kind: 'shrine',
          label: s.name,
          discovered: s.discovered,
        });
      }
      return {
        id: s.id,
        name: s.name,
        zoneName: s.zoneName,
        x: s.x,
        z: s.z,
        discovered: s.discovered,
      };
    });

    if (this.currentMapId === 'templo') {
      for (const c of this.chests) {
        if (!c.opened) {
          entities.push({ id: c.id, x: c.group.position.x, z: c.group.position.z, kind: 'chest' });
        }
      }
      for (const l of this.loreObjects) {
        entities.push({
          id: l.id,
          x: l.x,
          z: l.z,
          kind: 'lore',
          label: l.name,
          discovered: l.discovered,
        });
      }
      for (const d of this.doors) {
        entities.push({ id: d.id, x: d.x, z: d.z, kind: 'door', label: d.name });
      }
      for (const c of this.clanNpcs) {
        entities.push({
          id: c.id,
          x: c.group.position.x,
          z: c.group.position.z,
          kind: 'clan_npc',
          label: c.name,
          discovered: c.invited,
        });
      }
      for (const h of this.herbNodes) {
        if (h.available) {
          entities.push({
            id: h.id,
            x: h.x,
            z: h.z,
            kind: 'herb',
            label: h.name,
          });
        }
      }
      for (const m of this.monsters) {
        if (m.alive && m.scheduleActive) {
          entities.push({
            id: m.id,
            x: m.group.position.x,
            z: m.group.position.z,
            kind: this.isDragonBoss(m.speciesId) ? 'boss' : 'monster',
          });
        }
      }
    }

    const chunkPillars = this.chunkManager.collectNearbyObstacles(
      this.playerPos.x,
      this.playerPos.z,
      54
    );
    const activePillars = this.currentMapId === 'plaza' ? this.plazaObstacles : this.obstacles;
    const activeRadius = this.currentMapId === 'plaza' ? PLAZA_WORLD_RADIUS : WORLD_RADIUS;

    this.callbacks.onMinimapUpdate({
      mapId: this.currentMapId,
      isSafeZone: isPositionSafeZone(this.playerPos.x, this.playerPos.z, this.currentMapId),
      playerX: this.playerPos.x,
      playerZ: this.playerPos.z,
      playerYaw: this.yaw,
      worldRadius: activeRadius,
      zoneName: getZoneName(this.playerPos.x, this.playerPos.z, this.currentMapId),
      pillars: [...activePillars, ...chunkPillars],
      entities,
      shrines,
    });
  }

  public switchMap(
    nextMap: WorldMapId,
    arrivalX?: number,
    arrivalZ?: number,
    arrivalYaw?: number
  ): void {
    // Clear active projectiles on map transition
    for (const p of this.projectiles) {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.Material).dispose();
    }
    this.projectiles = [];

    const destX = arrivalX ?? (nextMap === 'plaza' ? 0 : -5.2);
    const destZ = arrivalZ ?? (nextMap === 'plaza' ? 12 : 7.5);
    const destYaw = arrivalYaw ?? (nextMap === 'plaza' ? 0 : -0.45);

    this.currentMapId = nextMap;
    this.plazaGroup.visible = nextMap === 'plaza';
    this.templeGroup.visible = nextMap === 'templo';

    const ay = groundHeightAt(destX, destZ, nextMap);
    this.playerPos.set(destX, ay, destZ);
    this.playerVelY = 0;
    this.grounded = true;
    this.yaw = destYaw;
    this.pitch = -0.04;
    this.portalCooldown = 2.5;

    this.chunkManager.setMapId(nextMap, destX, destZ);
    this.particles.emitBurst('shrine', destX, ay + 1.3, destZ, 30);
    soundEngine.playEvent('world:teleport');

    const nextZone = getZoneName(destX, destZ, nextMap);
    this.lastReportedZone = nextZone;
    this.callbacks.onMapChange?.(nextMap);
    this.callbacks.onZoneEntered?.(nextZone);
    this.pushMinimapSnapshot();
    this.callbacks.onTargetChange(this.findFocusedTarget());
    this.callbacks.onLog(
      nextMap === 'templo'
        ? 'Teletransportado al Templo del Velo (Zona Segura). Sal del recinto para explorar el Valle.'
        : 'Regresaste a la Plaza del Alba (Zona Segura · Punto de encuentro).',
      'quest'
    );
  }

  public getCurrentMapId(): WorldMapId {
    return this.currentMapId;
  }

  public getOnlineTransform(): {
    mapId: WorldMapId;
    x: number;
    z: number;
    yaw: number;
    isMoving: boolean;
  } {
    return {
      mapId: this.currentMapId,
      x: this.playerPos.x,
      z: this.playerPos.z,
      yaw: this.yaw,
      isMoving: this.isMovingLastFrame,
    };
  }

  public resetToPlaza(): void {
    this.switchMap('plaza', 0, 12, 0);
  }

  public syncOnlinePlayers(players: OnlinePlayerState[], localUid: string | null): void {
    const activeIds = new Set<string>();

    for (const p of players) {
      if (!p.isOnline || p.uid === localUid) continue;
      activeIds.add(p.uid);
      const badge = getClanBadgeInfo(p.clanName, p.clanTag, p.clanColor);
      const normalized: OnlinePlayerState = {
        ...p,
        clanName: badge.clanName,
        clanTag: badge.clanTag,
        clanColor: badge.clanColor,
      };

      const existing = this.remotePlayers.get(p.uid);
      if (existing) {
        existing.state = normalized;
        existing.targetX = normalized.x;
        existing.targetZ = normalized.z;
        existing.targetYaw = normalized.yaw;
        updateRemoteHeroNameplate(
          existing.group,
          normalized.playerName,
          normalized.clanTag,
          normalized.clanColor,
          normalized.level,
          normalized.rebirths
        );
      } else {
        const group = createRemoteHeroModel(
          normalized.raceId,
          normalized.classId,
          normalized.clanColor,
          normalized.playerName,
          normalized.clanTag,
          normalized.level,
          normalized.rebirths
        );
        const gy = groundHeightAt(normalized.x, normalized.z, normalized.mapId);
        group.position.set(normalized.x, gy, normalized.z);
        group.rotation.y = normalized.yaw;
        group.visible = normalized.mapId === this.currentMapId;
        this.scene.add(group);
        this.remotePlayers.set(p.uid, {
          uid: p.uid,
          state: normalized,
          group,
          targetX: normalized.x,
          targetZ: normalized.z,
          targetYaw: normalized.yaw,
          stridePhase: Math.random() * Math.PI * 2,
        });
      }
    }

    for (const [uid, rp] of [...this.remotePlayers.entries()]) {
      if (!activeIds.has(uid)) {
        this.scene.remove(rp.group);
        const tex = rp.group.userData.plateTexture as THREE.Texture | undefined;
        tex?.dispose();
        this.disposeObjectResources(rp.group);
        this.remotePlayers.delete(uid);
      }
    }
  }

  public teleportToShrine(shrineId: string): boolean {
    const shrine = this.shrines.find((s) => s.id === shrineId && s.discovered);
    if (!shrine) return false;

    if (this.currentMapId !== 'templo') {
      this.switchMap('templo', shrine.arrivalX, shrine.arrivalZ, shrine.arrivalYaw);
    } else {
      const ay = groundHeightAt(shrine.arrivalX, shrine.arrivalZ, 'templo');
      this.playerPos.set(shrine.arrivalX, ay, shrine.arrivalZ);
      this.playerVelY = 0;
      this.grounded = true;
      this.yaw = shrine.arrivalYaw;
      this.pitch = -0.04;
      this.chunkManager.update(this.playerPos.x, this.playerPos.z, true);
      this.particles.emitBurst('shrine', shrine.arrivalX, ay + 1.2, shrine.arrivalZ, 28);
      this.particles.emitBurst('shrine', shrine.x, groundHeightAt(shrine.x, shrine.z, 'templo') + 2.0, shrine.z, 22);
      soundEngine.playEvent('world:teleport');
    }

    const arrivalZone = getZoneName(shrine.arrivalX, shrine.arrivalZ, 'templo');
    if (arrivalZone !== this.lastReportedZone) {
      this.lastReportedZone = arrivalZone;
      const zonePoiId = this.getZonePoiId(arrivalZone);
      if (zonePoiId) {
        this.queuePoiSnapshot(zonePoiId, shrine.arrivalX, shrine.arrivalZ);
      }
    }
    this.pushMinimapSnapshot();
    this.callbacks.onTargetChange(this.findFocusedTarget());
    this.callbacks.onFastTravel?.(shrine.id, shrine.name, shrine.zoneName);
    return true;
  }

  private getZonePoiId(zoneName: string): string | null {
    switch (zoneName) {
      case 'Santuario del Bastión':
        return 'poi_zone_bastion';
      case 'Ruinas Exteriores':
        return 'poi_zone_ruinas';
      case 'Atrio Antiguo':
        return 'poi_zone_atrio';
      case 'Santuario Sombrío':
        return 'poi_zone_sombrio';
      case 'Cráter Basáltico':
        return 'poi_zone_crater';
      case 'Altar del Wyvern (Norte)':
        return 'poi_zone_altar';
      case 'Bosque Susurrante (Sur)':
        return 'poi_zone_bosque_sur';
      case 'Páramo de Ceniza (Este)':
        return 'poi_zone_paramo_este';
      case 'Bruma de Occidente (Oeste)':
        return 'poi_zone_bruma_oeste';
      case 'Tierras Altas del Norte':
        return 'poi_zone_tierras_altas';
      default:
        return null;
    }
  }

  public queuePoiSnapshot(poiId: string, x = this.playerPos.x, z = this.playerPos.z): void {
    if (this.capturedPoiIds.has(poiId)) return;
    const def = JOURNAL_POI_CATALOG.find((p) => p.id === poiId);
    if (!def) return;
    this.capturedPoiIds.add(poiId);
    this.pendingSnapshots.push({ poiId, x, z });
  }

  private flushPendingSnapshots(): void {
    const glCanvas = this.renderer.domElement;
    const ctx = this.snapshotCtx;
    const targetW = this.snapshotCanvas.width;
    const targetH = this.snapshotCanvas.height;

    let dataUrl = '';
    if (ctx && glCanvas.width > 0 && glCanvas.height > 0) {
      const srcAspect = glCanvas.width / glCanvas.height;
      const dstAspect = targetW / targetH;
      let sx = 0;
      let sy = 0;
      let sw = glCanvas.width;
      let sh = glCanvas.height;
      if (srcAspect > dstAspect) {
        sw = Math.round(glCanvas.height * dstAspect);
        sx = Math.round((glCanvas.width - sw) / 2);
      } else if (srcAspect < dstAspect) {
        sh = Math.round(glCanvas.width / dstAspect);
        sy = Math.round((glCanvas.height - sh) / 2);
      }
      ctx.drawImage(glCanvas, sx, sy, sw, sh, 0, 0, targetW, targetH);
      dataUrl = this.snapshotCanvas.toDataURL('image/jpeg', 0.84);
    }

    const batch = this.pendingSnapshots.splice(0, this.pendingSnapshots.length);
    const now = Date.now();
    for (const item of batch) {
      const def = JOURNAL_POI_CATALOG.find((p) => p.id === item.poiId);
      if (!def) continue;
      this.callbacks.onJournalSnapshotCaptured?.({
        poiId: def.id,
        title: def.title,
        category: def.category,
        zoneName: def.zoneName,
        x: Math.round(item.x * 10) / 10,
        z: Math.round(item.z * 10) / 10,
        weather: this.currentWeather,
        capturedAt: now,
        imageDataUrl: dataUrl,
        fieldNote: def.fieldNote,
      });
    }
  }

  public respawnAtSanctuary(): void {
    this.switchMap('templo', 0, 7.5, 0);
    this.cleanseStatuses();
  }

  public cleanseStatuses(): string[] {
    const cleansed: string[] = [];
    if (this.playerStatuses.poison.remaining > 0) {
      this.playerStatuses.poison.remaining = 0;
      cleansed.push('Veneno');
    }
    if (this.playerStatuses.burn.remaining > 0) {
      this.playerStatuses.burn.remaining = 0;
      cleansed.push('Quemadura');
    }
    if (this.playerStatuses.slow.remaining > 0) {
      this.playerStatuses.slow.remaining = 0;
      cleansed.push('Ralentización');
    }
    if (cleansed.length > 0) {
      this.emitPlayerStatuses();
    }
    return cleansed;
  }

  public syncClanNpcs(members: ClanMemberState[]): void {
    for (const m of members) {
      const npc = this.clanNpcs.find((c) => c.id === m.id);
      if (!npc) continue;
      const justInvited = !npc.invited && m.invited;
      npc.rescued = m.rescued;
      npc.invited = m.invited;
      npc.role = m.role;
      setClanNpcVisualState(npc.group, npc.rescued, npc.invited, npc.role);
      if (justInvited) {
        const by = groundHeightAt(npc.baseX, npc.baseZ, 'templo');
        npc.group.position.set(npc.baseX, by, npc.baseZ);
        npc.group.rotation.y = npc.baseRotY;
        this.particles.emitBurst('shrine', npc.baseX, by + 1.5, npc.baseZ, 20);
      }
    }
    this.pushMinimapSnapshot();
  }

  public applyPlayerStatus(
    id: PlayerStatusEffectId,
    duration: number,
    damagePerSec = 0,
    sourceName?: string
  ): void {
    if (this.callbacks.isDebuffImmune?.()) {
      this.callbacks.onLog('La Panacea del Velo bloquea el efecto de estado negativo.', 'heal');
      return;
    }
    const raceId = this.callbacks.getRaceId?.() ?? 'humano';
    const effDuration = raceId === 'enano' ? Math.max(1.2, duration * 0.5) : duration;

    if (id === 'poison') {
      const wasActive = this.playerStatuses.poison.remaining > 0;
      this.playerStatuses.poison.remaining = Math.max(this.playerStatuses.poison.remaining, effDuration);
      this.playerStatuses.poison.duration = Math.max(this.playerStatuses.poison.duration, effDuration);
      this.playerStatuses.poison.damage = Math.max(
        wasActive ? this.playerStatuses.poison.damage : 0,
        damagePerSec || 3
      );
      if (!wasActive) {
        this.playerStatuses.poison.tickTimer = 1.0;
        this.callbacks.onLog(
          `¡Envenenado${sourceName ? ` por ${sourceName}` : ''}! (-${this.playerStatuses.poison.damage} HP/s)`,
          'study'
        );
      }
    } else if (id === 'burn') {
      const wasActive = this.playerStatuses.burn.remaining > 0;
      this.playerStatuses.burn.remaining = Math.max(this.playerStatuses.burn.remaining, effDuration);
      this.playerStatuses.burn.duration = Math.max(this.playerStatuses.burn.duration, effDuration);
      this.playerStatuses.burn.damage = Math.max(
        wasActive ? this.playerStatuses.burn.damage : 0,
        damagePerSec || 4
      );
      if (!wasActive) {
        this.playerStatuses.burn.tickTimer = 1.0;
        this.callbacks.onLog(
          `¡Quemadura activa${sourceName ? ` por ${sourceName}` : ''}! (-${this.playerStatuses.burn.damage} HP/s)`,
          'damage'
        );
      }
    } else if (id === 'slow') {
      const wasActive = this.playerStatuses.slow.remaining > 0;
      this.playerStatuses.slow.remaining = Math.max(this.playerStatuses.slow.remaining, effDuration);
      this.playerStatuses.slow.duration = Math.max(this.playerStatuses.slow.duration, effDuration);
      if (!wasActive) {
        this.callbacks.onLog(
          `¡Ralentizado${sourceName ? ` por ${sourceName}` : ''}! (-35% velocidad)`,
          'info'
        );
      }
    }
    this.emitPlayerStatuses();
  }

  private maybeApplyMonsterStatusToPlayer(speciesId: MonsterSpeciesId, sourceName: string): void {
    if (speciesId === 'goblin_merodeador') {
      if (Math.random() < 0.42) {
        this.applyPlayerStatus('poison', 6.0, 3, sourceName);
      }
    } else if (speciesId === 'esqueleto_centinela') {
      if (Math.random() < 0.42) {
        this.applyPlayerStatus('slow', 4.5, 0, sourceName);
      }
    } else if (speciesId === 'espectro_velo') {
      if (Math.random() < 0.5) {
        this.applyPlayerStatus('slow', 5.0, 0, sourceName);
      }
      if (Math.random() < 0.35) {
        this.applyPlayerStatus('poison', 5.0, 3, sourceName);
      }
    } else if (speciesId === 'golem_obsidiana') {
      if (Math.random() < 0.45) {
        this.applyPlayerStatus('slow', 4.0, 0, sourceName);
      }
      if (Math.random() < 0.35) {
        this.applyPlayerStatus('burn', 4.5, 4, sourceName);
      }
    } else if (speciesId === 'wyvern_ceniza') {
      if (Math.random() < 0.65) {
        this.applyPlayerStatus('burn', 5.5, 5, sourceName);
      }
      if (Math.random() < 0.3) {
        this.applyPlayerStatus('slow', 3.5, 0, sourceName);
      }
    } else if (speciesId === 'dragon_rojo_ardiente') {
      if (Math.random() < 0.75) {
        this.applyPlayerStatus('burn', 6.0, 7, sourceName);
      }
    } else if (speciesId === 'dragon_negro_oscuro') {
      if (Math.random() < 0.65) {
        this.applyPlayerStatus('burn', 5.5, 6, sourceName);
      }
      if (Math.random() < 0.55) {
        this.applyPlayerStatus('poison', 6.0, 5, sourceName);
      }
    } else if (speciesId === 'dragon_verde_espiritual') {
      if (Math.random() < 0.75) {
        this.applyPlayerStatus('poison', 6.5, 6, sourceName);
      }
      if (Math.random() < 0.5) {
        this.applyPlayerStatus('slow', 4.5, 0, sourceName);
      }
    } else if (speciesId === 'dragon_celeste_hielo') {
      if (Math.random() < 0.8) {
        this.applyPlayerStatus('slow', 6.0, 0, sourceName);
      }
    } else if (speciesId === 'dragon_amarillo_divino') {
      if (Math.random() < 0.75) {
        this.applyPlayerStatus('burn', 6.0, 8, sourceName);
      }
      if (Math.random() < 0.4) {
        this.applyPlayerStatus('slow', 4.0, 0, sourceName);
      }
    }
  }

  private updatePlayerStatuses(dt: number): void {
    const p = this.playerStatuses;
    const hadAny = p.poison.remaining > 0 || p.burn.remaining > 0 || p.slow.remaining > 0;
    if (!hadAny) return;

    let expired = false;

    if (p.poison.remaining > 0) {
      p.poison.remaining = Math.max(0, p.poison.remaining - dt);
      p.poison.tickTimer -= dt;
      if (p.poison.tickTimer <= 0 && p.poison.remaining > 0) {
        p.poison.tickTimer = 1.0;
        this.callbacks.onPlayerDamaged(p.poison.damage, 'Veneno', false);
        this.callbacks.onFloatingDamage({
          id: `p-dot-poison-${Date.now()}-${Math.random()}`,
          value: `-${p.poison.damage} Veneno`,
          isCrit: false,
          statusTone: 'poison',
          screenX: window.innerWidth * 0.44,
          screenY: window.innerHeight * 0.65,
        });
      }
      if (p.poison.remaining <= 0) {
        p.poison.duration = 6;
        expired = true;
      }
    }

    if (p.burn.remaining > 0) {
      p.burn.remaining = Math.max(0, p.burn.remaining - dt);
      p.burn.tickTimer -= dt;
      if (p.burn.tickTimer <= 0 && p.burn.remaining > 0) {
        p.burn.tickTimer = 1.0;
        this.callbacks.onPlayerDamaged(p.burn.damage, 'Quemadura', false);
        this.callbacks.onFloatingDamage({
          id: `p-dot-burn-${Date.now()}-${Math.random()}`,
          value: `-${p.burn.damage} Quemadura`,
          isCrit: false,
          statusTone: 'burn',
          screenX: window.innerWidth * 0.56,
          screenY: window.innerHeight * 0.65,
        });
      }
      if (p.burn.remaining <= 0) {
        p.burn.duration = 5;
        expired = true;
      }
    }

    if (p.slow.remaining > 0) {
      p.slow.remaining = Math.max(0, p.slow.remaining - dt);
      if (p.slow.remaining <= 0) {
        p.slow.duration = 4.5;
        expired = true;
      }
    }

    this.statusSyncTimer += dt;
    if (expired || this.statusSyncTimer >= 0.1) {
      this.statusSyncTimer = 0;
      this.emitPlayerStatuses();
    }
  }

  private emitPlayerStatuses(): void {
    const active: PlayerStatusEffect[] = [];
    const p = this.playerStatuses;
    if (p.poison.remaining > 0) {
      active.push({
        id: 'poison',
        label: 'Veneno',
        remaining: p.poison.remaining,
        duration: p.poison.duration,
        effectText: `Veneno: -${p.poison.damage} HP/s`,
      });
    }
    if (p.burn.remaining > 0) {
      active.push({
        id: 'burn',
        label: 'Quemadura',
        remaining: p.burn.remaining,
        duration: p.burn.duration,
        effectText: `Quemadura: -${p.burn.damage} HP/s`,
      });
    }
    if (p.slow.remaining > 0) {
      active.push({
        id: 'slow',
        label: 'Lento',
        remaining: p.slow.remaining,
        duration: p.slow.duration,
        effectText: 'Ralentización: -35% velocidad de movimiento',
      });
    }
    this.callbacks.onPlayerStatusesChange?.(active);
  }

  private applyStatusTickDamage(
    m: ActiveMonster,
    dmg: number,
    status: 'burn' | 'poison'
  ): void {
    m.hp = Math.max(0, m.hp - dmg);
    m.hitFlashTimer = 0.1;
    this.particles.emitBurst(status, m.group.position.x, m.group.position.y + 1.2, m.group.position.z, 9);

    _projVec.copy(m.group.position);
    _projVec.y += status === 'burn' ? 2.05 : 1.75;
    _projVec.project(this.camera);
    if (_projVec.z < 1) {
      const sx = ((_projVec.x + 1) / 2) * window.innerWidth;
      const sy = ((-_projVec.y + 1) / 2) * window.innerHeight;
      this.callbacks.onFloatingDamage({
        id: `dot-${status}-${Date.now()}-${Math.random()}`,
        value: status === 'burn' ? `-${dmg} Quemadura` : `-${dmg} Veneno`,
        isCrit: false,
        statusTone: status,
        screenX: sx,
        screenY: sy,
      });
    }

    if (m.hp <= 0) {
      this.handleMonsterDeath(m);
    }
  }

  public dispose(): void {
    this.destroyed = true;
    this.pendingSnapshots = [];
    this.snapshotCtx = null;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.cleanupListeners();
    for (const rp of this.remotePlayers.values()) {
      const tex = rp.group.userData.plateTexture as THREE.Texture | undefined;
      tex?.dispose();
    }
    this.remotePlayers.clear();
    this.chunkManager?.dispose();
    this.particles.dispose();
    this.weatherParticles.dispose();
    this.composer?.dispose();

    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

const _tmpV = new THREE.Vector3();
function _vec3Temp(x: number, y: number, z: number): THREE.Vector3 {
  return _tmpV.set(x, y, z);
}
function plinthAlign(_mesh: THREE.Mesh, _x: number, _z: number): void {
  // helper kept tidy
}
