import {
  AchievementDefinition,
  ActiveAlchemyBuff,
  AlchemyFormula,
  BaseAttributes,
  BestiaryProgressEntry,
  ClanComputedBonuses,
  ClanMemberState,
  ClanNpcDefinition,
  ClanPreset,
  ClanRole,
  ClassDefinition,
  ClassId,
  ComputedStats,
  CraftingRecipe,
  DayPhase,
  DialogueNode,
  DialogueReward,
  DifficultyDefinition,
  DifficultyId,
  DragonHeartId,
  EquipmentSlot,
  ExtensionModuleSlot,
  GameItem,
  InventoryEntry,
  ItemBonuses,
  ItemCategory,
  JournalPoiDefinition,
  LoreEntryDefinition,
  MarketItemQuote,
  MarketState,
  MarketTrend,
  MonsterSpecies,
  MonsterSpeciesId,
  NpcId,
  PlayerTitleDefinition,
  Quest,
  RaceDefinition,
  RaceId,
  Rarity,
  SkillSlot,
  TalentBranchId,
  TalentNode,
  WeatherType,
  WorldScalingProfile,
} from './types';

export const MAX_LEVEL = 9999;
export const REBIRTH_DAMAGE_FACTOR = 1.5;

export function getXpForNextLevel(level: number): number {
  const clamped = Math.max(1, Math.min(MAX_LEVEL, level));
  return Math.round(
    clamped * 100 + (clamped - 1) * 45 + Math.pow(Math.max(0, clamped - 20), 1.32) * 16
  );
}

export function getRebirthDamageMultiplier(rebirths: number): number {
  return Number(Math.pow(REBIRTH_DAMAGE_FACTOR, Math.max(0, rebirths)).toFixed(2));
}

export function getRebirthRequiredLevel(rebirths: number): number {
  return Math.min(MAX_LEVEL, 15 + Math.max(0, rebirths) * 10);
}

export const RARITY_COLORS: Record<Rarity, { text: string; border: string; bg: string; label: string }> = {
  comun: {
    text: 'text-stone-300',
    border: 'border-stone-600/60',
    bg: 'bg-stone-900/70',
    label: 'Común',
  },
  poco_comun: {
    text: 'text-emerald-300',
    border: 'border-emerald-600/60',
    bg: 'bg-emerald-950/40',
    label: 'Poco común',
  },
  raro: {
    text: 'text-sky-300',
    border: 'border-sky-500/60',
    bg: 'bg-sky-950/40',
    label: 'Raro',
  },
  epico: {
    text: 'text-amber-300',
    border: 'border-amber-500/70',
    bg: 'bg-amber-950/40',
    label: 'Épico',
  },
  legendario: {
    text: 'text-rose-300',
    border: 'border-rose-500/80',
    bg: 'bg-rose-950/45',
    label: 'Legendario',
  },
};

export const ITEMS_CATALOG: Record<string, GameItem> = {
  espada_hierro: {
    id: 'espada_hierro',
    name: 'Espada de Guardia',
    category: 'arma',
    slot: 'arma',
    rarity: 'comun',
    description: 'Hoja equilibrada de acero templado usada por los exploradores del Bastión.',
    valueGold: 25,
    bonuses: { danoMin: 7, danoMax: 12, fuerza: 2 },
  },
  hoja_alba: {
    id: 'hoja_alba',
    name: 'Hoja Rúnica del Alba',
    category: 'arma',
    slot: 'arma',
    rarity: 'raro',
    description: 'Grabada con runas solares; aumenta la probabilidad de golpe crítico.',
    valueGold: 110,
    bonuses: { danoMin: 14, danoMax: 22, fuerza: 4, probCritico: 8, danoCritico: 20 },
  },
  hacha_obsidiana: {
    id: 'hacha_obsidiana',
    name: 'Segadora de Obsidiana',
    category: 'arma',
    slot: 'arma',
    rarity: 'epico',
    description: 'Forjada en el Cráter Basáltico. Golpes devastadores con alto multiplicador crítico.',
    valueGold: 260,
    bonuses: { danoMin: 22, danoMax: 34, fuerza: 8, probCritico: 12, danoCritico: 40 },
  },
  mandoble_ceniza: {
    id: 'mandoble_ceniza',
    name: 'Mandoble del Wyvern',
    category: 'arma',
    slot: 'arma',
    rarity: 'legendario',
    description: 'Arma ancestral imbuida con brasas eternas del Altar del Dragón.',
    valueGold: 520,
    bonuses: {
      danoMin: 30,
      danoMax: 46,
      fuerza: 12,
      agilidad: 4,
      probCritico: 16,
      danoCritico: 55,
      regenMana: 1.5,
    },
  },
  espada_templada: {
    id: 'espada_templada',
    name: 'Espada de Guardia Templada',
    category: 'arma',
    slot: 'arma',
    rarity: 'poco_comun',
    description: 'Espada de Guardia reforzada con cuero curtido y una runa menor de filo.',
    valueGold: 68,
    bonuses: { danoMin: 12, danoMax: 18, fuerza: 4, probCritico: 4 },
  },
  hoja_alba_ascendida: {
    id: 'hoja_alba_ascendida',
    name: 'Hoja Solar Ascendida',
    category: 'arma',
    slot: 'arma',
    rarity: 'epico',
    description: 'Versión perfeccionada en forja rúnica; irradia calor solar con golpes críticos letales.',
    valueGold: 215,
    bonuses: {
      danoMin: 20,
      danoMax: 30,
      fuerza: 6,
      agilidad: 3,
      probCritico: 12,
      danoCritico: 32,
    },
  },
  segadora_runica: {
    id: 'segadora_runica',
    name: 'Segadora Rúnica de Obsidiana',
    category: 'arma',
    slot: 'arma',
    rarity: 'legendario',
    description: 'Hacha volcánica mejorada con runas ígneas del Cráter y empuñadura de bestia.',
    valueGold: 440,
    bonuses: {
      danoMin: 28,
      danoMax: 42,
      fuerza: 10,
      probCritico: 15,
      danoCritico: 50,
      regenMana: 1.0,
    },
  },
  escudo_roble: {
    id: 'escudo_roble',
    name: 'Escudo de Roble Reforzado',
    category: 'escudo',
    slot: 'escudo',
    rarity: 'comun',
    description: 'Madera curtida con remaches de hierro para absorber golpes frontales.',
    valueGold: 20,
    bonuses: { defensa: 5, vitalidad: 2 },
  },
  egida_centinela: {
    id: 'egida_centinela',
    name: 'Égida del Centinela',
    category: 'escudo',
    slot: 'escudo',
    rarity: 'raro',
    description: 'Escudo antiguo que acelera la recuperación vital en combate.',
    valueGold: 120,
    bonuses: { defensa: 12, vitalidad: 5, regenHp: 1.4, maxHp: 25 },
  },
  yelmo_explorador: {
    id: 'yelmo_explorador',
    name: 'Yelmo de Cuero y Bronce',
    category: 'armadura',
    slot: 'yelmo',
    rarity: 'poco_comun',
    description: 'Protege sin obstruir la visión ni la agilidad del portador.',
    valueGold: 45,
    bonuses: { defensa: 4, agilidad: 3, probCritico: 3 },
  },
  coraza_templario: {
    id: 'coraza_templario',
    name: 'Coraza del Velo Antiguo',
    category: 'armadura',
    slot: 'armadura',
    rarity: 'epico',
    description: 'Placas oscuras grabadas con sellos protectores que regeneran vida y maná.',
    valueGold: 210,
    bonuses: { defensa: 16, vitalidad: 6, maxHp: 45, regenHp: 1.8, regenMana: 1.2 },
  },
  capa_sombras: {
    id: 'capa_sombras',
    name: 'Manto del Acechador',
    category: 'armadura',
    slot: 'armadura',
    rarity: 'poco_comun',
    description: 'Armadura ligera que incrementa notablemente la agilidad y la tasa crítica.',
    valueGold: 75,
    bonuses: { defensa: 7, agilidad: 6, probCritico: 6 },
  },
  amuleto_rubi: {
    id: 'amuleto_rubi',
    name: 'Amuleto de Sangre y Maná',
    category: 'accesorio',
    slot: 'amuleto',
    rarity: 'raro',
    description: 'Gema tallada que sincroniza la regeneración física y arcana.',
    valueGold: 135,
    bonuses: { regenHp: 2.2, regenMana: 2.5, inteligencia: 4, maxMana: 30 },
  },
  runa_espacio_demo: {
    id: 'runa_espacio_demo',
    name: 'Sello Rúnico Experimental',
    category: 'accesorio',
    slot: 'runa_extra',
    rarity: 'epico',
    description: 'Reliquia diseñada para la ranura de expansión del personaje.',
    valueGold: 180,
    bonuses: { fuerza: 3, agilidad: 3, probCritico: 5, regenHp: 1, regenMana: 1 },
  },
  montura_corcel: {
    id: 'montura_corcel',
    name: 'Corcel del Bastión',
    category: 'montura',
    slot: 'montura',
    rarity: 'poco_comun',
    description: 'Caballo de guerra entrenado en el Santuario; aporta +2.5 m/s de velocidad de desplazamiento por el valle.',
    valueGold: 95,
    bonuses: { velocidadMovimiento: 2.5, agilidad: 2 },
    mountVisual: {
      bodyHex: 0x5c3d28,
      accentHex: 0xd4a44a,
      crestHex: 0x261a12,
      creatureType: 'Corcel Acorazado',
    },
  },
  montura_lobo_velo: {
    id: 'montura_lobo_velo',
    name: 'Lobo Sombrío del Velo',
    category: 'montura',
    slot: 'montura',
    rarity: 'raro',
    description: 'Bestia lupina domada entre la niebla del oeste. Otorga +3.8 m/s de velocidad y reflejos felinos.',
    valueGold: 220,
    bonuses: { velocidadMovimiento: 3.8, agilidad: 4, probCritico: 3 },
    mountVisual: {
      bodyHex: 0x2d3748,
      accentHex: 0x38bdf8,
      crestHex: 0x161d29,
      creatureType: 'Lobo Espectral',
    },
  },
  montura_draco_ceniza: {
    id: 'montura_draco_ceniza',
    name: 'Dracónido de Ceniza',
    category: 'montura',
    slot: 'montura',
    rarity: 'legendario',
    description: 'Cría acorazada de los Altos Riscos. Proporciona +5.2 m/s de galope ígneo y vigor en combate.',
    valueGold: 460,
    bonuses: { velocidadMovimiento: 5.2, fuerza: 5, agilidad: 6, regenHp: 0.8 },
    mountVisual: {
      bodyHex: 0x4b1d1d,
      accentHex: 0xf97316,
      crestHex: 0x1f0b0b,
      creatureType: 'Dracónido Menor',
    },
  },
  pocion_vida: {
    id: 'pocion_vida',
    name: 'Poción de Vitalidad',
    category: 'consumible',
    rarity: 'comun',
    description: 'Restaura inmediatamente 55 puntos de Salud.',
    valueGold: 15,
    healHp: 55,
    stackable: true,
  },
  elixir_mana: {
    id: 'elixir_mana',
    name: 'Elixir de Éter Azul',
    category: 'consumible',
    rarity: 'poco_comun',
    description: 'Restaura 45 puntos de Maná al instante.',
    valueGold: 20,
    restoreMana: 45,
    stackable: true,
  },
  pocion_gran_vitalidad: {
    id: 'pocion_gran_vitalidad',
    name: 'Poción Superior de Vitalidad',
    category: 'consumible',
    rarity: 'raro',
    description: 'Concentrado alquímico que restaura +120 HP y +20 Maná al instante.',
    valueGold: 42,
    healHp: 120,
    restoreMana: 20,
    stackable: true,
  },
  elixir_supremo_velo: {
    id: 'elixir_supremo_velo',
    name: 'Elixir Dual del Velo',
    category: 'consumible',
    rarity: 'epico',
    description: 'Brebaje maestro destilado con runas ígneas; restaura +85 HP y +85 Maná.',
    valueGold: 65,
    healHp: 85,
    restoreMana: 85,
    stackable: true,
  },
  pocion_furia_solar: {
    id: 'pocion_furia_solar',
    name: 'Tónico de Furia Solar',
    category: 'consumible',
    rarity: 'poco_comun',
    description: 'Poción alquímica prolongada: +6 Daño, +6 Fuerza y +8% Prob. Crítica durante 60s.',
    valueGold: 34,
    buffEffect: {
      id: 'furia_solar',
      name: 'Furia Solar',
      durationSec: 60,
      tone: 'amber',
      summary: '+6 Daño Mín./Máx., +6 Fuerza, +8% Prob. Crítica',
      bonuses: { danoMin: 6, danoMax: 6, fuerza: 6, probCritico: 8 },
    },
    stackable: true,
  },
  pocion_piel_basaltica: {
    id: 'pocion_piel_basaltica',
    name: 'Ungüento de Piel Basáltica',
    category: 'consumible',
    rarity: 'poco_comun',
    description: 'Endurece la piel con extracto mineral: +9 Defensa, +35 Salud Máx. y +2.5 Regen. HP/s durante 75s.',
    valueGold: 38,
    buffEffect: {
      id: 'piel_basaltica',
      name: 'Piel Basáltica',
      durationSec: 75,
      tone: 'emerald',
      summary: '+9 Defensa, +35 Salud Máx., +2.5 Regen. HP/s',
      bonuses: { defensa: 9, maxHp: 35, regenHp: 2.5 },
    },
    stackable: true,
  },
  pocion_paso_etereo: {
    id: 'pocion_paso_etereo',
    name: 'Elixir de Paso Etéreo',
    category: 'consumible',
    rarity: 'raro',
    description: 'Infusión ligera de niebla astral: +2.6 m/s Velocidad, +6 Agilidad y +10% Prob. Crítica durante 65s.',
    valueGold: 48,
    buffEffect: {
      id: 'paso_etereo',
      name: 'Paso Etéreo',
      durationSec: 65,
      tone: 'sky',
      summary: '+2.6 m/s Velocidad, +6 Agilidad, +10% Prob. Crítica',
      bonuses: { velocidadMovimiento: 2.6, agilidad: 6, probCritico: 10 },
    },
    stackable: true,
  },
  pocion_lucidez_arcana: {
    id: 'pocion_lucidez_arcana',
    name: 'Infusión de Lucidez Arcana',
    category: 'consumible',
    rarity: 'raro',
    description: 'Destilado lunario que otorga +4.5 Regen. Maná/s, +40 Maná Máx. y +8 Inteligencia durante 80s.',
    valueGold: 52,
    restoreMana: 25,
    buffEffect: {
      id: 'lucidez_arcana',
      name: 'Lucidez Arcana',
      durationSec: 80,
      tone: 'violet',
      summary: '+4.5 Regen. Maná/s, +40 Maná Máx., +8 Inteligencia',
      bonuses: { regenMana: 4.5, maxMana: 40, inteligencia: 8 },
    },
    stackable: true,
  },
  pocion_sangre_inmortal: {
    id: 'pocion_sangre_inmortal',
    name: 'Brebaje de Sangre Regenerativa',
    category: 'consumible',
    rarity: 'epico',
    description: 'Alquimia volcánica: cura +35 HP al instante y otorga +6 Regen. HP/s, +12 Daño y +25% Daño Crítico durante 90s.',
    valueGold: 82,
    healHp: 35,
    buffEffect: {
      id: 'sangre_inmortal',
      name: 'Sangre Regenerativa',
      durationSec: 90,
      tone: 'rose',
      summary: '+6.0 Regen. HP/s, +12 Daño Mín./Máx., +25% Daño Crítico',
      bonuses: { regenHp: 6.0, danoMin: 12, danoMax: 12, danoCritico: 25 },
    },
    stackable: true,
  },
  pocion_panacea_lunar: {
    id: 'pocion_panacea_lunar',
    name: 'Panacea Nocturna del Velo',
    category: 'consumible',
    rarity: 'epico',
    description: 'Purifica venenos, quemaduras y ralentización al instante e otorga inmunidad a estados alterados + 5 Defensa y +3.5 Regen. HP/s durante 75s.',
    valueGold: 88,
    buffEffect: {
      id: 'panacea_lunar',
      name: 'Inmunidad del Velo',
      durationSec: 75,
      tone: 'emerald',
      summary: 'Inmune a Veneno/Quemadura/Lento · +5 Def · +3.5 HP/s',
      bonuses: { defensa: 5, regenHp: 3.5 },
      cleanseDebuffs: true,
      immuneToDebuffs: true,
    },
    stackable: true,
  },
  hierba_solar: {
    id: 'hierba_solar',
    name: 'Hierba Solar',
    category: 'material',
    rarity: 'comun',
    description: 'Planta medicinal dorada que crece en las ruinas. Ingrediente base para pociones.',
    valueGold: 8,
    stackable: true,
  },
  flor_eterea: {
    id: 'flor_eterea',
    name: 'Flor Etérea',
    category: 'material',
    rarity: 'poco_comun',
    description: 'Planta luminiscente cargada de éter astral. Usada en elixires de maná y celeridad.',
    valueGold: 12,
    stackable: true,
  },
  raiz_lunaria: {
    id: 'raiz_lunaria',
    name: 'Raíz de Loto Lunar',
    category: 'material',
    rarity: 'poco_comun',
    description: 'Hierba nocturna de raíces plateadas que estabiliza efectos alquímicos prolongados.',
    valueGold: 14,
    stackable: true,
  },
  extracto_goblin: {
    id: 'extracto_goblin',
    name: 'Extracto de Savia Silvestre',
    category: 'material',
    rarity: 'poco_comun',
    description: 'Extracto resinado concentrado obtenido en el valle o de Goblins. Catalizador de vigor y fuerza.',
    valueGold: 16,
    stackable: true,
  },
  extracto_espectral: {
    id: 'extracto_espectral',
    name: 'Extracto de Niebla Astral',
    category: 'material',
    rarity: 'raro',
    description: 'Extracto frío destilado de espectros y centinelas. Prolonga el flujo arcano y la velocidad.',
    valueGold: 28,
    stackable: true,
  },
  extracto_ceniza: {
    id: 'extracto_ceniza',
    name: 'Extracto de Rescoldo Basáltico',
    category: 'material',
    rarity: 'epico',
    description: 'Extracto ígneo denso procedente de Gólems y Wyverns. Cataliza fórmulas maestras.',
    valueGold: 48,
    stackable: true,
  },
  piel_curtida: {
    id: 'piel_curtida',
    name: 'Piel de Bestia Curtida',
    category: 'material',
    rarity: 'comun',
    description: 'Cuero resistente ideal para reforzar empuñaduras y equilibrar armas en la forja.',
    valueGold: 14,
    stackable: true,
  },
  runa_menor: {
    id: 'runa_menor',
    name: 'Runa de Filo Menor',
    category: 'material',
    rarity: 'poco_comun',
    description: 'Piedra grabada que canaliza energía para potenciar pociones o templar armas.',
    valueGold: 26,
    stackable: true,
  },
  runa_ignea: {
    id: 'runa_ignea',
    name: 'Runa Ígnea del Cráter',
    category: 'material',
    rarity: 'raro',
    description: 'Runa volcánica de gran pureza utilizada en mejoras épicas y elixires maestros.',
    valueGold: 55,
    stackable: true,
  },
  muestra_goblin: {
    id: 'muestra_goblin',
    name: 'Daga y Diario de Goblin',
    category: 'reliquia',
    rarity: 'poco_comun',
    description: 'Úsalo o analízalo en el Bestiario para sumar +35 pts de estudio sobre Goblins.',
    valueGold: 18,
    studySpeciesId: 'goblin_merodeador',
    studyPoints: 35,
    stackable: true,
  },
  muestra_esqueleto: {
    id: 'muestra_esqueleto',
    name: 'Sello Óseo del Centinela',
    category: 'reliquia',
    rarity: 'raro',
    description: 'Fragmento rúnico que revela los patrones del Esqueleto Centinela (+40 pts de estudio).',
    valueGold: 32,
    studySpeciesId: 'esqueleto_centinela',
    studyPoints: 40,
    stackable: true,
  },
  muestra_espectro: {
    id: 'muestra_espectro',
    name: 'Esencia del Velo Etéreo',
    category: 'reliquia',
    rarity: 'raro',
    description: 'Condensado espectral. Aporta +40 pts de estudio del Espectro del Velo.',
    valueGold: 45,
    studySpeciesId: 'espectro_velo',
    studyPoints: 40,
    stackable: true,
  },
  muestra_golem: {
    id: 'muestra_golem',
    name: 'Núcleo de Obsidiana',
    category: 'reliquia',
    rarity: 'epico',
    description: 'Cristal térmico del Gólem. Aporta +45 pts de estudio en el Bestiario.',
    valueGold: 75,
    studySpeciesId: 'golem_obsidiana',
    studyPoints: 45,
    stackable: true,
  },
  muestra_wyvern: {
    id: 'muestra_wyvern',
    name: 'Escama Ardiente de Wyvern',
    category: 'reliquia',
    rarity: 'legendario',
    description: 'Trofeo del jefe Wyvern de Ceniza (+50 pts de estudio en el Bestiario).',
    valueGold: 140,
    studySpeciesId: 'wyvern_ceniza',
    studyPoints: 50,
    stackable: true,
  },
  corazon_dragon_rojo: {
    id: 'corazon_dragon_rojo',
    name: 'Corazón de Dragón Rojo (Fuego Ardiente)',
    category: 'reliquia',
    rarity: 'legendario',
    description: 'Núcleo ígneo del Dragón Rojo del Páramo de Ceniza. Necesitas 3 corazones de dragón para el Ritual de Renacimiento.',
    valueGold: 380,
    studySpeciesId: 'dragon_rojo_ardiente',
    studyPoints: 50,
    stackable: true,
  },
  corazon_dragon_negro: {
    id: 'corazon_dragon_negro',
    name: 'Corazón de Dragón Negro (Fuego Oscuro)',
    category: 'reliquia',
    rarity: 'legendario',
    description: 'Esencia abismal del Dragón Negro de la Bruma Occidental. Material sagrado para el Ritual de Renacimiento.',
    valueGold: 395,
    studySpeciesId: 'dragon_negro_oscuro',
    studyPoints: 50,
    stackable: true,
  },
  corazon_dragon_verde: {
    id: 'corazon_dragon_verde',
    name: 'Corazón de Dragón Verde (Fuego Espiritual)',
    category: 'reliquia',
    rarity: 'legendario',
    description: 'Gema viva del Dragón Verde del Bosque Susurrante. Material sagrado para el Ritual de Renacimiento.',
    valueGold: 385,
    studySpeciesId: 'dragon_verde_espiritual',
    studyPoints: 50,
    stackable: true,
  },
  corazon_dragon_celeste: {
    id: 'corazon_dragon_celeste',
    name: 'Corazón de Dragón Celeste (Hielo)',
    category: 'reliquia',
    rarity: 'legendario',
    description: 'Cristal glaciar eterno del Dragón Celeste de las Tierras Altas. Material sagrado para el Ritual de Renacimiento.',
    valueGold: 410,
    studySpeciesId: 'dragon_celeste_hielo',
    studyPoints: 50,
    stackable: true,
  },
  corazon_dragon_amarillo: {
    id: 'corazon_dragon_amarillo',
    name: 'Corazón de Dragón Amarillo (Fuego Divino)',
    category: 'reliquia',
    rarity: 'legendario',
    description: 'Reliquia solar del Dragón Amarillo de la Cumbre Celestial. Material sagrado para el Ritual de Renacimiento.',
    valueGold: 450,
    studySpeciesId: 'dragon_amarillo_divino',
    studyPoints: 50,
    stackable: true,
  },
};

export const MONSTER_SPECIES: Record<MonsterSpeciesId, MonsterSpecies> = {
  goblin_merodeador: {
    id: 'goblin_merodeador',
    name: 'Goblin Merodeador',
    title: 'Acechador de Ruinas',
    category: 'Humanoide Menor',
    dangerLevel: 1,
    habitat: 'Ruinas Exteriores y Senderos del Bosque',
    description:
      'Criatura ágil de piel olivácea que merodea entre columnas derrumbadas buscando viajeros descuidados.',
    combatBehavior:
      'Se aproxima en zig-zag y ataca rápidamente con su daga dentada. Baja defensa, pero alta velocidad.',
    weaknesses: ['Daño Físico Cortante', 'Fuego Arcano'],
    resistances: ['Veneno Leve'],
    baseHp: 58,
    baseAtk: 8,
    baseDef: 2,
    xpReward: 32,
    goldReward: [8, 16],
    aggroRadius: 15,
    attackRange: 2.3,
    moveSpeed: 4.5,
    attackCooldown: 1.25,
    colorHex: '#6ea342',
    dropTable: [
      { itemId: 'muestra_goblin', chance: 0.7 },
      { itemId: 'hierba_solar', chance: 0.6 },
      { itemId: 'extracto_goblin', chance: 0.55 },
      { itemId: 'piel_curtida', chance: 0.5 },
      { itemId: 'pocion_vida', chance: 0.45 },
      { itemId: 'yelmo_explorador', chance: 0.2 },
    ],
    studyMasteryBonus: '+12% Daño contra Goblins y +15% probabilidad de botín.',
  },
  esqueleto_centinela: {
    id: 'esqueleto_centinela',
    name: 'Esqueleto Centinela',
    title: 'Guardia No-Muerto del Atrio',
    category: 'No-Muerto',
    dangerLevel: 2,
    habitat: 'Atrio Antiguo y Patios de Piedra',
    description:
      'Antiguos soldados reanimados por ecos del Velo. Conservan su disciplina marcial y escudo oxidado.',
    combatBehavior:
      'Avanza de forma constante y ejecuta estocadas pesadas. Resiste flechas, pero es vulnerable a impactos críticos.',
    weaknesses: ['Golpes Críticos', 'Magia Solar'],
    resistances: ['Hemorragia', 'Frío'],
    baseHp: 95,
    baseAtk: 13,
    baseDef: 5,
    xpReward: 55,
    goldReward: [14, 28],
    aggroRadius: 16,
    attackRange: 2.6,
    moveSpeed: 3.6,
    attackCooldown: 1.45,
    colorHex: '#d4ccb8',
    dropTable: [
      { itemId: 'muestra_esqueleto', chance: 0.72 },
      { itemId: 'flor_eterea', chance: 0.45 },
      { itemId: 'raiz_lunaria', chance: 0.5 },
      { itemId: 'runa_menor', chance: 0.35 },
      { itemId: 'hoja_alba', chance: 0.22 },
      { itemId: 'elixir_mana', chance: 0.4 },
    ],
    studyMasteryBonus: '+12% Daño contra No-Muertos y +2 Defensa pasiva frente a sus ataques.',
  },
  espectro_velo: {
    id: 'espectro_velo',
    name: 'Espectro del Velo',
    title: 'Sombra Susurrante',
    category: 'Entidad Etérea',
    dangerLevel: 3,
    habitat: 'Santuario Sombrío del Oeste',
    description:
      'Manifestación flotante de energía astral condensada. Su máscara cornuda emite un fulgor violeta.',
    combatBehavior:
      'Flota rápidamente hacia su presa y drena energía vital en cortos intervalos. Vulnerable a conjuros directos.',
    weaknesses: ['Bola de Fuego (1)', 'Hojas Rúnicas'],
    resistances: ['Armas Comunes'],
    baseHp: 125,
    baseAtk: 17,
    baseDef: 4,
    xpReward: 82,
    goldReward: [22, 42],
    aggroRadius: 18,
    attackRange: 2.9,
    moveSpeed: 4.9,
    attackCooldown: 1.3,
    colorHex: '#a78bfa',
    dropTable: [
      { itemId: 'muestra_espectro', chance: 0.75 },
      { itemId: 'flor_eterea', chance: 0.6 },
      { itemId: 'extracto_espectral', chance: 0.65 },
      { itemId: 'raiz_lunaria', chance: 0.45 },
      { itemId: 'runa_menor', chance: 0.45 },
      { itemId: 'amuleto_rubi', chance: 0.25 },
      { itemId: 'montura_lobo_velo', chance: 0.28 },
      { itemId: 'elixir_mana', chance: 0.55 },
    ],
    studyMasteryBonus: '+12% Daño contra Espectros y +0.5 Regeneración de Maná permanente.',
  },
  golem_obsidiana: {
    id: 'golem_obsidiana',
    name: 'Gólem de Obsidiana',
    title: 'Coloso del Cráter',
    category: 'Constructo Elemental',
    dangerLevel: 4,
    habitat: 'Cráter Basáltico del Norte',
    description:
      'Monolito viviente unido por runas de magma. Su torso guarda un núcleo incandescente casi impenetrable.',
    combatBehavior:
      'Lento pero implacable. Cada impacto sacude el suelo y causa gran daño físico si no se bloquea o esquiva.',
    weaknesses: ['Golpe Devastador (3)', 'Penetración Crítica'],
    resistances: ['Fuego Superficial', 'Cortes Ligeros'],
    baseHp: 205,
    baseAtk: 24,
    baseDef: 11,
    xpReward: 135,
    goldReward: [40, 75],
    aggroRadius: 15,
    attackRange: 3.1,
    moveSpeed: 2.6,
    attackCooldown: 1.9,
    colorHex: '#f59e0b',
    dropTable: [
      { itemId: 'muestra_golem', chance: 0.8 },
      { itemId: 'extracto_ceniza', chance: 0.65 },
      { itemId: 'runa_ignea', chance: 0.55 },
      { itemId: 'piel_curtida', chance: 0.45 },
      { itemId: 'hacha_obsidiana', chance: 0.28 },
      { itemId: 'coraza_templario', chance: 0.22 },
    ],
    studyMasteryBonus: '+15% Daño contra Constructos e ignora 25% de su Defensa.',
  },
  wyvern_ceniza: {
    id: 'wyvern_ceniza',
    name: 'Wyvern de Ceniza',
    title: 'Señor del Altar Carmesí (Jefe)',
    category: 'Dracónido Mayor',
    dangerLevel: 5,
    habitat: 'Altar del Dragón (Extremo Norte)',
    description:
      'Bestia alada cubierta de escamas carbonizadas y brasas vivas. Custodia los secretos finales del Velo.',
    combatBehavior:
      'Embiste a gran velocidad desde las alturas del altar con garras y aliento ígneo. Requiere equipo sólido y estudio previo.',
    weaknesses: ['Ataques Críticos Concentrados', 'Conjuros Rúnicos'],
    resistances: ['Fuego', 'Aturdimiento'],
    baseHp: 340,
    baseAtk: 31,
    baseDef: 13,
    xpReward: 320,
    goldReward: [110, 180],
    aggroRadius: 21,
    attackRange: 3.6,
    moveSpeed: 4.3,
    attackCooldown: 1.65,
    colorHex: '#ef4444',
    dropTable: [
      { itemId: 'muestra_wyvern', chance: 1.0 },
      { itemId: 'runa_ignea', chance: 0.85 },
      { itemId: 'piel_curtida', chance: 0.7 },
      { itemId: 'mandoble_ceniza', chance: 0.65 },
      { itemId: 'montura_draco_ceniza', chance: 0.55 },
      { itemId: 'runa_espacio_demo', chance: 0.45 },
    ],
    studyMasteryBonus: '+15% Daño contra Dracónidos y +5% Probabilidad Crítica global.',
  },
  dragon_rojo_ardiente: {
    id: 'dragon_rojo_ardiente',
    name: 'Dragón Rojo de Fuego Ardiente',
    title: 'Señor Volcánico del Este (Jefe)',
    category: 'Dragón Elemental',
    dangerLevel: 5,
    habitat: 'Páramo de Ceniza (Este)',
    description:
      'Coloso escarlata cuyas escamas arden como fragua abierta. Su rugido incendia el páramo oriental.',
    combatBehavior:
      'Emite ráfagas de fuego ardiente y aplica Quemaduras severas. Suelta Corazón de Dragón Rojo.',
    weaknesses: ['Daño de Hielo / Arcano', 'Lanza Matadragones'],
    resistances: ['Fuego', 'Aturdimiento'],
    baseHp: 560,
    baseAtk: 38,
    baseDef: 15,
    xpReward: 580,
    goldReward: [180, 290],
    aggroRadius: 23,
    attackRange: 4.1,
    moveSpeed: 4.5,
    attackCooldown: 1.55,
    colorHex: '#ef4444',
    dropTable: [
      { itemId: 'corazon_dragon_rojo', chance: 0.85 },
      { itemId: 'extracto_ceniza', chance: 0.9 },
      { itemId: 'runa_ignea', chance: 0.8 },
      { itemId: 'mandoble_ceniza', chance: 0.45 },
    ],
    studyMasteryBonus: '+15% Daño contra Dragones Rojos y +12% probabilidad de Corazón Rojo.',
  },
  dragon_negro_oscuro: {
    id: 'dragon_negro_oscuro',
    name: 'Dragón Negro de Fuego Oscuro',
    title: 'Soberano del Velo Abismal (Jefe)',
    category: 'Dragón Elemental',
    dangerLevel: 5,
    habitat: 'Bruma de Occidente (Oeste)',
    description:
      'Dragón de obsidiana envuelto en llamas sombrías que consumen la luz y corroen la armadura.',
    combatBehavior:
      'Combina fuego oscuro con corrupción venenosa y embestidas veloces entre la niebla. Suelta Corazón de Dragón Negro.',
    weaknesses: ['Magia Solar', 'Críticos Concentrados'],
    resistances: ['Veneno', 'Fuego Oscuro'],
    baseHp: 610,
    baseAtk: 41,
    baseDef: 16,
    xpReward: 640,
    goldReward: [200, 320],
    aggroRadius: 24,
    attackRange: 4.2,
    moveSpeed: 4.7,
    attackCooldown: 1.5,
    colorHex: '#7c3aed',
    dropTable: [
      { itemId: 'corazon_dragon_negro', chance: 0.85 },
      { itemId: 'extracto_espectral', chance: 0.9 },
      { itemId: 'coraza_templario', chance: 0.45 },
      { itemId: 'montura_lobo_velo', chance: 0.4 },
    ],
    studyMasteryBonus: '+15% Daño contra Dragones Negros y +12% probabilidad de Corazón Negro.',
  },
  dragon_verde_espiritual: {
    id: 'dragon_verde_espiritual',
    name: 'Dragón Verde de Fuego Espiritual',
    title: 'Guardián del Bosque Antiguo (Jefe)',
    category: 'Dragón Elemental',
    dangerLevel: 5,
    habitat: 'Bosque Susurrante (Sur)',
    description:
      'Bestia ancestral cubierta de musgo etéreo y llamas espirituales verde esmeralda que drenan vigor.',
    combatBehavior:
      'Sus zarpazos infunden llamas espirituales tóxicas y enlentecimiento de raíces. Suelta Corazón de Dragón Verde.',
    weaknesses: ['Cortes Pesados', 'Fuego Ardiente'],
    resistances: ['Veneno', 'Ralentización'],
    baseHp: 580,
    baseAtk: 37,
    baseDef: 17,
    xpReward: 600,
    goldReward: [190, 300],
    aggroRadius: 23,
    attackRange: 4.1,
    moveSpeed: 4.4,
    attackCooldown: 1.6,
    colorHex: '#10b981',
    dropTable: [
      { itemId: 'corazon_dragon_verde', chance: 0.85 },
      { itemId: 'raiz_lunaria', chance: 0.9 },
      { itemId: 'flor_eterea', chance: 0.85 },
      { itemId: 'amuleto_rubi', chance: 0.5 },
    ],
    studyMasteryBonus: '+15% Daño contra Dragones Verdes y +12% probabilidad de Corazón Verde.',
  },
  dragon_celeste_hielo: {
    id: 'dragon_celeste_hielo',
    name: 'Dragón Celeste de Hielo',
    title: 'Tirano de la Escarcha Boreal (Jefe)',
    category: 'Dragón Elemental',
    dangerLevel: 5,
    habitat: 'Tierras Altas del Norte (Noreste)',
    description:
      'Dragón cristalino de alas translúcidas cuyas exhalaciones congelan el aire en décimas de segundo.',
    combatBehavior:
      'Congela y ralentiza gravemente al enemigo con escarcha boreal de alto impacto. Suelta Corazón de Dragón Celeste.',
    weaknesses: ['Orbe Ígneo', 'Fuego Ardiente'],
    resistances: ['Frío', 'Armadura Pesada'],
    baseHp: 640,
    baseAtk: 42,
    baseDef: 18,
    xpReward: 690,
    goldReward: [220, 350],
    aggroRadius: 24,
    attackRange: 4.2,
    moveSpeed: 4.5,
    attackCooldown: 1.55,
    colorHex: '#38bdf8',
    dropTable: [
      { itemId: 'corazon_dragon_celeste', chance: 0.85 },
      { itemId: 'pocion_panacea_lunar', chance: 0.7 },
      { itemId: 'egida_centinela', chance: 0.5 },
      { itemId: 'runa_ignea', chance: 0.75 },
    ],
    studyMasteryBonus: '+15% Daño contra Dragones Celestes y +12% probabilidad de Corazón Celeste.',
  },
  dragon_amarillo_divino: {
    id: 'dragon_amarillo_divino',
    name: 'Dragón Amarillo de Fuego Divino',
    title: 'Avatar Áureo de la Cumbre (Jefe Supremo)',
    category: 'Dragón Elemental',
    dangerLevel: 5,
    habitat: 'Tierras Altas del Norte (Cumbre Noroeste)',
    description:
      'El más antiguo de los cinco dragones elementales. Sus escamas doradas irradian fuego divino purificador.',
    combatBehavior:
      'Desata fuego divino de daño masivo y alta resistencia. Suelta Corazón de Dragón Amarillo.',
    weaknesses: ['Sinergias de Renacimiento', 'Cazadores de Dragones'],
    resistances: ['Fuego', 'Luz', 'Aturdimiento'],
    baseHp: 740,
    baseAtk: 46,
    baseDef: 20,
    xpReward: 850,
    goldReward: [280, 440],
    aggroRadius: 25,
    attackRange: 4.4,
    moveSpeed: 4.7,
    attackCooldown: 1.5,
    colorHex: '#facc15',
    dropTable: [
      { itemId: 'corazon_dragon_amarillo', chance: 0.88 },
      { itemId: 'hoja_alba_ascendida', chance: 0.5 },
      { itemId: 'montura_draco_ceniza', chance: 0.45 },
      { itemId: 'runa_espacio_demo', chance: 0.6 },
    ],
    studyMasteryBonus: '+15% Daño contra Dragones Amarillos y +12% probabilidad de Corazón Amarillo.',
  },
};

export const INITIAL_ATTRIBUTES: BaseAttributes = {
  fuerza: 8,
  agilidad: 7,
  vitalidad: 8,
  inteligencia: 6,
  suerte: 5,
};

export const INITIAL_EQUIPMENT: Record<EquipmentSlot, string | null> = {
  arma: 'espada_hierro',
  escudo: 'escudo_roble',
  yelmo: null,
  armadura: null,
  amuleto: null,
  runa_extra: null,
  montura: null,
};

export const INITIAL_INVENTORY: InventoryEntry[] = [
  { uid: 'inv-1', itemId: 'pocion_vida', quantity: 3 },
  { uid: 'inv-2', itemId: 'elixir_mana', quantity: 2 },
  { uid: 'inv-3', itemId: 'capa_sombras', quantity: 1 },
  { uid: 'inv-4', itemId: 'runa_espacio_demo', quantity: 1 },
  { uid: 'inv-5', itemId: 'hierba_solar', quantity: 4 },
  { uid: 'inv-6', itemId: 'flor_eterea', quantity: 3 },
  { uid: 'inv-7', itemId: 'raiz_lunaria', quantity: 2 },
  { uid: 'inv-8', itemId: 'extracto_goblin', quantity: 2 },
  { uid: 'inv-9', itemId: 'extracto_espectral', quantity: 1 },
  { uid: 'inv-10', itemId: 'piel_curtida', quantity: 2 },
  { uid: 'inv-11', itemId: 'runa_menor', quantity: 1 },
  { uid: 'inv-12', itemId: 'montura_corcel', quantity: 1 },
];

export const INITIAL_QUESTS: Quest[] = [
  {
    id: 'mision_ruinas',
    title: 'Limpieza de las Ruinas Exteriores',
    giver: 'Archivista Valen',
    zone: 'Ruinas Exteriores',
    description:
      'Los Goblins Merodeadores han tomado los pilares cercanos al campamento. Derrota 3 para asegurar el paso.',
    loreNote: 'El Sabio del Santuario sospecha que buscan fragmentos rúnicos antiguos.',
    status: 'activa',
    objectives: [
      {
        id: 'obj_goblin',
        description: 'Derrotar Goblins Merodeadores',
        type: 'kill',
        targetId: 'goblin_merodeador',
        required: 3,
        current: 0,
      },
    ],
    rewards: { xp: 110, gold: 45, itemId: 'yelmo_explorador' },
  },
  {
    id: 'mision_bestiario',
    title: 'El Códice del Investigador',
    giver: 'Archivista Valen',
    zone: 'Todo el Valle',
    description:
      'Usa [E] frente a criaturas o analiza muestras en el Libro de Estudio hasta dominar (100%) al Goblin Merodeador y avistar 3 especies distintas.',
    loreNote: 'Conocer al enemigo otorga bonificaciones permanentes en combate.',
    status: 'activa',
    objectives: [
      {
        id: 'obj_study_goblin',
        description: 'Alcanzar 100% estudio: Goblin Merodeador',
        type: 'study',
        targetId: 'goblin_merodeador',
        required: 100,
        current: 0,
      },
      {
        id: 'obj_sight_3',
        description: 'Avistar especies distintas en el Bestiario',
        type: 'study',
        targetId: 'any_sighted',
        required: 3,
        current: 0,
      },
    ],
    rewards: { xp: 150, gold: 70, itemId: 'amuleto_rubi' },
  },
  {
    id: 'mision_centinelas',
    title: 'Ecos del Atrio Antiguo',
    giver: 'Archivista Valen',
    zone: 'Atrio Antiguo',
    description:
      'Adéntrate hacia el norte y derrota 2 Esqueletos Centinela y 2 Espectros del Velo.',
    loreNote: 'Las losas del Atrio aún responden a la magia astral.',
    status: 'activa',
    objectives: [
      {
        id: 'obj_skel',
        description: 'Derrotar Esqueletos Centinela',
        type: 'kill',
        targetId: 'esqueleto_centinela',
        required: 2,
        current: 0,
      },
      {
        id: 'obj_wraith',
        description: 'Derrotar Espectros del Velo',
        type: 'kill',
        targetId: 'espectro_velo',
        required: 2,
        current: 0,
      },
    ],
    rewards: { xp: 240, gold: 120, itemId: 'egida_centinela' },
  },
  {
    id: 'mision_wyvern',
    title: 'El Señor del Altar Carmesí',
    giver: 'Archivista Valen',
    zone: 'Altar del Dragón',
    description:
      'Enfrenta al temible Wyvern de Ceniza en el extremo norte y demuestra tu dominio absoluto.',
    loreNote: 'Solo los aventureros bien equipados sobreviven al aliento del Wyvern.',
    status: 'activa',
    objectives: [
      {
        id: 'obj_boss',
        description: 'Derrotar al Wyvern de Ceniza',
        type: 'kill',
        targetId: 'wyvern_ceniza',
        required: 1,
        current: 0,
      },
    ],
    rewards: { xp: 500, gold: 300, itemId: 'coraza_templario' },
  },
];

export const INITIAL_BESTIARY: Record<MonsterSpeciesId, BestiaryProgressEntry> = {
  goblin_merodeador: { speciesId: 'goblin_merodeador', sighted: false, kills: 0, studyPoints: 0 },
  esqueleto_centinela: { speciesId: 'esqueleto_centinela', sighted: false, kills: 0, studyPoints: 0 },
  espectro_velo: { speciesId: 'espectro_velo', sighted: false, kills: 0, studyPoints: 0 },
  golem_obsidiana: { speciesId: 'golem_obsidiana', sighted: false, kills: 0, studyPoints: 0 },
  wyvern_ceniza: { speciesId: 'wyvern_ceniza', sighted: false, kills: 0, studyPoints: 0 },
  dragon_rojo_ardiente: { speciesId: 'dragon_rojo_ardiente', sighted: false, kills: 0, studyPoints: 0 },
  dragon_negro_oscuro: { speciesId: 'dragon_negro_oscuro', sighted: false, kills: 0, studyPoints: 0 },
  dragon_verde_espiritual: { speciesId: 'dragon_verde_espiritual', sighted: false, kills: 0, studyPoints: 0 },
  dragon_celeste_hielo: { speciesId: 'dragon_celeste_hielo', sighted: false, kills: 0, studyPoints: 0 },
  dragon_amarillo_divino: { speciesId: 'dragon_amarillo_divino', sighted: false, kills: 0, studyPoints: 0 },
};

export const INITIAL_SKILLS: SkillSlot[] = [
  {
    slotIndex: 1,
    id: 'bola_fuego',
    name: 'Orbe Ígneo',
    keyLabel: '1',
    manaCost: 18,
    cooldown: 2.2,
    remainingCooldown: 0,
    description: 'Lanza un proyectil arcano de fuego que explota al impactar e inflige daño mágico.',
  },
  {
    slotIndex: 2,
    id: 'luz_sanadora',
    name: 'Luz Restauradora',
    keyLabel: '2',
    manaCost: 22,
    cooldown: 6.0,
    remainingCooldown: 0,
    description: 'Canaliza energía vital para restaurar salud y potenciar brevemente la regeneración.',
  },
  {
    slotIndex: 3,
    id: 'golpe_critico',
    name: 'Tajo Ejecutor',
    keyLabel: '3',
    manaCost: 15,
    cooldown: 4.5,
    remainingCooldown: 0,
    description: 'Estocada concentrada con +45% de probabilidad crítica garantizada y daño amplificado.',
  },
  {
    slotIndex: 4,
    id: 'espacio_habilidad_4',
    name: 'Ranura Libre I',
    keyLabel: '4',
    manaCost: 0,
    cooldown: 0,
    remainingCooldown: 0,
    isReservedSlot: true,
    description: 'Espacio reservado para futura habilidad (ej. Torbellino, Paso Sombrío o Invocación).',
  },
  {
    slotIndex: 5,
    id: 'espacio_habilidad_5',
    name: 'Ranura Libre II',
    keyLabel: '5',
    manaCost: 0,
    cooldown: 0,
    remainingCooldown: 0,
    isReservedSlot: true,
    description: 'Espacio reservado para futuro conjuro elemental o grito de guerra.',
  },
  {
    slotIndex: 6,
    id: 'espacio_habilidad_6',
    name: 'Ranura Libre III',
    keyLabel: '6',
    manaCost: 0,
    cooldown: 0,
    remainingCooldown: 0,
    isReservedSlot: true,
    description: 'Espacio reservado para habilidad definitiva o módulo de expansión.',
  },
];

export const INITIAL_EXTENSION_MODULES: ExtensionModuleSlot[] = [
  {
    id: 'mod_alquimia',
    name: 'Mesa de Alquimia y Crafteo',
    category: 'Progresión',
    status: 'activo_demo',
    description:
      'Sistema de crafteo activo en el Inventario [I] para combinar plantas, pieles y runas en pociones y mejoras de armas.',
    hookPoint: 'InventoryModal (modo="crafteo") + CRAFTING_RECIPES',
    enabled: true,
  },
  {
    id: 'mod_talentos',
    name: 'Árbol de Talentos y Maestrías',
    category: 'Combate',
    status: 'activo_demo',
    description:
      'Ramas de Físico, Mágico y Supervivencia integradas en el panel de Personaje [C] usando puntos cada 5 niveles.',
    hookPoint: 'CharacterModal (pestaña="talentos") + TALENTS_CATALOG',
    enabled: true,
  },
  {
    id: 'mod_runas_avanzadas',
    name: 'Forja de Runas (Ranura 6)',
    category: 'Magia',
    status: 'activo_demo',
    description:
      'Ranura de equipo adicional ("Runa Extra") ya conectada al cálculo real de estadísticas.',
    hookPoint: 'EquipmentSlot["runa_extra"] en types.ts',
    enabled: true,
  },
  {
    id: 'mod_gremio_tienda',
    name: 'Mercader y Comercio del Santuario',
    category: 'Economía',
    status: 'activo_demo',
    description:
      'Sistema de comercio activo con el Mercader Kael y modo Tienda en el Inventario para comprar/vender objetos.',
    hookPoint: 'InventoryModal (modo="tienda") + MERCHANT_CATALOG_IDS',
    enabled: true,
  },
  {
    id: 'mod_companero',
    name: 'Espíritu Guardián / Mascota',
    category: 'Combate',
    status: 'reservado',
    description:
      'Espacio para invocar un familiar 3D que siga al jugador y otorgue auras de regeneración.',
    hookPoint: 'src/game/extensions.ts -> onPlayerTick()',
    enabled: false,
  },
  {
    id: 'mod_biomas',
    name: 'Portales y Mazmorras Instanciadas',
    category: 'Mundo',
    status: 'reservado',
    description:
      'Conector de zonas para cargar nuevos mapas procedurales manteniendo inventario y bestiario.',
    hookPoint: 'src/game/extensions.ts -> registerWorldZone()',
    enabled: false,
  },
];

export function computePlayerStats(
  level: number,
  attrs: BaseAttributes,
  equipment: Record<EquipmentSlot, string | null>,
  bestiary: Record<MonsterSpeciesId, BestiaryProgressEntry>,
  talentRanks: Record<string, number> = {},
  clanStatBonuses?: ItemBonuses,
  activeBuffs: ActiveAlchemyBuff[] = [],
  raceId: RaceId = 'humano',
  classId: ClassId = 'caballero_runico',
  rebirths = 0
): ComputedStats {
  let equipDanoMin = 0;
  let equipDanoMax = 0;
  let equipDef = 0;
  let equipFuerza = 0;
  let equipAgilidad = 0;
  let equipIntel = 0;
  let equipVit = 0;
  let equipCrit = 0;
  let equipCritDmg = 0;
  let equipRegenHp = 0;
  let equipRegenMana = 0;
  let equipMaxHp = 0;
  let equipMaxMana = 0;
  let equipVelocidad = 0;

  const applyBonus = (b?: ItemBonuses, mult = 1) => {
    if (!b) return;
    equipDanoMin += (b.danoMin ?? 0) * mult;
    equipDanoMax += (b.danoMax ?? 0) * mult;
    equipDef += (b.defensa ?? 0) * mult;
    equipFuerza += (b.fuerza ?? 0) * mult;
    equipAgilidad += (b.agilidad ?? 0) * mult;
    equipIntel += (b.inteligencia ?? 0) * mult;
    equipVit += (b.vitalidad ?? 0) * mult;
    equipCrit += (b.probCritico ?? 0) * mult;
    equipCritDmg += (b.danoCritico ?? 0) * mult;
    equipRegenHp += (b.regenHp ?? 0) * mult;
    equipRegenMana += (b.regenMana ?? 0) * mult;
    equipMaxHp += (b.maxHp ?? 0) * mult;
    equipMaxMana += (b.maxMana ?? 0) * mult;
    equipVelocidad += (b.velocidadMovimiento ?? 0) * mult;
  };

  // Race & Class Passive Bonuses
  const raceDef = RACES_CATALOG.find((r) => r.id === raceId);
  const classDef = CLASSES_CATALOG.find((c) => c.id === classId);
  if (raceDef) applyBonus(raceDef.passiveBonuses, 1);
  if (classDef) applyBonus(classDef.passiveBonuses, 1);

  (Object.values(equipment) as (string | null)[]).forEach((itemId) => {
    if (!itemId) return;
    applyBonus(ITEMS_CATALOG[itemId]?.bonuses, 1);
  });

  TALENTS_CATALOG.forEach((talent) => {
    const rank = talentRanks[talent.id] ?? 0;
    if (rank <= 0) return;
    applyBonus(talent.bonusesPerRank, rank);
  });

  if (clanStatBonuses) {
    applyBonus(clanStatBonuses, 1);
  }

  activeBuffs.forEach((buff) => {
    if (buff.remaining > 0) {
      applyBonus(buff.bonuses, 1);
    }
  });

  const fuerzaTotal = attrs.fuerza + equipFuerza;
  const agilidadTotal = attrs.agilidad + equipAgilidad;
  const vitalidadTotal = attrs.vitalidad + equipVit;
  const intelTotal = attrs.inteligencia + equipIntel;

  // Bestiary mastery bonuses
  const espectroMastered = bestiary.espectro_velo?.studyPoints >= 100 ? 0.5 : 0;
  const wyvernMastered = bestiary.wyvern_ceniza?.studyPoints >= 100 ? 5 : 0;

  // Rebirth Damage Multiplier (1.5x per rebirth)
  const rebirthMult = getRebirthDamageMultiplier(rebirths);

  const rawMin = 4 + fuerzaTotal * 1.15 + equipDanoMin + (level - 1) * 1.5;
  const rawMax = 8 + fuerzaTotal * 1.45 + equipDanoMax + (level - 1) * 2.2;
  const danoMin = Math.round(rawMin * rebirthMult);
  const danoMax = Math.round(rawMax * rebirthMult);
  const defensa = Math.round(
    2 + vitalidadTotal * 0.65 + agilidadTotal * 0.25 + equipDef + rebirths * 3
  );

  const probCritico = Math.min(
    85,
    Number((5 + agilidadTotal * 0.55 + attrs.suerte * 0.8 + equipCrit + wyvernMastered).toFixed(1))
  );
  const danoCritico = Math.round(150 + fuerzaTotal * 1.2 + equipCritDmg + rebirths * 10);

  const maxHp = Math.round(100 + vitalidadTotal * 10 + (level - 1) * 14 + equipMaxHp + rebirths * 35);
  const maxMana = Math.round(60 + intelTotal * 8 + (level - 1) * 8 + equipMaxMana + rebirths * 15);

  const regenHp = Number((1.1 + vitalidadTotal * 0.16 + equipRegenHp).toFixed(2));
  const regenMana = Number((1.6 + intelTotal * 0.25 + equipRegenMana + espectroMastered).toFixed(2));

  const velocidadMovimiento = Number(
    (7.2 + Math.min(4.5, agilidadTotal * 0.14) + equipVelocidad).toFixed(2)
  );
  const velocidadAtaque = Number((1 + Math.min(0.95, agilidadTotal * 0.025)).toFixed(2));

  return {
    danoMin,
    danoMax,
    defensa,
    fuerzaTotal,
    agilidadTotal,
    probCritico,
    danoCritico,
    regenHp,
    regenMana,
    velocidadMovimiento,
    velocidadAtaque,
    maxHp,
    maxMana,
  };
}

export const MERCHANT_CATALOG_IDS: string[] = [
  'pocion_vida',
  'elixir_mana',
  'hierba_solar',
  'flor_eterea',
  'raiz_lunaria',
  'extracto_goblin',
  'extracto_espectral',
  'piel_curtida',
  'runa_menor',
  'runa_ignea',
  'espada_hierro',
  'escudo_roble',
  'yelmo_explorador',
  'capa_sombras',
  'hoja_alba',
  'egida_centinela',
  'amuleto_rubi',
  'hacha_obsidiana',
  'coraza_templario',
  'runa_espacio_demo',
  'montura_corcel',
  'montura_lobo_velo',
  'montura_draco_ceniza',
  'muestra_goblin',
];

export function getBuyPrice(item: GameItem): number {
  return Math.max(10, Math.round(item.valueGold * 1.4));
}

export function getSellPrice(item: GameItem): number {
  return Math.max(5, Math.round(item.valueGold * 0.7));
}

const MARKET_CATEGORIES: ItemCategory[] = [
  'consumible',
  'material',
  'arma',
  'escudo',
  'armadura',
  'accesorio',
  'montura',
  'reliquia',
];

function seededUnit(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function getMerchantMaxStock(item: GameItem, quests: Quest[]): number {
  const tradeRoutesDone = quests.some(
    (q) => q.id === 'mision_oculta_mercader' && q.status === 'completada'
  );
  const routeBonus = tradeRoutesDone ? 1 : 0;
  if (item.category === 'consumible' || item.category === 'material') {
    if (item.rarity === 'comun') return 5 + routeBonus;
    if (item.rarity === 'poco_comun') return 4 + routeBonus;
    return 3 + routeBonus;
  }
  if (item.category === 'reliquia') return 2 + routeBonus;
  if (item.rarity === 'legendario' || item.rarity === 'epico') return 1 + routeBonus;
  if (item.rarity === 'raro') return 2 + routeBonus;
  return 2 + routeBonus;
}

export function createDailyMarketState(
  dayNumber: number,
  quests: Quest[],
  prevStock?: Record<string, number>
): MarketState {
  const completedIds = new Set(
    quests.filter((q) => q.status === 'completada').map((q) => q.id)
  );
  const dailyFactorByCategory = {} as Record<ItemCategory, number>;
  const scarceCategories: ItemCategory[] = [];
  const surplusCategories: ItemCategory[] = [];

  MARKET_CATEGORIES.forEach((cat, idx) => {
    const roll = seededUnit(dayNumber * 31 + idx * 17);
    // Range ~0.82 .. 1.24; day 1 starts gently balanced with 1 scarce category
    let factor = Number((0.86 + roll * 0.36).toFixed(2));
    if (dayNumber === 1 && cat === 'material') factor = 1.18;
    if (dayNumber === 1 && cat === 'consumible') factor = 0.92;
    dailyFactorByCategory[cat] = factor;
    if (factor >= 1.12) scarceCategories.push(cat);
    else if (factor <= 0.92) surplusCategories.push(cat);
  });

  const stockByItemId: Record<string, number> = {};
  MERCHANT_CATALOG_IDS.forEach((itemId, idx) => {
    const item = ITEMS_CATALOG[itemId];
    if (!item) return;
    const maxStock = getMerchantMaxStock(item, quests);
    const catFactor = dailyFactorByCategory[item.category] ?? 1;
    const itemRoll = seededUnit(dayNumber * 53 + idx * 13);

    // Scarcity days reduce vendor supply; surplus days bring full crates
    let targetStock = Math.max(
      1,
      Math.round(maxStock * (catFactor >= 1.12 ? 0.45 : catFactor <= 0.92 ? 1.0 : 0.78))
    );
    if (catFactor >= 1.16 && itemRoll < 0.38) {
      targetStock = Math.max(0, targetStock - 1);
    }

    if (prevStock && prevStock[itemId] !== undefined) {
      // Gradual daily restock or surplus normalization from previous day
      const prev = prevStock[itemId];
      if (prev < targetStock) {
        stockByItemId[itemId] = Math.min(maxStock, prev + Math.max(1, Math.ceil((targetStock - prev) * 0.7)));
      } else if (prev > maxStock) {
        stockByItemId[itemId] = Math.max(maxStock, prev - 2);
      } else {
        stockByItemId[itemId] = targetStock;
      }
    } else {
      stockByItemId[itemId] = Math.min(maxStock, targetStock);
    }
  });

  const catLabels: Record<ItemCategory, string> = {
    consumible: 'pociones',
    material: 'hierbas y runas',
    arma: 'armas',
    escudo: 'escudos',
    armadura: 'armaduras',
    accesorio: 'reliquias de equipo',
    montura: 'monturas',
    reliquia: 'muestras de estudio',
  };

  let headline = '';
  if (completedIds.has('mision_oculta_mercader')) {
    headline = `Día ${dayNumber}: Rutas del Gremio aseguradas (+reservas y mejores márgenes de comercio).`;
  } else if (scarceCategories.length > 0) {
    const names = scarceCategories.slice(0, 2).map((c) => catLabels[c]).join(' y ');
    headline = `Día ${dayNumber}: Escasez de ${names} en el valle (suben compra y recompra).`;
  } else if (surplusCategories.length > 0) {
    const names = surplusCategories.slice(0, 2).map((c) => catLabels[c]).join(' y ');
    headline = `Día ${dayNumber}: Llegada de caravanas con excedente de ${names} (precios rebajados).`;
  } else {
    headline = `Día ${dayNumber}: Mercado estable en el Santuario del Bastión.`;
  }

  return {
    dayNumber,
    headline,
    scarceCategories,
    surplusCategories,
    stockByItemId,
    dailyFactorByCategory,
  };
}

export function computeDynamicMarketQuote(
  item: GameItem,
  market: MarketState,
  quests: Quest[]
): MarketItemQuote {
  const baseBuyPrice = getBuyPrice(item);
  const baseSellPrice = getSellPrice(item);
  const maxStock = getMerchantMaxStock(item, quests);
  const stock =
    market.stockByItemId[item.id] !== undefined
      ? market.stockByItemId[item.id]
      : Math.max(1, Math.ceil(maxStock * 0.75));

  const reasons: string[] = [];
  let buyMult = market.dailyFactorByCategory[item.category] ?? 1.0;
  let sellMult = 1.0 + ((buyMult - 1.0) * 0.85);

  if (buyMult >= 1.12) {
    reasons.push(`Alta demanda diaria en ${item.category} (+${Math.round((buyMult - 1) * 100)}%)`);
  } else if (buyMult <= 0.92) {
    reasons.push(`Abundancia diaria de caravana (${Math.round((buyMult - 1) * 100)}%)`);
  }

  // Scarcity vs surplus from current stock level
  if (stock === 0) {
    buyMult *= 1.32;
    sellMult *= 1.35;
    reasons.push('Agotado en puesto (+35% valor de recompra si vendes)');
  } else if (stock <= Math.max(1, Math.floor(maxStock * 0.35))) {
    buyMult *= 1.2;
    sellMult *= 1.22;
    reasons.push(`Escasez crítica en inventario (${stock}/${maxStock})`);
  } else if (stock > maxStock) {
    buyMult *= 0.82;
    sellMult *= 0.78;
    reasons.push(`Excedente en tienda (${stock}/${maxStock}, baja recompra)`);
  }

  // Completed quests reputation & route unlocks
  const completedQuests = quests.filter((q) => q.status === 'completada');
  const completedIds = new Set(completedQuests.map((q) => q.id));

  if (completedQuests.length > 0) {
    const repBuyDiscount = Math.min(0.2, completedQuests.length * 0.04);
    const repSellBonus = Math.min(0.25, completedQuests.length * 0.05);
    buyMult *= 1 - repBuyDiscount;
    sellMult *= 1 + repSellBonus;
    reasons.push(
      `Prestigio por ${completedQuests.length} misión${completedQuests.length > 1 ? 'es' : ''} (-${Math.round(
        repBuyDiscount * 100
      )}% compra / +${Math.round(repSellBonus * 100)}% venta)`
    );
  }

  if (completedIds.has('mision_ruinas') && (item.category === 'consumible' || item.category === 'material')) {
    buyMult *= 0.9;
    reasons.push('Ruinas aseguradas (-10% compra en suministros)');
  }
  if (completedIds.has('mision_bestiario') && (item.category === 'reliquia' || item.id.startsWith('extracto_'))) {
    sellMult *= 1.24;
    reasons.push('Demanda del Códice (+24% venta en muestras y extractos)');
  }
  if (
    completedIds.has('mision_centinelas') &&
    (item.category === 'arma' || item.category === 'escudo' || item.category === 'armadura')
  ) {
    buyMult *= 0.9;
    reasons.push('Forja del Atrio abierta (-10% compra en equipo)');
  }
  if (completedIds.has('mision_oculta_mercader')) {
    buyMult *= 0.9;
    sellMult *= 1.15;
    reasons.push('Rutas del Gremio protegidas (-10% compra / +15% venta)');
  }
  if (completedIds.has('mision_wyvern') && (item.rarity === 'epico' || item.rarity === 'legendario')) {
    sellMult *= 1.2;
    reasons.push('Gloria del Wyvern (+20% valor en equipo superior)');
  }

  const buyPrice = Math.max(8, Math.round(baseBuyPrice * buyMult));
  const sellPrice = Math.max(4, Math.round(baseSellPrice * sellMult));
  const buyDeltaPct = Math.round(((buyPrice - baseBuyPrice) / Math.max(1, baseBuyPrice)) * 100);
  const sellDeltaPct = Math.round(((sellPrice - baseSellPrice) / Math.max(1, baseSellPrice)) * 100);

  let trend: MarketTrend = 'estable';
  if (stock <= Math.max(1, Math.floor(maxStock * 0.35)) || buyDeltaPct >= 14) {
    trend = stock === 0 || stock <= 1 ? 'escasez' : 'alza';
  } else if (buyDeltaPct <= -10) {
    trend = 'descuento';
  } else if (sellDeltaPct >= 12) {
    trend = 'alza';
  }

  if (reasons.length === 0) {
    reasons.push('Equilibrio normal de oferta y demanda diaria');
  }

  return {
    itemId: item.id,
    buyPrice,
    sellPrice,
    baseBuyPrice,
    baseSellPrice,
    buyDeltaPct,
    sellDeltaPct,
    stock,
    maxStock,
    trend,
    reasons,
  };
}

export function computeBestiaryCompletionPct(
  bestiary: Record<MonsterSpeciesId, BestiaryProgressEntry>
): number {
  const entries = Object.values(bestiary);
  if (entries.length === 0) return 0;
  const totalPoints = entries.reduce((sum, e) => sum + Math.min(100, e.studyPoints), 0);
  return Math.round((totalPoints / (entries.length * 100)) * 100);
}

export const ACHIEVEMENTS_CATALOG: AchievementDefinition[] = [
  {
    id: 'primer_monstruo',
    title: 'Primer Monstruo Derrotado',
    description: 'Consigue tu primera baja enfrentando a las criaturas del Valle del Velo.',
    category: 'Combate',
    target: 1,
    unitLabel: 'baja',
    rewardGold: 25,
    rewardXp: 35,
    getCurrent: (m) => m.totalKills,
  },
  {
    id: 'cazador_implacable',
    title: 'Cazador de las Ruinas',
    description: 'Derrota un total de 10 monstruos en combate.',
    category: 'Combate',
    target: 10,
    unitLabel: 'bajas',
    rewardGold: 80,
    rewardXp: 120,
    getCurrent: (m) => m.totalKills,
  },
  {
    id: 'matadragones_altar',
    title: 'Señor Caído del Altar',
    description: 'Derrota al jefe Wyvern de Ceniza en el Altar del Dragón.',
    category: 'Combate',
    target: 1,
    unitLabel: 'jefe',
    rewardGold: 250,
    rewardXp: 300,
    getCurrent: (m) => m.wyvernKills,
  },
  {
    id: 'nivel_5',
    title: 'Aventurero Curtido',
    description: 'Alcanza el Nivel 5 mejorando tus atributos en el Valle.',
    category: 'Progresión',
    target: 5,
    unitLabel: 'nivel',
    rewardGold: 100,
    getCurrent: (m) => m.level,
  },
  {
    id: 'nivel_10',
    title: 'Nivel 10 alcanzado',
    description: 'Alcanza el Nivel 10 de personaje para dominar el Bastión.',
    category: 'Progresión',
    target: 10,
    unitLabel: 'nivel',
    rewardGold: 300,
    getCurrent: (m) => m.level,
  },
  {
    id: 'observador_valle',
    title: 'Ojo del Naturalista',
    description: 'Avista las 5 especies distintas de monstruos en el Bestiario.',
    category: 'Bestiario',
    target: 5,
    unitLabel: 'especies',
    rewardGold: 60,
    rewardXp: 80,
    getCurrent: (m) => m.sightedSpeciesCount,
  },
  {
    id: 'bestiario_50',
    title: 'Bestiario completado al 50%',
    description: 'Alcanza al menos un 50% de progreso global en el Libro de Estudio.',
    category: 'Bestiario',
    target: 50,
    unitLabel: '%',
    rewardGold: 120,
    rewardXp: 150,
    getCurrent: (m) => m.bestiaryCompletionPct,
  },
  {
    id: 'bestiario_100',
    title: 'Erudito Supremo del Velo',
    description: 'Completa el 100% de investigación de todas las criaturas del Bestiario.',
    category: 'Bestiario',
    target: 100,
    unitLabel: '%',
    rewardGold: 400,
    rewardXp: 450,
    getCurrent: (m) => m.bestiaryCompletionPct,
  },
  {
    id: 'buscador_reliquias',
    title: 'Buscador de Reliquias',
    description: 'Abre 3 cofres del tesoro repartidos por el valle.',
    category: 'Exploración',
    target: 3,
    unitLabel: 'cofres',
    rewardGold: 75,
    rewardXp: 90,
    getCurrent: (m) => m.chestsOpened,
  },
  {
    id: 'patrocinador_gremio',
    title: 'Comerciante del Santuario',
    description: 'Completa 3 compras o ventas con el Mercader Kael.',
    category: 'Economía',
    target: 3,
    unitLabel: 'operaciones',
    rewardGold: 60,
    rewardXp: 60,
    getCurrent: (m) => m.tradesCompleted,
  },
  {
    id: 'heroe_santuario',
    title: 'Héroe del Santuario',
    description: 'Completa y reclama todas las misiones del Archivista Valen.',
    category: 'Exploración',
    target: 4,
    unitLabel: 'misiones',
    rewardGold: 200,
    rewardXp: 250,
    getCurrent: (m) => m.questsCompleted,
  },
  {
    id: 'red_santuarios',
    title: 'Red del Caminante',
    description: 'Activa 3 Santuarios de Viaje Rápido para enlazar las zonas del Valle.',
    category: 'Exploración',
    target: 3,
    unitLabel: 'santuarios',
    rewardGold: 90,
    rewardXp: 110,
    getCurrent: (m) => m.discoveredShrinesCount,
  },
];

export const TALENT_BRANCHES: {
  id: TalentBranchId;
  name: string;
  subtitle: string;
}[] = [
  {
    id: 'fisico',
    name: 'Físico',
    subtitle: 'Potencia marcial, fuerza bruta y letalidad crítica',
  },
  {
    id: 'magico',
    name: 'Mágico',
    subtitle: 'Reserva de maná, agilidad rúnica y regeneración arcana',
  },
  {
    id: 'supervivencia',
    name: 'Supervivencia',
    subtitle: 'Armadura natural, salud máxima y recuperación vital',
  },
];

export const TALENTS_CATALOG: TalentNode[] = [
  // Rama Físico
  {
    id: 'fis_1',
    branch: 'fisico',
    tier: 1,
    name: 'Filo Templado',
    description: 'Perfecciona el golpe con armas cuerpo a cuerpo y fortalece el brazo.',
    effectSummary: '+3 Daño Mín/Máx y +2 Fuerza por rango',
    maxRank: 2,
    bonusesPerRank: { danoMin: 3, danoMax: 3, fuerza: 2 },
  },
  {
    id: 'fis_2',
    branch: 'fisico',
    tier: 2,
    name: 'Precisión Letal',
    description: 'Identifica puntos vulnerables para desencadenar impactos críticos.',
    effectSummary: '+4% Prob. Crítica y +18% Daño Crítico por rango',
    maxRank: 2,
    requiresTalentId: 'fis_1',
    bonusesPerRank: { probCritico: 4, danoCritico: 18 },
  },
  {
    id: 'fis_3',
    branch: 'fisico',
    tier: 3,
    name: 'Furia del Bastión',
    description: 'Maestría suprema de combate que multiplica la fuerza de cada tajo.',
    effectSummary: '+8 Daño Máx, +6 Fuerza y +5% Prob. Crítica',
    maxRank: 1,
    requiresTalentId: 'fis_2',
    bonusesPerRank: { danoMin: 4, danoMax: 8, fuerza: 6, probCritico: 5 },
  },

  // Rama Mágico
  {
    id: 'mag_1',
    branch: 'magico',
    tier: 1,
    name: 'Reserva Etérea',
    description: 'Expande tu capacidad arcana para lanzar más conjuros seguidos.',
    effectSummary: '+22 Maná Máx y +3 Inteligencia por rango',
    maxRank: 2,
    bonusesPerRank: { maxMana: 22, inteligencia: 3 },
  },
  {
    id: 'mag_2',
    branch: 'magico',
    tier: 2,
    name: 'Corriente Arcana',
    description: 'Canaliza el éter ambiental para regenerar maná y moverte con ligereza.',
    effectSummary: '+1.2 Regen Maná/s y +4 Agilidad por rango',
    maxRank: 2,
    requiresTalentId: 'mag_1',
    bonusesPerRank: { regenMana: 1.2, agilidad: 4 },
  },
  {
    id: 'mag_3',
    branch: 'magico',
    tier: 3,
    name: 'Archimago del Velo',
    description: 'Dominio absoluto del flujo astral y precisión crítica en habilidades.',
    effectSummary: '+40 Maná Máx, +2.5 Regen Maná/s y +6% Prob. Crítica',
    maxRank: 1,
    requiresTalentId: 'mag_2',
    bonusesPerRank: { maxMana: 40, regenMana: 2.5, probCritico: 6 },
  },

  // Rama Supervivencia
  {
    id: 'sup_1',
    branch: 'supervivencia',
    tier: 1,
    name: 'Piel de Hierro',
    description: 'Endurece tu postura defensiva para absorber golpes enemigos.',
    effectSummary: '+4 Defensa y +25 Salud Máx por rango',
    maxRank: 2,
    bonusesPerRank: { defensa: 4, maxHp: 25 },
  },
  {
    id: 'sup_2',
    branch: 'supervivencia',
    tier: 2,
    name: 'Vigor Inagotable',
    description: 'Acelera la cicatrización natural en medio de la exploración.',
    effectSummary: '+1.2 Regen HP/s y +3 Vitalidad por rango',
    maxRank: 2,
    requiresTalentId: 'sup_1',
    bonusesPerRank: { regenHp: 1.2, vitalidad: 3 },
  },
  {
    id: 'sup_3',
    branch: 'supervivencia',
    tier: 3,
    name: 'Bastión Viviente',
    description: 'Convierte tu cuerpo en una fortaleza casi impenetrable.',
    effectSummary: '+10 Defensa, +75 Salud Máx y +2.2 Regen HP/s',
    maxRank: 1,
    requiresTalentId: 'sup_2',
    bonusesPerRank: { defensa: 10, maxHp: 75, regenHp: 2.2 },
  },
];

export const HIDDEN_QUESTS_CATALOG: Record<string, Quest> = {
  mision_oculta_crater: {
    id: 'mision_oculta_crater',
    title: 'Misión Oculta: El Núcleo del Cráter',
    giver: 'Archivista Valen',
    zone: 'Cráter Basáltico (Este)',
    description:
      'Valen te confió en secreto que los Gólems de Obsidiana están resonando con energía del Velo. Derrota 2 en el Cráter Basáltico.',
    loreNote: 'Desbloqueada mediante diálogo de investigación con el Archivista Valen.',
    status: 'activa',
    objectives: [
      {
        id: 'obj_golem_hidden',
        description: 'Derrotar Gólems de Obsidiana',
        type: 'kill',
        targetId: 'golem_obsidiana',
        required: 2,
        current: 0,
      },
    ],
    rewards: { xp: 280, gold: 150, itemId: 'hacha_obsidiana' },
  },
  mision_oculta_mercader: {
    id: 'mision_oculta_mercader',
    title: 'Misión Oculta: Rutas Perdidas del Gremio',
    giver: 'Mercader Kael',
    zone: 'Santuario Sombrío (Oeste)',
    description:
      'Kael necesita información táctica sobre los Espectros del Velo que asaltan sus caravanas. Alcanza 60% de estudio sobre esta especie.',
    loreNote: 'Desbloqueada tras indagar sobre las rutas comerciales del Mercader Kael.',
    status: 'activa',
    objectives: [
      {
        id: 'obj_espectro_hidden',
        description: 'Alcanzar 60% estudio: Espectro del Velo',
        type: 'study',
        targetId: 'espectro_velo',
        required: 60,
        current: 0,
      },
    ],
    rewards: { xp: 190, gold: 130, itemId: 'elixir_mana' },
  },
};

export const DIALOGUE_REWARDS: Record<string, DialogueReward> = {
  valen_pergamino: {
    xp: 25,
    itemId: 'elixir_mana',
    logText: 'Archivista Valen te entrega un Elixir de Éter Azul (+25 XP).',
  },
  kael_monedas: {
    gold: 35,
    itemId: 'pocion_vida',
    logText: 'Mercader Kael te obsequia +35 Oro y una Poción de Vitalidad.',
  },
};

export const DIALOGUE_TREES: Record<
  NpcId,
  { startNodeId: string; nodes: Record<string, DialogueNode> }
> = {
  npc_valen: {
    startNodeId: 'valen_root',
    nodes: {
      valen_root: {
        id: 'valen_root',
        npcId: 'npc_valen',
        speakerName: 'Archivista Valen',
        speakerTitle: 'Guardián del Códice y Misiones',
        text: 'Las runas del Santuario vibran con inquietud, viajero. El Velo se debilita en las ruinas del norte. ¿Qué asunto te trae ante el Códice?',
        choices: [
          {
            id: 'v_night_blessing',
            text: 'La noche arrecia sobre el valle... ¿puedes reforzar mi vigor para la vigilia?',
            action: 'night_blessing',
            onlyAtNight: true,
            hintLabel: 'Vigilia Nocturna',
          },
          {
            id: 'v_quests',
            text: 'Revisar el Registro de Misiones del Bastión.',
            action: 'open_quests',
            hintLabel: 'Misiones',
          },
          {
            id: 'v_bestiary',
            text: 'Háblame sobre el estudio del Bestiario y sus secretos.',
            nextNodeId: 'valen_bestiario',
          },
          {
            id: 'v_crater',
            text: '¿Has detectado temblores extraños en la zona este del valle?',
            nextNodeId: 'valen_crater',
            hideIfQuestUnlocked: 'mision_oculta_crater',
            hintLabel: 'Explorar pista',
          },
          {
            id: 'v_bye',
            text: 'Volveré tras explorar los alrededores.',
            action: 'close',
          },
        ],
      },
      valen_bestiario: {
        id: 'valen_bestiario',
        npcId: 'npc_valen',
        speakerName: 'Archivista Valen',
        speakerTitle: 'Guardián del Códice y Misiones',
        text: 'Cada criatura estudiada con [E] o mediante sus muestras revela debilidades ocultas y otorga bonificaciones permanentes en combate. El conocimiento es tan letal como el acero.',
        choices: [
          {
            id: 'v_pledge',
            text: 'Prometo documentar todas las especies del valle para el archivo.',
            grantRewardId: 'valen_pergamino',
            nextNodeId: 'valen_gracias',
            hideIfRewardClaimed: 'valen_pergamino',
            hintLabel: 'Recompensa',
          },
          {
            id: 'v_open_b',
            text: 'Abrir el Libro de Estudio (Bestiario) ahora.',
            action: 'open_bestiary',
            hintLabel: 'Bestiario',
          },
          {
            id: 'v_back_1',
            text: 'Entendido, hablemos de otro tema.',
            nextNodeId: 'valen_root',
          },
        ],
      },
      valen_gracias: {
        id: 'valen_gracias',
        npcId: 'npc_valen',
        speakerName: 'Archivista Valen',
        speakerTitle: 'Guardián del Códice y Misiones',
        text: 'Tu dedicación honra al Santuario. Toma este Elixir de Éter Azul para sostener tus conjuros durante tus expediciones.',
        choices: [
          {
            id: 'v_g_root',
            text: 'Gracias, Valen. Quiero preguntarte algo más.',
            nextNodeId: 'valen_root',
          },
          {
            id: 'v_g_bye',
            text: 'Partiré de inmediato.',
            action: 'close',
          },
        ],
      },
      valen_crater: {
        id: 'valen_crater',
        npcId: 'npc_valen',
        speakerName: 'Archivista Valen',
        speakerTitle: 'Guardián del Códice y Misiones',
        text: 'Veo que tienes buen instinto... En el Cráter Basáltico al noreste, dos Gólems de Obsidiana han despertado antes de tiempo. No figura en los tablones públicos para no alarmar a los reclutas.',
        choices: [
          {
            id: 'v_accept_hidden',
            text: 'Confía en mí: iré al Cráter Basáltico y destruiré a esos Gólems.',
            unlockQuestId: 'mision_oculta_crater',
            nextNodeId: 'valen_mision_aceptada',
            hideIfQuestUnlocked: 'mision_oculta_crater',
            hintLabel: 'Misión oculta',
          },
          {
            id: 'v_decline_crater',
            text: 'Aún no estoy listo para enfrentarlos. Volvamos atrás.',
            nextNodeId: 'valen_root',
          },
        ],
      },
      valen_mision_aceptada: {
        id: 'valen_mision_aceptada',
        npcId: 'npc_valen',
        speakerName: 'Archivista Valen',
        speakerTitle: 'Guardián del Códice y Misiones',
        text: 'He anotado el encargo secreto en tu Registro de Misiones: "El Núcleo del Cráter". Si regresas victorioso, la Segadora de Obsidiana será tuya.',
        choices: [
          {
            id: 'v_ma_open',
            text: 'Ver la nueva misión en mi registro.',
            action: 'open_quests',
            hintLabel: 'Misiones',
          },
          {
            id: 'v_ma_bye',
            text: 'En marcha hacia el noreste.',
            action: 'close',
          },
        ],
      },
    },
  },
  npc_kael: {
    startNodeId: 'kael_root',
    nodes: {
      kael_root: {
        id: 'kael_root',
        npcId: 'npc_kael',
        speakerName: 'Mercader Kael',
        speakerTitle: 'Comerciante del Gremio',
        text: '¡Buenas monedas y acero firme, aventurero! Tengo pociones recién destiladas, hojas rúnicas y compro cualquier reliquia que traigas del valle.',
        choices: [
          {
            id: 'k_shop',
            text: 'Abrir el catálogo de compra y venta.',
            action: 'open_shop',
            hintLabel: 'Comercio',
          },
          {
            id: 'k_deal',
            text: 'Acabo de llegar al Santuario, ¿tienes algún apoyo para exploradores?',
            nextNodeId: 'kael_muestra',
            hideIfRewardClaimed: 'kael_monedas',
            hintLabel: 'Recompensa',
          },
          {
            id: 'k_caravan',
            text: '¿Cómo logras cruzar el valle con tus mercancías intactas?',
            nextNodeId: 'kael_caravana',
            hideIfQuestUnlocked: 'mision_oculta_mercader',
            hintLabel: 'Explorar pista',
          },
          {
            id: 'k_bye',
            text: 'Quizá más tarde, Kael.',
            action: 'close',
          },
        ],
      },
      kael_muestra: {
        id: 'kael_muestra',
        npcId: 'npc_kael',
        speakerName: 'Mercader Kael',
        speakerTitle: 'Comerciante del Gremio',
        text: 'Un cliente vivo es un cliente que vuelve a gastar oro. Si prometes traerme muestras y equipo excedente de las ruinas, te adelantaré un pequeño incentivo.',
        choices: [
          {
            id: 'k_claim_gift',
            text: 'Trato hecho: tendrás prioridad con mi botín.',
            grantRewardId: 'kael_monedas',
            nextNodeId: 'kael_trato',
            hideIfRewardClaimed: 'kael_monedas',
            hintLabel: 'Recompensa',
          },
          {
            id: 'k_back_m',
            text: 'Prefiero ver directamente tu tienda.',
            action: 'open_shop',
            hintLabel: 'Comercio',
          },
        ],
      },
      kael_trato: {
        id: 'kael_trato',
        npcId: 'npc_kael',
        speakerName: 'Mercader Kael',
        speakerTitle: 'Comerciante del Gremio',
        text: '¡Así se habla! Aquí tienes 35 monedas de oro y una Poción de Vitalidad por cuenta de la casa.',
        choices: [
          {
            id: 'k_t_shop',
            text: 'Echar un vistazo a tus productos ahora.',
            action: 'open_shop',
            hintLabel: 'Comercio',
          },
          {
            id: 'k_t_root',
            text: 'Gracias. Volvamos a conversar.',
            nextNodeId: 'kael_root',
          },
        ],
      },
      kael_caravana: {
        id: 'kael_caravana',
        npcId: 'npc_kael',
        speakerName: 'Mercader Kael',
        speakerTitle: 'Comerciante del Gremio',
        text: 'No siempre lo logro... Mi última escolta desapareció en el Santuario Sombrío al oeste. Esos Espectros del Velo atraviesan las armaduras comunes sin que nadie sepa cómo estudiarlos.',
        choices: [
          {
            id: 'k_accept_hidden',
            text: 'Investigaré a los Espectros del Velo y reuniré datos para tus rutas.',
            unlockQuestId: 'mision_oculta_mercader',
            nextNodeId: 'kael_mision_aceptada',
            hideIfQuestUnlocked: 'mision_oculta_mercader',
            hintLabel: 'Misión oculta',
          },
          {
            id: 'k_c_back',
            text: 'Volver al menú principal del puesto.',
            nextNodeId: 'kael_root',
          },
        ],
      },
      kael_mision_aceptada: {
        id: 'kael_mision_aceptada',
        npcId: 'npc_kael',
        speakerName: 'Mercader Kael',
        speakerTitle: 'Comerciante del Gremio',
        text: 'Excelente. Cuando alcances un 60% de estudio sobre el Espectro del Velo en tu Bestiario, reclama la recompensa del gremio en tu registro de misiones.',
        choices: [
          {
            id: 'k_ma_quests',
            text: 'Abrir Registro de Misiones.',
            action: 'open_quests',
            hintLabel: 'Misiones',
          },
          {
            id: 'k_ma_shop',
            text: 'Abrir la Tienda de Kael.',
            action: 'open_shop',
            hintLabel: 'Comercio',
          },
        ],
      },
    },
  },
};

export function getNpcDynamicContext(
  npcId: NpcId,
  phase: DayPhase,
  weather: WeatherType
): { statusLabel: string; greetingOverride?: string } {
  const isNight = phase === 'noche' || phase === 'ocaso';
  const isStorm = weather === 'lluvia' || weather === 'nieve' || weather === 'tormenta_ceniza';
  const isRainOrFog = isStorm || weather === 'neblina';

  if (npcId === 'npc_valen') {
    if (weather === 'tormenta_ceniza') {
      return {
        statusLabel: 'Alerta Volcánica · Cenizas del Cráter',
        greetingOverride:
          'Los vientos del Cráter Basáltico traen una densa tormenta de ceniza y brasas incandescentes sobre el valle. Mantén el paso firme al explorar.',
      };
    }
    if (weather === 'nieve') {
      return {
        statusLabel: 'Nevazón en el Bastión · Vigilia Fría',
        greetingOverride:
          'Una nevada silenciosa cubre las ruinas y apaga los ecos del Velo. El aire gélido calma los senderos, pero vigila la visibilidad.',
      };
    }
    if (phase === 'noche') {
      return {
        statusLabel: 'Vigilia Nocturna · Junto al Santuario',
        greetingOverride:
          weather === 'lluvia'
            ? 'La tormenta nocturna agita los espectros de las ruinas exteriores. Mantengo el farol encendido junto al cristal; si necesitas aliento para la oscuridad, pídemelo.'
            : 'Ha caído la noche sobre el Bastión. Los Goblins se han ocultado, pero los Espectros del Velo y los No-Muertos merodean ahora por el valle. Permanezco en vigilia junto al Santuario.',
      };
    }
    if (phase === 'ocaso') {
      return {
        statusLabel: 'Guardia de Ocaso · Observando el Norte',
        greetingOverride:
          'El sol se oculta tras los riscos y las sombras se alargan. Pronto emergerán las criaturas nocturnas del Velo; prepárate antes de que cierre la oscuridad.',
      };
    }
    if (phase === 'amanecer') {
      return {
        statusLabel: 'Alba en la Plaza · Archivo Matinal',
        greetingOverride:
          'La luz del alba disipa los espectros nocturnos. Es buen momento para patrullar las Ruinas Exteriores antes de que los Goblins rearmen sus emboscadas.',
      };
    }
    return {
      statusLabel: isRainOrFog ? 'Archivo Central · Día Nublado' : 'Archivo Central · Puesto Diurno',
      greetingOverride:
        weather === 'lluvia'
          ? 'Aunque es pleno día, la lluvia reduce la visibilidad en el valle. Aprovecha para consultar tus misiones y el Bestiario bajo resguardo.'
          : undefined,
    };
  }

  // Mercader Kael
  if (isNight || isStorm) {
    return {
      statusLabel:
        weather === 'tormenta_ceniza'
          ? 'Refugio de Ceniza · Junto al Fuego'
          : weather === 'nieve'
          ? 'Resguardo Invernal · Plaza'
          : isNight
          ? 'Refugio Nocturno · Junto al Fuego'
          : 'Resguardo por Lluvia · Plaza',
      greetingOverride:
        weather === 'tormenta_ceniza'
          ? 'Las brasas de la tormenta de ceniza amenazan con prender las lonas de mi carreta. Aprovecha mis pociones antes de salir al páramo.'
          : weather === 'nieve'
          ? '¡Qué helada está cayendo! He acercado el carro al calor de los braseros para que no se congelen los elixires.'
          : weather === 'lluvia'
          ? 'Con esta lluvia he acercado la carreta al calor del Santuario para que no se humedezcan los elixires. Aun así, el comercio no se detiene para un cliente decidido.'
          : 'De noche no me alejo del fuego ni de la luz de Valen. Los Espectros rondan demasiado cerca del muro... dime qué provisiones necesitas rápido.',
    };
  }
  return {
    statusLabel: 'Puesto Abierto · Comercio Diurno',
  };
}

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: 'receta_pocion_vida',
    name: 'Poción de Vitalidad',
    category: 'Alquimia',
    description: 'Destila hojas de Hierba Solar para obtener una poción curativa clásica (+55 HP).',
    resultItemId: 'pocion_vida',
    resultQuantity: 1,
    ingredients: [{ itemId: 'hierba_solar', quantity: 2 }],
  },
  {
    id: 'receta_elixir_mana',
    name: 'Elixir de Éter Azul',
    category: 'Alquimia',
    description: 'Infusiona pétalos de Flor Etérea para restaurar reserva mágica (+45 Maná).',
    resultItemId: 'elixir_mana',
    resultQuantity: 1,
    ingredients: [{ itemId: 'flor_eterea', quantity: 2 }],
  },
  {
    id: 'receta_pocion_superior',
    name: 'Poción Superior de Vitalidad',
    category: 'Alquimia',
    description:
      'Combina plantas medicinales y energía rúnica para crear una poción intensa (+120 HP, +20 Maná).',
    resultItemId: 'pocion_gran_vitalidad',
    resultQuantity: 1,
    ingredients: [
      { itemId: 'hierba_solar', quantity: 2 },
      { itemId: 'flor_eterea', quantity: 1 },
      { itemId: 'runa_menor', quantity: 1 },
    ],
    goldCost: 10,
  },
  {
    id: 'receta_elixir_dual',
    name: 'Elixir Dual del Velo',
    category: 'Alquimia',
    description:
      'Alquimia avanzada con Runa Ígnea que recupera salud y maná por igual (+85 HP y +85 Maná).',
    resultItemId: 'elixir_supremo_velo',
    resultQuantity: 1,
    ingredients: [
      { itemId: 'hierba_solar', quantity: 2 },
      { itemId: 'flor_eterea', quantity: 2 },
      { itemId: 'runa_ignea', quantity: 1 },
    ],
    goldCost: 20,
  },
  {
    id: 'receta_mejorar_espada_guardia',
    name: 'Templar Espada de Guardia',
    category: 'Forja y Mejora',
    description:
      'Refuerza una Espada de Guardia con piel curtida y una runa menor, elevando su daño, fuerza y crítico.',
    resultItemId: 'espada_templada',
    resultQuantity: 1,
    ingredients: [
      { itemId: 'espada_hierro', quantity: 1 },
      { itemId: 'piel_curtida', quantity: 2 },
      { itemId: 'runa_menor', quantity: 1 },
    ],
    goldCost: 15,
    acceptsEquippedWeapon: true,
  },
  {
    id: 'receta_mejorar_hoja_alba',
    name: 'Ascender Hoja Rúnica del Alba',
    category: 'Forja y Mejora',
    description:
      'Imbuye la Hoja Rúnica del Alba con runas solares e ígneas para desatar todo su potencial crítico.',
    resultItemId: 'hoja_alba_ascendida',
    resultQuantity: 1,
    ingredients: [
      { itemId: 'hoja_alba', quantity: 1 },
      { itemId: 'runa_menor', quantity: 2 },
      { itemId: 'runa_ignea', quantity: 1 },
    ],
    goldCost: 40,
    acceptsEquippedWeapon: true,
  },
  {
    id: 'receta_mejorar_obsidiana',
    name: 'Forjar Segadora Rúnica de Obsidiana',
    category: 'Forja y Mejora',
    description:
      'Transforma la Segadora de Obsidiana con pieles endurecidas y doble runa volcánica en un arma legendaria.',
    resultItemId: 'segadora_runica',
    resultQuantity: 1,
    ingredients: [
      { itemId: 'hacha_obsidiana', quantity: 1 },
      { itemId: 'piel_curtida', quantity: 2 },
      { itemId: 'runa_ignea', quantity: 2 },
    ],
    goldCost: 80,
    acceptsEquippedWeapon: true,
  },
];

export const LORE_CODEX_CATALOG: LoreEntryDefinition[] = [
  {
    id: 'lore_fundacion',
    title: 'Acta Fundacional del Bastión',
    chapter: 'Historia del Bastión',
    zone: 'Santuario del Bastión',
    sourceType: 'object',
    sourceLabel: 'Atril del Santuario (Objeto 3D)',
    discoveryHint: 'Examina el atril luminoso al norte de la plaza del Santuario del Bastión [E].',
    excerpt: 'Primer registro de la Orden tras la grieta inicial del Velo en el Valle.',
    body: [
      'En el cuadragésimo año del Eclipse Gris, los arquitectos de la Primera Vigilia erigieron la plaza circular del Bastión sobre la veta de cuarzo azul más estable del valle.',
      'Mientras las colinas exteriores quedaban expuestas a los ecos del Velo, el cristal central canalizó una barrera serena capaz de restaurar el vigor de todo centinela que jurase proteger las puertas del norte.',
    ],
    xpReward: 25,
  },
  {
    id: 'lore_estandarte',
    title: 'Estela de la Primera Guardia',
    chapter: 'Reliquias Escritas',
    zone: 'Atrio Antiguo',
    sourceType: 'object',
    sourceLabel: 'Estela del Atrio (Objeto 3D)',
    discoveryHint: 'Cruza el Portón del Atrio Antiguo y examina la estela grabada al este del patio [E].',
    excerpt: 'Inscripción marcial que revela el destino de los Centinelas Óseos.',
    body: [
      '«Ningún escudo cederá mientras quede un aliento en el Atrio.» Así ordenó el Comandante Varek antes de sellar el Portón de Roble frente a la marea espectral.',
      'Cuando el Velo saturó los losas de piedra, sus juramentos quedaron anclados a sus armaduras. Hoy custodian mecánicamente el paso, incapaces de distinguir entre invasores y aliados.',
    ],
    xpReward: 40,
  },
  {
    id: 'lore_sombras',
    title: 'Diario del Cartógrafo Etéreo',
    chapter: 'Reliquias Escritas',
    zone: 'Santuario Sombrío',
    sourceType: 'object',
    sourceLabel: 'Manuscrito Sombrío (Objeto 3D)',
    discoveryHint: 'Explora el borde oriental del Santuario Sombrío al oeste e interactúa con el atril [E].',
    excerpt: 'Notas fragmentadas sobre el origen de los Espectros del Velo.',
    body: [
      'Día 19: Las brújulas dejan de apuntar al Altar Carmesí en cuanto uno supera las columnas occidentales. El aire susurra fórmulas arcanas que nadie ha pronunciado en siglos.',
      'Sospecho que los Espectros no llegaron desde fuera de la grieta: son los propios eruditos de la torre oeste, disueltos en luz violeta por intentar medir el Velo sin sellos protectores.',
    ],
    xpReward: 50,
  },
  {
    id: 'lore_forja_crater',
    title: 'Tablilla del Crisol Basáltico',
    chapter: 'Reliquias Escritas',
    zone: 'Cráter Basáltico',
    sourceType: 'object',
    sourceLabel: 'Tablilla del Cráter (Objeto 3D)',
    discoveryHint: 'Adéntrate en el Cráter Basáltico al este y lee la tablilla volcánica [E].',
    excerpt: 'Tratado de los herreros antiguos sobre la creación de los Gólems de Obsidiana.',
    body: [
      'El magma que brotó bajo el flanco oriental amenazaba con fundir los cimientos del Atrio. Para contenerlo, los maestros forjadores tallaron corazones de runas ígneas dentro de bloques de basalto.',
      'Cada Gólem de Obsidiana nació como una caldera viviente. Al caer uno en combate, sus fragmentos aún conservan el calor necesario para templar armas legendarias en la forja.',
    ],
    xpReward: 60,
  },
  {
    id: 'lore_area_ruinas',
    title: 'La Caída de la Muralla Exterior',
    chapter: 'Crónicas de Zona',
    zone: 'Ruinas Exteriores',
    sourceType: 'area',
    sourceLabel: 'Completar Área: Ruinas Exteriores',
    discoveryHint: 'Completa la misión "Limpieza de las Ruinas Exteriores" derrotando 3 Goblins.',
    excerpt: 'Cómo los clanes de goblins ocuparon las torres de vigilancia tras el abandono.',
    body: [
      'Con la retirada de los últimos exploradores hacia el Santuario interior, las murallas periféricas quedaron reducidas a columnas caídas y cofres olvidados entre la maleza.',
      'Los Goblins Merodeadores aprovecharon la confusión para establecer campamentos entre las ruinas, recolectando hierba solar y esquirlas metálicas sin comprender el poder que dormía bajo sus pies.',
    ],
    xpReward: 45,
  },
  {
    id: 'lore_area_atrio',
    title: 'Crónica del Portón Antiguo',
    chapter: 'Crónicas de Zona',
    zone: 'Atrio Antiguo',
    sourceType: 'area',
    sourceLabel: 'Descubrir Área: Atrio Antiguo',
    discoveryHint: 'Abre el Portón del Atrio Antiguo al norte y adéntrate en el patio de piedra.',
    excerpt: 'El umbral ceremonial que separaba la academia del Santuario del Altar Superior.',
    body: [
      'En tiempos de paz, el Atrio Antiguo recibía a los peregrinos con antorchas encendidas y cantos de sintonización. Sus columnas aún conservan las marcas de los estandartes del Gremio.',
      'Cruzar el portón marca el punto en que la luz protectora del Bastión cede ante la intemperie del valle y el dominio de los no-muertos.',
    ],
    xpReward: 35,
  },
  {
    id: 'lore_area_crater',
    title: 'El Despertar del Cráter',
    chapter: 'Crónicas de Zona',
    zone: 'Cráter Basáltico',
    sourceType: 'area',
    sourceLabel: 'Descubrir Área: Cráter Basáltico',
    discoveryHint: 'Explora la región volcánica del Cráter Basáltico al noreste del valle.',
    excerpt: 'Registro geológico de la fractura térmica provocada por el descenso del Wyvern.',
    body: [
      'El Cráter Basáltico no existía antes de la Segunda Ruptura. El impacto incandescente de una bestia dracónica abrió el suelo hasta exponer vetas de obsidiana pura.',
      'Desde entonces, las cenizas ascienden en espiral hacia el cielo, tiñendo las nubes y alimentando las runas ígneas que buscan los herreros más audaces.',
    ],
    xpReward: 45,
  },
  {
    id: 'lore_area_altar',
    title: 'Cenizas del Altar Carmesí',
    chapter: 'Historia del Bastión',
    zone: 'Altar del Wyvern',
    sourceType: 'area',
    sourceLabel: 'Completar Área: Altar del Wyvern',
    discoveryHint: 'Derrota al jefe Wyvern de Ceniza en el extremo norte del Valle.',
    excerpt: 'El cierre del ciclo ígneo sobre el punto más alto del Valle del Velo.',
    body: [
      'Cuando el Wyvern de Ceniza anidó en el Altar del Norte, la presión arcana del Velo alcanzó su punto crítico. Su aliento mantenía en vela a los constructos y espectros de todo el valle.',
      'Al caer el señor dracónico frente al acero y la magia de un nuevo campeón, las brasas del altar se apaciguan temporalmente, permitiendo al Bastión respirar y restaurar sus antiguas rutas.',
    ],
    xpReward: 100,
  },
];

export const JOURNAL_POI_CATALOG: JournalPoiDefinition[] = [
  {
    id: 'poi_zone_bastion',
    title: 'Plaza del Santuario del Bastión',
    category: 'Zona',
    zoneName: 'Santuario del Bastión',
    x: 0,
    z: 4,
    discoveryHint: 'Punto de partida en la plaza circular del Bastión.',
    fieldNote:
      'Centro fortificado del valle. Sus losas de piedra y braseros encendidos ofrecen resguardo frente a las criaturas del Velo.',
  },
  {
    id: 'poi_zone_ruinas',
    title: 'Senderos de las Ruinas Exteriores',
    category: 'Zona',
    zoneName: 'Ruinas Exteriores',
    x: -14,
    z: 14,
    discoveryHint: 'Abandona la plaza central hacia el anillo exterior del valle.',
    fieldNote:
      'Columnas derribadas, cofres olvidados y patrullas de goblins que vigilan los linderos boscosos del valle.',
  },
  {
    id: 'poi_zone_atrio',
    title: 'Patio del Atrio Antiguo',
    category: 'Zona',
    zoneName: 'Atrio Antiguo',
    x: 0,
    z: -16,
    discoveryHint: 'Cruza el Portón norte hacia el patio ceremonial del Atrio Antiguo.',
    fieldNote:
      'Antesala de la antigua academia. Los Esqueletos Centinela patrullan entre pilares erosionados por el viento.',
  },
  {
    id: 'poi_zone_sombrio',
    title: 'Brumas del Santuario Sombrío',
    category: 'Zona',
    zoneName: 'Santuario Sombrío',
    x: -20,
    z: -6,
    discoveryHint: 'Explora el flanco occidental del valle más allá de las columnas caídas.',
    fieldNote:
      'Sector envuelto en resonancias violetas donde flotan los Espectros del Velo entre vestigios arcanos.',
  },
  {
    id: 'poi_zone_crater',
    title: 'Grieta del Cráter Basáltico',
    category: 'Zona',
    zoneName: 'Cráter Basáltico',
    x: 16,
    z: -22,
    discoveryHint: 'Adéntrate en la región oriental al noreste del Atrio Antiguo.',
    fieldNote:
      'Cuenca de basalto negro fracturada por el impacto dracónico y custodiada por Gólems de Obsidiana.',
  },
  {
    id: 'poi_zone_altar',
    title: 'Cumbre del Altar del Wyvern',
    category: 'Zona',
    zoneName: 'Altar del Wyvern (Norte)',
    x: 0,
    z: -38,
    discoveryHint: 'Atraviesa la Puerta del Altar Carmesí en el extremo norte.',
    fieldNote:
      'Santuario superior en ruinas dominado por el Wyvern de Ceniza, fuente de la inestabilidad ígnea del norte.',
  },
  {
    id: 'poi_shrine_atrio',
    title: 'Santuario del Atrio',
    category: 'Santuario',
    zoneName: 'Atrio Antiguo',
    x: -4.5,
    z: -18,
    discoveryHint: 'Sintoniza [E] el monolito rúnico situado al oeste del Atrio Antiguo.',
    fieldNote:
      'Baliza de viaje rápido que reconecta la ruta norte con la plaza segura del Bastión.',
  },
  {
    id: 'poi_shrine_sombrio',
    title: 'Santuario Sombrío',
    category: 'Santuario',
    zoneName: 'Santuario Sombrío',
    x: -20,
    z: -10,
    discoveryHint: 'Sintoniza [E] el cristal latente en el corazón del Santuario Sombrío.',
    fieldNote:
      'Piedra de paso estabilizada entre la niebla violeta del sector occidental.',
  },
  {
    id: 'poi_shrine_crater',
    title: 'Santuario del Cráter',
    category: 'Santuario',
    zoneName: 'Cráter Basáltico',
    x: 15,
    z: -22,
    discoveryHint: 'Activa [E] el santuario enclavado en la ladera del Cráter Basáltico.',
    fieldNote:
      'Refugio energético sobre roca volcánica que permite regresar al instante para forjar y abastecerse.',
  },
  {
    id: 'poi_shrine_altar',
    title: 'Santuario del Altar Carmesí',
    category: 'Santuario',
    zoneName: 'Altar del Wyvern',
    x: -6,
    z: -35,
    discoveryHint: 'Activa [E] el santuario situado junto a la entrada del Altar Norte.',
    fieldNote:
      'Último punto de enlace antes del enfrentamiento con el señor dracónico del valle.',
  },
  {
    id: 'poi_lore_fundacion',
    title: 'Atril del Acta Fundacional',
    category: 'Reliquia',
    zoneName: 'Santuario del Bastión',
    x: 2.2,
    z: -3.2,
    discoveryHint: 'Examina [E] el atril iluminado al norte del Santuario del Bastión.',
    fieldNote:
      'Monumento de bronce y pergamino que conmemora la creación de la Primera Vigilia.',
  },
  {
    id: 'poi_lore_estandarte',
    title: 'Estela de la Primera Guardia',
    category: 'Reliquia',
    zoneName: 'Atrio Antiguo',
    x: 6.4,
    z: -13.5,
    discoveryHint: 'Examina [E] la estela grabada al este tras cruzar el Portón del Atrio.',
    fieldNote:
      'Bloque conmemorativo erigido en honor de los defensores que sellaron el paso norte.',
  },
  {
    id: 'poi_lore_sombras',
    title: 'Atril del Cartógrafo Etéreo',
    category: 'Reliquia',
    zoneName: 'Santuario Sombrío',
    x: -16.5,
    z: -5.5,
    discoveryHint: 'Inspecciona [E] el manuscrito en el borde este del Santuario Sombrío.',
    fieldNote:
      'Mesa de campaña abandonada con anotaciones magnéticas distorsionadas por el Velo.',
  },
  {
    id: 'poi_lore_forja_crater',
    title: 'Tablilla del Crisol Basáltico',
    category: 'Reliquia',
    zoneName: 'Cráter Basáltico',
    x: 13.5,
    z: -28.0,
    discoveryHint: 'Lee [E] la tablilla volcánica en la parte sur del Cráter Basáltico.',
    fieldNote:
      'Registro tallado en piedra térmica por los antiguos maestros herreros del cráter.',
  },
  {
    id: 'poi_zone_bosque_sur',
    title: 'Senderos del Bosque Susurrante',
    category: 'Zona',
    zoneName: 'Bosque Susurrante (Sur)',
    x: 0,
    z: 74,
    discoveryHint: 'Avanza hacia el sur más allá de las Ruinas Exteriores hasta los pinares densos.',
    fieldNote:
      'Vasto bosque meridional de pinos milenarios rico en hierbas solares y patrullado por bandas de goblins.',
  },
  {
    id: 'poi_zone_paramo_este',
    title: 'Horizonte del Páramo de Ceniza',
    category: 'Zona',
    zoneName: 'Páramo de Ceniza (Este)',
    x: 76,
    z: -12,
    discoveryHint: 'Explora la frontera oriental más allá del Cráter Basáltico.',
    fieldNote:
      'Planicie reseca de ceniza volcánica y monolitos negros donde vagan Gólems de Obsidiana.',
  },
  {
    id: 'poi_zone_bruma_oeste',
    title: 'Monolitos de la Bruma Occidental',
    category: 'Zona',
    zoneName: 'Bruma de Occidente (Oeste)',
    x: -76,
    z: -10,
    discoveryHint: 'Cruza la frontera oeste pasando el Santuario Sombrío.',
    fieldNote:
      'Páramos envueltos en niebla violácea donde los espectros custodian antiguos pilares derruidos.',
  },
  {
    id: 'poi_zone_tierras_altas',
    title: 'Cumbres de las Tierras Altas',
    category: 'Zona',
    zoneName: 'Tierras Altas del Norte',
    x: 0,
    z: -84,
    discoveryHint: 'Sube por las crestas septentrionales detrás del Altar del Wyvern.',
    fieldNote:
      'Escarpadas tierras altas batidas por el viento gélido y vetas de piedra lunar.',
  },
  {
    id: 'poi_shrine_bosque_sur',
    title: 'Santuario del Bosque Susurrante',
    category: 'Santuario',
    zoneName: 'Bosque Susurrante (Sur)',
    x: 12,
    z: 82,
    discoveryHint: 'Activa [E] el monolito oculto en los pinares del Bosque Susurrante (Sur).',
    fieldNote:
      'Baliza arcana del sur que conecta los bosques lejanos directamente con el Santuario del Bastión.',
  },
  {
    id: 'poi_shrine_paramo_este',
    title: 'Santuario del Páramo de Ceniza',
    category: 'Santuario',
    zoneName: 'Páramo de Ceniza (Este)',
    x: 84,
    z: -18,
    discoveryHint: 'Activa [E] el santuario erigido entre las rocas del Páramo de Ceniza (Este).',
    fieldNote:
      'Estación de viaje rápido anclada sobre lava solidificada en la frontera oriental.',
  },
  {
    id: 'poi_shrine_bruma_oeste',
    title: 'Santuario de la Bruma Occidental',
    category: 'Santuario',
    zoneName: 'Bruma de Occidente (Oeste)',
    x: -84,
    z: -12,
    discoveryHint: 'Activa [E] el santuario entre la niebla violeta de Occidente.',
    fieldNote:
      'Faro rúnico occidental que estabiliza las rutas a través de las brumas del Velo.',
  },
  {
    id: 'poi_shrine_tierras_altas',
    title: 'Santuario de las Tierras Altas',
    category: 'Santuario',
    zoneName: 'Tierras Altas del Norte',
    x: -10,
    z: -92,
    discoveryHint: 'Activa [E] el santuario en la cresta de las Tierras Altas del Norte.',
    fieldNote:
      'Mirador elevado que marca el límite septentrional cartografiado del Valle del Velo.',
  },
];

export const TITLES_CATALOG: PlayerTitleDefinition[] = [
  {
    id: 'titulo_iniciado',
    name: 'del Bastión',
    sourceType: 'inicial',
    sourceLabel: 'Rango Inicial',
    requirementText: 'Disponible al comenzar tu aventura en el Santuario.',
    description: 'Emblema básico de los exploradores juramentados de la Primera Vigilia.',
    colorClass: 'text-stone-300',
  },
  {
    id: 'titulo_matamonstruos',
    name: 'Cazador de Sombras',
    sourceType: 'logro',
    sourceLabel: 'Logro: Primer Monstruo Derrotado',
    requirementText: 'Derrota a tu primer monstruo en el Valle del Velo.',
    description: 'Otorgado a quienes derraman por primera vez sangre de las criaturas del Velo.',
    colorClass: 'text-emerald-300',
    requiredAchievementId: 'primer_monstruo',
  },
  {
    id: 'titulo_ruinas',
    name: 'Centinela de Ruinas',
    sourceType: 'mision',
    sourceLabel: 'Misión: Limpieza de las Ruinas Exteriores',
    requirementText: 'Completa y reclama la misión "Limpieza de las Ruinas Exteriores".',
    description: 'Reconocimiento del Archivista Valen por despejar los senderos cercanos al Bastión.',
    colorClass: 'text-emerald-300',
    requiredQuestId: 'mision_ruinas',
  },
  {
    id: 'titulo_mercader',
    name: 'Socio del Gremio',
    sourceType: 'logro',
    sourceLabel: 'Logro: Comerciante del Santuario',
    requirementText: 'Completa 3 operaciones de compra o venta con el Mercader Kael.',
    description: 'Distinción comercial por sostener el abastecimiento del Santuario.',
    colorClass: 'text-amber-300',
    requiredAchievementId: 'patrocinador_gremio',
  },
  {
    id: 'titulo_caminante',
    name: 'Caminante Rúnico',
    sourceType: 'logro',
    sourceLabel: 'Logro: Red del Caminante',
    requirementText: 'Activa 3 Santuarios de Viaje Rápido en el valle.',
    description: 'Título reservado para viajeros capaces de sintonizar la red arcana del valle.',
    colorClass: 'text-sky-300',
    requiredAchievementId: 'red_santuarios',
  },
  {
    id: 'titulo_investigador',
    name: 'Cronista del Valle',
    sourceType: 'mision',
    sourceLabel: 'Misión: El Códice del Investigador',
    requirementText: 'Completa y reclama la misión "El Códice del Investigador".',
    description: 'Condecoración académica por documentar el comportamiento de las criaturas.',
    colorClass: 'text-sky-300',
    requiredQuestId: 'mision_bestiario',
  },
  {
    id: 'titulo_erudito',
    name: 'Erudito del Velo',
    sourceType: 'logro',
    sourceLabel: 'Logro: Bestiario completado al 50%',
    requirementText: 'Alcanza al menos un 50% de progreso global en el Bestiario.',
    description: 'Mención honorífica por el estudio sistemático de debilidades monstruosas.',
    colorClass: 'text-indigo-300',
    requiredAchievementId: 'bestiario_50',
  },
  {
    id: 'titulo_atrio',
    name: 'Rompedor del Atrio',
    sourceType: 'mision',
    sourceLabel: 'Misión: Ecos del Atrio Antiguo',
    requirementText: 'Completa y reclama la misión "Ecos del Atrio Antiguo".',
    description: 'Honra a quienes purgaron el patio ceremonial de no-muertos y espectros.',
    colorClass: 'text-amber-300',
    requiredQuestId: 'mision_centinelas',
  },
  {
    id: 'titulo_crater',
    name: 'Forjador de Obsidiana',
    sourceType: 'mision',
    sourceLabel: 'Misión Oculta: El Núcleo del Cráter',
    requirementText: 'Completa la misión secreta del Cráter Basáltico otorgada por Valen.',
    description: 'Título secreto conferido únicamente a quienes silenciaron los núcleos del cráter.',
    colorClass: 'text-orange-300',
    requiredQuestId: 'mision_oculta_crater',
  },
  {
    id: 'titulo_veterano',
    name: 'Veterano del Bastión',
    sourceType: 'logro',
    sourceLabel: 'Logro: Nivel 10 alcanzado',
    requirementText: 'Alcanza el Nivel 10 de personaje.',
    description: 'Sello de maestría para aventureros curtidos en todas las disciplinas del valle.',
    colorClass: 'text-amber-300',
    requiredAchievementId: 'nivel_10',
  },
  {
    id: 'titulo_matadragones',
    name: 'Azote del Wyvern',
    sourceType: 'logro',
    sourceLabel: 'Logro: Señor Caído del Altar',
    requirementText: 'Derrota al jefe Wyvern de Ceniza en el Altar del Norte.',
    description: 'Gloria máxima grabada en bronce tras abatir al señor dracónico del valle.',
    colorClass: 'text-rose-300',
    requiredAchievementId: 'matadragones_altar',
  },
  {
    id: 'titulo_heroe',
    name: 'Leyenda del Santuario',
    sourceType: 'logro',
    sourceLabel: 'Logro: Héroe del Santuario',
    requirementText: 'Completa y reclama las 4 misiones principales del Archivista Valen.',
    description: 'El mayor honor del Bastión para el salvador definitivo del Valle del Velo.',
    colorClass: 'text-[#f3e6c8]',
    requiredAchievementId: 'heroe_santuario',
  },
];

export function getUnlockedTitleIds(
  unlockedAchievements: Record<string, number>,
  quests: Quest[]
): string[] {
  const completedQuestIds = new Set(
    quests.filter((q) => q.status === 'completada').map((q) => q.id)
  );
  return TITLES_CATALOG.filter((t) => {
    if (t.sourceType === 'inicial') return true;
    if (t.requiredAchievementId) return Boolean(unlockedAchievements[t.requiredAchievementId]);
    if (t.requiredQuestId) return completedQuestIds.has(t.requiredQuestId);
    return false;
  }).map((t) => t.id);
}

// ============================================================
// SISTEMA DE CLANES Y NPCS RESCATADOS
// ============================================================

export const CLAN_NPCS_CATALOG: ClanNpcDefinition[] = [
  {
    id: 'clan_lyra',
    name: 'Lyra la Herborista',
    title: 'Botánica del Valle',
    preferredRole: 'alquimista',
    rescueZone: 'Ruinas Exteriores Oeste',
    rescueCoords: { x: -9.5, z: 13.5 },
    baseCoords: { x: -5.4, z: 6.2, rotY: 0.9 },
    rescueDialog:
      '¡Gracias por ahuyentar a las criaturas! Llevaba días atrapada entre estas ruinas con mis alforjas de hierbas. Si me invitas a tu base en el Santuario, destilaré extractos y potenciaré tus pociones.',
    specialtyNote: 'Especialista Alquimista (+50% regeneración, +1 hierba extra y +10% duración adicional).',
    cloakHex: 0x166534,
    accentHex: 0x34d399,
  },
  {
    id: 'clan_garrick',
    name: 'Sargento Garrick',
    title: 'Veterano de la Guardia',
    preferredRole: 'guardia',
    rescueZone: 'Atrio Antiguo Este',
    rescueCoords: { x: 11.5, z: -14.5 },
    baseCoords: { x: -6.8, z: 1.8, rotY: 1.3 },
    rescueDialog:
      'Pensé que los Centinelas Óseos cerrarían el paso para siempre. Me debes una buena batalla, compañero. Invítame a tu base del Bastión y reforzaré las defensas y patrullas del clan.',
    specialtyNote: 'Especialista Guardia (+50% defensa, ataque, salud y oro por patrulla).',
    cloakHex: 0x475569,
    accentHex: 0xf59e0b,
  },
  {
    id: 'clan_seraphina',
    name: 'Escriba Seraphina',
    title: 'Cronista del Velo',
    preferredRole: 'historiador',
    rescueZone: 'Santuario Sombrío',
    rescueCoords: { x: -23.5, z: -13.0 },
    baseCoords: { x: -4.2, z: -2.4, rotY: 0.65 },
    rescueDialog:
      'La niebla astral casi apaga mi linterna mientras copiaba las estelas antiguas. Si me das refugio en tu clan, catalogaré hallazgos del Bestiario y generaré sabiduría pasiva.',
    specialtyNote: 'Especialista Historiadora (+50% crítico, inteligencia, XP y estudio del Bestiario).',
    cloakHex: 0x312e81,
    accentHex: 0x38bdf8,
  },
];

export const INITIAL_CLAN_MEMBERS: ClanMemberState[] = CLAN_NPCS_CATALOG.map((npc) => ({
  id: npc.id,
  rescued: false,
  invited: false,
  role: 'ninguno',
}));

export const CLAN_ROLE_INFO: Record<
  Exclude<ClanRole, 'ninguno'>,
  {
    label: string;
    statSummary: string;
    resourceSummary: string;
    toneClass: string;
  }
> = {
  guardia: {
    label: 'Guardia',
    statSummary: '+4 Defensa, +2 Daño Mín./Máx., +20 Salud Máx.',
    resourceSummary: '+4 Oro cada 25s de patrulla segura',
    toneClass: 'text-amber-300',
  },
  alquimista: {
    label: 'Alquimista',
    statSummary: '+0.6 Regen. HP/s, +0.6 Regen. Maná/s, +15 Maná Máx.',
    resourceSummary: '1 Hierba o Extracto cada 25s y +20% duración de pociones',
    toneClass: 'text-emerald-300',
  },
  historiador: {
    label: 'Historiador',
    statSummary: '+4% Prob. Crítica, +12% Daño Crítico, +3 Inteligencia',
    resourceSummary: '+12 XP, +2 Oro y +3 Estudio del Bestiario cada 25s',
    toneClass: 'text-sky-300',
  },
};

export function computeClanBonuses(members: ClanMemberState[]): ClanComputedBonuses {
  const statBonuses: ItemBonuses = {
    danoMin: 0,
    danoMax: 0,
    defensa: 0,
    maxHp: 0,
    maxMana: 0,
    regenHp: 0,
    regenMana: 0,
    probCritico: 0,
    danoCritico: 0,
    inteligencia: 0,
  };
  let goldPerCycle = 0;
  let xpPerCycle = 0;
  let studyPointsPerCycle = 0;
  let herbsPerCycle = 0;
  let alchemyDurationMult = 1;
  let activeGuards = 0;
  let activeAlchemists = 0;
  let activeHistorians = 0;

  members.forEach((m) => {
    if (!m.rescued || !m.invited || m.role === 'ninguno') return;
    const def = CLAN_NPCS_CATALOG.find((c) => c.id === m.id);
    if (!def) return;
    const isSpec = def.preferredRole === m.role;
    const mult = isSpec ? 1.5 : 1.0;

    if (m.role === 'guardia') {
      activeGuards += 1;
      statBonuses.defensa = (statBonuses.defensa ?? 0) + Math.round(4 * mult);
      statBonuses.danoMin = (statBonuses.danoMin ?? 0) + Math.round(2 * mult);
      statBonuses.danoMax = (statBonuses.danoMax ?? 0) + Math.round(2 * mult);
      statBonuses.maxHp = (statBonuses.maxHp ?? 0) + Math.round(20 * mult);
      goldPerCycle += Math.round(4 * mult);
    } else if (m.role === 'alquimista') {
      activeAlchemists += 1;
      statBonuses.regenHp = Number(((statBonuses.regenHp ?? 0) + 0.6 * mult).toFixed(2));
      statBonuses.regenMana = Number(((statBonuses.regenMana ?? 0) + 0.6 * mult).toFixed(2));
      statBonuses.maxMana = (statBonuses.maxMana ?? 0) + Math.round(15 * mult);
      herbsPerCycle += isSpec ? 2 : 1;
      alchemyDurationMult += isSpec ? 0.3 : 0.2;
    } else if (m.role === 'historiador') {
      activeHistorians += 1;
      statBonuses.probCritico = (statBonuses.probCritico ?? 0) + Math.round(4 * mult);
      statBonuses.danoCritico = (statBonuses.danoCritico ?? 0) + Math.round(12 * mult);
      statBonuses.inteligencia = (statBonuses.inteligencia ?? 0) + Math.round(3 * mult);
      xpPerCycle += Math.round(12 * mult);
      goldPerCycle += 2;
      studyPointsPerCycle += isSpec ? 5 : 3;
    }
  });

  return {
    statBonuses,
    goldPerCycle,
    xpPerCycle,
    studyPointsPerCycle,
    herbsPerCycle,
    alchemyDurationMult: Number(alchemyDurationMult.toFixed(2)),
    activeGuards,
    activeAlchemists,
    activeHistorians,
  };
}

// ============================================================
// SISTEMA DE ALQUIMIA AVANZADA (HIERBAS, EXTRACTOS Y BUFFS)
// ============================================================

export const ALCHEMY_INGREDIENT_IDS: string[] = [
  'hierba_solar',
  'flor_eterea',
  'raiz_lunaria',
  'extracto_goblin',
  'extracto_espectral',
  'extracto_ceniza',
];

export const ALCHEMY_FORMULAS: AlchemyFormula[] = [
  {
    id: 'alq_furia_solar',
    name: 'Tónico de Furia Solar',
    resultItemId: 'pocion_furia_solar',
    resultQuantity: 1,
    category: 'Combate',
    description: 'Combina Hierba Solar con Extracto Silvestre para aumentar daño, fuerza y probabilidad crítica durante 60s.',
    ingredients: [
      { itemId: 'hierba_solar', quantity: 2 },
      { itemId: 'extracto_goblin', quantity: 1 },
    ],
  },
  {
    id: 'alq_piel_basaltica',
    name: 'Ungüento de Piel Basáltica',
    resultItemId: 'pocion_piel_basaltica',
    resultQuantity: 1,
    category: 'Defensa',
    description: 'Combina Hierba Solar, Raíz de Loto Lunar y Extracto Silvestre para ganar +9 Defensa y regeneración sostenida durante 75s.',
    ingredients: [
      { itemId: 'hierba_solar', quantity: 1 },
      { itemId: 'raiz_lunaria', quantity: 1 },
      { itemId: 'extracto_goblin', quantity: 1 },
    ],
  },
  {
    id: 'alq_paso_etereo',
    name: 'Elixir de Paso Etéreo',
    resultItemId: 'pocion_paso_etereo',
    resultQuantity: 1,
    category: 'Movilidad',
    description: 'Mezcla Flor Etérea con Extracto Astral para obtener +2.6 m/s de velocidad, +6 Agilidad y +10% Crítico durante 65s.',
    ingredients: [
      { itemId: 'flor_eterea', quantity: 2 },
      { itemId: 'extracto_espectral', quantity: 1 },
    ],
  },
  {
    id: 'alq_lucidez_arcana',
    name: 'Infusión de Lucidez Arcana',
    resultItemId: 'pocion_lucidez_arcana',
    resultQuantity: 1,
    category: 'Arcano',
    description: 'Destila Flor Etérea, Raíz de Loto Lunar y Extracto Astral para multiplicar la regeneración de maná durante 80s.',
    ingredients: [
      { itemId: 'flor_eterea', quantity: 1 },
      { itemId: 'raiz_lunaria', quantity: 2 },
      { itemId: 'extracto_espectral', quantity: 1 },
    ],
  },
  {
    id: 'alq_sangre_inmortal',
    name: 'Brebaje de Sangre Regenerativa',
    resultItemId: 'pocion_sangre_inmortal',
    resultQuantity: 1,
    category: 'Combate',
    description: 'Fórmula ígnea con Extracto Basáltico que otorga +6 HP/s, +12 Daño y +25% Daño Crítico durante 90s.',
    ingredients: [
      { itemId: 'hierba_solar', quantity: 2 },
      { itemId: 'raiz_lunaria', quantity: 1 },
      { itemId: 'extracto_ceniza', quantity: 1 },
    ],
  },
  {
    id: 'alq_panacea_lunar',
    name: 'Panacea Nocturna del Velo',
    resultItemId: 'pocion_panacea_lunar',
    resultQuantity: 1,
    category: 'Inmunidad',
    description: 'Combina flora astral y doble extracto para purificar debuffs e inmunizar contra veneno, quemadura y lentitud durante 75s.',
    ingredients: [
      { itemId: 'flor_eterea', quantity: 1 },
      { itemId: 'raiz_lunaria', quantity: 1 },
      { itemId: 'extracto_espectral', quantity: 1 },
      { itemId: 'extracto_ceniza', quantity: 1 },
    ],
  },
];

export const WORLD_HERB_NODES: {
  id: string;
  itemId: string;
  name: string;
  x: number;
  z: number;
  colorHex: number;
}[] = [
  { id: 'herb_1', itemId: 'hierba_solar', name: 'Brote de Hierba Solar', x: -6.5, z: 14.5, colorHex: 0xfacc15 },
  { id: 'herb_2', itemId: 'extracto_goblin', name: 'Glándula de Savia Silvestre', x: 11.5, z: 11.5, colorHex: 0x4ade80 },
  { id: 'herb_3', itemId: 'hierba_solar', name: 'Mata de Hierba Solar', x: 18.0, z: -2.0, colorHex: 0xfacc15 },
  { id: 'herb_4', itemId: 'raiz_lunaria', name: 'Raíz de Loto Lunar', x: -15.5, z: 4.5, colorHex: 0xcbd5e1 },
  { id: 'herb_5', itemId: 'flor_eterea', name: 'Flor Etérea Luminiscente', x: -20.5, z: -4.0, colorHex: 0xa78bfa },
  { id: 'herb_6', itemId: 'extracto_espectral', name: 'Condensado de Niebla Astral', x: -12.0, z: -19.0, colorHex: 0x38bdf8 },
  { id: 'herb_7', itemId: 'raiz_lunaria', name: 'Brote Lunar del Atrio', x: 9.5, z: -20.5, colorHex: 0xcbd5e1 },
  { id: 'herb_8', itemId: 'hierba_solar', name: 'Hierba Solar del Bosque', x: -10.5, z: 72.0, colorHex: 0xfacc15 },
  { id: 'herb_9', itemId: 'extracto_goblin', name: 'Savia Espesa del Sur', x: 22.0, z: 86.0, colorHex: 0x4ade80 },
  { id: 'herb_10', itemId: 'flor_eterea', name: 'Flor Etérea de Occidente', x: -76.0, z: -8.0, colorHex: 0xa78bfa },
  { id: 'herb_11', itemId: 'extracto_espectral', name: 'Rocío Astral de la Bruma', x: -94.0, z: 10.0, colorHex: 0x38bdf8 },
  { id: 'herb_12', itemId: 'extracto_ceniza', name: 'Resina de Ceniza Volcánica', x: 78.0, z: -26.0, colorHex: 0xfb923c },
  { id: 'herb_13', itemId: 'raiz_lunaria', name: 'Loto Lunar de las Tierras Altas', x: 8.0, z: -86.0, colorHex: 0xcbd5e1 },
];

// ============================================================
// DIFICULTAD, RAZAS, CLASES Y RENACIMIENTO (DRAGONES)
// ============================================================

export const DIFFICULTIES_CATALOG: DifficultyDefinition[] = [
  {
    id: 'normal',
    name: 'Normal',
    subtitle: 'Travesía Clásica',
    description: 'Equilibrio estándar del Valle del Velo. Ideal para explorar los primeros biomas.',
    hpMult: 1.0,
    atkMult: 1.0,
    speedMult: 1.0,
    xpMult: 1.0,
    goldMult: 1.0,
    heartDropBonus: 0,
    colorClass: 'text-stone-200',
    badgeClass: 'bg-stone-800/80 border-stone-600/60 text-stone-200',
  },
  {
    id: 'dificil',
    name: 'Difícil',
    subtitle: 'Desafío de Veterano',
    description: 'Enemigos más resistentes y veloces con mayor botín de experiencia y oro.',
    hpMult: 1.65,
    atkMult: 1.45,
    speedMult: 1.08,
    xpMult: 1.6,
    goldMult: 1.45,
    heartDropBonus: 0.06,
    colorClass: 'text-amber-300',
    badgeClass: 'bg-amber-950/60 border-amber-500/55 text-amber-300',
  },
  {
    id: 'pesadilla',
    name: 'Pesadilla',
    subtitle: 'Ecos Corrompidos',
    description: 'Criaturas implacables pensadas para builds optimizadas con talentos y alquimia.',
    hpMult: 2.9,
    atkMult: 2.1,
    speedMult: 1.15,
    xpMult: 2.8,
    goldMult: 2.1,
    heartDropBonus: 0.12,
    colorClass: 'text-orange-300',
    badgeClass: 'bg-orange-950/60 border-orange-500/60 text-orange-300',
  },
  {
    id: 'abismal',
    name: 'Abismal',
    subtitle: 'Velo Desgarrado',
    description: 'Solo guerreros con renacimiento sobreviven a los Dragones Elementales en este modo.',
    hpMult: 5.5,
    atkMult: 3.3,
    speedMult: 1.22,
    xpMult: 5.0,
    goldMult: 3.4,
    heartDropBonus: 0.2,
    colorClass: 'text-rose-300',
    badgeClass: 'bg-rose-950/65 border-rose-500/65 text-rose-300',
  },
  {
    id: 'infierno',
    name: 'Infierno del Velo',
    subtitle: 'Ascensión Extrema (Nv. 9999)',
    description: 'Escala legendaria para exprimir múltiples renacimientos y alcanzar el nivel máximo 9999.',
    hpMult: 11.0,
    atkMult: 5.0,
    speedMult: 1.3,
    xpMult: 9.5,
    goldMult: 6.0,
    heartDropBonus: 0.3,
    colorClass: 'text-fuchsia-300',
    badgeClass: 'bg-fuchsia-950/65 border-fuchsia-500/70 text-fuchsia-300',
  },
];

export function computeWorldScaling(
  level: number,
  rebirths: number,
  difficultyId: DifficultyId
): WorldScalingProfile {
  const lvl = Math.max(1, Math.min(MAX_LEVEL, Math.round(level)));
  const reb = Math.max(0, Math.round(rebirths));
  const diff =
    DIFFICULTIES_CATALOG.find((d) => d.id === difficultyId) ?? DIFFICULTIES_CATALOG[0];

  const levelFactorHp =
    1 + (lvl - 1) * 0.16 + Math.pow(Math.max(0, lvl - 10), 1.08) * 0.06;
  const levelFactorAtk =
    1 + (lvl - 1) * 0.1 + Math.pow(Math.max(0, lvl - 12), 0.96) * 0.03;
  const levelFactorDef = 1 + (lvl - 1) * 0.075;

  const rebirthFactorHp = Math.pow(1.42, reb);
  const rebirthFactorAtk =
    1 + reb * 0.42 + Math.pow(Math.max(0, reb - 1), 1.15) * 0.16;
  const rebirthFactorDef = 1 + reb * 0.48;

  const hpMult = Number((diff.hpMult * levelFactorHp * rebirthFactorHp).toFixed(2));
  const atkMult = Number((diff.atkMult * levelFactorAtk * rebirthFactorAtk).toFixed(2));
  const defMult = Number(
    ((1 + (diff.atkMult - 1) * 0.4) * levelFactorDef * rebirthFactorDef).toFixed(2)
  );
  const speedMult = Number(
    (diff.speedMult * (1 + Math.min(0.45, (lvl - 1) * 0.008 + reb * 0.055))).toFixed(2)
  );
  const aggroMult = Number(
    (1 + Math.min(0.65, (lvl - 1) * 0.006 + reb * 0.08)).toFixed(2)
  );
  const attackCooldownMult = Number(
    Math.max(0.62, 1 - Math.min(0.38, (lvl - 1) * 0.004 + reb * 0.035)).toFixed(2)
  );

  const xpMult = Number(
    (diff.xpMult * (1 + (lvl - 1) * 0.15 + reb * 0.5)).toFixed(2)
  );
  const goldMult = Number(
    (diff.goldMult * (1 + (lvl - 1) * 0.1 + reb * 0.35)).toFixed(2)
  );

  const respawnTimeMult = Number(
    Math.max(
      0.32,
      1 / (1 + (lvl - 1) * 0.015 + reb * 0.18 + Math.max(0, diff.speedMult - 1) * 0.4)
    ).toFixed(2)
  );
  const encounterIntervalSec = Number(
    Math.max(
      11,
      44 / (1 + (lvl - 1) * 0.024 + reb * 0.28 + Math.max(0, diff.atkMult - 1) * 0.16)
    ).toFixed(1)
  );
  const maxDynamicEncounters = Math.min(
    7,
    2 +
      Math.floor((lvl - 1) / 10) +
      reb +
      (diff.id === 'abismal' || diff.id === 'infierno' ? 1 : 0)
  );
  const eliteChance = Number(
    Math.min(
      0.55,
      0.05 + (lvl - 1) * 0.008 + reb * 0.09 + (diff.atkMult - 1) * 0.04
    ).toFixed(2)
  );

  const threatRating = Number((hpMult * 0.35 + atkMult * 0.65).toFixed(1));
  let threatLabel = 'Estándar';
  if (threatRating >= 140) threatLabel = 'Apocalíptica';
  else if (threatRating >= 40) threatLabel = 'Cataclísmica';
  else if (threatRating >= 14) threatLabel = 'Crítica';
  else if (threatRating >= 5) threatLabel = 'Peligrosa';
  else if (threatRating >= 2) threatLabel = 'Elevada';

  return {
    playerLevel: lvl,
    rebirths: reb,
    difficultyId: diff.id,
    hpMult,
    atkMult,
    defMult,
    speedMult,
    aggroMult,
    attackCooldownMult,
    xpMult,
    goldMult,
    respawnTimeMult,
    encounterIntervalSec,
    maxDynamicEncounters,
    eliteChance,
    threatRating,
    threatLabel,
  };
}

export function getEnemyEffectiveLevel(
  baseDangerLevel: number,
  playerLevel: number,
  rebirths: number,
  isElite = false
): number {
  const lvl = Math.max(1, Math.min(MAX_LEVEL, Math.round(playerLevel)));
  const reb = Math.max(0, Math.round(rebirths));
  const eliteBump = isElite ? Math.max(2, Math.round(lvl * 0.12)) : 0;
  const scaled = Math.round(lvl * (0.72 + baseDangerLevel * 0.08) + reb * 12 + eliteBump);
  return Math.min(MAX_LEVEL, Math.max(baseDangerLevel * 2, scaled));
}

export const RACES_CATALOG: RaceDefinition[] = [
  {
    id: 'humano',
    name: 'Humano del Bastión',
    tagline: 'Versatilidad marcial y liderazgo del Santuario',
    colorClass: 'text-amber-300',
    passiveTitle: 'Pasiva: Voluntad del Bastión',
    passiveDescription: '+3 Fuerza, +3 Vitalidad, +20 Salud Máx. y +0.8 Regen. HP/s.',
    passiveBonuses: { fuerza: 3, vitalidad: 3, maxHp: 20, regenHp: 0.8 },
    uniqueTitle: 'Única: Herencia de Conquistador',
    uniqueDescription: 'Ganas +15% de XP y Oro adicionales al derrotar cualquier criatura.',
    activeSkill: {
      id: 'racial_humano',
      name: 'Baluarte Imperial',
      manaCost: 20,
      cooldown: 9.0,
      description: 'Restaura 28% de Salud máxima, limpia estados negativos y golpea a enemigos cercanos.',
    },
  },
  {
    id: 'elfo',
    name: 'Elfo Astral',
    tagline: 'Maestría arcana ancestral y ligereza estelar',
    colorClass: 'text-sky-300',
    passiveTitle: 'Pasiva: Sangre Estelar',
    passiveDescription: '+5 Inteligencia, +3 Agilidad, +35 Maná Máx., +1.4 Regen. Maná/s y +0.6 m/s Vel.',
    passiveBonuses: {
      inteligencia: 5,
      agilidad: 3,
      maxMana: 35,
      regenMana: 1.4,
      velocidadMovimiento: 0.6,
    },
    uniqueTitle: 'Única: Flujo Astral',
    uniqueDescription: 'Reduce en 25% el costo de Maná y aumenta +22% el daño de tus hechizos.',
    activeSkill: {
      id: 'racial_elfo',
      name: 'Lluvia Estelar',
      manaCost: 22,
      cooldown: 7.5,
      description: 'Dispara 3 proyectiles astrales perforantes hacia adelante y recupera +18 Maná.',
    },
  },
  {
    id: 'enano',
    name: 'Enano de Basalto',
    tagline: 'Piel férrea forjada en el corazón de la montaña',
    colorClass: 'text-orange-300',
    passiveTitle: 'Pasiva: Temple de Piedra',
    passiveDescription: '+8 Defensa, +5 Vitalidad, +50 Salud Máx. y +4 Daño Mín./Máx.',
    passiveBonuses: { defensa: 8, vitalidad: 5, maxHp: 50, danoMin: 4, danoMax: 4 },
    uniqueTitle: 'Única: Corazón Inquebrantable',
    uniqueDescription: 'Los bloqueos [G] mitigan 85% del daño y los estados negativos duran la mitad.',
    activeSkill: {
      id: 'racial_enano',
      name: 'Martillo Sísmico',
      manaCost: 24,
      cooldown: 8.5,
      description: 'Sacude la tierra en un radio de 6m infligiendo 1.9x daño con gran retroceso.',
    },
  },
  {
    id: 'draconido',
    name: 'Dracónido Cenizo',
    tagline: 'Estirpe escamada nacida del fuego primordial',
    colorClass: 'text-rose-300',
    passiveTitle: 'Pasiva: Escamas de Brasa',
    passiveDescription: '+5 Fuerza, +6 Daño Mín./Máx., +4 Defensa y +20% Daño Crítico.',
    passiveBonuses: { fuerza: 5, danoMin: 6, danoMax: 6, defensa: 4, danoCritico: 20 },
    uniqueTitle: 'Única: Sangre de Dragón',
    uniqueDescription: '+25% de daño contra Dragones y Wyverns; tus quemaduras infligen +35% daño.',
    activeSkill: {
      id: 'racial_draconido',
      name: 'Aliento Primordial',
      manaCost: 24,
      cooldown: 8.0,
      description: 'Exhala fuego dracónico frente a ti infligiendo 2.0x daño mágico y Quemadura.',
    },
  },
  {
    id: 'espectro_raza',
    name: 'Espectro Sombreado',
    tagline: 'Caminante del Velo nocturno y precisión letal',
    colorClass: 'text-violet-300',
    passiveTitle: 'Pasiva: Velo Etéreo',
    passiveDescription: '+5 Agilidad, +8% Prob. Crítica, +25% Daño Crítico y +0.8 m/s Velocidad.',
    passiveBonuses: { agilidad: 5, probCritico: 8, danoCritico: 25, velocidadMovimiento: 0.8 },
    uniqueTitle: 'Única: Pacto Crepuscular',
    uniqueDescription: 'Infliges +25% daño al caer la noche/ocaso y robas 10% de tu daño cuerpo a cuerpo como HP.',
    activeSkill: {
      id: 'racial_espectro',
      name: 'Paso del Abismo',
      manaCost: 18,
      cooldown: 7.0,
      description: 'Te impulsa hacia adelante en las sombras, envenena enemigos cercanos y sana +30 HP.',
    },
  },
];

export const CLASSES_CATALOG: ClassDefinition[] = [
  {
    id: 'caballero_runico',
    name: 'Caballero Rúnico',
    tagline: 'Vanguardia acorazada de acero y runas protectoras',
    colorClass: 'text-amber-300',
    passiveTitle: 'Pasiva: Maestría del Escudo',
    passiveDescription: '+7 Defensa, +5 Fuerza, +40 Salud Máx. y +1.0 Regen. HP/s.',
    passiveBonuses: { defensa: 7, fuerza: 5, maxHp: 40, regenHp: 1.0 },
    uniqueTitle: 'Única: Contraataque Rúnico',
    uniqueDescription: 'Al bloquear un ataque enemigo [G], tu próximo golpe inflige +45% de daño adicional.',
    activeSkill: {
      id: 'clase_caballero',
      name: 'Torbellino Rúnico',
      manaCost: 22,
      cooldown: 7.0,
      description: 'Gira con espada y runas golpeando a todos los enemigos a 5.5m por 1.85x daño.',
    },
  },
  {
    id: 'piromago',
    name: 'Piro-Mago del Velo',
    tagline: 'Hechicero elemental que incinera ejércitos enteros',
    colorClass: 'text-orange-300',
    passiveTitle: 'Pasiva: Brasa Infinita',
    passiveDescription: '+7 Inteligencia, +50 Maná Máx., +2.2 Regen. Maná/s y +5 Daño Mín./Máx.',
    passiveBonuses: { inteligencia: 7, maxMana: 50, regenMana: 2.2, danoMin: 5, danoMax: 5 },
    uniqueTitle: 'Única: Combustión Total',
    uniqueDescription: 'Infliges +30% daño extra a enemigos que ya sufren Quemadura.',
    activeSkill: {
      id: 'clase_piromago',
      name: 'Meteorito del Velo',
      manaCost: 30,
      cooldown: 8.5,
      description: 'Lanza una esfera volcánica gigante que explota con 2.4x daño y quema en área.',
    },
  },
  {
    id: 'asesino_sombras',
    name: 'Asesino de Sombras',
    tagline: 'Golpes críticos fulminantes y toxinas letales',
    colorClass: 'text-emerald-300',
    passiveTitle: 'Pasiva: Filo Oculto',
    passiveDescription: '+6 Agilidad, +12% Prob. Crítica, +35% Daño Crítico y +0.7 m/s Vel.',
    passiveBonuses: {
      agilidad: 6,
      probCritico: 12,
      danoCritico: 35,
      velocidadMovimiento: 0.7,
    },
    uniqueTitle: 'Única: Toxina Letal',
    uniqueDescription: 'Infliges +30% de daño adicional contra enemigos envenenados.',
    activeSkill: {
      id: 'clase_asesino',
      name: 'Ejecución Umbría',
      manaCost: 20,
      cooldown: 6.5,
      description: 'Estocada letal con +65% de crítico garantizado, 2.3x daño y Veneno intenso.',
    },
  },
  {
    id: 'paladin_solar',
    name: 'Paladín Solar',
    tagline: 'Campeón sagrado de luz purificadora e inmortalidad',
    colorClass: 'text-yellow-300',
    passiveTitle: 'Pasiva: Égida Sagrada',
    passiveDescription: '+5 Vitalidad, +5 Defensa, +2.0 Regen. HP/s, +1.0 Regen. Maná/s y +30 HP Máx.',
    passiveBonuses: { vitalidad: 5, defensa: 5, regenHp: 2.0, regenMana: 1.0, maxHp: 30 },
    uniqueTitle: 'Única: Juicio Purificador',
    uniqueDescription: '+35% daño contra No-Muertos y Espectros; cada habilidad activa restaura salud.',
    activeSkill: {
      id: 'clase_paladin',
      name: 'Consagración Solar',
      manaCost: 26,
      cooldown: 9.0,
      description: 'Restaura 30% de tu Salud máxima y desata una onda solar de 1.75x daño en área.',
    },
  },
  {
    id: 'cazador_dragones',
    name: 'Cazador de Dragones',
    tagline: 'Especialista en abatir dragones elementales y jefes',
    colorClass: 'text-rose-300',
    passiveTitle: 'Pasiva: Puntería del Cazador',
    passiveDescription: '+6 Fuerza, +4 Agilidad, +8 Daño Mín./Máx. y +7% Prob. Crítica.',
    passiveBonuses: { fuerza: 6, agilidad: 4, danoMin: 8, danoMax: 8, probCritico: 7 },
    uniqueTitle: 'Única: Azote Dracónico',
    uniqueDescription: '+35% daño contra Dragones y Wyverns y +20% probabilidad de Corazones de Dragón.',
    activeSkill: {
      id: 'clase_cazador',
      name: 'Lanza Matadragones',
      manaCost: 24,
      cooldown: 7.0,
      description: 'Arroja una jabalina ígnea de largo alcance con 2.2x daño (+40% contra Dragones).',
    },
  },
];

export const DRAGON_HEARTS_META: {
  itemId: DragonHeartId;
  dragonSpeciesId: MonsterSpeciesId;
  shortName: string;
  elementLabel: string;
  habitat: string;
  accentClass: string;
  badgeClass: string;
}[] = [
  {
    itemId: 'corazon_dragon_rojo',
    dragonSpeciesId: 'dragon_rojo_ardiente',
    shortName: 'Corazón Rojo',
    elementLabel: 'Dragón de Fuego Ardiente',
    habitat: 'Páramo de Ceniza (Este)',
    accentClass: 'text-red-300',
    badgeClass: 'bg-red-950/60 border-red-500/60 text-red-200',
  },
  {
    itemId: 'corazon_dragon_negro',
    dragonSpeciesId: 'dragon_negro_oscuro',
    shortName: 'Corazón Negro',
    elementLabel: 'Dragón de Fuego Oscuro',
    habitat: 'Bruma de Occidente (Oeste)',
    accentClass: 'text-violet-300',
    badgeClass: 'bg-violet-950/60 border-violet-500/60 text-violet-200',
  },
  {
    itemId: 'corazon_dragon_verde',
    dragonSpeciesId: 'dragon_verde_espiritual',
    shortName: 'Corazón Verde',
    elementLabel: 'Dragón de Fuego Espiritual',
    habitat: 'Bosque Susurrante (Sur)',
    accentClass: 'text-emerald-300',
    badgeClass: 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200',
  },
  {
    itemId: 'corazon_dragon_celeste',
    dragonSpeciesId: 'dragon_celeste_hielo',
    shortName: 'Corazón Celeste',
    elementLabel: 'Dragón de Hielo',
    habitat: 'Tierras Altas del Norte (Noreste)',
    accentClass: 'text-sky-300',
    badgeClass: 'bg-sky-950/60 border-sky-500/60 text-sky-200',
  },
  {
    itemId: 'corazon_dragon_amarillo',
    dragonSpeciesId: 'dragon_amarillo_divino',
    shortName: 'Corazón Amarillo',
    elementLabel: 'Dragón de Fuego Divino',
    habitat: 'Cumbre Celestial (Norte Noroeste)',
    accentClass: 'text-yellow-300',
    badgeClass: 'bg-yellow-950/60 border-yellow-500/60 text-yellow-200',
  },
];

export function getSkillsForBuild(
  raceId: RaceId,
  classId: ClassId,
  rebirths: number,
  prevCooldowns?: Record<number, number>
): SkillSlot[] {
  const race = RACES_CATALOG.find((r) => r.id === raceId) ?? RACES_CATALOG[0];
  const cls = CLASSES_CATALOG.find((c) => c.id === classId) ?? CLASSES_CATALOG[0];
  const rebirthMult = getRebirthDamageMultiplier(rebirths);

  return [
    ...INITIAL_SKILLS.slice(0, 3).map((sk) => ({
      ...sk,
      remainingCooldown: prevCooldowns?.[sk.slotIndex] ?? 0,
    })),
    {
      slotIndex: 4,
      id: race.activeSkill.id,
      name: race.activeSkill.name,
      keyLabel: '4',
      manaCost: race.activeSkill.manaCost,
      cooldown: race.activeSkill.cooldown,
      remainingCooldown: prevCooldowns?.[4] ?? 0,
      sourceLabel: `Activa Racial · ${race.name}`,
      description: race.activeSkill.description,
    },
    {
      slotIndex: 5,
      id: cls.activeSkill.id,
      name: cls.activeSkill.name,
      keyLabel: '5',
      manaCost: cls.activeSkill.manaCost,
      cooldown: cls.activeSkill.cooldown,
      remainingCooldown: prevCooldowns?.[5] ?? 0,
      sourceLabel: `Activa de Clase · ${cls.name}`,
      description: cls.activeSkill.description,
    },
    {
      slotIndex: 6,
      id: 'nova_renacimiento',
      name: 'Nova Renacida',
      keyLabel: '6',
      manaCost: 28,
      cooldown: 11.0,
      remainingCooldown: prevCooldowns?.[6] ?? 0,
      sourceLabel: `Renacimiento ×${rebirthMult} Daño`,
      description: `Explosión dracónica radial que escala con tu multiplicador de renacimiento (actual ×${rebirthMult}) e inflige 2.5x daño en área.`,
    },
  ];
}

export const PRESET_CLANS: ClanPreset[] = [
  {
    id: 'guardia_bastion',
    name: 'Guardia del Bastión',
    tag: 'GDB',
    colorHex: '#d4af5f',
    motto: 'Defensores del Santuario y el Velo Antiguo',
  },
  {
    id: 'orden_carmesi',
    name: 'Orden Carmesí',
    tag: 'ORC',
    colorHex: '#f87171',
    motto: 'Cazadores de Dragones del Páramo',
  },
  {
    id: 'sombra_astral',
    name: 'Sombra Astral',
    tag: 'AST',
    colorHex: '#a78bfa',
    motto: 'Eruditos nocturnos de la magia etérea',
  },
  {
    id: 'forja_basaltica',
    name: 'Forja Basáltica',
    tag: 'FBZ',
    colorHex: '#fb923c',
    motto: 'Maestros del hierro, runas y alquimia',
  },
  {
    id: 'vanguardia_solar',
    name: 'Vanguardia Solar',
    tag: 'VGS',
    colorHex: '#38bdf8',
    motto: 'Pioneros de las Tierras Altas del Norte',
  },
];

const CLAN_COLOR_PALETTE = [
  '#d4af5f',
  '#38bdf8',
  '#34d399',
  '#f87171',
  '#a78bfa',
  '#fb923c',
  '#facc15',
  '#2dd4bf',
];

export function getClanBadgeInfo(
  clanName: string,
  customTag?: string,
  customColor?: string
): { clanName: string; clanTag: string; clanColor: string } {
  const cleanName = clanName.trim().slice(0, 28) || 'Guardia del Bastión';
  const preset = PRESET_CLANS.find(
    (p) => p.name.toLowerCase() === cleanName.toLowerCase()
  );
  if (preset && !customTag && !customColor) {
    return {
      clanName: preset.name,
      clanTag: preset.tag,
      clanColor: preset.colorHex,
    };
  }

  let tag = (customTag ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
  if (tag.length < 2) {
    if (preset) {
      tag = preset.tag;
    } else {
      const words = cleanName
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      if (words.length >= 2) {
        tag = words
          .slice(0, 4)
          .map((w) => w[0])
          .join('')
          .toUpperCase();
      } else {
        tag = (words[0] ?? 'CLN').slice(0, 3).toUpperCase();
      }
      if (tag.length < 2) tag = 'CLN';
    }
  }

  let color = (customColor ?? '').trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    if (preset) {
      color = preset.colorHex;
    } else {
      let hash = 0;
      for (let i = 0; i < cleanName.length; i++) {
        hash = (hash * 31 + cleanName.charCodeAt(i)) >>> 0;
      }
      color = CLAN_COLOR_PALETTE[hash % CLAN_COLOR_PALETTE.length];
    }
  }

  return {
    clanName: cleanName,
    clanTag: tag,
    clanColor: color,
  };
}
