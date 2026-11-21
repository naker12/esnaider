import React from 'react';
import {
  Backpack,
  Biohazard,
  BookOpen,
  Boxes,
  CloudFog,
  CloudRain,
  Flame,
  FlaskConical,
  HeartPulse,
  Moon,
  ScrollText,
  Shield,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Trophy,
  User,
  Users,
  Volume2,
  VolumeX,
  Wind,
  X,
  Crown,
  UserCheck,
} from 'lucide-react';
import {
  CLASSES_CATALOG,
  DIFFICULTIES_CATALOG,
  MAX_LEVEL,
  RACES_CATALOG,
  computeWorldScaling,
  getRebirthDamageMultiplier,
} from '../game/data';
import {
  AchievementToast,
  ActiveAlchemyBuff,
  ActiveModal,
  ChatChannel,
  ChatMessage,
  ClanComputedBonuses,
  ClassId,
  CombatLogMessage,
  ComputedStats,
  DayTimeSnapshot,
  DifficultyId,
  FloatingDamage,
  GameItem,
  MinimapSnapshot,
  OnlinePlayerState,
  PlayerStatusEffect,
  PlayerTitleDefinition,
  RaceId,
  SkillSlot,
  TargetInfo,
  WeatherType,
  WorldMapId,
} from '../game/types';
import { WEATHER_PRESETS } from '../game/weatherShader';
import { Minimap } from './Minimap';
import { OnlineChatPanel } from './OnlineChatPanel';

interface GameHudProps {
  localUid: string | null;
  playerName: string;
  clanName: string;
  clanTag: string;
  clanColor: string;
  currentMapId: WorldMapId;
  raceId: RaceId;
  classId: ClassId;
  difficultyId: DifficultyId;
  rebirths: number;
  isAccountLinked: boolean;
  canRebirth: boolean;
  activeTitle: PlayerTitleDefinition | null;
  equippedMount: GameItem | null;
  dayTime: DayTimeSnapshot;
  level: number;
  xp: number;
  xpToNext: number;
  hp: number;
  mana: number;
  gold: number;
  attributePoints: number;
  talentPoints: number;
  stats: ComputedStats;
  minimap: MinimapSnapshot;
  target: TargetInfo | null;
  skills: SkillSlot[];
  combatLogs: CombatLogMessage[];
  floatingDamages: FloatingDamage[];
  pointerLocked: boolean;
  isBlocking: boolean;
  muted: boolean;
  potionCount: number;
  weather: WeatherType;
  statusEffects: PlayerStatusEffect[];
  activeBuffs: ActiveAlchemyBuff[];
  clanBonuses: ClanComputedBonuses;
  hasClanActionPending?: boolean;
  fastTravelOpen: boolean;
  achievementToasts: AchievementToast[];
  hasUnseenAchievements: boolean;
  onlinePlayers: OnlinePlayerState[];
  chatMessages: ChatMessage[];
  chatChannel: ChatChannel;
  chatOpen: boolean;
  onToggleChatOpen: () => void;
  onChangeChatChannel: (channel: ChatChannel) => void;
  onSendChatMessage: (text: string, channel: ChatChannel) => Promise<void> | void;
  onChatInputFocusChange: (focused: boolean) => void;
  onLinkGoogleAccount: () => void;
  onDismissAchievementToast: (toastId: string) => void;
  onCycleWeather: () => void;
  onSelectWeather: (weather: WeatherType) => void;
  onAdvanceDayPhase: () => void;
  onToggleFastTravel: () => void;
  onTeleportShrine: (shrineId: string) => void;
  onToggleMute: () => void;
  onOpenModal: (modal: ActiveModal) => void;
  onTriggerSkill: (slotIndex: number) => void;
  onUseQuickPotion: () => void;
  onRequestPointerLock: () => void;
}

export const GameHud: React.FC<GameHudProps> = ({
  localUid,
  playerName,
  clanName,
  clanTag,
  clanColor,
  currentMapId,
  raceId,
  classId,
  difficultyId,
  rebirths,
  isAccountLinked,
  canRebirth,
  activeTitle,
  equippedMount,
  dayTime,
  level,
  xp,
  xpToNext,
  hp,
  mana,
  gold,
  attributePoints,
  talentPoints,
  stats,
  minimap,
  target,
  skills,
  combatLogs,
  floatingDamages,
  pointerLocked,
  isBlocking,
  muted,
  potionCount,
  weather,
  statusEffects,
  activeBuffs,
  clanBonuses,
  hasClanActionPending,
  fastTravelOpen,
  achievementToasts,
  hasUnseenAchievements,
  onlinePlayers,
  chatMessages,
  chatChannel,
  chatOpen,
  onToggleChatOpen,
  onChangeChatChannel,
  onSendChatMessage,
  onChatInputFocusChange,
  onLinkGoogleAccount,
  onDismissAchievementToast,
  onCycleWeather,
  onSelectWeather,
  onAdvanceDayPhase,
  onToggleFastTravel,
  onTeleportShrine,
  onToggleMute,
  onOpenModal,
  onTriggerSkill,
  onUseQuickPotion,
  onRequestPointerLock,
}) => {
  const hpPct = Math.max(0, Math.min(100, (hp / stats.maxHp) * 100));
  const manaPct = Math.max(0, Math.min(100, (mana / stats.maxMana) * 100));
  const xpPct = Math.max(0, Math.min(100, (xp / xpToNext) * 100));
  const isLowHp = hp > 0 && hpPct <= 28;
  const hasBurn = statusEffects.some((s) => s.id === 'burn');
  const hasPoison = statusEffects.some((s) => s.id === 'poison');
  const raceDef = RACES_CATALOG.find((r) => r.id === raceId) ?? RACES_CATALOG[0];
  const classDef = CLASSES_CATALOG.find((c) => c.id === classId) ?? CLASSES_CATALOG[0];
  const diffDef = DIFFICULTIES_CATALOG.find((d) => d.id === difficultyId) ?? DIFFICULTIES_CATALOG[0];
  const rebirthMult = getRebirthDamageMultiplier(rebirths);
  const worldScaling = computeWorldScaling(level, rebirths, difficultyId);

  return (
    <div className="fixed inset-0 z-20 pointer-events-none">
      {/* Low HP subtle screen edge warning */}
      {isLowHp && (
        <div
          className="fixed inset-0 pointer-events-none border-[6px] border-rose-600/45 shadow-[inset_0_0_65px_rgba(225,29,72,0.38)]"
          aria-hidden="true"
        />
      )}
      {/* Floating Damage Numbers */}
      {floatingDamages.map((fd) => (
        <div
          key={fd.id}
          style={{ left: `${fd.screenX}px`, top: `${fd.screenY}px` }}
          className={`fixed animate-damage-float font-mono-num font-bold pointer-events-none select-none ${
            fd.isHeal
              ? 'text-emerald-300 text-lg'
              : fd.statusTone === 'burn'
              ? 'text-orange-400 text-sm'
              : fd.statusTone === 'poison'
              ? 'text-lime-400 text-sm'
              : fd.isCrit
              ? 'text-amber-300 text-2xl'
              : 'text-white text-base'
          }`}
        >
          {fd.value}
        </div>
      ))}

      {/* Top-Left: Player Name + Title, Vitals, Regen Rates & Key Stats */}
      <div className="fixed top-4 left-4 w-72 bg-[#0c0e14]/92 border border-[#b48e4a]/45 rounded-lg p-3.5 space-y-2.5 pointer-events-auto shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => onOpenModal('personaje')}
              title="Abrir ficha de personaje y títulos [C]"
              className="min-w-0 flex items-baseline gap-1.5 text-left group"
            >
              <span className="font-display text-sm font-bold text-[#f3e6c8] group-hover:text-white truncate">
                {playerName}
              </span>
              {activeTitle && (
                <span className={`text-[11px] font-medium truncate ${activeTitle.colorClass}`}>
                  {activeTitle.name}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="font-mono-num text-xs text-amber-300">{gold} Oro</span>
              <button
                onClick={onToggleMute}
                className="text-stone-400 hover:text-white transition-colors"
                title={muted ? 'Activar audio' : 'Silenciar audio'}
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 text-[11px] text-stone-400">
            <span className="font-mono-num">
              Nv. {level}/{MAX_LEVEL} ·{' '}
              <span className="text-fuchsia-300 font-semibold">
                R{rebirths} (×{rebirthMult})
              </span>
            </span>
            <button
              onClick={() => onOpenModal('cuenta')}
              title={`Dificultad y Escala Dinámica [Y] · Amenaza ${worldScaling.threatLabel} (HP ×${worldScaling.hpMult} · ATQ ×${worldScaling.atkMult} · Encuentros ~${worldScaling.encounterIntervalSec}s)`}
              className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold transition-colors ${diffDef.badgeClass}`}
            >
              {diffDef.name} · {worldScaling.threatLabel}
            </button>
          </div>
          <div className="flex items-center justify-between text-[10px] text-stone-400">
            <span className="truncate">
              <span className={raceDef.colorClass}>{raceDef.name}</span> ·{' '}
              <span className={classDef.colorClass}>{classDef.name}</span>
            </span>
            {(attributePoints > 0 || talentPoints > 0) && (
              <button
                onClick={() => onOpenModal('personaje')}
                className="text-[10px] font-semibold text-amber-300 hover:text-amber-200 underline shrink-0 ml-1"
              >
                {attributePoints > 0 ? `+${attributePoints} pts` : ''}
                {attributePoints > 0 && talentPoints > 0 ? ' · ' : ''}
                {talentPoints > 0 ? `+${talentPoints} tal` : ''}
              </button>
            )}
          </div>
          <div className="flex items-center justify-between gap-1.5 pt-0.5">
            <button
              onClick={() => onOpenModal('clan')}
              title={`Clan: ${clanName} — Gestionar clan y emblema [K]`}
              className="min-w-0 flex items-center gap-1.5 text-[10px] hover:brightness-110 transition-all text-left"
            >
              <span
                className="px-1.5 py-0.5 rounded border font-mono-num font-bold shrink-0"
                style={{
                  borderColor: `${clanColor}88`,
                  backgroundColor: `${clanColor}22`,
                  color: clanColor,
                }}
              >
                [{clanTag}]
              </span>
              <span className="text-stone-300 truncate font-medium">{clanName}</span>
            </button>
            <span
              className={`px-1.5 py-0.5 rounded border text-[9px] font-semibold shrink-0 ${
                minimap.isSafeZone
                  ? 'bg-emerald-950/70 border-emerald-500/45 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
              }`}
              title={
                currentMapId === 'plaza'
                  ? 'Plaza del Alba: mapa inicial y zona segura sin combate'
                  : minimap.isSafeZone
                  ? 'Templo del Velo: zona segura libre de monstruos'
                  : 'Zona hostil fuera de la protección del Templo'
              }
            >
              {currentMapId === 'plaza'
                ? 'Plaza · Segura'
                : minimap.isSafeZone
                ? 'Templo · Segura'
                : 'Valle · Hostil'}
            </span>
          </div>
        </div>

        {/* Prolonged Alchemy Buffs & Negative Status Effects directly above HP Bar */}
        {(activeBuffs.length > 0 || statusEffects.length > 0) && (
          <div className="space-y-1.5">
            {activeBuffs.length > 0 && (
              <div
                aria-label="Efectos alquímicos activos"
                className="flex flex-wrap items-center gap-1.5"
              >
                {activeBuffs.map((buff) => {
                  const pct = Math.max(
                    0,
                    Math.min(100, (buff.remaining / Math.max(0.1, buff.duration)) * 100)
                  );
                  const tone =
                    buff.tone === 'amber'
                      ? {
                          box: 'bg-amber-950/75 border-amber-400/55 text-amber-200',
                          bar: 'bg-amber-400',
                          icon: <Flame className="w-3 h-3 text-amber-300 shrink-0" />,
                        }
                      : buff.tone === 'emerald'
                      ? {
                          box: 'bg-emerald-950/75 border-emerald-400/55 text-emerald-200',
                          bar: 'bg-emerald-400',
                          icon: <Shield className="w-3 h-3 text-emerald-300 shrink-0" />,
                        }
                      : buff.tone === 'violet'
                      ? {
                          box: 'bg-violet-950/75 border-violet-400/55 text-violet-200',
                          bar: 'bg-violet-400',
                          icon: <Sparkles className="w-3 h-3 text-violet-300 shrink-0" />,
                        }
                      : buff.tone === 'rose'
                      ? {
                          box: 'bg-rose-950/75 border-rose-400/55 text-rose-200',
                          bar: 'bg-rose-400',
                          icon: <HeartPulse className="w-3 h-3 text-rose-300 shrink-0" />,
                        }
                      : {
                          box: 'bg-sky-950/75 border-sky-400/55 text-sky-200',
                          bar: 'bg-sky-400',
                          icon: buff.immuneToDebuffs ? (
                            <ShieldCheck className="w-3 h-3 text-sky-300 shrink-0" />
                          ) : (
                            <Wind className="w-3 h-3 text-sky-300 shrink-0" />
                          ),
                        };

                  return (
                    <div
                      key={buff.id}
                      title={`${buff.name}: ${buff.summary}`}
                      className={`relative overflow-hidden flex items-center gap-1 px-2 py-1 rounded-md border ${tone.box}`}
                    >
                      {tone.icon}
                      <div className="flex items-baseline gap-1 text-[10px] leading-none">
                        <span className="font-semibold truncate max-w-[92px]">{buff.name}</span>
                        <span className="font-mono-num opacity-90">{Math.ceil(buff.remaining)}s</span>
                      </div>
                      <div
                        className={`absolute bottom-0 left-0 h-[2px] ${tone.bar} transition-[width] duration-150`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {statusEffects.length > 0 && (
              <div
                role="status"
                aria-live="polite"
                aria-label="Efectos de estado activos"
                className="flex flex-wrap items-center gap-1.5"
              >
                {statusEffects.map((effect) => {
                  const pct = Math.max(
                    0,
                    Math.min(100, (effect.remaining / Math.max(0.1, effect.duration)) * 100)
                  );
                  const style =
                    effect.id === 'poison'
                      ? {
                          box: 'bg-lime-950/75 border-lime-500/55 text-lime-200',
                          bar: 'bg-lime-400',
                          icon: (
                            <Biohazard className="w-3.5 h-3.5 text-lime-400 animate-status-poison shrink-0" />
                          ),
                        }
                      : effect.id === 'burn'
                      ? {
                          box: 'bg-orange-950/75 border-orange-500/55 text-orange-200',
                          bar: 'bg-orange-400',
                          icon: (
                            <Flame className="w-3.5 h-3.5 text-orange-400 animate-status-burn shrink-0" />
                          ),
                        }
                      : {
                          box: 'bg-sky-950/75 border-sky-400/55 text-sky-200',
                          bar: 'bg-sky-400',
                          icon: (
                            <Snowflake className="w-3.5 h-3.5 text-sky-300 animate-status-slow shrink-0" />
                          ),
                        };

                  return (
                    <div
                      key={effect.id}
                      title={effect.effectText}
                      className={`relative overflow-hidden flex items-center gap-1.5 px-2 py-1 rounded-md border ${style.box}`}
                    >
                      {style.icon}
                      <div className="flex items-baseline gap-1 text-[10px] leading-none">
                        <span className="font-semibold">{effect.label}</span>
                        <span className="font-mono-num opacity-85">{effect.remaining.toFixed(1)}s</span>
                      </div>
                      <div
                        className={`absolute bottom-0 left-0 h-[2px] ${style.bar} transition-[width] duration-100`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* HP Bar + Regen */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono-num">
            <span className="text-rose-300 font-medium">
              Salud {Math.round(hp)} / {stats.maxHp}
            </span>
            <span className="text-emerald-300">+{stats.regenHp}/s</span>
          </div>
          <div
            className={`h-2.5 w-full bg-black/60 rounded-sm overflow-hidden border transition-colors ${
              hasBurn
                ? 'border-orange-500/60'
                : hasPoison
                ? 'border-lime-500/60'
                : 'border-white/10'
            }`}
          >
            <div
              className="h-full bg-gradient-to-r from-rose-700 to-rose-500 transition-all duration-150"
              style={{ width: `${hpPct}%` }}
            />
          </div>
        </div>

        {/* Mana Bar + Regen */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono-num">
            <span className="text-sky-300 font-medium">
              Maná {Math.round(mana)} / {stats.maxMana}
            </span>
            <span className="text-sky-300">+{stats.regenMana}/s</span>
          </div>
          <div className="h-2 w-full bg-black/60 rounded-sm overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-blue-700 to-sky-400 transition-all duration-150"
              style={{ width: `${manaPct}%` }}
            />
          </div>
        </div>

        {/* XP Thin Bar + Quick Combat Line */}
        <div className="pt-1 border-t border-white/10 space-y-1.5">
          <div className="h-1 w-full bg-black/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#d4af5f] transition-all"
              style={{ width: `${xpPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono-num text-stone-300">
            <span>ATQ {stats.danoMin}-{stats.danoMax}</span>
            <span>DEF {stats.defensa}</span>
            <span>CRÍT {stats.probCritico}%</span>
            <span>VEL {stats.velocidadMovimiento}</span>
          </div>
          {equippedMount && (
            <button
              onClick={() => onOpenModal('personaje')}
              className="w-full flex items-center justify-between text-[11px] text-amber-200 hover:text-amber-100 border-t border-white/10 pt-1 text-left transition-colors"
              title="Gestionar montura en Personaje [C]"
            >
              <span className="truncate">Montura: {equippedMount.name}</span>
              <span className="font-mono-num text-emerald-300 shrink-0 ml-2">
                +{equippedMount.bonuses?.velocidadMovimiento ?? 0} m/s
              </span>
            </button>
          )}
          {(clanBonuses.goldPerCycle > 0 ||
            clanBonuses.xpPerCycle > 0 ||
            clanBonuses.herbsPerCycle > 0) && (
            <button
              onClick={() => onOpenModal('clan')}
              className="w-full flex items-center justify-between text-[11px] text-sky-200 hover:text-white border-t border-white/10 pt-1 text-left transition-colors"
              title="Abrir gestión de Clan [K]"
            >
              <span className="truncate">Clan activo</span>
              <span className="font-mono-num text-emerald-300 shrink-0 ml-2">
                +{clanBonuses.goldPerCycle}o · +{clanBonuses.xpPerCycle}xp · +
                {clanBonuses.herbsPerCycle}h /25s
              </span>
            </button>
          )}
          {isBlocking && (
            <div className="text-[11px] font-medium text-sky-300 text-center border-t border-white/10 pt-1">
              Guardia con Escudo Activa (-70% daño)
            </div>
          )}
        </div>
      </div>

      {/* Top-Right: Minimap, Day/Night Clock & Dynamic Weather Toggle */}
      <div className="fixed top-4 right-4 flex flex-col items-end gap-1.5">
        <Minimap
          snapshot={minimap}
          fastTravelOpen={fastTravelOpen}
          onToggleFastTravel={onToggleFastTravel}
          onTeleportShrine={onTeleportShrine}
        />
        <button
          onClick={onAdvanceDayPhase}
          title="Avanzar fase del ciclo día/noche [H] (afecta visibilidad, monstruos, NPCs y mercado diario)"
          className="pointer-events-auto w-[196px] px-3 py-1.5 rounded-lg bg-[#0c0e14]/92 border border-[#b48e4a]/45 hover:border-[#d4af5f] text-xs text-stone-200 hover:text-white flex items-center justify-between gap-2 shadow-lg transition-colors whitespace-nowrap"
        >
          <span className="flex items-center gap-1.5 min-w-0">
            {dayTime.phase === 'noche' ? (
              <Moon className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
            ) : dayTime.phase === 'ocaso' ? (
              <Sunset className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            ) : dayTime.phase === 'amanecer' ? (
              <Sunrise className="w-3.5 h-3.5 text-rose-300 shrink-0" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            )}
            <span className="font-mono-num font-semibold text-[#f3e6c8]">
              D{dayTime.dayNumber} · {dayTime.formattedTime}
            </span>
            <span className="truncate">{dayTime.phaseLabel}</span>
          </span>
          <span className="font-mono-num text-[10px] text-stone-400 shrink-0">
            {dayTime.visibilityMeters}m [H]
          </span>
        </button>
        <button
          onClick={onCycleWeather}
          title="Cambiar clima dinámico [V] (Lluvia, Nieve, Tormenta de Ceniza y más)"
          className="pointer-events-auto w-[196px] px-3 py-1.5 rounded-lg bg-[#0c0e14]/92 border border-[#b48e4a]/45 hover:border-[#d4af5f] text-xs text-stone-200 hover:text-white flex items-center justify-between gap-2 shadow-lg transition-colors whitespace-nowrap"
        >
          <span className="flex items-center gap-1.5 min-w-0">
            {weather === 'lluvia' ? (
              <CloudRain className="w-3.5 h-3.5 text-sky-300 shrink-0" />
            ) : weather === 'nieve' ? (
              <Snowflake className="w-3.5 h-3.5 text-cyan-200 shrink-0" />
            ) : weather === 'tormenta_ceniza' ? (
              <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            ) : weather === 'neblina' ? (
              <CloudFog className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            ) : weather === 'atardecer' ? (
              <Sunset className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            ) : dayTime.isNight ? (
              <Moon className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-200 shrink-0" />
            )}
            <span className="truncate">{WEATHER_PRESETS[weather].label}</span>
          </span>
          <span className="font-mono-num text-[10px] text-stone-400 shrink-0">[V]</span>
        </button>
        <div className="pointer-events-auto w-[196px] grid grid-cols-6 gap-1 bg-[#0c0e14]/92 border border-[#b48e4a]/35 rounded-lg p-1 shadow-lg">
          {(
            [
              ['despejado', 'Despejado', <Sun key="d" className="w-3.5 h-3.5" />],
              ['atardecer', 'Atardecer', <Sunset key="a" className="w-3.5 h-3.5" />],
              ['lluvia', 'Lluvia (partículas)', <CloudRain key="l" className="w-3.5 h-3.5" />],
              ['nieve', 'Nieve (partículas)', <Snowflake key="n" className="w-3.5 h-3.5" />],
              ['tormenta_ceniza', 'Tormenta de Ceniza (partículas)', <Flame key="c" className="w-3.5 h-3.5" />],
              ['neblina', 'Neblina', <CloudFog key="f" className="w-3.5 h-3.5" />],
            ] as [WeatherType, string, React.ReactNode][]
          ).map(([wKey, label, icon]) => (
            <button
              key={wKey}
              onClick={() => onSelectWeather(wKey)}
              title={`Activar clima: ${label}`}
              aria-label={`Activar clima ${label}`}
              className={`h-6 rounded flex items-center justify-center transition-colors ${
                weather === wKey
                  ? 'bg-[#b48e4a] text-[#0b0d12]'
                  : 'text-stone-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Center Crosshair & Target Info */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative flex flex-col items-center">
          <div className="w-5 h-5 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-[#f3e6c8]/90 border border-black/70" />
          </div>

          {target && (
            <div
              className={`absolute top-7 w-64 bg-[#0c0e14]/92 rounded-lg px-3 py-2 text-center shadow-lg border ${
                target.isElite ? 'border-rose-400/75' : 'border-[#b48e4a]/50'
              }`}
            >
              <div
                className={`text-sm font-semibold truncate ${
                  target.isElite ? 'text-rose-200' : 'text-[#f3e6c8]'
                }`}
              >
                {target.name}
              </div>
              <div className="text-[11px] text-stone-400 truncate">{target.subtitle}</div>
              {target.hp !== undefined && target.maxHp !== undefined && (
                <div className="mt-1.5 space-y-0.5">
                  <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 transition-all"
                      style={{ width: `${(target.hp / target.maxHp) * 100}%` }}
                    />
                  </div>
                  <div className="font-mono-num text-[10px] text-stone-300">
                    {target.hp} / {target.maxHp} HP
                  </div>
                </div>
              )}
              {target.interactLabel && (
                <div className="mt-1 text-[11px] font-medium text-amber-300">
                  {target.interactLabel}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pointer Lock / Controls Hint */}
      {!pointerLocked && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 pointer-events-auto">
          <button
            onClick={onRequestPointerLock}
            className="px-4 py-1.5 rounded-md bg-[#0c0e14]/92 border border-[#b48e4a]/50 text-xs text-stone-200 hover:text-white hover:border-[#d4af5f] transition-colors whitespace-nowrap"
          >
            Clic para cámara libre · WASD mover · Clic atacar · [G] bloquear · [E] abrir/estudiar
          </button>
        </div>
      )}

      {/* Achievement Unlock Toasts */}
      {achievementToasts.length > 0 && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-30 flex flex-col gap-2 w-80 max-w-[92vw] pointer-events-auto">
          {achievementToasts.map((toast) => (
            <div
              key={toast.id}
              className="animate-achievement-in bg-[#0c0e14]/96 border border-[#d4af5f] rounded-lg p-3 shadow-2xl flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-[#b48e4a]/20 border border-[#d4af5f]/60 flex items-center justify-center text-amber-300 shrink-0">
                <Trophy className="w-4 h-4" />
              </div>
              <button
                onClick={() => {
                  onDismissAchievementToast(toast.id);
                  onOpenModal('logros');
                }}
                className="flex-1 text-left min-w-0"
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                  Logro Desbloqueado · {toast.category}
                </div>
                <div className="font-display text-sm font-bold text-[#f3e6c8] truncate mt-0.5">
                  {toast.title}
                </div>
                <div className="text-[11px] text-stone-300 line-clamp-2 mt-0.5">
                  {toast.description}
                </div>
                {(toast.rewardGold || toast.rewardXp) && (
                  <div className="flex items-center gap-2 mt-1 text-[10px] font-mono-num">
                    {toast.rewardGold && (
                      <span className="text-amber-300">+{toast.rewardGold} Oro</span>
                    )}
                    {toast.rewardXp && (
                      <span className="text-sky-300">+{toast.rewardXp} XP</span>
                    )}
                  </div>
                )}
              </button>
              <button
                onClick={() => onDismissAchievementToast(toast.id)}
                className="text-stone-400 hover:text-white p-0.5 transition-colors"
                aria-label="Cerrar notificación de logro"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Bottom-Left: Subtle Combat & Study Feed */}
      <div className="fixed bottom-24 left-4 w-72 space-y-1 pointer-events-none">
        {combatLogs.slice(-4).map((log) => (
          <div
            key={log.id}
            className={`text-xs px-2.5 py-1 rounded bg-[#0c0e14]/82 border border-white/5 truncate ${
              log.tone === 'crit'
                ? 'text-amber-300 font-semibold'
                : log.tone === 'heal'
                ? 'text-emerald-300'
                : log.tone === 'study'
                ? 'text-sky-300'
                : log.tone === 'loot' || log.tone === 'quest'
                ? 'text-[#f3e6c8]'
                : log.tone === 'damage'
                ? 'text-rose-300'
                : 'text-stone-300'
            }`}
          >
            {log.text}
          </div>
        ))}
      </div>

      {/* Bottom-Center: Compact Action Bar + Menu Tabs + Reserved Slots 4-6 */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 max-w-[96vw] bg-[#0c0e14]/94 border border-[#b48e4a]/45 rounded-xl px-3 py-2 flex items-center gap-2 pointer-events-auto shadow-2xl overflow-x-auto">
        <div className="flex items-center gap-1.5 pr-2 border-r border-white/10">
          {skills.map((sk) => {
            const onCd = sk.remainingCooldown > 0;
            const slotAccent =
              sk.slotIndex === 4
                ? 'border-emerald-500/60 hover:border-emerald-400 text-emerald-100'
                : sk.slotIndex === 5
                ? 'border-rose-500/60 hover:border-rose-400 text-rose-100'
                : sk.slotIndex === 6
                ? 'border-fuchsia-500/60 hover:border-fuchsia-400 text-fuchsia-100'
                : 'border-[#b48e4a]/50 hover:border-[#d4af5f] text-[#f3e6c8]';
            return (
              <button
                key={sk.id}
                onClick={() => onTriggerSkill(sk.slotIndex)}
                title={`${sk.name}${sk.sourceLabel ? ` (${sk.sourceLabel})` : ''} — ${sk.description}`}
                className={`relative w-11 h-11 rounded-lg border flex flex-col items-center justify-center transition-colors shrink-0 ${
                  sk.isReservedSlot
                    ? 'bg-[#12151e] border-dashed border-stone-600 text-stone-500 hover:border-amber-400/50 hover:text-stone-300'
                    : onCd
                    ? 'bg-[#141720] border-white/15 text-stone-500'
                    : `bg-[#171c28] ${slotAccent}`
                }`}
              >
                <span className="text-[10px] font-mono-num font-bold leading-none">
                  {sk.keyLabel}
                </span>
                <span className="text-[9px] truncate max-w-[40px] mt-0.5 leading-none">
                  {sk.isReservedSlot ? 'Libre' : sk.name.split(' ')[0]}
                </span>
                {onCd && (
                  <span className="absolute inset-0 bg-black/70 rounded-lg flex items-center justify-center font-mono-num text-xs font-bold text-amber-300">
                    {sk.remainingCooldown.toFixed(1)}
                  </span>
                )}
              </button>
            );
          })}

          <button
            onClick={onUseQuickPotion}
            title="Usar Poción de Vitalidad [R]"
            className="w-11 h-11 rounded-lg border bg-[#191520] border-rose-500/40 hover:border-rose-400 text-rose-200 flex flex-col items-center justify-center shrink-0 transition-colors"
          >
            <span className="text-[10px] font-mono-num font-bold leading-none">R</span>
            <span className="text-[9px] font-mono-num mt-0.5 leading-none">
              HP x{potionCount}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <HudMenuBtn
            icon={<Backpack className="w-4 h-4" />}
            label="Inventario"
            shortcut="I"
            onClick={() => onOpenModal('inventario')}
          />
          <HudMenuBtn
            icon={<User className="w-4 h-4" />}
            label="Atributos"
            shortcut="C"
            highlight={attributePoints > 0 || talentPoints > 0}
            onClick={() => onOpenModal('personaje')}
          />
          <HudMenuBtn
            icon={<ScrollText className="w-4 h-4" />}
            label="Misiones"
            shortcut="M"
            onClick={() => onOpenModal('misiones')}
          />
          <HudMenuBtn
            icon={<BookOpen className="w-3.5 h-3.5" />}
            label="Bestiario"
            shortcut="B"
            onClick={() => onOpenModal('bestiario')}
          />
          <HudMenuBtn
            icon={<Users className="w-3.5 h-3.5" />}
            label="Clan"
            shortcut="K"
            highlight={hasClanActionPending}
            onClick={() => onOpenModal('clan')}
          />
          <HudMenuBtn
            icon={<FlaskConical className="w-3.5 h-3.5" />}
            label="Alquimia"
            shortcut="Q"
            highlight={activeBuffs.length > 0}
            onClick={() => onOpenModal('alquimia')}
          />
          <HudMenuBtn
            icon={<Trophy className="w-3.5 h-3.5" />}
            label="Logros"
            shortcut="L"
            highlight={hasUnseenAchievements}
            onClick={() => onOpenModal('logros')}
          />
          <HudMenuBtn
            icon={<Flame className="w-3.5 h-3.5" />}
            label="Renacer"
            shortcut="N"
            highlight={canRebirth}
            onClick={() => onOpenModal('renacimiento')}
          />
          <HudMenuBtn
            icon={<Crown className="w-3.5 h-3.5" />}
            label="Top"
            shortcut="U"
            onClick={() => onOpenModal('top')}
          />
          <HudMenuBtn
            icon={<UserCheck className="w-3.5 h-3.5" />}
            label="Cuenta"
            shortcut="Y"
            highlight={!isAccountLinked}
            onClick={() => onOpenModal('cuenta')}
          />
          <HudMenuBtn
            icon={<Boxes className="w-3.5 h-3.5" />}
            label="Módulos"
            shortcut="X"
            onClick={() => onOpenModal('modulos')}
          />
        </div>
      </div>

      {/* Bottom-Right: Online Multiplayer Chat & Active Players Drawer */}
      <OnlineChatPanel
        isAccountLinked={isAccountLinked}
        localUid={localUid}
        playerName={playerName}
        playerLevel={level}
        playerRebirths={rebirths}
        clanName={clanName}
        clanTag={clanTag}
        clanColor={clanColor}
        currentMapId={currentMapId}
        onlinePlayers={onlinePlayers}
        messages={chatMessages}
        channel={chatChannel}
        isOpen={chatOpen}
        onToggleOpen={onToggleChatOpen}
        onChangeChannel={onChangeChatChannel}
        onSendMessage={onSendChatMessage}
        onLinkGoogleAccount={onLinkGoogleAccount}
        onInputFocusChange={onChatInputFocusChange}
      />
    </div>
  );
};

const HudMenuBtn: React.FC<{
  icon: React.ReactNode;
  label: string;
  shortcut: string;
  highlight?: boolean;
  onClick: () => void;
}> = ({ icon, label, shortcut, highlight, onClick }) => (
  <button
    onClick={onClick}
    className={`px-2.5 py-2 rounded-lg border text-[11px] font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
      highlight
        ? 'bg-[#b48e4a]/25 border-amber-400 text-amber-200'
        : 'bg-[#141822] border-white/10 hover:border-[#b48e4a]/60 text-stone-200 hover:text-white'
    }`}
  >
    {icon}
    <span>{label}</span>
    <span className="font-mono-num text-[10px] text-stone-400">[{shortcut}]</span>
  </button>
);
