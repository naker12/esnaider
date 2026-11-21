import React, { useState } from 'react';
import {
  BookOpen,
  Check,
  Coins,
  FlaskConical,
  MapPin,
  Shield,
  Sparkles,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { CLAN_NPCS_CATALOG, CLAN_ROLE_INFO, PRESET_CLANS } from '../game/data';
import { ClanComputedBonuses, ClanMemberState, ClanRole } from '../game/types';

interface ClanModalProps {
  clanName: string;
  clanTag: string;
  clanColor: string;
  members: ClanMemberState[];
  bonuses: ClanComputedBonuses;
  onUpdateClanIdentity: (name: string, tag?: string, color?: string) => void;
  onInviteMember: (npcId: string) => void;
  onAssignRole: (npcId: string, role: ClanRole) => void;
  onClose: () => void;
}

const ROLE_OPTIONS: {
  id: Exclude<ClanRole, 'ninguno'>;
  icon: React.ReactNode;
}[] = [
  { id: 'guardia', icon: <Shield className="w-3.5 h-3.5" /> },
  { id: 'alquimista', icon: <FlaskConical className="w-3.5 h-3.5" /> },
  { id: 'historiador', icon: <BookOpen className="w-3.5 h-3.5" /> },
];

export const ClanModal: React.FC<ClanModalProps> = ({
  clanName,
  clanTag,
  clanColor,
  members,
  bonuses,
  onUpdateClanIdentity,
  onInviteMember,
  onAssignRole,
  onClose,
}) => {
  const [nameDraft, setNameDraft] = useState(clanName);
  const [tagDraft, setTagDraft] = useState(clanTag);

  const rescuedCount = members.filter((m) => m.rescued).length;
  const invitedCount = members.filter((m) => m.invited).length;
  const activeRoleCount = members.filter((m) => m.invited && m.role !== 'ninguno').length;

  const statBonusList: string[] = [];
  if (bonuses.statBonuses.defensa) statBonusList.push(`+${bonuses.statBonuses.defensa} Defensa`);
  if (bonuses.statBonuses.danoMin)
    statBonusList.push(`+${bonuses.statBonuses.danoMin}–${bonuses.statBonuses.danoMax} Daño`);
  if (bonuses.statBonuses.maxHp) statBonusList.push(`+${bonuses.statBonuses.maxHp} Salud Máx.`);
  if (bonuses.statBonuses.maxMana) statBonusList.push(`+${bonuses.statBonuses.maxMana} Maná Máx.`);
  if (bonuses.statBonuses.regenHp) statBonusList.push(`+${bonuses.statBonuses.regenHp} Regen. HP/s`);
  if (bonuses.statBonuses.regenMana)
    statBonusList.push(`+${bonuses.statBonuses.regenMana} Regen. Maná/s`);
  if (bonuses.statBonuses.probCritico)
    statBonusList.push(`+${bonuses.statBonuses.probCritico}% Crítico`);
  if (bonuses.statBonuses.danoCritico)
    statBonusList.push(`+${bonuses.statBonuses.danoCritico}% Daño Crítico`);
  if (bonuses.statBonuses.inteligencia)
    statBonusList.push(`+${bonuses.statBonuses.inteligencia} Inteligencia`);

  const handleSaveName = () => {
    const trimmed = nameDraft.trim();
    const cleanTag = tagDraft.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    if (trimmed.length >= 2) {
      onUpdateClanIdentity(trimmed, cleanTag.length >= 2 ? cleanTag : undefined);
    }
  };

  const handleSelectPreset = (name: string, tag: string, colorHex: string) => {
    setNameDraft(name);
    setTagDraft(tag);
    onUpdateClanIdentity(name, tag, colorHex);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-4xl max-h-[86vh] bg-[#0e1118] border border-[#b48e4a]/45 rounded-xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <Users className="w-5 h-5 text-[#d4af5f] shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-xl text-[#f3e6c8] truncate">
                  Clan y Base del Santuario
                </h2>
                <span
                  className="px-2 py-0.5 rounded border text-xs font-mono-num font-bold shrink-0"
                  style={{
                    borderColor: `${clanColor}88`,
                    backgroundColor: `${clanColor}22`,
                    color: clanColor,
                  }}
                >
                  [{clanTag}] {clanName}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Tu emblema [{clanTag}] aparece en el chat online, mapa 3D y Top Global · Rescata NPCs en el valle [E]
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs font-mono-num text-stone-300">
              Rescatados {rescuedCount}/{CLAN_NPCS_CATALOG.length} · En base {invitedCount}/
              {CLAN_NPCS_CATALOG.length}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Cerrar panel de clan"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto rpg-scroll p-6 space-y-5">
          {/* Clan Name & Passive Bonuses Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5 bg-[#131720] border border-white/10 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#f3e6c8]">Identidad Online del Clan</span>
                <span
                  className="px-1.5 py-0.5 rounded border text-[10px] font-mono-num font-bold"
                  style={{
                    borderColor: `${clanColor}88`,
                    backgroundColor: `${clanColor}22`,
                    color: clanColor,
                  }}
                >
                  [{clanTag}]
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameDraft}
                  maxLength={28}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                  }}
                  placeholder="Nombre del clan..."
                  className="flex-1 min-w-0 px-3 py-1.5 rounded-md bg-black/45 border border-white/15 focus:border-[#d4af5f] outline-none text-xs text-[#f3e6c8]"
                />
                <input
                  type="text"
                  value={tagDraft}
                  maxLength={5}
                  onChange={(e) =>
                    setTagDraft(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                  }}
                  placeholder="TAG"
                  title="Etiqueta de clan (2-5 letras/números)"
                  className="w-16 px-2 py-1.5 rounded-md bg-black/45 border border-white/15 focus:border-[#d4af5f] outline-none text-xs font-mono-num font-bold text-center text-[#f3e6c8]"
                />
                <button
                  onClick={handleSaveName}
                  disabled={
                    nameDraft.trim().length < 2 ||
                    (nameDraft.trim() === clanName &&
                      tagDraft.trim().toUpperCase() === clanTag)
                  }
                  className="px-3 py-1.5 rounded-md bg-[#b48e4a] hover:bg-[#c8a056] disabled:bg-white/10 disabled:text-stone-500 text-[#0b0d12] text-xs font-semibold whitespace-nowrap transition-colors"
                >
                  Aplicar
                </button>
              </div>
              <div className="space-y-1.5 pt-1 border-t border-white/10">
                <div className="text-[11px] text-stone-300 font-medium">
                  Clanes Públicos (comparte chat de clan y estandarte):
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {PRESET_CLANS.map((preset) => {
                    const isSelected =
                      preset.name.toLowerCase() === clanName.trim().toLowerCase();
                    return (
                      <button
                        key={preset.id}
                        onClick={() =>
                          handleSelectPreset(preset.name, preset.tag, preset.colorHex)
                        }
                        className={`px-2.5 py-1.5 rounded-md border text-left flex items-center justify-between gap-2 transition-colors ${
                          isSelected
                            ? 'bg-white/10 border-[#d4af5f]'
                            : 'bg-black/35 border-white/10 hover:border-white/25'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span
                              className="font-mono-num font-bold shrink-0"
                              style={{ color: preset.colorHex }}
                            >
                              [{preset.tag}]
                            </span>
                            <span className="font-semibold text-[#f3e6c8] truncate">
                              {preset.name}
                            </span>
                          </div>
                          <div className="text-[10px] text-stone-400 truncate">
                            {preset.motto}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="text-[11px] text-stone-400 leading-relaxed">
                Asignar a un NPC rescatado su <span className="text-amber-300">rol especialista</span>{' '}
                otorga <span className="font-mono-num text-emerald-300">+50%</span> de bonificación
                en sus atributos y producción pasiva.
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#131720] border border-[#b48e4a]/35 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#f3e6c8]">
                  Bonificaciones Activas del Clan ({activeRoleCount} roles activos)
                </span>
                <span className="text-[11px] font-mono-num text-stone-400">Ciclo cada 25s</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="px-2.5 py-2 rounded bg-black/35 border border-white/10">
                  <div className="text-[10px] text-stone-400">Oro / 25s</div>
                  <div className="font-mono-num font-bold text-amber-300 mt-0.5 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 shrink-0" />
                    +{bonuses.goldPerCycle}
                  </div>
                </div>
                <div className="px-2.5 py-2 rounded bg-black/35 border border-white/10">
                  <div className="text-[10px] text-stone-400">XP / 25s</div>
                  <div className="font-mono-num font-bold text-sky-300 mt-0.5">
                    +{bonuses.xpPerCycle} XP
                  </div>
                </div>
                <div className="px-2.5 py-2 rounded bg-black/35 border border-white/10">
                  <div className="text-[10px] text-stone-400">Hierbas / 25s</div>
                  <div className="font-mono-num font-bold text-emerald-300 mt-0.5">
                    +{bonuses.herbsPerCycle}
                  </div>
                </div>
                <div className="px-2.5 py-2 rounded bg-black/35 border border-white/10">
                  <div className="text-[10px] text-stone-400">Estudio + Alquimia</div>
                  <div className="font-mono-num font-bold text-violet-300 mt-0.5">
                    +{bonuses.studyPointsPerCycle} pts · {Math.round(bonuses.alchemyDurationMult * 100)}%
                  </div>
                </div>
              </div>

              {statBonusList.length > 0 ? (
                <div className="text-[11px] font-mono-num text-emerald-300 border-t border-white/10 pt-2">
                  Estadísticas aplicadas: {statBonusList.join(' · ')}
                </div>
              ) : (
                <div className="text-[11px] text-stone-400 border-t border-white/10 pt-2">
                  Invita miembros rescatados a la base y asígnales un rol para recibir estadísticas y
                  recursos automáticos.
                </div>
              )}
            </div>
          </div>

          {/* Members List */}
          <div className="space-y-3">
            {CLAN_NPCS_CATALOG.map((def) => {
              const state = members.find((m) => m.id === def.id) ?? {
                id: def.id,
                rescued: false,
                invited: false,
                role: 'ninguno' as ClanRole,
              };
              const preferredInfo = CLAN_ROLE_INFO[def.preferredRole];
              const currentRoleInfo =
                state.role !== 'ninguno' ? CLAN_ROLE_INFO[state.role] : null;

              return (
                <div
                  key={def.id}
                  className={`rounded-lg border p-4 transition-colors ${
                    state.invited
                      ? 'bg-[#131720] border-[#b48e4a]/45'
                      : state.rescued
                      ? 'bg-[#131a22] border-sky-400/45'
                      : 'bg-[#11141c] border-white/10'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-base font-bold text-[#f3e6c8]">
                          {def.name}
                        </h3>
                        <span className="text-xs text-stone-400">· {def.title}</span>
                        <span
                          className={`text-[11px] font-medium ${
                            state.invited
                              ? 'text-emerald-300'
                              : state.rescued
                              ? 'text-sky-300'
                              : 'text-stone-400'
                          }`}
                        >
                          ·{' '}
                          {state.invited
                            ? currentRoleInfo
                              ? `En base · Rol: ${currentRoleInfo.label}`
                              : 'En base · Sin rol asignado'
                            : state.rescued
                            ? 'Rescatado (esperando invitación)'
                            : 'Perdido en el valle'}
                        </span>
                      </div>

                      <p className="text-xs text-amber-200/90">{def.specialtyNote}</p>

                      {!state.rescued ? (
                        <div className="flex items-center gap-2 text-xs text-stone-300 bg-black/35 border border-white/10 rounded-md px-3 py-2">
                          <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                          <span>
                            Encuéntralo en{' '}
                            <strong className="text-[#f3e6c8]">{def.rescueZone}</strong>{' '}
                            <span className="font-mono-num text-stone-400">
                              ({def.rescueCoords.x}, {def.rescueCoords.z})
                            </span>{' '}
                            y acércate para rescatarlo con <span className="text-amber-300">[E]</span>.
                          </span>
                        </div>
                      ) : !state.invited ? (
                        <div className="text-xs text-stone-300 italic bg-black/30 border border-sky-500/20 rounded-md px-3 py-2">
                          “{def.rescueDialog}”
                        </div>
                      ) : (
                        <div className="text-xs text-stone-300">
                          {currentRoleInfo ? (
                            <div className="space-y-0.5">
                              <div className={currentRoleInfo.toneClass}>
                                Bonificación de rol: {currentRoleInfo.statSummary}
                                {state.role === def.preferredRole ? ' (Especialista +50%)' : ''}
                              </div>
                              <div className="text-stone-400">
                                Producción pasiva: {currentRoleInfo.resourceSummary}
                              </div>
                            </div>
                          ) : (
                            <span className="text-stone-400">
                              Rol recomendado: {preferredInfo.label}. Elige un rol a la derecha para
                              activar sus bonificaciones.
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Area */}
                    <div className="shrink-0 flex flex-col items-stretch md:items-end justify-center gap-2 md:min-w-[260px]">
                      {!state.rescued ? (
                        <div className="text-xs text-stone-400 border border-dashed border-white/15 rounded-md px-3 py-2 text-center">
                          Pendiente de rescate en el mundo 3D
                        </div>
                      ) : !state.invited ? (
                        <button
                          onClick={() => onInviteMember(def.id)}
                          className="px-4 py-2.5 rounded-lg bg-[#b48e4a] hover:bg-[#c8a056] text-[#0b0d12] text-xs font-semibold flex items-center justify-center gap-2 whitespace-nowrap transition-colors"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Invitar a la Base del Santuario</span>
                        </button>
                      ) : (
                        <div className="space-y-1.5 w-full">
                          <div className="text-[11px] text-stone-400 md:text-right">
                            Asignar Rol en {clanName}:
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {ROLE_OPTIONS.map((opt) => {
                              const active = state.role === opt.id;
                              const isPreferred = def.preferredRole === opt.id;
                              const info = CLAN_ROLE_INFO[opt.id];
                              return (
                                <button
                                  key={opt.id}
                                  onClick={() => onAssignRole(def.id, opt.id)}
                                  className={`px-2.5 py-1.5 rounded-md border text-xs font-medium flex items-center justify-between gap-1.5 whitespace-nowrap transition-colors ${
                                    active
                                      ? 'bg-[#b48e4a] border-[#d4af5f] text-[#0b0d12] font-semibold'
                                      : 'bg-[#171c27] border-white/10 hover:border-[#b48e4a]/60 text-stone-200'
                                  }`}
                                >
                                  <span className="flex items-center gap-1.5">
                                    {opt.icon}
                                    <span>{info.label}</span>
                                  </span>
                                  {active ? (
                                    <Check className="w-3.5 h-3.5 shrink-0" />
                                  ) : isPreferred ? (
                                    <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
                                  ) : null}
                                </button>
                              );
                            })}
                            <button
                              onClick={() => onAssignRole(def.id, 'ninguno')}
                              className={`px-2.5 py-1.5 rounded-md border text-xs font-medium whitespace-nowrap transition-colors ${
                                state.role === 'ninguno'
                                  ? 'bg-stone-700 border-stone-400 text-white font-semibold'
                                  : 'bg-black/35 border-white/10 hover:border-white/25 text-stone-400'
                              }`}
                            >
                              En descanso
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
