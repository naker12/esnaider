import React, { useState } from 'react';
import {
  Award,
  Shield,
  Sword,
  Zap,
  HeartPulse,
  Sparkles,
  Crosshair,
  Plus,
  X,
  Dumbbell,
  Wind,
  GitBranch,
  User,
  Lock,
  CheckCircle2,
  Pencil,
  Check,
  Compass,
  Flame,
  Swords,
  Crown,
} from 'lucide-react';
import {
  CLASSES_CATALOG,
  DIFFICULTIES_CATALOG,
  ITEMS_CATALOG,
  MAX_LEVEL,
  RACES_CATALOG,
  RARITY_COLORS,
  TALENT_BRANCHES,
  TALENTS_CATALOG,
  TITLES_CATALOG,
  getRebirthDamageMultiplier,
} from '../game/data';
import {
  BaseAttributes,
  ClassId,
  ComputedStats,
  DifficultyId,
  EquipmentSlot,
  InventoryEntry,
  ItemBonuses,
  RaceId,
  TalentBranchId,
  TitleSourceType,
} from '../game/types';

type CharacterTab = 'atributos' | 'talentos' | 'titulos';
type TitleFilter = 'todos' | TitleSourceType | 'desbloqueados';

interface CharacterModalProps {
  playerName: string;
  raceId: RaceId;
  classId: ClassId;
  difficultyId: DifficultyId;
  rebirths: number;
  level: number;
  xp: number;
  xpToNext: number;
  hp: number;
  mana: number;
  attributePoints: number;
  talentPoints: number;
  attributes: BaseAttributes;
  stats: ComputedStats;
  equipment: Record<EquipmentSlot, string | null>;
  inventoryMounts: InventoryEntry[];
  talentRanks: Record<string, number>;
  unlockedTitleIds: string[];
  selectedTitleId: string | null;
  onSpendAttribute: (attr: keyof BaseAttributes) => void;
  onSpendTalent: (talentId: string) => void;
  onUnequip: (slot: EquipmentSlot) => void;
  onEquipItemUid: (uid: string) => void;
  onSelectTitle: (titleId: string | null) => void;
  onChangePlayerName: (name: string) => void;
  onChangeDifficulty: (difficultyId: DifficultyId) => void;
  onOpenAccount: () => void;
  onOpenRebirth: () => void;
  onClose: () => void;
}

const SLOT_LABELS: { slot: EquipmentSlot; label: string; hint: string }[] = [
  { slot: 'arma', label: 'Arma Principal', hint: 'Aumenta Daño y Fuerza' },
  { slot: 'escudo', label: 'Escudo / Mano Izq.', hint: 'Aumenta Defensa y Vitalidad' },
  { slot: 'yelmo', label: 'Yelmo', hint: 'Protección craneal' },
  { slot: 'armadura', label: 'Armadura de Pecho', hint: 'Defensa y Regeneración' },
  { slot: 'amuleto', label: 'Amuleto', hint: 'Regeneración HP/Maná' },
  { slot: 'runa_extra', label: 'Ranura de Expansión (Runa)', hint: 'Espacio modular extra' },
];

const BRANCH_STYLES: Record<
  TalentBranchId,
  { border: string; accent: string; iconBg: string; icon: React.ReactNode }
> = {
  fisico: {
    border: 'border-rose-500/40',
    accent: 'text-rose-300',
    iconBg: 'bg-rose-950/50 border-rose-500/40 text-rose-300',
    icon: <Sword className="w-4 h-4" />,
  },
  magico: {
    border: 'border-sky-500/40',
    accent: 'text-sky-300',
    iconBg: 'bg-sky-950/50 border-sky-500/40 text-sky-300',
    icon: <Sparkles className="w-4 h-4" />,
  },
  supervivencia: {
    border: 'border-emerald-500/40',
    accent: 'text-emerald-300',
    iconBg: 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300',
    icon: <Shield className="w-4 h-4" />,
  },
};

export const CharacterModal: React.FC<CharacterModalProps> = ({
  playerName,
  raceId,
  classId,
  difficultyId,
  rebirths,
  level,
  xp,
  xpToNext,
  hp,
  mana,
  attributePoints,
  talentPoints,
  attributes,
  stats,
  equipment,
  inventoryMounts,
  talentRanks,
  unlockedTitleIds,
  selectedTitleId,
  onSpendAttribute,
  onSpendTalent,
  onUnequip,
  onEquipItemUid,
  onSelectTitle,
  onChangePlayerName,
  onChangeDifficulty,
  onOpenAccount,
  onOpenRebirth,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<CharacterTab>('atributos');
  const [titleFilter, setTitleFilter] = useState<TitleFilter>('todos');
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(playerName);

  const raceDef = RACES_CATALOG.find((r) => r.id === raceId) ?? RACES_CATALOG[0];
  const classDef = CLASSES_CATALOG.find((c) => c.id === classId) ?? CLASSES_CATALOG[0];
  const rebirthMult = getRebirthDamageMultiplier(rebirths);

  const totalSpentTalents = TALENTS_CATALOG.reduce((sum, t) => sum + (talentRanks[t.id] ?? 0), 0);
  const totalMaxTalents = TALENTS_CATALOG.reduce((sum, t) => sum + t.maxRank, 0);
  const nextTalentLevel = Math.floor(level / 5) * 5 + 5;
  const activeTitle =
    TITLES_CATALOG.find(
      (t) => t.id === selectedTitleId && unlockedTitleIds.includes(t.id)
    ) ?? null;

  const filteredTitles = TITLES_CATALOG.filter((t) => {
    const unlocked = unlockedTitleIds.includes(t.id);
    if (titleFilter === 'desbloqueados') return unlocked;
    if (titleFilter !== 'todos') return t.sourceType === titleFilter;
    return true;
  });

  const commitNameEdit = () => {
    const cleaned = draftName.trim().slice(0, 18);
    if (cleaned.length > 0) {
      onChangePlayerName(cleaned);
    } else {
      setDraftName(playerName);
    }
    setEditingName(false);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-5xl max-h-[88vh] bg-[#0e1118] border border-[#b48e4a]/45 rounded-xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/10">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-2">
              {editingName ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={draftName}
                    maxLength={18}
                    onChange={(e) => setDraftName(e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') commitNameEdit();
                      if (e.key === 'Escape') {
                        setDraftName(playerName);
                        setEditingName(false);
                      }
                    }}
                    className="px-2 py-0.5 rounded bg-[#151923] border border-[#d4af5f] text-sm font-display text-[#f3e6c8] focus:outline-none w-36"
                    autoFocus
                  />
                  <button
                    onClick={commitNameEdit}
                    className="p-1 rounded bg-[#b48e4a] text-[#0b0d12] hover:bg-[#c8a056]"
                    aria-label="Guardar nombre"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <h2 className="font-display text-xl text-[#f3e6c8]">
                    {playerName}
                  </h2>
                  {activeTitle && (
                    <span className={`font-display text-sm font-semibold ${activeTitle.colorClass}`}>
                      {activeTitle.name}
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setDraftName(playerName);
                      setEditingName(true);
                    }}
                    className="text-stone-500 hover:text-stone-200 transition-colors p-0.5"
                    title="Editar nombre del personaje"
                    aria-label="Editar nombre del personaje"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Nivel <span className="font-mono-num text-stone-200">{level}/{MAX_LEVEL}</span> ·{' '}
              <span className="font-mono-num text-fuchsia-300 font-semibold">
                R{rebirths} (×{rebirthMult} Daño)
              </span>{' '}
              · <span className={raceDef.colorClass}>{raceDef.name}</span> ·{' '}
              <span className={classDef.colorClass}>{classDef.name}</span> · XP {xp}/{xpToNext} · Atrib:{' '}
              <span className="font-mono-num text-amber-300 font-semibold">{attributePoints}</span>{' '}
              · Tal:{' '}
              <span className="font-mono-num text-emerald-300 font-semibold">{talentPoints}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Tab Switcher */}
            <div className="flex items-center p-1 rounded-lg bg-[#141821] border border-white/10">
              <button
                onClick={() => setActiveTab('atributos')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  activeTab === 'atributos'
                    ? 'bg-[#b48e4a] text-[#0b0d12] font-semibold'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Equipo y Atributos</span>
              </button>
              <button
                onClick={() => setActiveTab('talentos')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  activeTab === 'talentos'
                    ? 'bg-[#b48e4a] text-[#0b0d12] font-semibold'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>
                  Árbol de Talentos{talentPoints > 0 ? ` (${talentPoints})` : ''}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('titulos')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  activeTab === 'titulos'
                    ? 'bg-[#b48e4a] text-[#0b0d12] font-semibold'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Títulos</span>
                <span className="font-mono-num text-[10px] opacity-85">
                  {unlockedTitleIds.length}/{TITLES_CATALOG.length}
                </span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Cerrar personaje"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        {activeTab === 'atributos' ? (
          <div className="flex-1 overflow-y-auto rpg-scroll p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Equipment Paperdoll + Dedicated Creature Mount Slot */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Dedicated Mount Slot */}
              {(() => {
                const mountId = equipment.montura;
                const mountItem = mountId ? ITEMS_CATALOG[mountId] : null;
                const mountRarity = mountItem ? RARITY_COLORS[mountItem.rarity] : null;

                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-[#d4af5f] flex items-center gap-1.5">
                        <Compass className="w-4 h-4 text-amber-300" />
                        <span>Ranura de Montura (Criatura)</span>
                      </h3>
                      <span className="font-mono-num text-[11px] text-emerald-300">
                        {mountItem?.bonuses?.velocidadMovimiento
                          ? `+${mountItem.bonuses.velocidadMovimiento} m/s`
                          : 'A pie'}
                      </span>
                    </div>

                    <div
                      className={`p-3.5 rounded-lg border transition-colors ${
                        mountItem && mountRarity
                          ? `${mountRarity.bg} ${mountRarity.border}`
                          : 'bg-[#141821] border-[#b48e4a]/35 border-dashed'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[11px] text-stone-400">
                            {mountItem?.mountVisual?.creatureType ?? 'Criatura Activa'}
                          </div>
                          {mountItem ? (
                            <>
                              <div className={`text-sm font-semibold truncate ${mountRarity?.text}`}>
                                {mountItem.name}
                              </div>
                              <div className="text-[11px] text-stone-300 truncate mt-0.5">
                                {formatBonuses(mountItem.bonuses)}
                              </div>
                            </>
                          ) : (
                            <div className="text-xs text-stone-400 mt-0.5">
                              Sin montura equipada · Aumenta la velocidad de desplazamiento en el mundo 3D
                            </div>
                          )}
                        </div>
                        {mountItem && (
                          <button
                            onClick={() => onUnequip('montura')}
                            className="px-3 py-1.5 text-xs font-medium rounded-md bg-white/10 hover:bg-white/20 text-stone-200 whitespace-nowrap shrink-0 transition-colors"
                          >
                            Desmontar
                          </button>
                        )}
                      </div>

                      {inventoryMounts.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-white/10 space-y-1.5">
                          <div className="text-[11px] text-stone-400">
                            Criaturas en tu mochila:
                          </div>
                          <div className="flex flex-col gap-1.5">
                            {inventoryMounts.map((entry) => {
                              const creature = ITEMS_CATALOG[entry.itemId];
                              if (!creature) return null;
                              const cr = RARITY_COLORS[creature.rarity];
                              return (
                                <div
                                  key={entry.uid}
                                  className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded bg-[#0c0f16] border border-white/10"
                                >
                                  <div className="min-w-0">
                                    <div className={`text-xs font-medium truncate ${cr.text}`}>
                                      {creature.name}
                                    </div>
                                    <div className="text-[10px] text-stone-400 font-mono-num truncate">
                                      {formatBonuses(creature.bonuses)}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => onEquipItemUid(entry.uid)}
                                    className="px-2.5 py-1 rounded bg-[#b48e4a] hover:bg-[#c8a056] text-[#0b0d12] text-[11px] font-semibold whitespace-nowrap shrink-0 transition-colors"
                                  >
                                    {mountItem ? 'Cambiar' : 'Montar'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-2.5">
                <h3 className="text-sm font-semibold text-[#d4af5f]">Equipamiento Activo</h3>
                <div className="grid grid-cols-1 gap-2">
                  {SLOT_LABELS.map(({ slot, label, hint }) => {
                    const itemId = equipment[slot];
                    const item = itemId ? ITEMS_CATALOG[itemId] : null;
                    const rarity = item ? RARITY_COLORS[item.rarity] : null;

                    return (
                      <div
                        key={slot}
                        className={`p-3 rounded-lg border transition-colors flex items-center justify-between gap-3 ${
                          item && rarity
                            ? `${rarity.bg} ${rarity.border}`
                            : 'bg-[#141821] border-white/10'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-[11px] text-stone-400">{label}</div>
                          {item ? (
                            <>
                              <div className={`text-sm font-semibold truncate ${rarity?.text}`}>
                                {item.name}
                              </div>
                              <div className="text-[11px] text-stone-300 truncate mt-0.5">
                                {formatBonuses(item.bonuses)}
                              </div>
                            </>
                          ) : (
                            <div className="text-xs text-stone-500 mt-0.5">Vacío · {hint}</div>
                          )}
                        </div>
                        {item && (
                          <button
                            onClick={() => onUnequip(slot)}
                            className="px-3 py-1.5 text-xs font-medium rounded-md bg-white/10 hover:bg-white/20 text-stone-200 whitespace-nowrap shrink-0 transition-colors"
                          >
                            Quitar
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Race/Class/Rebirth Summary + Complete Stat Sections & Attributes */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              {/* Race, Class & Difficulty Quick Cards */}
              <div className="p-3.5 rounded-xl bg-[#131722] border border-[#b48e4a]/35 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#d4af5f]">
                    <Swords className="w-4 h-4" />
                    <span>Linaje, Clase y Habilidades</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onOpenRebirth}
                      className="px-2.5 py-1 rounded bg-fuchsia-950/60 hover:bg-fuchsia-900/70 border border-fuchsia-500/50 text-[11px] font-semibold text-fuchsia-200 flex items-center gap-1 transition-colors"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>Renacimiento (R{rebirths})</span>
                    </button>
                    <button
                      onClick={onOpenAccount}
                      className="px-2.5 py-1 rounded bg-[#1a2030] hover:bg-[#232b40] border border-white/15 text-[11px] font-semibold text-stone-200 flex items-center gap-1 transition-colors"
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-300" />
                      <span>Cambiar Build / Cuenta</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-2.5 rounded-lg bg-[#0d1018] border border-white/10 space-y-1">
                    <div className={`text-xs font-bold ${raceDef.colorClass}`}>
                      Raza: {raceDef.name}
                    </div>
                    <div className="text-[11px] text-amber-300/90">{raceDef.passiveTitle}</div>
                    <div className="text-[11px] text-sky-300/90">{raceDef.uniqueTitle}</div>
                    <div className="text-[11px] text-emerald-300">
                      Activa [4]: {raceDef.activeSkill.name}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0d1018] border border-white/10 space-y-1">
                    <div className={`text-xs font-bold ${classDef.colorClass}`}>
                      Clase: {classDef.name}
                    </div>
                    <div className="text-[11px] text-amber-300/90">{classDef.passiveTitle}</div>
                    <div className="text-[11px] text-sky-300/90">{classDef.uniqueTitle}</div>
                    <div className="text-[11px] text-rose-300">
                      Activa [5]: {classDef.activeSkill.name}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
                  <span className="text-[11px] text-stone-400">Dificultad del Mundo:</span>
                  <div className="flex flex-wrap items-center gap-1">
                    {DIFFICULTIES_CATALOG.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => onChangeDifficulty(d.id)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                          d.id === difficultyId
                            ? 'bg-[#b48e4a] border-[#d4af5f] text-[#0b0d12] font-bold'
                            : 'bg-[#0d1018] border-white/10 text-stone-300 hover:border-white/25'
                        }`}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Combat & Regeneration Sections */}
              <div>
                <h3 className="text-sm font-semibold text-[#d4af5f] mb-3">
                  Secciones de Combate y Regeneración
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <StatCard
                    icon={<Sword className="w-4 h-4 text-rose-400" />}
                    label="Daño"
                    value={`${stats.danoMin} - ${stats.danoMax}`}
                    sub={`Vel. Ataque ${stats.velocidadAtaque}x`}
                  />
                  <StatCard
                    icon={<Shield className="w-4 h-4 text-sky-400" />}
                    label="Defensa"
                    value={`${stats.defensa}`}
                    sub="Mitigación física"
                  />
                  <StatCard
                    icon={<Dumbbell className="w-4 h-4 text-amber-400" />}
                    label="Fuerza"
                    value={`${stats.fuerzaTotal}`}
                    sub={`Base ${attributes.fuerza} + Eq`}
                  />
                  <StatCard
                    icon={<Crosshair className="w-4 h-4 text-orange-400" />}
                    label="Crítico"
                    value={`${stats.probCritico}%`}
                    sub={`Multiplicador ${stats.danoCritico}%`}
                  />
                  <StatCard
                    icon={<Wind className="w-4 h-4 text-emerald-400" />}
                    label="Agilidad"
                    value={`${stats.agilidadTotal}`}
                    sub={`Vel. Mov ${stats.velocidadMovimiento} m/s`}
                  />
                  <StatCard
                    icon={<HeartPulse className="w-4 h-4 text-red-400" />}
                    label="Regeneración HP"
                    value={`+${stats.regenHp}/s`}
                    sub={`Salud ${Math.round(hp)} / ${stats.maxHp}`}
                  />
                  <StatCard
                    icon={<Sparkles className="w-4 h-4 text-indigo-400" />}
                    label="Regeneración Maná"
                    value={`+${stats.regenMana}/s`}
                    sub={`Maná ${Math.round(mana)} / ${stats.maxMana}`}
                  />
                  <StatCard
                    icon={<Zap className="w-4 h-4 text-yellow-400" />}
                    label="Suerte Base"
                    value={`${attributes.suerte}`}
                    sub="Crítico y botín"
                  />
                </div>
              </div>

              {/* Base Attribute Allocation */}
              <div className="border-t border-white/10 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#d4af5f]">Atributos Base</h3>
                  <span className="text-xs text-stone-400">
                    Puntos para asignar:{' '}
                    <strong className="font-mono-num text-amber-300">{attributePoints}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(
                    [
                      ['fuerza', 'Fuerza', 'Aumenta Daño físico y Daño Crítico'],
                      ['agilidad', 'Agilidad', 'Aumenta Velocidad, Ataque y Crítico'],
                      ['vitalidad', 'Vitalidad', 'Aumenta HP Máx, Defensa y Regen HP'],
                      ['inteligencia', 'Inteligencia', 'Aumenta Maná Máx y Regen Maná'],
                      ['suerte', 'Suerte', 'Aumenta Probabilidad Crítica'],
                    ] as [keyof BaseAttributes, string, string][]
                  ).map(([key, name, desc]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#141821] border border-white/10"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-stone-100">{name}</span>
                          <span className="font-mono-num text-sm font-bold text-[#f3e6c8]">
                            {attributes[key]}
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-400 truncate">{desc}</div>
                      </div>
                      <button
                        disabled={attributePoints <= 0}
                        onClick={() => onSpendAttribute(key)}
                        className="p-2 rounded-md bg-[#b48e4a]/25 hover:bg-[#b48e4a]/45 disabled:opacity-30 disabled:cursor-not-allowed text-amber-200 transition-colors shrink-0"
                        title={`Mejorar ${name}`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'talentos' ? (
          <div className="flex-1 overflow-y-auto rpg-scroll p-6 space-y-5">
            {/* Talent Points Banner */}
            <div className="p-4 rounded-lg bg-[#141821] border border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-[#f3e6c8]">
                  Puntos de Talento Disponibles:{' '}
                  <span className="font-mono-num text-emerald-300">{talentPoints}</span>
                </div>
                <p className="text-xs text-stone-400">
                  Obtienes <strong className="text-stone-200">+1 punto de talento</strong> cada 5 niveles (próximo en Nivel{' '}
                  <span className="font-mono-num text-amber-300">{nextTalentLevel}</span>). Desbloquea nodos en orden para acceder a maestrías superiores.
                </p>
              </div>
              <div className="font-mono-num text-xs text-stone-300">
                Rangos invertidos: <strong className="text-[#f3e6c8]">{totalSpentTalents}</strong> /{' '}
                {totalMaxTalents}
              </div>
            </div>

            {/* 3 Branches Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {TALENT_BRANCHES.map((branch) => {
                const style = BRANCH_STYLES[branch.id];
                const nodes = TALENTS_CATALOG.filter((t) => t.branch === branch.id).sort(
                  (a, b) => a.tier - b.tier
                );
                const branchSpent = nodes.reduce((s, n) => s + (talentRanks[n.id] ?? 0), 0);
                const branchMax = nodes.reduce((s, n) => s + n.maxRank, 0);

                return (
                  <div
                    key={branch.id}
                    className={`rounded-xl bg-[#121620] border ${style.border} p-4 flex flex-col gap-4`}
                  >
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${style.iconBg}`}
                        >
                          {style.icon}
                        </div>
                        <div>
                          <h3 className={`font-display text-base font-bold ${style.accent}`}>
                            Rama {branch.name}
                          </h3>
                          <p className="text-[11px] text-stone-400 leading-snug">
                            {branch.subtitle}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono-num text-xs text-stone-300 shrink-0">
                        {branchSpent}/{branchMax}
                      </span>
                    </div>

                    {/* Vertical Tree Tiers */}
                    <div className="flex flex-col items-stretch">
                      {nodes.map((node, idx) => {
                        const rank = talentRanks[node.id] ?? 0;
                        const isMax = rank >= node.maxRank;
                        const parentRank = node.requiresTalentId
                          ? talentRanks[node.requiresTalentId] ?? 0
                          : 1;
                        const prereqMet = parentRank >= 1;
                        const canUpgrade = prereqMet && !isMax && talentPoints > 0;
                        const parentNode = node.requiresTalentId
                          ? TALENTS_CATALOG.find((t) => t.id === node.requiresTalentId)
                          : null;

                        return (
                          <React.Fragment key={node.id}>
                            {idx > 0 && (
                              <div className="flex justify-center py-1">
                                <div
                                  className={`w-0.5 h-4 ${
                                    prereqMet ? 'bg-[#d4af5f]' : 'bg-white/10'
                                  }`}
                                />
                              </div>
                            )}
                            <div
                              className={`p-3.5 rounded-lg border transition-colors space-y-2 ${
                                isMax
                                  ? 'bg-[#1a202d] border-[#d4af5f]/70'
                                  : rank > 0
                                  ? 'bg-[#171c27] border-emerald-400/50'
                                  : prereqMet
                                  ? 'bg-[#151923] border-white/15'
                                  : 'bg-[#0f1219] border-white/10 opacity-65'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="text-[10px] font-mono-num uppercase tracking-wider text-stone-400">
                                    Grado {node.tier}
                                  </div>
                                  <h4 className="text-sm font-semibold text-[#f3e6c8]">
                                    {node.name}
                                  </h4>
                                </div>
                                <div className="flex items-center gap-1 font-mono-num text-xs shrink-0">
                                  {isMax ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                                  ) : !prereqMet ? (
                                    <Lock className="w-3.5 h-3.5 text-stone-500" />
                                  ) : null}
                                  <span className={rank > 0 ? 'text-amber-300 font-bold' : 'text-stone-400'}>
                                    {rank}/{node.maxRank}
                                  </span>
                                </div>
                              </div>

                              <p className="text-xs text-stone-300 leading-relaxed">
                                {node.description}
                              </p>

                              <div className="text-[11px] font-medium text-emerald-300">
                                {node.effectSummary}
                              </div>

                              {!prereqMet && parentNode && (
                                <div className="text-[11px] text-stone-400">
                                  Requiere: {parentNode.name} (Rango 1)
                                </div>
                              )}

                              <button
                                disabled={!canUpgrade}
                                onClick={() => onSpendTalent(node.id)}
                                className="w-full py-1.5 px-3 rounded-md bg-[#b48e4a] hover:bg-[#c8a056] disabled:bg-white/10 disabled:text-stone-500 text-[#0b0d12] text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors"
                              >
                                {isMax ? (
                                  <span>Rango Máximo</span>
                                ) : !prereqMet ? (
                                  <span>Bloqueado</span>
                                ) : talentPoints > 0 ? (
                                  <>
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Invertir 1 Punto de Talento</span>
                                  </>
                                ) : (
                                  <span>Sin puntos de talento</span>
                                )}
                              </button>
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Active Title Preview & Filter Bar */}
            <div className="px-6 py-4 border-b border-white/10 bg-[#11151f] flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-[11px] text-stone-400">Identidad Mostrada en el HUD</div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-base font-bold text-[#f3e6c8]">
                    {playerName}
                  </span>
                  {activeTitle ? (
                    <span className={`font-display text-sm font-semibold ${activeTitle.colorClass}`}>
                      {activeTitle.name}
                    </span>
                  ) : (
                    <span className="text-xs text-stone-500">Sin título equipado</span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {(
                    [
                      ['todos', 'Todos'],
                      ['desbloqueados', 'Desbloqueados'],
                      ['logro', 'De Logros'],
                      ['mision', 'De Misiones'],
                    ] as [TitleFilter, string][]
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setTitleFilter(key)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                        titleFilter === key
                          ? 'bg-[#b48e4a] text-[#0b0d12] font-semibold'
                          : 'bg-[#161a24] text-stone-300 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {activeTitle && (
                  <button
                    onClick={() => onSelectTitle(null)}
                    className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-xs text-stone-200 whitespace-nowrap transition-colors"
                  >
                    Quitar título
                  </button>
                )}
              </div>
            </div>

            {/* Titles Grid */}
            <div className="flex-1 overflow-y-auto rpg-scroll p-6 grid grid-cols-1 md:grid-cols-2 gap-3.5 content-start">
              {filteredTitles.map((title) => {
                const isUnlocked = unlockedTitleIds.includes(title.id);
                const isEquipped = activeTitle?.id === title.id;

                return (
                  <div
                    key={title.id}
                    className={`p-4 rounded-lg border flex flex-col justify-between gap-3 transition-colors ${
                      isEquipped
                        ? 'bg-[#1a202d] border-[#d4af5f]'
                        : isUnlocked
                        ? 'bg-[#141821] border-amber-500/30 hover:border-white/25'
                        : 'bg-[#10131a] border-white/10 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[11px] text-stone-400 truncate">
                          {title.sourceLabel}
                        </div>
                        <h3
                          className={`font-display text-base font-bold mt-0.5 ${
                            isUnlocked ? title.colorClass : 'text-stone-400'
                          }`}
                        >
                          {title.name}
                        </h3>
                      </div>

                      {isEquipped ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-amber-300 shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Equipado</span>
                        </span>
                      ) : !isUnlocked ? (
                        <Lock className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                      ) : null}
                    </div>

                    <p className="text-xs text-stone-300 leading-relaxed">
                      {title.description}
                    </p>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3">
                      <span className="text-[11px] text-stone-400">
                        {title.requirementText}
                      </span>

                      {isUnlocked ? (
                        <button
                          onClick={() => onSelectTitle(isEquipped ? null : title.id)}
                          className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                            isEquipped
                              ? 'bg-white/10 hover:bg-white/20 text-stone-200'
                              : 'bg-[#b48e4a] hover:bg-[#c8a056] text-[#0b0d12]'
                          }`}
                        >
                          {isEquipped ? 'Desequipar' : 'Equipar'}
                        </button>
                      ) : (
                        <span className="text-[11px] text-stone-500 font-medium whitespace-nowrap shrink-0">
                          Bloqueado
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}> = ({ icon, label, value, sub }) => (
  <div className="p-3 rounded-lg bg-[#141821] border border-white/10 flex flex-col gap-1">
    <div className="flex items-center gap-1.5 text-xs text-stone-400">
      {icon}
      <span>{label}</span>
    </div>
    <div className="font-mono-num text-lg font-bold text-[#ece6d8]">{value}</div>
    <div className="text-[11px] text-stone-400 font-mono-num">{sub}</div>
  </div>
);

function formatBonuses(b?: ItemBonuses): string {
  if (!b) return 'Sin bonificadores';
  const parts: string[] = [];
  if (b.velocidadMovimiento) parts.push(`Vel.Mov +${b.velocidadMovimiento} m/s`);
  if (b.danoMin || b.danoMax) parts.push(`Daño +${b.danoMin ?? 0}-${b.danoMax ?? 0}`);
  if (b.defensa) parts.push(`Def +${b.defensa}`);
  if (b.fuerza) parts.push(`Fza +${b.fuerza}`);
  if (b.agilidad) parts.push(`Agi +${b.agilidad}`);
  if (b.vitalidad) parts.push(`Vit +${b.vitalidad}`);
  if (b.inteligencia) parts.push(`Int +${b.inteligencia}`);
  if (b.probCritico) parts.push(`Crít +${b.probCritico}%`);
  if (b.danoCritico) parts.push(`D.Crít +${b.danoCritico}%`);
  if (b.regenHp) parts.push(`RegenHP +${b.regenHp}/s`);
  if (b.regenMana) parts.push(`RegenManá +${b.regenMana}/s`);
  if (b.maxHp) parts.push(`HP +${b.maxHp}`);
  if (b.maxMana) parts.push(`Maná +${b.maxMana}`);
  return parts.join(' · ');
}
