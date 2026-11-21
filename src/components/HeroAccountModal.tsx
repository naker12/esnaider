import React, { useState } from 'react';
import {
  Check,
  CloudDownload,
  CloudUpload,
  Flame,
  LogIn,
  LogOut,
  Shield,
  Sparkles,
  Swords,
  User as UserIcon,
  X,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import {
  CLASSES_CATALOG,
  DIFFICULTIES_CATALOG,
  RACES_CATALOG,
  computeWorldScaling,
  getRebirthDamageMultiplier,
} from '../game/data';
import { ClassId, DifficultyId, RaceId } from '../game/types';

type AccountModalTab = 'identidad' | 'raza' | 'clase' | 'dificultad';

interface HeroAccountModalProps {
  playerName: string;
  raceId: RaceId;
  classId: ClassId;
  difficultyId: DifficultyId;
  level: number;
  rebirths: number;
  firebaseUser: User | null;
  cloudSyncBusy: boolean;
  cloudStatusMessage: string | null;
  onChangePlayerName: (name: string) => void;
  onSelectRace: (raceId: RaceId) => void;
  onSelectClass: (classId: ClassId) => void;
  onSelectDifficulty: (difficultyId: DifficultyId) => void;
  onLinkGoogleAccount: () => void;
  onSignOut: () => void;
  onSaveToCloud: () => void;
  onLoadFromCloud: () => void;
  onClose: () => void;
}

export const HeroAccountModal: React.FC<HeroAccountModalProps> = ({
  playerName,
  raceId,
  classId,
  difficultyId,
  level,
  rebirths,
  firebaseUser,
  cloudSyncBusy,
  cloudStatusMessage,
  onChangePlayerName,
  onSelectRace,
  onSelectClass,
  onSelectDifficulty,
  onLinkGoogleAccount,
  onSignOut,
  onSaveToCloud,
  onLoadFromCloud,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<AccountModalTab>('identidad');
  const [nameInput, setNameInput] = useState(playerName);
  const [nameSavedFlash, setNameSavedFlash] = useState(false);

  const selectedRace = RACES_CATALOG.find((r) => r.id === raceId) ?? RACES_CATALOG[0];
  const selectedClass = CLASSES_CATALOG.find((c) => c.id === classId) ?? CLASSES_CATALOG[0];
  const selectedDiff =
    DIFFICULTIES_CATALOG.find((d) => d.id === difficultyId) ?? DIFFICULTIES_CATALOG[0];
  const rebirthMult = getRebirthDamageMultiplier(rebirths);
  const worldScaling = computeWorldScaling(level, rebirths, difficultyId);

  const handleSaveName = () => {
    const cleaned = nameInput.trim().slice(0, 24);
    if (cleaned.length > 0) {
      onChangePlayerName(cleaned);
      setNameInput(cleaned);
      setNameSavedFlash(true);
      window.setTimeout(() => setNameSavedFlash(false), 1600);
    } else {
      setNameInput(playerName);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-5xl max-h-[90vh] bg-[#0e1118] border border-[#b48e4a]/50 rounded-xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/10">
          <div className="min-w-0">
            <h2 className="font-display text-xl text-[#f3e6c8]">
              Identidad del Héroe, Cuenta y Dificultad
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              <span className="text-[#f3e6c8] font-semibold">{playerName}</span> ·{' '}
              <span className={selectedRace.colorClass}>{selectedRace.name}</span> ·{' '}
              <span className={selectedClass.colorClass}>{selectedClass.name}</span> ·{' '}
              <span className={selectedDiff.colorClass}>{selectedDiff.name}</span> ·{' '}
              <span className="font-mono-num text-amber-300">
                Nv.{level} · R{rebirths} (×{rebirthMult} Daño)
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 rounded-lg bg-[#141821] border border-white/10 overflow-x-auto">
              {(
                [
                  ['identidad', 'Nombre y Cuenta', <UserIcon key="u" className="w-3.5 h-3.5" />],
                  ['raza', 'Razas', <Sparkles key="r" className="w-3.5 h-3.5" />],
                  ['clase', 'Clases', <Swords key="c" className="w-3.5 h-3.5" />],
                  ['dificultad', 'Dificultad', <Flame key="d" className="w-3.5 h-3.5" />],
                ] as [AccountModalTab, string, React.ReactNode][]
              ).map(([tabKey, label, icon]) => (
                <button
                  key={tabKey}
                  onClick={() => setActiveTab(tabKey)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                    activeTab === tabKey
                      ? 'bg-[#b48e4a] text-[#0b0d12] font-semibold'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  {icon}
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Cerrar panel de cuenta"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto rpg-scroll p-6">
          {activeTab === 'identidad' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* 1. Ingresar Nombre */}
              <div className="lg:col-span-6 p-5 rounded-xl bg-[#131722] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-mono-num uppercase tracking-wider text-amber-300">
                      Paso 1
                    </span>
                    <h3 className="font-display text-lg text-[#f3e6c8]">
                      Ingresar Nombre del Héroe
                    </h3>
                  </div>
                  <UserIcon className="w-5 h-5 text-[#d4af5f]" />
                </div>

                <p className="text-xs text-stone-300 leading-relaxed">
                  Tu nombre aparecerá en el HUD, tu ficha de personaje y en el ranking global del Top.
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nameInput}
                    maxLength={24}
                    placeholder="Escribe tu nombre de héroe..."
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') handleSaveName();
                    }}
                    className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#0b0d14] border border-[#b48e4a]/50 focus:border-[#d4af5f] text-sm font-display text-[#f3e6c8] focus:outline-none"
                  />
                  <button
                    onClick={handleSaveName}
                    className="px-4 py-2.5 rounded-lg bg-[#b48e4a] hover:bg-[#c8a056] text-[#0b0d12] text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>{nameSavedFlash ? 'Guardado' : 'Aplicar'}</span>
                  </button>
                </div>

                {/* Build Quick Summary */}
                <div className="pt-3 border-t border-white/10 space-y-2.5">
                  <div className="text-xs font-semibold text-[#d4af5f]">
                    Configuración Actual del Personaje
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      onClick={() => setActiveTab('raza')}
                      className="p-2.5 rounded-lg bg-[#0d1018] border border-white/10 hover:border-[#b48e4a]/60 text-left transition-colors"
                    >
                      <div className="text-[10px] text-stone-400">Raza</div>
                      <div className={`text-xs font-semibold truncate ${selectedRace.colorClass}`}>
                        {selectedRace.name}
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('clase')}
                      className="p-2.5 rounded-lg bg-[#0d1018] border border-white/10 hover:border-[#b48e4a]/60 text-left transition-colors"
                    >
                      <div className="text-[10px] text-stone-400">Clase</div>
                      <div className={`text-xs font-semibold truncate ${selectedClass.colorClass}`}>
                        {selectedClass.name}
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('dificultad')}
                      className="p-2.5 rounded-lg bg-[#0d1018] border border-white/10 hover:border-[#b48e4a]/60 text-left transition-colors"
                    >
                      <div className="text-[10px] text-stone-400">Dificultad</div>
                      <div className={`text-xs font-semibold truncate ${selectedDiff.colorClass}`}>
                        {selectedDiff.name}
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Vincular con una Cuenta */}
              <div className="lg:col-span-6 p-5 rounded-xl bg-[#131722] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-mono-num uppercase tracking-wider text-sky-300">
                      Paso 2
                    </span>
                    <h3 className="font-display text-lg text-[#f3e6c8]">
                      Vincular con una Cuenta
                    </h3>
                  </div>
                  <Shield className="w-5 h-5 text-sky-300" />
                </div>

                <p className="text-xs text-stone-300 leading-relaxed">
                  Vincula tu cuenta de Google para respaldar tu progreso en la nube (Nivel hasta 9999, Oro, Kills, Renacimientos y Corazones de Dragón) y competir en el Top Global.
                </p>

                {firebaseUser ? (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-lg bg-emerald-950/35 border border-emerald-500/40 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[11px] text-emerald-300 font-semibold">
                          Cuenta Vinculada Activa
                        </div>
                        <div className="text-sm text-[#f3e6c8] font-medium truncate">
                          {firebaseUser.displayName || firebaseUser.email || 'Cuenta Google'}
                        </div>
                        {firebaseUser.email && (
                          <div className="text-[11px] text-stone-400 truncate">
                            {firebaseUser.email}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={onSignOut}
                        disabled={cloudSyncBusy}
                        className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-xs text-stone-200 flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Desvincular</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        onClick={onSaveToCloud}
                        disabled={cloudSyncBusy}
                        className="px-4 py-2.5 rounded-lg bg-[#b48e4a] hover:bg-[#c8a056] disabled:opacity-50 text-[#0b0d12] text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                      >
                        <CloudUpload className="w-4 h-4" />
                        <span>Guardar en la Nube</span>
                      </button>
                      <button
                        onClick={onLoadFromCloud}
                        disabled={cloudSyncBusy}
                        className="px-4 py-2.5 rounded-lg bg-[#192030] hover:bg-[#222c42] border border-sky-500/40 disabled:opacity-50 text-sky-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                      >
                        <CloudDownload className="w-4 h-4" />
                        <span>Cargar desde la Nube</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-lg bg-[#0d1018] border border-white/10 text-xs text-stone-400">
                      Actualmente estás jugando de forma local. Vincula tu cuenta para guardar tu personaje y entrar al Top Global.
                    </div>
                    <button
                      onClick={onLinkGoogleAccount}
                      disabled={cloudSyncBusy}
                      className="w-full px-4 py-3 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-[#071019] text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>
                        {cloudSyncBusy ? 'Conectando...' : 'Vincular con Google'}
                      </span>
                    </button>
                  </div>
                )}

                {cloudStatusMessage && (
                  <div className="p-2.5 rounded-lg bg-[#0b0e15] border border-amber-500/30 text-xs text-amber-200">
                    {cloudStatusMessage}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'raza' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-stone-300">
                  Cada raza otorga una <strong className="text-amber-300">Pasiva</strong> permanente, una ventaja <strong className="text-sky-300">Única</strong> y una <strong className="text-emerald-300">Habilidad Activa [4]</strong>.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {RACES_CATALOG.map((race) => {
                  const isSelected = race.id === raceId;
                  return (
                    <div
                      key={race.id}
                      onClick={() => onSelectRace(race.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-colors flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#1a1f2c] border-[#d4af5f]'
                          : 'bg-[#131722] border-white/10 hover:border-white/25'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className={`font-display text-base font-bold ${race.colorClass}`}>
                              {race.name}
                            </h3>
                            <p className="text-[11px] text-stone-400">{race.tagline}</p>
                          </div>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded bg-[#b48e4a] text-[#0b0d12] text-[10px] font-bold">
                              Activa
                            </span>
                          )}
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#0d1018] border border-white/5 space-y-1">
                          <div className="text-[11px] font-semibold text-amber-300">
                            {race.passiveTitle}
                          </div>
                          <p className="text-xs text-stone-300">{race.passiveDescription}</p>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#0d1018] border border-white/5 space-y-1">
                          <div className="text-[11px] font-semibold text-sky-300">
                            {race.uniqueTitle}
                          </div>
                          <p className="text-xs text-stone-300">{race.uniqueDescription}</p>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#0d1018] border border-emerald-500/20 space-y-1">
                          <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-emerald-300">
                            <span>Activa [4]: {race.activeSkill.name}</span>
                            <span className="font-mono-num text-[10px] text-stone-400">
                              {race.activeSkill.manaCost} Maná · {race.activeSkill.cooldown}s
                            </span>
                          </div>
                          <p className="text-xs text-stone-300">{race.activeSkill.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'clase' && (
            <div className="space-y-4">
              <p className="text-xs text-stone-300">
                Cada clase define tu estilo de combate con una <strong className="text-amber-300">Pasiva</strong>, una mecánica <strong className="text-sky-300">Única</strong> y una <strong className="text-rose-300">Habilidad Activa [5]</strong>.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CLASSES_CATALOG.map((cls) => {
                  const isSelected = cls.id === classId;
                  return (
                    <div
                      key={cls.id}
                      onClick={() => onSelectClass(cls.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-colors flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#1a1f2c] border-[#d4af5f]'
                          : 'bg-[#131722] border-white/10 hover:border-white/25'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className={`font-display text-base font-bold ${cls.colorClass}`}>
                              {cls.name}
                            </h3>
                            <p className="text-[11px] text-stone-400">{cls.tagline}</p>
                          </div>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded bg-[#b48e4a] text-[#0b0d12] text-[10px] font-bold">
                              Activa
                            </span>
                          )}
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#0d1018] border border-white/5 space-y-1">
                          <div className="text-[11px] font-semibold text-amber-300">
                            {cls.passiveTitle}
                          </div>
                          <p className="text-xs text-stone-300">{cls.passiveDescription}</p>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#0d1018] border border-white/5 space-y-1">
                          <div className="text-[11px] font-semibold text-sky-300">
                            {cls.uniqueTitle}
                          </div>
                          <p className="text-xs text-stone-300">{cls.uniqueDescription}</p>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#0d1018] border border-rose-500/20 space-y-1">
                          <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-rose-300">
                            <span>Activa [5]: {cls.activeSkill.name}</span>
                            <span className="font-mono-num text-[10px] text-stone-400">
                              {cls.activeSkill.manaCost} Maná · {cls.activeSkill.cooldown}s
                            </span>
                          </div>
                          <p className="text-xs text-stone-300">{cls.activeSkill.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'dificultad' && (
            <div className="space-y-4">
              <p className="text-xs text-stone-300">
                La dificultad del mundo combina el modo elegido con tu <strong className="text-sky-300">Nivel ({level})</strong> y <strong className="text-fuchsia-300">Renacimientos (R{rebirths})</strong>: escalan los atributos enemigos, la frecuencia de encuentros y la probabilidad de élites.
              </p>

              <div className="p-3.5 rounded-xl bg-[#131722] border border-[#b48e4a]/40 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <div className="text-[11px] text-stone-400">Amenaza Global</div>
                  <div className="font-display font-bold text-[#f3e6c8]">
                    {worldScaling.threatLabel}
                  </div>
                  <div className="font-mono-num text-[10px] text-stone-400">
                    Nv.{level} · R{rebirths}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-stone-400">Escala Enemiga</div>
                  <div className="font-mono-num font-semibold text-rose-300">
                    HP ×{worldScaling.hpMult} · ATQ ×{worldScaling.atkMult}
                  </div>
                  <div className="font-mono-num text-[10px] text-sky-300">
                    DEF ×{worldScaling.defMult} · VEL ×{worldScaling.speedMult}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-stone-400">Encuentros y Élite</div>
                  <div className="font-mono-num font-semibold text-amber-300">
                    Cada ~{worldScaling.encounterIntervalSec}s (máx {worldScaling.maxDynamicEncounters})
                  </div>
                  <div className="font-mono-num text-[10px] text-orange-300">
                    Élite {Math.round(worldScaling.eliteChance * 100)}% · Reap. {Math.round(worldScaling.respawnTimeMult * 100)}%
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-stone-400">Botín Total</div>
                  <div className="font-mono-num font-semibold text-emerald-300">
                    XP ×{worldScaling.xpMult}
                  </div>
                  <div className="font-mono-num text-[10px] text-amber-300">
                    Oro ×{worldScaling.goldMult}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {DIFFICULTIES_CATALOG.map((diff) => {
                  const isSelected = diff.id === difficultyId;
                  return (
                    <button
                      key={diff.id}
                      onClick={() => onSelectDifficulty(diff.id)}
                      className={`p-4 rounded-xl border text-left transition-colors flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#1a1f2c] border-[#d4af5f]'
                          : 'bg-[#131722] border-white/10 hover:border-white/25'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`font-display text-base font-bold ${diff.colorClass}`}>
                            {diff.name}
                          </span>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded bg-[#b48e4a] text-[#0b0d12] text-[10px] font-bold">
                              Activa
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-stone-400">{diff.subtitle}</div>
                        <p className="text-xs text-stone-300 leading-relaxed">{diff.description}</p>
                      </div>

                      <div className="pt-2.5 border-t border-white/10 grid grid-cols-2 gap-1.5 text-[11px] font-mono-num">
                        <span className="text-rose-300">HP Enemigo ×{diff.hpMult}</span>
                        <span className="text-orange-300">ATQ Enemigo ×{diff.atkMult}</span>
                        <span className="text-sky-300">XP ×{diff.xpMult}</span>
                        <span className="text-amber-300">Oro ×{diff.goldMult}</span>
                        <span className="col-span-2 text-emerald-300">
                          +{Math.round(diff.heartDropBonus * 100)}% Drop Corazón de Dragón
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-[#0b0d14] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-stone-400">
            Puedes cambiar tu Raza, Clase, Nombre o Dificultad en cualquier momento pulsando <span className="font-mono-num text-stone-200">[Y]</span>.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#b48e4a] hover:bg-[#c8a056] text-[#0b0d12] text-sm font-semibold transition-colors"
          >
            Entrar al Valle del Velo
          </button>
        </div>
      </div>
    </div>
  );
};
