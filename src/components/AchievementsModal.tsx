import React, { useState } from 'react';
import { Award, CheckCircle2, Lock, Trophy, X } from 'lucide-react';
import { ACHIEVEMENTS_CATALOG } from '../game/data';
import { AchievementCategory, AchievementMetrics } from '../game/types';

interface AchievementsModalProps {
  metrics: AchievementMetrics;
  unlockedMap: Record<string, number>;
  onClose: () => void;
}

type CategoryFilter = 'Todos' | AchievementCategory;
type StatusFilter = 'todos' | 'desbloqueados' | 'pendientes';

const CATEGORIES: CategoryFilter[] = [
  'Todos',
  'Combate',
  'Progresión',
  'Bestiario',
  'Exploración',
  'Economía',
];

function formatUnlockTime(timestamp: number): string {
  try {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  metrics,
  unlockedMap,
  onClose,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('Todos');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');

  const totalCount = ACHIEVEMENTS_CATALOG.length;
  const unlockedCount = ACHIEVEMENTS_CATALOG.filter((a) => Boolean(unlockedMap[a.id])).length;
  const overallPct = Math.round((unlockedCount / totalCount) * 100);

  const filtered = ACHIEVEMENTS_CATALOG.filter((ach) => {
    if (categoryFilter !== 'Todos' && ach.category !== categoryFilter) return false;
    const isUnlocked = Boolean(unlockedMap[ach.id]);
    if (statusFilter === 'desbloqueados' && !isUnlocked) return false;
    if (statusFilter === 'pendientes' && isUnlocked) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-4xl max-h-[88vh] bg-[#0e1118] border border-[#b48e4a]/45 rounded-xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-[#d4af5f]" />
            <div>
              <h2 className="font-display text-xl text-[#f3e6c8]">Salón de Logros</h2>
              <p className="text-xs text-stone-400">
                Hitos de combate, exploración, comercio y estudio del Bestiario
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-mono-num text-sm font-bold text-amber-300">
                {unlockedCount} / {totalCount} Desbloqueados
              </div>
              <div className="font-mono-num text-[11px] text-stone-400">
                Progreso total: {overallPct}%
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Cerrar logros"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Overall Progress + Filter Bar */}
        <div className="px-6 py-3.5 border-b border-white/10 space-y-3 bg-[#11151f]">
          <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-[#b48e4a] to-amber-300 transition-all duration-300"
              style={{ width: `${overallPct}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                    categoryFilter === cat
                      ? 'bg-[#b48e4a] text-[#0b0d12] font-semibold'
                      : 'bg-[#161a24] text-stone-300 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#141821] border border-white/10">
              {(
                [
                  ['todos', 'Todos'],
                  ['desbloqueados', 'Completados'],
                  ['pendientes', 'Pendientes'],
                ] as [StatusFilter, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                    statusFilter === key
                      ? 'bg-white/15 text-[#f3e6c8]'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Achievements List */}
        <div className="flex-1 overflow-y-auto rpg-scroll p-6 grid grid-cols-1 md:grid-cols-2 gap-3.5 content-start">
          {filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center text-sm text-stone-400 border border-dashed border-white/10 rounded-lg">
              No hay logros que coincidan con el filtro seleccionado.
            </div>
          ) : (
            filtered.map((ach) => {
              const unlockedAt = unlockedMap[ach.id];
              const isUnlocked = Boolean(unlockedAt);
              const rawCurrent = ach.getCurrent(metrics);
              const clampedCurrent = Math.min(ach.target, Math.max(0, rawCurrent));
              const pct = Math.min(100, Math.round((clampedCurrent / ach.target) * 100));

              return (
                <div
                  key={ach.id}
                  className={`p-4 rounded-lg border flex flex-col justify-between gap-3 transition-colors ${
                    isUnlocked
                      ? 'bg-[#181d28] border-[#d4af5f]/70'
                      : 'bg-[#12161f] border-white/10 opacity-85'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${
                          isUnlocked
                            ? 'bg-[#b48e4a]/20 border-[#d4af5f]/60 text-amber-300'
                            : 'bg-black/40 border-white/10 text-stone-500'
                        }`}
                      >
                        {isUnlocked ? (
                          <Award className="w-5 h-5" />
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-[11px] text-stone-400">{ach.category}</div>
                        <h3
                          className={`font-display text-base font-bold leading-snug ${
                            isUnlocked ? 'text-[#f3e6c8]' : 'text-stone-300'
                          }`}
                        >
                          {ach.title}
                        </h3>
                      </div>
                    </div>

                    {isUnlocked ? (
                      <div className="flex items-center gap-1 text-emerald-300 text-xs font-medium shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="font-mono-num">{formatUnlockTime(unlockedAt)}</span>
                      </div>
                    ) : (
                      <span className="font-mono-num text-xs text-stone-400 shrink-0">
                        {pct}%
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-300 leading-relaxed">{ach.description}</p>

                  {/* Progress & Rewards */}
                  <div className="space-y-2 pt-1">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono-num">
                        <span className="text-stone-400">Progreso</span>
                        <span className={isUnlocked ? 'text-amber-300' : 'text-stone-300'}>
                          {clampedCurrent} / {ach.target} {ach.unitLabel}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            isUnlocked ? 'bg-emerald-400' : 'bg-[#d4af5f]'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {(ach.rewardGold || ach.rewardXp) && (
                      <div className="pt-2 border-t border-white/10 flex items-center gap-3 text-[11px] font-mono-num">
                        <span className="text-stone-400">Recompensa:</span>
                        {ach.rewardGold && (
                          <span className="text-amber-300">+{ach.rewardGold} Oro</span>
                        )}
                        {ach.rewardXp && (
                          <span className="text-sky-300">+{ach.rewardXp} XP</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
