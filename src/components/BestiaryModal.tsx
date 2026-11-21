import React, { useState } from 'react';
import { BookOpen, FlaskConical, ShieldAlert, Skull, X } from 'lucide-react';
import { ITEMS_CATALOG, MONSTER_SPECIES } from '../game/data';
import {
  BestiaryProgressEntry,
  InventoryEntry,
  MonsterSpeciesId,
} from '../game/types';

interface BestiaryModalProps {
  bestiary: Record<MonsterSpeciesId, BestiaryProgressEntry>;
  inventory: InventoryEntry[];
  onAnalyzeSample: (speciesId: MonsterSpeciesId) => void;
  onClose: () => void;
}

const SPECIES_ORDER: MonsterSpeciesId[] = [
  'goblin_merodeador',
  'esqueleto_centinela',
  'espectro_velo',
  'golem_obsidiana',
  'wyvern_ceniza',
];

function getStudyTierLabel(points: number, sighted: boolean): { label: string; color: string } {
  if (points >= 100) return { label: 'Dominado (100%)', color: 'text-amber-300' };
  if (points >= 50) return { label: 'Analizado', color: 'text-sky-300' };
  if (sighted || points > 0) return { label: 'Avistado', color: 'text-emerald-300' };
  return { label: 'Desconocido', color: 'text-stone-500' };
}

export const BestiaryModal: React.FC<BestiaryModalProps> = ({
  bestiary,
  inventory,
  onAnalyzeSample,
  onClose,
}) => {
  const [selectedId, setSelectedId] = useState<MonsterSpeciesId>('goblin_merodeador');

  const species = MONSTER_SPECIES[selectedId];
  const progress = bestiary[selectedId];
  const tier = getStudyTierLabel(progress.studyPoints, progress.sighted);
  const isKnown = progress.sighted || progress.studyPoints > 0;
  const isAnalyzed = progress.studyPoints >= 50;
  const isMastered = progress.studyPoints >= 100;

  // Check if player carries any study relic for this species
  const matchingSample = inventory.find((entry) => {
    const item = ITEMS_CATALOG[entry.itemId];
    return item?.studySpeciesId === selectedId;
  });

  const masteredCount = SPECIES_ORDER.filter((id) => bestiary[id].studyPoints >= 100).length;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-5xl max-h-[88vh] bg-[#0e1118] border border-[#b48e4a]/45 rounded-xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-[#d4af5f]" />
            <div>
              <h2 className="font-display text-xl text-[#f3e6c8]">
                Libro de Estudio de Monstruos (Bestiario)
              </h2>
              <p className="text-xs text-stone-400">
                Estudia criaturas en el mundo con [E], derrótalas o analiza muestras para desbloquear debilidades y bonificaciones ({masteredCount}/{SPECIES_ORDER.length} dominados)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Cerrar bestiario"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto rpg-scroll p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Species Sidebar */}
          <div className="md:col-span-4 space-y-2.5">
            {SPECIES_ORDER.map((id) => {
              const s = MONSTER_SPECIES[id];
              const p = bestiary[id];
              const t = getStudyTierLabel(p.studyPoints, p.sighted);
              const active = selectedId === id;

              return (
                <button
                  key={id}
                  onClick={() => setSelectedId(id)}
                  className={`w-full text-left p-3.5 rounded-lg border transition-colors flex flex-col gap-1.5 ${
                    active
                      ? 'bg-[#1a1f2b] border-[#d4af5f]'
                      : 'bg-[#131720] border-white/10 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-[#ece6d8] truncate">
                      {p.sighted || p.studyPoints > 0 ? s.name : 'Criatura Sin Registrar'}
                    </span>
                    <span className="font-mono-num text-xs text-stone-400 shrink-0">
                      {p.studyPoints}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={t.color}>{t.label}</span>
                    <span className="text-stone-400 font-mono-num">
                      Bajas: {p.kills}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-black/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#d4af5f] transition-all"
                      style={{ width: `${p.studyPoints}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Species Research Dossier */}
          <div className="md:col-span-8 bg-[#131720] border border-white/10 rounded-lg p-6 flex flex-col justify-between gap-5">
            <div className="space-y-5">
              {/* Top Dossier Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <div className="text-xs text-stone-400">
                    {isKnown ? `${species.category} · Peligro ${'★'.repeat(species.dangerLevel)}` : 'Registro bloqueado'}
                  </div>
                  <h3 className="font-display text-2xl text-[#f3e6c8] mt-1">
                    {isKnown ? species.name : 'Especie Desconocida'}
                  </h3>
                  <div className="text-xs text-stone-400 mt-0.5">
                    {isKnown ? `${species.title} · Hábitat: ${species.habitat}` : 'Acércate en el mapa o usa [E] para avistar.'}
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-sm font-semibold ${tier.color}`}>{tier.label}</div>
                  <div className="font-mono-num text-xs text-stone-400 mt-0.5">
                    Investigación: {progress.studyPoints} / 100 pts
                  </div>
                </div>
              </div>

              {/* Study Progress Bar & Sample Action */}
              <div className="p-3.5 rounded-lg bg-[#0d1017] border border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-[180px] space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-300">Progreso de Estudio</span>
                    <span className="font-mono-num text-[#d4af5f]">{progress.studyPoints}%</span>
                  </div>
                  <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#b48e4a] to-amber-300 transition-all"
                      style={{ width: `${progress.studyPoints}%` }}
                    />
                  </div>
                </div>

                <button
                  disabled={!matchingSample || isMastered}
                  onClick={() => onAnalyzeSample(selectedId)}
                  className="px-3.5 py-2 rounded-lg bg-[#b48e4a] hover:bg-[#c8a056] disabled:bg-white/10 disabled:text-stone-500 text-[#0b0d12] text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>
                    {isMastered
                      ? 'Estudio Completo'
                      : matchingSample
                      ? `Analizar Muestra (${matchingSample.quantity})`
                      : 'Sin Muestras en Mochila'}
                  </span>
                </button>
              </div>

              {/* Description & Combat Stats */}
              {isKnown ? (
                <>
                  <p className="text-sm text-stone-300 leading-relaxed">
                    {species.description}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-[#0d1017] border border-white/10">
                      <div className="text-[11px] text-stone-400">Salud Base</div>
                      <div className="font-mono-num text-base font-bold text-rose-300 mt-0.5">
                        {species.baseHp} HP
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#0d1017] border border-white/10">
                      <div className="text-[11px] text-stone-400">Ataque</div>
                      <div className="font-mono-num text-base font-bold text-amber-300 mt-0.5">
                        {species.baseAtk} ATK
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#0d1017] border border-white/10">
                      <div className="text-[11px] text-stone-400">Defensa</div>
                      <div className="font-mono-num text-base font-bold text-sky-300 mt-0.5">
                        {species.baseDef} DEF
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#0d1017] border border-white/10">
                      <div className="text-[11px] text-stone-400">Recompensa</div>
                      <div className="font-mono-num text-base font-bold text-emerald-300 mt-0.5">
                        +{species.xpReward} XP
                      </div>
                    </div>
                  </div>

                  {/* Tier 2 Unlocked: Weaknesses & Tactics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-lg bg-[#0d1017] border border-white/10 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Debilidades y Comportamiento</span>
                      </div>
                      {isAnalyzed ? (
                        <>
                          <p className="text-xs text-stone-300 leading-relaxed">
                            {species.combatBehavior}
                          </p>
                          <div className="text-xs text-emerald-300 pt-1">
                            Débil a: {species.weaknesses.join(', ')}
                          </div>
                          <div className="text-xs text-rose-300">
                            Resiste: {species.resistances.join(', ')}
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-stone-500">
                          Alcanza 50% de estudio para revelar tácticas y debilidades elementales.
                        </p>
                      )}
                    </div>

                    <div className="p-3.5 rounded-lg bg-[#0d1017] border border-white/10 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-300">
                        <Skull className="w-3.5 h-3.5" />
                        <span>Botín Conocido</span>
                      </div>
                      <ul className="space-y-1 text-xs text-stone-300">
                        {species.dropTable.map((d) => {
                          const item = ITEMS_CATALOG[d.itemId];
                          return (
                            <li key={d.itemId} className="flex justify-between">
                              <span>{item?.name ?? d.itemId}</span>
                              <span className="font-mono-num text-stone-400">
                                {Math.round(d.chance * 100)}%
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-10 text-center text-sm text-stone-400 border border-dashed border-white/10 rounded-lg">
                  Explora el mapa para avistar a esta criatura. Al apuntarle con la mira y presionar{' '}
                  <strong className="text-[#f3e6c8]">[E]</strong> obtendrás datos de estudio en tiempo real.
                </div>
              )}
            </div>

            {/* Tier 3 Mastery Bonus Banner */}
            <div
              className={`p-3.5 rounded-lg border text-xs flex items-center justify-between gap-3 ${
                isMastered
                  ? 'bg-amber-950/35 border-amber-400/60 text-amber-200'
                  : 'bg-[#0d1017] border-white/10 text-stone-400'
              }`}
            >
              <div>
                <span className="font-semibold">
                  {isMastered ? 'Maestría Activa (100%): ' : 'Bonificación de Maestría (al 100%): '}
                </span>
                <span>{species.studyMasteryBonus}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
