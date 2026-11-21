import React from 'react';
import { Flame, Heart, Sparkles, Swords, X } from 'lucide-react';
import {
  DRAGON_HEARTS_META,
  MAX_LEVEL,
  REBIRTH_DAMAGE_FACTOR,
  getRebirthDamageMultiplier,
  getRebirthRequiredLevel,
} from '../game/data';
import { DragonHeartId, InventoryEntry } from '../game/types';

interface RebirthModalProps {
  level: number;
  rebirths: number;
  inventory: InventoryEntry[];
  onPerformRebirth: (heartMode: DragonHeartId | 'mix') => void;
  onClose: () => void;
}

export const RebirthModal: React.FC<RebirthModalProps> = ({
  level,
  rebirths,
  inventory,
  onPerformRebirth,
  onClose,
}) => {
  const requiredLevel = getRebirthRequiredLevel(rebirths);
  const currentMult = getRebirthDamageMultiplier(rebirths);
  const nextMult = getRebirthDamageMultiplier(rebirths + 1);
  const levelMet = level >= requiredLevel;

  const heartCounts: Record<DragonHeartId, number> = {
    corazon_dragon_rojo: 0,
    corazon_dragon_negro: 0,
    corazon_dragon_verde: 0,
    corazon_dragon_celeste: 0,
    corazon_dragon_amarillo: 0,
  };

  for (const entry of inventory) {
    if (entry.itemId in heartCounts) {
      const k = entry.itemId as DragonHeartId;
      heartCounts[k] += entry.quantity;
    }
  }

  const totalHearts = Object.values(heartCounts).reduce((a, b) => a + b, 0);
  const canMixRebirth = levelMet && totalHearts >= 3;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-[#0e1118] border border-fuchsia-500/45 rounded-xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="font-display text-xl text-[#f3e6c8] flex items-center gap-2">
              <Flame className="w-5 h-5 text-fuchsia-300" />
              <span>Altar del Renacimiento Dracónico</span>
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Nivel Máximo <span className="font-mono-num text-amber-300">{MAX_LEVEL}</span> · Cada Renacimiento multiplica tu daño por{' '}
              <span className="font-mono-num text-fuchsia-300 font-bold">×{REBIRTH_DAMAGE_FACTOR}</span>.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Cerrar Altar de Renacimiento"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto rpg-scroll p-6 space-y-6">
          {/* Multiplier Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[#131722] border border-white/10">
              <div className="text-[11px] text-stone-400">Nivel Actual / Máx</div>
              <div className="font-mono-num text-lg font-bold text-[#f3e6c8]">
                {level} <span className="text-xs text-stone-400">/ {MAX_LEVEL}</span>
              </div>
              <div className={`text-[11px] mt-0.5 ${levelMet ? 'text-emerald-300' : 'text-amber-300'}`}>
                {levelMet ? 'Nivel mínimo cumplido' : `Requiere Nivel ${requiredLevel}`}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#131722] border border-white/10">
              <div className="text-[11px] text-stone-400">Renacimientos</div>
              <div className="font-mono-num text-lg font-bold text-fuchsia-300">
                R{rebirths}
              </div>
              <div className="text-[11px] text-stone-400 mt-0.5">
                +5 pts de atributo por ciclo
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#131722] border border-white/10">
              <div className="text-[11px] text-stone-400">Multiplicador Actual</div>
              <div className="font-mono-num text-lg font-bold text-amber-300">
                ×{currentMult} Daño
              </div>
              <div className="text-[11px] text-stone-400 mt-0.5">
                Escala todo tu ataque
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-fuchsia-950/35 border border-fuchsia-500/45">
              <div className="text-[11px] text-fuchsia-200">Tras Renacer</div>
              <div className="font-mono-num text-lg font-bold text-fuchsia-300">
                ×{nextMult} Daño
              </div>
              <div className="text-[11px] text-fuchsia-200/80 mt-0.5">
                Conservas equipo, oro y kills
              </div>
            </div>
          </div>

          {/* Rules Explanation */}
          <div className="p-4 rounded-xl bg-[#131722] border border-[#b48e4a]/35 text-xs text-stone-300 space-y-1.5 leading-relaxed">
            <div className="font-semibold text-[#f3e6c8] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Condiciones del Ritual de Renacimiento</span>
            </div>
            <p>
              Alcanza al menos el <strong className="text-amber-300">Nivel {requiredLevel}</strong> y reúne{' '}
              <strong className="text-rose-300">3 Corazones de Dragón</strong> cazando a los 5 Dragones Elementales que habitan los confines del mapa (Rojo, Negro, Verde, Celeste o Amarillo).
            </p>
            <p>
              Al renacer regresas a <strong className="text-stone-100">Nivel 1</strong> manteniendo tu equipo, oro, montura, bestiario, clan, títulos y kills, pero con un{' '}
              <strong className="text-fuchsia-300">×1.5 de daño acumulado permanente</strong> y la habilidad suprema{' '}
              <strong className="text-amber-300">[6] Nova Renacida</strong> potenciada.
            </p>
          </div>

          {/* 5 Dragon Hearts Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#d4af5f] flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-400" />
                <span>Corazones de los 5 Dragones Elementales (Total: {totalHearts}/3)</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {DRAGON_HEARTS_META.map((meta) => {
                const count = heartCounts[meta.itemId];
                const canSacrificeSame = levelMet && count >= 3;

                return (
                  <div
                    key={meta.itemId}
                    className="p-4 rounded-xl bg-[#131722] border border-white/10 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-display text-sm font-bold ${meta.accentClass}`}>
                          {meta.shortName}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded border font-mono-num text-xs font-bold ${meta.badgeClass}`}
                        >
                          {count} / 3
                        </span>
                      </div>
                      <div className="text-xs font-medium text-stone-200">
                        {meta.elementLabel}
                      </div>
                      <div className="text-[11px] text-stone-400">
                        Hábitat: {meta.habitat}
                      </div>
                    </div>

                    <button
                      disabled={!canSacrificeSame}
                      onClick={() => onPerformRebirth(meta.itemId)}
                      className="w-full py-2 px-3 rounded-lg bg-[#b48e4a] hover:bg-[#c8a056] disabled:bg-white/10 disabled:text-stone-500 text-[#0b0d12] text-xs font-semibold transition-colors"
                    >
                      {canSacrificeSame
                        ? `Renacer con 3 ${meta.shortName}`
                        : !levelMet
                        ? `Requiere Nv. ${requiredLevel}`
                        : `Faltan ${Math.max(0, 3 - count)} corazón(es)`}
                    </button>
                  </div>
                );
              })}

              {/* Combined Mix Sacrifice Card */}
              <div className="p-4 rounded-xl bg-fuchsia-950/25 border border-fuchsia-500/40 flex flex-col justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm font-bold text-fuchsia-300">
                      Ofrenda Elemental Mixta
                    </span>
                    <span className="px-2 py-0.5 rounded border border-fuchsia-500/50 bg-fuchsia-950/60 font-mono-num text-xs font-bold text-fuchsia-200">
                      {Math.min(3, totalHearts)} / 3
                    </span>
                  </div>
                  <div className="text-xs text-stone-300">
                    Combina 3 corazones de cualquier Dragón Elemental para completar el ritual.
                  </div>
                </div>

                <button
                  disabled={!canMixRebirth}
                  onClick={() => onPerformRebirth('mix')}
                  className="w-full py-2 px-3 rounded-lg bg-fuchsia-500 hover:bg-fuchsia-400 disabled:bg-white/10 disabled:text-stone-500 text-[#0c0614] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Swords className="w-3.5 h-3.5" />
                  <span>
                    {canMixRebirth
                      ? `Renacer (×${nextMult} Daño)`
                      : !levelMet
                      ? `Sube a Nivel ${requiredLevel}`
                      : `Reúne ${Math.max(0, 3 - totalHearts)} corazón(es) más`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
