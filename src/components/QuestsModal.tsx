import React, { useState } from 'react';
import { BookMarked, Camera, CheckCircle2, Compass, Lock, MapPin, ScrollText, Sparkles, X } from 'lucide-react';
import { ITEMS_CATALOG, JOURNAL_POI_CATALOG, LORE_CODEX_CATALOG } from '../game/data';
import { WORLD_RADIUS } from '../game/engine';
import { LoreCategory, LoreEntryDefinition, Quest, TravelerJournalEntry } from '../game/types';
import { TravelerJournal } from './TravelerJournal';

type QuestsModalTab = 'misiones' | 'codice' | 'diario';
type LoreFilter = 'todo' | LoreCategory;

interface QuestsModalProps {
  quests: Quest[];
  discoveredLoreIds: string[];
  journalEntries: TravelerJournalEntry[];
  onClaimReward: (questId: string) => void;
  onClose: () => void;
}

export const QuestsModal: React.FC<QuestsModalProps> = ({
  quests,
  discoveredLoreIds,
  journalEntries,
  onClaimReward,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<QuestsModalTab>('misiones');
  const [loreFilter, setLoreFilter] = useState<LoreFilter>('todo');
  const [selectedLoreId, setSelectedLoreId] = useState<string>(
    discoveredLoreIds[discoveredLoreIds.length - 1] ?? LORE_CODEX_CATALOG[0]?.id ?? ''
  );

  const activeCount = quests.filter((q) => q.status !== 'completada').length;
  const loreTotal = LORE_CODEX_CATALOG.length;
  const loreDiscoveredCount = LORE_CODEX_CATALOG.filter((l) =>
    discoveredLoreIds.includes(l.id)
  ).length;
  const lorePct = loreTotal > 0 ? Math.round((loreDiscoveredCount / loreTotal) * 100) : 0;
  const journalTotal = JOURNAL_POI_CATALOG.length;
  const journalCount = journalEntries.length;
  const journalPct = journalTotal > 0 ? Math.round((journalCount / journalTotal) * 100) : 0;

  const filteredLore = LORE_CODEX_CATALOG.filter(
    (entry) => loreFilter === 'todo' || entry.chapter === loreFilter
  );

  const activeLore: LoreEntryDefinition | null =
    filteredLore.find((l) => l.id === selectedLoreId) ?? filteredLore[0] ?? null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-4xl max-h-[86vh] bg-[#0e1118] border border-[#b48e4a]/45 rounded-xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {activeTab === 'codice' ? (
              <BookMarked className="w-5 h-5 text-[#d4af5f]" />
            ) : activeTab === 'diario' ? (
              <Camera className="w-5 h-5 text-[#d4af5f]" />
            ) : (
              <ScrollText className="w-5 h-5 text-[#d4af5f]" />
            )}
            <div>
              <h2 className="font-display text-xl text-[#f3e6c8]">
                {activeTab === 'codice'
                  ? 'Códice de Historia del Valle'
                  : activeTab === 'diario'
                  ? 'Diario de Viajero'
                  : 'Registro de Misiones'}
              </h2>
              <p className="text-xs text-stone-400">
                {activeTab === 'codice'
                  ? `${loreDiscoveredCount} / ${loreTotal} fragmentos descubiertos (${lorePct}%)`
                  : activeTab === 'diario'
                  ? `${journalCount} / ${journalTotal} puntos de interés capturados (${journalPct}%)`
                  : `${activeCount} activas · ${quests.length - activeCount} completadas`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tab Switcher: Misiones | Códice de Historia | Diario de Viajero */}
            <div className="flex items-center p-1 rounded-lg bg-[#141821] border border-white/10">
              <button
                onClick={() => setActiveTab('misiones')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  activeTab === 'misiones'
                    ? 'bg-[#b48e4a] text-[#0b0d12] font-semibold'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <ScrollText className="w-3.5 h-3.5" />
                <span>Misiones</span>
              </button>
              <button
                onClick={() => setActiveTab('codice')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  activeTab === 'codice'
                    ? 'bg-[#b48e4a] text-[#0b0d12] font-semibold'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <BookMarked className="w-3.5 h-3.5" />
                <span>Códice de Historia</span>
                <span className="font-mono-num text-[10px] opacity-85">
                  {loreDiscoveredCount}/{loreTotal}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('diario')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  activeTab === 'diario'
                    ? 'bg-[#b48e4a] text-[#0b0d12] font-semibold'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Diario de Viajero</span>
                <span className="font-mono-num text-[10px] opacity-85">
                  {journalCount}/{journalTotal}
                </span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Cerrar misiones"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        {activeTab === 'misiones' ? (
          <div className="flex-1 overflow-y-auto rpg-scroll p-6 space-y-4">
            {quests.map((q) => {
              const rewardItem = q.rewards.itemId ? ITEMS_CATALOG[q.rewards.itemId] : null;
              const ready = q.status === 'lista_recompensa';
              const done = q.status === 'completada';

              return (
                <div
                  key={q.id}
                  className={`p-5 rounded-lg border transition-colors ${
                    ready
                      ? 'bg-[#1a1f29] border-amber-400/70'
                      : done
                      ? 'bg-[#10131a] border-white/10 opacity-75'
                      : 'bg-[#141821] border-white/10'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-stone-400">
                        {q.zone} · Encargo de {q.giver}
                      </div>
                      <h3 className="font-display text-lg text-[#f3e6c8] mt-0.5 flex items-center gap-2">
                        <span>{q.title}</span>
                        {done && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </h3>
                    </div>

                    {ready ? (
                      <button
                        onClick={() => onClaimReward(q.id)}
                        className="px-4 py-2 rounded-lg bg-[#b48e4a] hover:bg-[#c8a056] text-[#0b0d12] text-xs font-bold whitespace-nowrap transition-colors"
                      >
                        Reclamar Recompensa
                      </button>
                    ) : (
                      <span
                        className={`text-xs font-medium ${
                          done ? 'text-emerald-400' : 'text-amber-300'
                        }`}
                      >
                        {done ? 'Completada' : 'En curso'}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-stone-300 mt-2">{q.description}</p>
                  <p className="text-xs text-stone-400 italic mt-1">{q.loreNote}</p>

                  {/* Objectives */}
                  <div className="mt-4 space-y-2">
                    {q.objectives.map((obj) => {
                      const pct = Math.min(100, Math.round((obj.current / obj.required) * 100));
                      return (
                        <div key={obj.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-stone-200">{obj.description}</span>
                            <span className="font-mono-num text-stone-300">
                              {Math.min(obj.current, obj.required)} / {obj.required}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                pct >= 100 ? 'bg-emerald-400' : 'bg-[#d4af5f]'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Rewards */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-3 text-xs text-stone-300">
                    <span className="text-stone-400">Recompensa:</span>
                    <span className="font-mono-num text-sky-300">+{q.rewards.xp} XP</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-num text-amber-300">+{q.rewards.gold} Oro</span>
                    {rewardItem && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-emerald-300 font-medium">{rewardItem.name}</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : activeTab === 'codice' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Codex Filter & Progress */}
            <div className="px-6 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto">
                {(
                  [
                    ['todo', 'Todos'],
                    ['Historia del Bastión', 'Historia del Bastión'],
                    ['Reliquias Escritas', 'Reliquias Escritas'],
                    ['Crónicas de Zona', 'Crónicas de Zona'],
                  ] as [LoreFilter, string][]
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setLoreFilter(key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                      loreFilter === key
                        ? 'bg-[#b48e4a] text-[#0b0d12] font-semibold'
                        : 'bg-[#161a24] text-stone-300 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2.5 min-w-[170px]">
                <div className="flex-1 h-2 bg-black/60 rounded-sm overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-[#d4af5f] transition-all"
                    style={{ width: `${lorePct}%` }}
                  />
                </div>
                <span className="font-mono-num text-xs text-amber-300">{lorePct}%</span>
              </div>
            </div>

            {/* Codex Split View */}
            <div className="flex-1 overflow-y-auto rpg-scroll p-6 grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Entries List */}
              <div className="md:col-span-5 space-y-2.5 content-start">
                {filteredLore.map((entry) => {
                  const unlocked = discoveredLoreIds.includes(entry.id);
                  const isSelected = activeLore?.id === entry.id;

                  return (
                    <button
                      key={entry.id}
                      onClick={() => setSelectedLoreId(entry.id)}
                      className={`w-full text-left p-3.5 rounded-lg border transition-colors flex flex-col gap-1 ${
                        isSelected
                          ? 'bg-[#1b202c] border-[#d4af5f]'
                          : unlocked
                          ? 'bg-[#141821] border-amber-500/30 hover:border-white/30'
                          : 'bg-[#10131a] border-white/10 hover:border-white/20 opacity-80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-sm font-semibold truncate ${
                            unlocked ? 'text-[#f3e6c8]' : 'text-stone-400'
                          }`}
                        >
                          {unlocked ? entry.title : 'Fragmento sin descubrir'}
                        </span>
                        {unlocked ? (
                          <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-stone-400">
                        <span className="truncate">{entry.chapter}</span>
                        <span className="shrink-0 flex items-center gap-1">
                          {entry.sourceType === 'object' ? (
                            <MapPin className="w-3 h-3 text-amber-400/80" />
                          ) : (
                            <Compass className="w-3 h-3 text-sky-400/80" />
                          )}
                          <span>{entry.zone}</span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Lore Reader Pane */}
              <div className="md:col-span-7 bg-[#131720] border border-[#b48e4a]/30 rounded-lg p-6 flex flex-col justify-between gap-4">
                {activeLore ? (
                  discoveredLoreIds.includes(activeLore.id) ? (
                    <>
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                          <div>
                            <div className="text-xs text-amber-300/90 font-medium">
                              {activeLore.chapter} · {activeLore.zone}
                            </div>
                            <h3 className="font-display text-xl text-[#f3e6c8] mt-1">
                              {activeLore.title}
                            </h3>
                          </div>
                          <span className="px-2.5 py-1 rounded bg-emerald-950/70 border border-emerald-500/40 text-[11px] text-emerald-300 font-medium whitespace-nowrap">
                            Registrado
                          </span>
                        </div>

                        <p className="text-xs text-stone-400 italic border-l-2 border-[#b48e4a]/60 pl-3">
                          {activeLore.excerpt}
                        </p>

                        <div className="space-y-3 text-sm text-stone-200 leading-relaxed">
                          {activeLore.body.map((paragraph, idx) => (
                            <p key={idx}>{paragraph}</p>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-400">
                        <span>Fuente: {activeLore.sourceLabel}</span>
                        <span className="font-mono-num text-sky-300">
                          +{activeLore.xpReward} XP obtenida
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="my-auto py-8 px-4 text-center space-y-3">
                      <div className="w-11 h-11 rounded-lg bg-[#191e2a] border border-white/10 flex items-center justify-center mx-auto text-stone-400">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div className="text-xs uppercase tracking-wider text-stone-400">
                        {activeLore.chapter} · {activeLore.zone}
                      </div>
                      <h3 className="font-display text-lg text-stone-200">
                        Registro Bloqueado
                      </h3>
                      <p className="text-sm text-stone-300 max-w-md mx-auto leading-relaxed">
                        {activeLore.discoveryHint}
                      </p>
                      <div className="text-xs text-amber-300/80 font-mono-num">
                        Recompensa al descubrir: +{activeLore.xpReward} XP
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-sm text-stone-400 my-auto text-center">
                    Selecciona un capítulo del Códice para leer su registro.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <TravelerJournal entries={journalEntries} worldRadius={WORLD_RADIUS} />
        )}
      </div>
    </div>
  );
};
