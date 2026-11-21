export type Rarity = 'comun' | 'poco_comun' | 'raro' | 'epico' | 'legendario';

export type EquipmentSlot =
  | 'arma'
  | 'escudo'
  | 'yelmo'
  | 'armadura'
  | 'amuleto'
  | 'runa_extra'
  | 'montura';

export type ItemCategory =
  | 'arma'
  | 'escudo'
  | 'armadura'
  | 'accesorio'
  | 'montura'
  | 'consumible'
  | 'material'
  | 'reliquia';

export type InventoryMode = 'mochila' | 'tienda' | 'crafteo';

export type CraftingCategory = 'Alquimia' | 'Forja y Mejora';

export interface CraftingIngredientRequirement {
  itemId: string;
  quantity: number;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  category: CraftingCategory;
  description: string;
  resultItemId: string;
  resultQuantity: number;
  ingredients: CraftingIngredientRequirement[];
  goldCost?: number;
  acceptsEquippedWeapon?: boolean;
}

export interface ItemBonuses {
  danoMin?: number;
  danoMax?: number;
  defensa?: number;
  fuerza?: number;
  agilidad?: number;
  inteligencia?: number;
  vitalidad?: number;
  probCritico?: number; // percentage points, e.g. 5 = +5%
  danoCritico?: number; // percentage points, e.g. 25 = +25%
  regenHp?: number; // HP per second
  regenMana?: number; // Mana per second
  maxHp?: number;
  maxMana?: number;
  velocidadMovimiento?: number; // m/s bonus from mounts or gear
}

export interface MountVisualSpec {
  bodyHex: number;
  accentHex: number;
  crestHex: number;
  creatureType: string;
}

export type AlchemyBuffId =
  | 'furia_solar'
  | 'piel_basaltica'
  | 'paso_etereo'
  | 'lucidez_arcana'
  | 'sangre_inmortal'
  | 'panacea_lunar';

export type AlchemyBuffTone = 'amber' | 'emerald' | 'sky' | 'violet' | 'rose';

export interface AlchemyBuffEffect {
  id: AlchemyBuffId;
  name: string;
  durationSec: number;
  tone: AlchemyBuffTone;
  summary: string;
  bonuses?: ItemBonuses;
  cleanseDebuffs?: boolean;
  immuneToDebuffs?: boolean;
}

export interface ActiveAlchemyBuff {
  id: AlchemyBuffId;
  name: string;
  remaining: number;
  duration: number;
  tone: AlchemyBuffTone;
  summary: string;
  bonuses?: ItemBonuses;
  immuneToDebuffs?: boolean;
}

export interface AlchemyFormula {
  id: string;
  name: string;
  resultItemId: string;
  resultQuantity: number;
  category: 'Combate' | 'Defensa' | 'Movilidad' | 'Arcano' | 'Inmunidad';
  description: string;
  ingredients: CraftingIngredientRequirement[];
}

export interface GameItem {
  id: string;
  name: string;
  category: ItemCategory;
  slot?: EquipmentSlot;
  rarity: Rarity;
  description: string;
  valueGold: number;
  bonuses?: ItemBonuses;
  mountVisual?: MountVisualSpec;
  healHp?: number;
  restoreMana?: number;
  buffEffect?: AlchemyBuffEffect;
  studySpeciesId?: MonsterSpeciesId;
  studyPoints?: number;
  stackable?: boolean;
}

export interface InventoryEntry {
  uid: string;
  itemId: string;
  quantity: number;
}

export interface BaseAttributes {
  fuerza: number;
  agilidad: number;
  vitalidad: number;
  inteligencia: number;
  suerte: number;
}

export interface ComputedStats {
  danoMin: number;
  danoMax: number;
  defensa: number;
  fuerzaTotal: number;
  agilidadTotal: number;
  probCritico: number;
  danoCritico: number;
  regenHp: number;
  regenMana: number;
  velocidadMovimiento: number;
  velocidadAtaque: number;
  maxHp: number;
  maxMana: number;
}

export type MonsterSpeciesId =
  | 'goblin_merodeador'
  | 'esqueleto_centinela'
  | 'espectro_velo'
  | 'golem_obsidiana'
  | 'wyvern_ceniza'
  | 'dragon_rojo_ardiente'
  | 'dragon_negro_oscuro'
  | 'dragon_verde_espiritual'
  | 'dragon_celeste_hielo'
  | 'dragon_amarillo_divino';

export type MonsterSchedule = 'diurno' | 'nocturno' | 'siempre';

export type StudyTier = 0 | 1 | 2 | 3; // 0=Desconocido, 1=Avistado, 2=Analizado, 3=Dominado

export interface MonsterSpecies {
  id: MonsterSpeciesId;
  name: string;
  title: string;
  category: string;
  dangerLevel: number; // 1 to 5
  habitat: string;
  description: string;
  combatBehavior: string;
  weaknesses: string[];
  resistances: string[];
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  xpReward: number;
  goldReward: [number, number];
  aggroRadius: number;
  attackRange: number;
  moveSpeed: number;
  attackCooldown: number;
  colorHex: string;
  dropTable: { itemId: string; chance: number }[];
  studyMasteryBonus: string;
}

export interface BestiaryProgressEntry {
  speciesId: MonsterSpeciesId;
  sighted: boolean;
  kills: number;
  studyPoints: number; // 0..100
}

export type QuestStatus = 'disponible' | 'activa' | 'lista_recompensa' | 'completada';

export interface QuestObjective {
  id: string;
  description: string;
  type: 'kill' | 'study' | 'collect' | 'visit';
  targetId: string;
  required: number;
  current: number;
}

export interface Quest {
  id: string;
  title: string;
  giver: string;
  zone: string;
  description: string;
  loreNote: string;
  status: QuestStatus;
  objectives: QuestObjective[];
  rewards: {
    xp: number;
    gold: number;
    itemId?: string;
  };
}

export type LoreCategory = 'Historia del Bastión' | 'Crónicas de Zona' | 'Reliquias Escritas';

export interface LoreEntryDefinition {
  id: string;
  title: string;
  chapter: LoreCategory;
  zone: string;
  sourceType: 'object' | 'area';
  sourceLabel: string;
  discoveryHint: string;
  excerpt: string;
  body: string[];
  xpReward: number;
}

export type JournalPoiCategory = 'Zona' | 'Santuario' | 'Reliquia';

export interface JournalPoiDefinition {
  id: string;
  title: string;
  category: JournalPoiCategory;
  zoneName: string;
  x: number;
  z: number;
  discoveryHint: string;
  fieldNote: string;
}

export interface TravelerJournalEntry {
  poiId: string;
  title: string;
  category: JournalPoiCategory;
  zoneName: string;
  x: number;
  z: number;
  weather: WeatherType;
  capturedAt: number;
  imageDataUrl: string;
  fieldNote: string;
}

export type ActiveModal =
  | null
  | 'inventario'
  | 'personaje'
  | 'misiones'
  | 'bestiario'
  | 'clan'
  | 'alquimia'
  | 'modulos'
  | 'logros'
  | 'dialogo'
  | 'cuenta'
  | 'top'
  | 'renacimiento';

export type ClanRole = 'ninguno' | 'guardia' | 'alquimista' | 'historiador';

export interface ClanNpcDefinition {
  id: string;
  name: string;
  title: string;
  preferredRole: Exclude<ClanRole, 'ninguno'>;
  rescueZone: string;
  rescueCoords: { x: number; z: number };
  baseCoords: { x: number; z: number; rotY: number };
  rescueDialog: string;
  specialtyNote: string;
  cloakHex: number;
  accentHex: number;
}

export interface ClanMemberState {
  id: string;
  rescued: boolean;
  invited: boolean;
  role: ClanRole;
}

export interface ClanComputedBonuses {
  statBonuses: ItemBonuses;
  goldPerCycle: number;
  xpPerCycle: number;
  studyPointsPerCycle: number;
  herbsPerCycle: number;
  alchemyDurationMult: number;
  activeGuards: number;
  activeAlchemists: number;
  activeHistorians: number;
}

export type WeatherType =
  | 'despejado'
  | 'lluvia'
  | 'nieve'
  | 'tormenta_ceniza'
  | 'neblina'
  | 'atardecer';

export type DayPhase = 'amanecer' | 'dia' | 'ocaso' | 'noche';

export interface DayTimeSnapshot {
  dayNumber: number;
  hour: number;
  formattedTime: string;
  phase: DayPhase;
  phaseLabel: string;
  isNight: boolean;
  visibilityMeters: number;
}

export type MarketTrend = 'escasez' | 'alza' | 'estable' | 'descuento';

export interface MarketItemQuote {
  itemId: string;
  buyPrice: number;
  sellPrice: number;
  baseBuyPrice: number;
  baseSellPrice: number;
  buyDeltaPct: number;
  sellDeltaPct: number;
  stock: number;
  maxStock: number;
  trend: MarketTrend;
  reasons: string[];
}

export interface MarketState {
  dayNumber: number;
  headline: string;
  scarceCategories: ItemCategory[];
  surplusCategories: ItemCategory[];
  stockByItemId: Record<string, number>;
  dailyFactorByCategory: Record<ItemCategory, number>;
}

export type NpcId = 'npc_valen' | 'npc_kael';

export type DialogueAction =
  | 'open_quests'
  | 'open_shop'
  | 'open_bestiary'
  | 'night_blessing'
  | 'close';

export interface DialogueChoice {
  id: string;
  text: string;
  nextNodeId?: string;
  action?: DialogueAction;
  grantRewardId?: string;
  unlockQuestId?: string;
  hideIfRewardClaimed?: string;
  hideIfQuestUnlocked?: string;
  onlyAtNight?: boolean;
  onlyAtDay?: boolean;
  hintLabel?: string;
}

export interface DialogueNode {
  id: string;
  npcId: NpcId;
  speakerName: string;
  speakerTitle: string;
  text: string;
  choices: DialogueChoice[];
}

export interface DialogueReward {
  gold?: number;
  xp?: number;
  itemId?: string;
  logText: string;
}

export type TalentBranchId = 'fisico' | 'magico' | 'supervivencia';

export interface TalentNode {
  id: string;
  branch: TalentBranchId;
  tier: 1 | 2 | 3;
  name: string;
  description: string;
  effectSummary: string;
  maxRank: number;
  requiresTalentId?: string;
  bonusesPerRank: ItemBonuses;
}

export type AchievementCategory =
  | 'Combate'
  | 'Progresión'
  | 'Bestiario'
  | 'Exploración'
  | 'Economía';

export interface AchievementMetrics {
  level: number;
  totalKills: number;
  wyvernKills: number;
  bestiaryCompletionPct: number;
  sightedSpeciesCount: number;
  chestsOpened: number;
  tradesCompleted: number;
  questsCompleted: number;
  discoveredShrinesCount: number;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  target: number;
  unitLabel: string;
  rewardGold?: number;
  rewardXp?: number;
  getCurrent: (metrics: AchievementMetrics) => number;
}

export interface AchievementToast {
  id: string;
  achievementId: string;
  title: string;
  description: string;
  category: AchievementCategory;
  rewardGold?: number;
  rewardXp?: number;
}

export type TitleSourceType = 'inicial' | 'logro' | 'mision';

export interface PlayerTitleDefinition {
  id: string;
  name: string;
  sourceType: TitleSourceType;
  sourceLabel: string;
  requirementText: string;
  description: string;
  colorClass: string;
  requiredAchievementId?: string;
  requiredQuestId?: string;
}

export type PlayerStatusEffectId = 'poison' | 'burn' | 'slow';

export interface PlayerStatusEffect {
  id: PlayerStatusEffectId;
  label: string;
  remaining: number;
  duration: number;
  effectText: string;
}

export interface CombatLogMessage {
  id: string;
  text: string;
  tone: 'info' | 'damage' | 'crit' | 'heal' | 'loot' | 'quest' | 'study';
  timestamp: number;
}

export interface FloatingDamage {
  id: string;
  value: string;
  isCrit: boolean;
  isHeal?: boolean;
  statusTone?: 'burn' | 'poison';
  screenX: number;
  screenY: number;
}

export type WorldMapId = 'plaza' | 'templo';

export type ChatChannel = 'global' | 'clan';

export interface ClanPreset {
  id: string;
  name: string;
  tag: string;
  colorHex: string;
  motto: string;
}

export interface OnlinePlayerState {
  uid: string;
  playerName: string;
  clanName: string;
  clanTag: string;
  clanColor: string;
  raceId: RaceId;
  classId: ClassId;
  level: number;
  rebirths: number;
  titleName?: string;
  mapId: WorldMapId;
  x: number;
  z: number;
  yaw: number;
  isMoving: boolean;
  isOnline: boolean;
  updatedAtMs?: number;
}

export interface ChatMessage {
  id: string;
  uid: string;
  playerName: string;
  clanName: string;
  clanTag: string;
  clanColor: string;
  channel: ChatChannel;
  mapId: WorldMapId;
  text: string;
  createdAtMs?: number;
}

export interface TargetInfo {
  type:
    | 'monster'
    | 'chest'
    | 'door'
    | 'shrine'
    | 'npc'
    | 'lore'
    | 'clan_npc'
    | 'herb'
    | 'portal'
    | 'remote_player';
  id: string;
  name: string;
  subtitle: string;
  hp?: number;
  maxHp?: number;
  level?: number;
  isElite?: boolean;
  speciesId?: MonsterSpeciesId;
  canInteract: boolean;
  interactLabel: string;
}

export interface FastTravelShrineInfo {
  id: string;
  name: string;
  zoneName: string;
  x: number;
  z: number;
  discovered: boolean;
}

export interface MinimapEntity {
  id: string;
  x: number;
  z: number;
  kind:
    | 'monster'
    | 'boss'
    | 'chest'
    | 'door'
    | 'shrine'
    | 'npc'
    | 'lore'
    | 'clan_npc'
    | 'herb'
    | 'portal'
    | 'remote_player';
  label?: string;
  discovered?: boolean;
  colorHex?: string;
}

export interface MinimapSnapshot {
  mapId: WorldMapId;
  isSafeZone: boolean;
  playerX: number;
  playerZ: number;
  playerYaw: number;
  worldRadius: number;
  zoneName: string;
  pillars: { x: number; z: number; r: number }[];
  entities: MinimapEntity[];
  shrines: FastTravelShrineInfo[];
}

export interface ExtensionModuleSlot {
  id: string;
  name: string;
  category: 'Combate' | 'Progresión' | 'Mundo' | 'Economía' | 'Magia';
  status: 'disponible' | 'activo_demo' | 'reservado';
  description: string;
  hookPoint: string;
  enabled: boolean;
}

export interface SkillSlot {
  slotIndex: number; // 1..6
  id: string;
  name: string;
  keyLabel: string;
  manaCost: number;
  cooldown: number;
  remainingCooldown: number;
  isReservedSlot?: boolean;
  sourceLabel?: string;
  description: string;
}

export type DifficultyId = 'normal' | 'dificil' | 'pesadilla' | 'abismal' | 'infierno';

export interface DifficultyDefinition {
  id: DifficultyId;
  name: string;
  subtitle: string;
  description: string;
  hpMult: number;
  atkMult: number;
  speedMult: number;
  xpMult: number;
  goldMult: number;
  heartDropBonus: number;
  colorClass: string;
  badgeClass: string;
}

export type RaceId = 'humano' | 'elfo' | 'enano' | 'draconido' | 'espectro_raza';

export type ClassId =
  | 'caballero_runico'
  | 'piromago'
  | 'asesino_sombras'
  | 'paladin_solar'
  | 'cazador_dragones';

export interface ActiveAbilitySpec {
  id: string;
  name: string;
  manaCost: number;
  cooldown: number;
  description: string;
}

export interface RaceDefinition {
  id: RaceId;
  name: string;
  tagline: string;
  colorClass: string;
  passiveTitle: string;
  passiveDescription: string;
  passiveBonuses: ItemBonuses;
  uniqueTitle: string;
  uniqueDescription: string;
  activeSkill: ActiveAbilitySpec;
}

export interface ClassDefinition {
  id: ClassId;
  name: string;
  tagline: string;
  colorClass: string;
  passiveTitle: string;
  passiveDescription: string;
  passiveBonuses: ItemBonuses;
  uniqueTitle: string;
  uniqueDescription: string;
  activeSkill: ActiveAbilitySpec;
}

export type DragonHeartId =
  | 'corazon_dragon_rojo'
  | 'corazon_dragon_negro'
  | 'corazon_dragon_verde'
  | 'corazon_dragon_celeste'
  | 'corazon_dragon_amarillo';

export type LeaderboardMetric = 'gold' | 'kills' | 'level' | 'rebirths';

export interface LeaderboardEntry {
  uid: string;
  playerName: string;
  clanName?: string;
  clanTag?: string;
  clanColor?: string;
  titleName?: string;
  raceId: RaceId;
  classId: ClassId;
  difficultyId: DifficultyId;
  gold: number;
  kills: number;
  level: number;
  rebirths: number;
  updatedAtMs?: number;
}

export interface CloudPlayerProfile {
  uid: string;
  playerName: string;
  clanName?: string;
  clanTag?: string;
  clanColor?: string;
  raceId: RaceId;
  classId: ClassId;
  difficultyId: DifficultyId;
  selectedTitleId?: string;
  level: number;
  xp: number;
  gold: number;
  kills: number;
  rebirths: number;
  attributePoints: number;
  talentPoints: number;
  attributes: BaseAttributes;
  dragonHearts: Record<DragonHeartId, number>;
}

export interface WorldScalingProfile {
  playerLevel: number;
  rebirths: number;
  difficultyId: DifficultyId;
  hpMult: number;
  atkMult: number;
  defMult: number;
  speedMult: number;
  aggroMult: number;
  attackCooldownMult: number;
  xpMult: number;
  goldMult: number;
  respawnTimeMult: number;
  encounterIntervalSec: number;
  maxDynamicEncounters: number;
  eliteChance: number;
  threatRating: number;
  threatLabel: string;
}

