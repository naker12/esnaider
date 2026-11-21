import React, { useMemo, useState } from 'react';
import {
  Check,
  Flame,
  FlaskConical,
  HeartPulse,
  Minus,
  Plus,
  RotateCcw,
  Shield,
  ShieldCheck,
  Sparkles,
  Wind,
  X,
} from 'lucide-react';
import {
  ALCHEMY_FORMULAS,
  ALCHEMY_INGREDIENT_IDS,
  ITEMS_CATALOG,
  RARITY_COLORS,
} from '../game/data';
import { ActiveAlchemyBuff, AlchemyFormula, InventoryEntry } from '../game/types';

interface AlchemyModalProps {
  inventory: InventoryEntry[];
  activeBuffs: ActiveAlchemyBuff[];
  alchemyDurationMult: number;
  activeAlchemistsCount: number;
  onBrewFormula: (formulaId: string, useImmediately?: boolean) => void;
  onUsePotionUid: (uid: string) => void;
  onClose: () => void;
}

type AlchemyTab = 'formulas' | 'caldero';
type FormulaCategoryFilter = 'Todas' | AlchemyFormula['category'];

function getItemCount(inventory: InventoryEntry[], itemId: string): number {
  return inventory
    .filter((e) => e.itemId === itemId)
    .reduce((sum, e) => sum + e.quantity, 0);
}

function renderBuffIcon(buffId: string) {
  switch (buffId) {
    case 'furia_solar':
      return <Flame className="w-4 h-4 text-amber-300 shrink-0" />;
    case 'piel_basaltica':
      return <Shield className="w-4 h-4 text-emerald-300 shrink-0" />;
    case 'paso_etereo':
      return <Wind className="w-4 h-4 text-sky-300 shrink-0" />;
    case 'lucidez_arcana':
      return <Sparkles className="w-4 h-4 text-violet-300 shrink-0" />;
    case 'sangre_inmortal':
      return <HeartPulse className="w-4 h-4 text-rose-300 shrink-0" />;
    default:
      return <ShieldCheck className="w-4 h-4 text-sky-200 shrink-0" />;
  }
}

export const AlchemyModal: React.FC<AlchemyModalProps> = ({
  inventory,
  activeBuffs,
  alchemyDurationMult,
  activeAlchemistsCount,
  onBrewFormula,
  onUsePotionUid,
  onClose,
}) => {
  const [tab, setTab] = useState<AlchemyTab>('formulas');
  const [categoryFilter, setCategoryFilter] = useState<FormulaCategoryFilter>('Todas');
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>(
    ALCHEMY_FORMULAS[0]?.id ?? ''
  );
  const [cauldronMix, setCauldronMix] = useState<Record<string, number>>({});

  const filteredFormulas = useMemo(
    () =>
      ALCHEMY_FORMULAS.filter(
        (f) => categoryFilter === 'Todas' || f.category === categoryFilter
      ),
    [categoryFilter]
  );

  const activeFormula =
    filteredFormulas.find((f) => f.id === selectedFormulaId) ??
    filteredFormulas[0] ??
    null;

  const canBrew = (formula: AlchemyFormula): boolean =>
    formula.ingredients.every(
      (req) => getItemCount(inventory, req.itemId) >= req.quantity
    );

  // Match cauldron combination against ALCHEMY_FORMULAS
  const cauldronEntries = useMemo(
    () => Object.entries(cauldronMix).filter(([, qty]) => qty > 0),
    [cauldronMix]
  );

  const matchedCauldronFormula = useMemo(() => {
    if (cauldronEntries.length === 0) return null;
    return (
      ALCHEMY_FORMULAS.find((f) => {
        if (f.ingredients.length !== cauldronEntries.length) return false;
        return f.ingredients.every(
          (req) => (cauldronMix[req.itemId] ?? 0) === req.quantity
        );
      }) ?? null
    );
  }, [cauldronEntries, cauldronMix]);

  // Brewed advanced potions currently in backpack
  const brewedPotionsInBag = useMemo(
    () =>
      inventory.filter((entry) => Boolean(ITEMS_CATALOG[entry.itemId]?.buffEffect)),
    [inventory]
  );

  const adjustCauldron = (itemId: string, delta: number) => {
    const owned = getItemCount(inventory, itemId);
    setCauldronMix((prev) => {
      const current = prev[itemId] ?? 0;
      const next = Math.max(0, Math.min(owned, current + delta));
      if (next === 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: next };
    });
  };

  const loadFormulaIntoCauldron = (formula: AlchemyFormula) => {
    const nextMix: Record<string, number> = {};
    for (const req of formula.ingredients) {
      const owned = getItemCount(inventory, req.itemId);
      if (owned > 0) {
        nextMix[req.itemId] = Math.min(owned, req.quantity);
      }
    }
    setCauldronMix(nextMix);
    setTab('caldero');
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-4xl max-h-[88vh] bg-[#0e1118] border border-[#b48e4a]/45 rounded-xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <FlaskConical className="w-5 h-5 text-emerald-300 shrink-0" />
            <div className="min-w-0">
              <h2 className="font-display text-xl text-[#f3e6c8] truncate">
                Laboratorio de Alquimia
              </h2>
              <p className="text-xs text-stone-400">
                Combina hierbas recolectadas y extractos para destilar pociones con efectos
                prolongados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center p-1 rounded-lg bg-[#141821] border border-white/10">
              <button
                onClick={() => setTab('formulas')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  tab === 'formulas'
                    ? 'bg-[#b48e4a] text-[#0b0d12] font-semibold'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                Fórmulas Alquímicas
              </button>
              <button
                onClick={() => setTab('caldero')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  tab === 'caldero'
                    ? 'bg-[#b48e4a] text-[#0b0d12] font-semibold'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                Caldero de Combinación
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Cerrar laboratorio de alquimia"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Alchemist Clan Bonus & Category Filters */}
        <div className="px-6 py-2.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-[#11151f]">
          {tab === 'formulas' ? (
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(
                ['Todas', 'Combate', 'Defensa', 'Movilidad', 'Arcano', 'Inmunidad'] as FormulaCategoryFilter[]
              ).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                    categoryFilter === cat
                      ? 'bg-[#b48e4a] text-[#0b0d12] font-semibold'
                      : 'bg-[#171c28] text-stone-300 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-xs text-stone-300">
              Mezcla hierbas y extractos del Valle en el caldero para descubrir y destilar pociones
              únicas.
            </div>
          )}

          <div className="text-xs font-mono-num text-emerald-300 shrink-0">
            Duración alquímica: {Math.round(alchemyDurationMult * 100)}%
            {activeAlchemistsCount > 0 ? ` (${activeAlchemistsCount} alquimista clan)` : ''}
          </div>
        </div>

        {/* Main Content */}
        {tab === 'formulas' ? (
          <div className="flex-1 overflow-y-auto rpg-scroll p-6 grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Formula List */}
            <div className="md:col-span-7 space-y-2.5 content-start">
              {filteredFormulas.map((formula) => {
                const result = ITEMS_CATALOG[formula.resultItemId];
                if (!result || !result.buffEffect) return null;
                const rarity = RARITY_COLORS[result.rarity];
                const ready = canBrew(formula);
                const isSelected = activeFormula?.id === formula.id;
                const ownedResult = getItemCount(inventory, result.id);
                const effectiveDuration = Math.round(
                  result.buffEffect.durationSec * alchemyDurationMult
                );

                return (
                  <button
                    key={formula.id}
                    onClick={() => setSelectedFormulaId(formula.id)}
                    className={`w-full text-left p-3.5 rounded-lg border transition-colors flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-[#1b202c] border-[#d4af5f]'
                        : `${rarity.bg} ${rarity.border} hover:border-white/30`
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {renderBuffIcon(result.buffEffect.id)}
                        <span className={`text-sm font-semibold truncate ${rarity.text}`}>
                          {formula.name}
                        </span>
                      </div>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded shrink-0 ${
                          ready
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                            : 'bg-black/40 text-stone-400 border border-white/10'
                        }`}
                      >
                        {ready ? 'Lista' : 'Faltan ingredientes'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-stone-400">
                      <span>
                        {formula.category} · {result.buffEffect.summary}
                      </span>
                      <span className="font-mono-num text-stone-300 shrink-0 ml-2">
                        {effectiveDuration}s{ownedResult > 0 ? ` · En mochila: ${ownedResult}` : ''}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Formula Inspector */}
            <div className="md:col-span-5 bg-[#131720] border border-white/10 rounded-lg p-5 flex flex-col justify-between gap-4">
              {activeFormula && ITEMS_CATALOG[activeFormula.resultItemId]?.buffEffect ? (
                (() => {
                  const result = ITEMS_CATALOG[activeFormula.resultItemId]!;
                  const buff = result.buffEffect!;
                  const rarity = RARITY_COLORS[result.rarity];
                  const ready = canBrew(activeFormula);
                  const effectiveDuration = Math.round(buff.durationSec * alchemyDurationMult);

                  return (
                    <>
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-stone-400">
                            {activeFormula.category} · {rarity.label}
                          </div>
                          <h3 className={`font-display text-lg font-bold mt-1 ${rarity.text}`}>
                            {result.name}
                          </h3>
                        </div>

                        <p className="text-xs text-stone-300 leading-relaxed">
                          {activeFormula.description}
                        </p>

                        <div className="p-3 rounded-md bg-black/35 border border-emerald-500/25 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                              {renderBuffIcon(buff.id)}
                              <span>{buff.name}</span>
                            </span>
                            <span className="font-mono-num text-amber-300">
                              {effectiveDuration}s
                            </span>
                          </div>
                          <div className="text-xs text-stone-200">{buff.summary}</div>
                          {result.healHp && (
                            <div className="text-[11px] font-mono-num text-emerald-300">
                              Además restaura +{result.healHp} HP al instante
                            </div>
                          )}
                          {result.restoreMana && (
                            <div className="text-[11px] font-mono-num text-sky-300">
                              Además restaura +{result.restoreMana} Maná al instante
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-white/10 space-y-2">
                          <div className="text-xs font-semibold text-stone-200">
                            Ingredientes Recolectados
                          </div>
                          <div className="space-y-1.5">
                            {activeFormula.ingredients.map((req) => {
                              const ing = ITEMS_CATALOG[req.itemId];
                              const owned = getItemCount(inventory, req.itemId);
                              const ok = owned >= req.quantity;
                              return (
                                <div
                                  key={req.itemId}
                                  className="flex items-center justify-between gap-2 text-xs px-2.5 py-1.5 rounded bg-black/30 border border-white/10"
                                >
                                  <span className="flex items-center gap-1.5 min-w-0">
                                    {ok && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                                    <span
                                      className={`truncate ${
                                        ok ? 'text-stone-200' : 'text-rose-300'
                                      }`}
                                    >
                                      {ing?.name ?? req.itemId}
                                    </span>
                                  </span>
                                  <span
                                    className={`font-mono-num shrink-0 ${
                                      ok ? 'text-emerald-300' : 'text-rose-400'
                                    }`}
                                  >
                                    {owned} / {req.quantity}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/10 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            disabled={!ready}
                            onClick={() => onBrewFormula(activeFormula.id, false)}
                            className="py-2 px-3 rounded-lg bg-[#b48e4a] hover:bg-[#c8a056] disabled:bg-white/10 disabled:text-stone-500 text-[#0b0d12] text-xs font-semibold whitespace-nowrap transition-colors"
                          >
                            Destilar Poción
                          </button>
                          <button
                            disabled={!ready}
                            onClick={() => onBrewFormula(activeFormula.id, true)}
                            className="py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:bg-white/10 disabled:text-stone-500 text-white text-xs font-semibold whitespace-nowrap transition-colors"
                          >
                            Destilar y Beber
                          </button>
                        </div>
                        <button
                          onClick={() => loadFormulaIntoCauldron(activeFormula)}
                          className="w-full py-1.5 px-3 rounded-md bg-white/5 hover:bg-white/10 text-stone-300 text-[11px] transition-colors"
                        >
                          Probar esta mezcla en el Caldero
                        </button>
                      </div>
                    </>
                  );
                })()
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto rpg-scroll p-6 grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Collected Ingredients Picker */}
            <div className="md:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-[#f3e6c8]">
                  Hierbas y Extractos Disponibles
                </h3>
                <span className="text-[11px] text-stone-400">
                  Recolecta nodos brillantes en el valle [E] o derrota criaturas
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ALCHEMY_INGREDIENT_IDS.map((ingId) => {
                  const item = ITEMS_CATALOG[ingId];
                  if (!item) return null;
                  const owned = getItemCount(inventory, ingId);
                  const inCauldron = cauldronMix[ingId] ?? 0;
                  const rarity = RARITY_COLORS[item.rarity];

                  return (
                    <div
                      key={ingId}
                      className={`p-3 rounded-lg border flex flex-col justify-between gap-2 ${
                        inCauldron > 0
                          ? 'bg-[#1a202d] border-[#d4af5f]'
                          : 'bg-[#131720] border-white/10'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs font-semibold truncate ${rarity.text}`}>
                            {item.name}
                          </span>
                          <span className="font-mono-num text-xs text-stone-300 shrink-0">
                            x{owned}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-white/10">
                        <span className="text-[11px] text-stone-400">En caldero:</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            disabled={inCauldron <= 0}
                            onClick={() => adjustCauldron(ingId, -1)}
                            className="p-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-35 text-stone-200 transition-colors"
                            aria-label={`Quitar ${item.name}`}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono-num text-xs font-bold text-[#f3e6c8] w-5 text-center">
                            {inCauldron}
                          </span>
                          <button
                            disabled={inCauldron >= owned}
                            onClick={() => adjustCauldron(ingId, 1)}
                            className="p-1 rounded bg-[#b48e4a]/85 hover:bg-[#c8a056] disabled:opacity-35 text-[#0b0d12] transition-colors"
                            aria-label={`Añadir ${item.name}`}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive Cauldron Output */}
            <div className="md:col-span-5 bg-[#131720] border border-[#b48e4a]/35 rounded-lg p-5 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-bold text-[#f3e6c8]">
                    Caldero de Destilación
                  </h3>
                  {cauldronEntries.length > 0 && (
                    <button
                      onClick={() => setCauldronMix({})}
                      className="text-[11px] text-stone-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Vaciar</span>
                    </button>
                  )}
                </div>

                {cauldronEntries.length === 0 ? (
                  <div className="py-6 px-3 rounded-md border border-dashed border-white/15 text-center text-xs text-stone-400">
                    Añade hierbas y extractos desde el panel izquierdo para preparar una mezcla
                    alquímica.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {cauldronEntries.map(([id, qty]) => (
                      <div
                        key={id}
                        className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded bg-black/35 border border-white/10"
                      >
                        <span className="text-stone-200 truncate">
                          {ITEMS_CATALOG[id]?.name ?? id}
                        </span>
                        <span className="font-mono-num text-amber-300 shrink-0">x{qty}</span>
                      </div>
                    ))}
                  </div>
                )}

                {matchedCauldronFormula ? (
                  (() => {
                    const result = ITEMS_CATALOG[matchedCauldronFormula.resultItemId];
                    const buff = result?.buffEffect;
                    if (!result || !buff) return null;
                    const rarity = RARITY_COLORS[result.rarity];
                    const effectiveDuration = Math.round(buff.durationSec * alchemyDurationMult);
                    return (
                      <div className="p-3.5 rounded-lg bg-emerald-950/35 border border-emerald-500/45 space-y-2">
                        <div className="text-[11px] font-semibold text-emerald-300">
                          Combinación Válida Descubierta
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className={`font-display text-sm font-bold ${rarity.text}`}>
                            {result.name}
                          </span>
                          <span className="font-mono-num text-xs text-amber-300">
                            {effectiveDuration}s
                          </span>
                        </div>
                        <div className="text-xs text-stone-200">{buff.summary}</div>
                      </div>
                    );
                  })()
                ) : cauldronEntries.length > 0 ? (
                  <div className="p-3 rounded-md bg-black/30 border border-white/10 text-xs text-stone-400">
                    Esta proporción aún no coincide con una fórmula estable. Ajusta las cantidades o
                    consulta la pestaña <strong className="text-stone-200">Fórmulas Alquímicas</strong>.
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10">
                <button
                  disabled={!matchedCauldronFormula || !canBrew(matchedCauldronFormula)}
                  onClick={() => {
                    if (!matchedCauldronFormula) return;
                    onBrewFormula(matchedCauldronFormula.id, false);
                    setCauldronMix({});
                  }}
                  className="py-2 px-3 rounded-lg bg-[#b48e4a] hover:bg-[#c8a056] disabled:bg-white/10 disabled:text-stone-500 text-[#0b0d12] text-xs font-semibold whitespace-nowrap transition-colors"
                >
                  Destilar Mezcla
                </button>
                <button
                  disabled={!matchedCauldronFormula || !canBrew(matchedCauldronFormula)}
                  onClick={() => {
                    if (!matchedCauldronFormula) return;
                    onBrewFormula(matchedCauldronFormula.id, true);
                    setCauldronMix({});
                  }}
                  className="py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:bg-white/10 disabled:text-stone-500 text-white text-xs font-semibold whitespace-nowrap transition-colors"
                >
                  Destilar y Beber
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer: Ready Alchemy Potions & Active Buffs */}
        {(brewedPotionsInBag.length > 0 || activeBuffs.length > 0) && (
          <div className="px-6 py-3 border-t border-white/10 bg-[#10141d] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <span className="text-[11px] font-semibold text-stone-400 shrink-0">
                Listas en mochila:
              </span>
              {brewedPotionsInBag.length === 0 ? (
                <span className="text-[11px] text-stone-500">Ninguna</span>
              ) : (
                brewedPotionsInBag.map((entry) => {
                  const item = ITEMS_CATALOG[entry.itemId];
                  if (!item) return null;
                  return (
                    <button
                      key={entry.uid}
                      onClick={() => onUsePotionUid(entry.uid)}
                      className="px-2.5 py-1 rounded-md bg-[#171d2a] hover:bg-[#222b3e] border border-[#b48e4a]/40 text-xs text-[#f3e6c8] flex items-center gap-1.5 whitespace-nowrap transition-colors"
                    >
                      <span>{item.name}</span>
                      <span className="font-mono-num text-amber-300">x{entry.quantity}</span>
                      <span className="text-[10px] text-emerald-300 font-semibold">Beber</span>
                    </button>
                  );
                })
              )}
            </div>

            {activeBuffs.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-emerald-300 font-medium">Activos:</span>
                {activeBuffs.map((b) => (
                  <span
                    key={b.id}
                    className="text-[11px] font-mono-num text-stone-200 bg-black/40 border border-white/10 px-2 py-0.5 rounded"
                  >
                    {b.name} ({Math.ceil(b.remaining)}s)
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
