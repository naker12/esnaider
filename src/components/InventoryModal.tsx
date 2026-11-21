import React, { useEffect, useState } from 'react';
import {
  Backpack,
  Check,
  Coins,
  FlaskConical,
  Hammer,
  Store,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  computeDynamicMarketQuote,
  CRAFTING_RECIPES,
  ITEMS_CATALOG,
  MERCHANT_CATALOG_IDS,
  RARITY_COLORS,
} from '../game/data';
import {
  CraftingCategory,
  CraftingRecipe,
  EquipmentSlot,
  GameItem,
  InventoryEntry,
  InventoryMode,
  ItemCategory,
  MarketState,
  Quest,
} from '../game/types';

export type { InventoryMode };

type ShopSubMode = 'comprar' | 'vender';
type FilterKey = 'todo' | 'equipo' | 'montura' | 'consumible' | 'material' | 'reliquia';
type CraftFilterKey = 'todo' | CraftingCategory;

interface InventoryModalProps {
  gold: number;
  inventory: InventoryEntry[];
  equipment: Record<EquipmentSlot, string | null>;
  marketState: MarketState;
  quests: Quest[];
  initialMode?: InventoryMode;
  onUseOrEquip: (uid: string) => void;
  onDropItem: (uid: string) => void;
  onBuyItem: (itemId: string) => void;
  onSellItem: (uid: string, sellAll?: boolean) => void;
  onCraftRecipe: (recipeId: string) => void;
  onOpenAlchemy?: () => void;
  onClose: () => void;
}

const BONUS_LABELS: Record<string, string> = {
  danoMin: 'Daño Mín.',
  danoMax: 'Daño Máx.',
  defensa: 'Defensa',
  fuerza: 'Fuerza',
  agilidad: 'Agilidad',
  inteligencia: 'Inteligencia',
  vitalidad: 'Vitalidad',
  probCritico: 'Prob. Crítica (%)',
  danoCritico: 'Daño Crítico (%)',
  regenHp: 'Regen. HP/s',
  regenMana: 'Regen. Maná/s',
  maxHp: 'Salud Máx.',
  maxMana: 'Maná Máx.',
  velocidadMovimiento: 'Vel. Movimiento (m/s)',
};

function matchesFilter(item: GameItem, filter: FilterKey): boolean {
  if (filter === 'todo') return true;
  if (filter === 'equipo') {
    const cats: ItemCategory[] = ['arma', 'escudo', 'armadura', 'accesorio', 'montura'];
    return cats.includes(item.category);
  }
  return item.category === filter;
}

function getOwnedCount(
  itemId: string,
  inventory: InventoryEntry[],
  equipment: Record<EquipmentSlot, string | null>,
  allowEquippedWeapon = false
): { total: number; inInventory: number; equippedMatch: boolean } {
  const inInventory = inventory
    .filter((e) => e.itemId === itemId)
    .reduce((sum, e) => sum + e.quantity, 0);
  const item = ITEMS_CATALOG[itemId];
  const equippedMatch = Boolean(
    allowEquippedWeapon && item?.slot === 'arma' && equipment.arma === itemId
  );
  return {
    total: inInventory + (equippedMatch ? 1 : 0),
    inInventory,
    equippedMatch,
  };
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  gold,
  inventory,
  equipment,
  marketState,
  quests,
  initialMode = 'mochila',
  onUseOrEquip,
  onDropItem,
  onBuyItem,
  onSellItem,
  onCraftRecipe,
  onOpenAlchemy,
  onClose,
}) => {
  const [mode, setMode] = useState<InventoryMode>(initialMode);
  const [shopSubMode, setShopSubMode] = useState<ShopSubMode>('comprar');
  const [filter, setFilter] = useState<FilterKey>('todo');
  const [craftFilter, setCraftFilter] = useState<CraftFilterKey>('todo');
  const [selectedUid, setSelectedUid] = useState<string | null>(inventory[0]?.uid ?? null);
  const [selectedShopItemId, setSelectedShopItemId] = useState<string>(MERCHANT_CATALOG_IDS[0]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(CRAFTING_RECIPES[0]?.id ?? '');

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const filteredInventory = inventory.filter((entry) => {
    const item = ITEMS_CATALOG[entry.itemId];
    return item ? matchesFilter(item, filter) : false;
  });

  const filteredShopIds = MERCHANT_CATALOG_IDS.filter((id) => {
    const item = ITEMS_CATALOG[id];
    return item ? matchesFilter(item, filter) : false;
  });

  const filteredRecipes = CRAFTING_RECIPES.filter(
    (recipe) => craftFilter === 'todo' || recipe.category === craftFilter
  );

  const isShopBuy = mode === 'tienda' && shopSubMode === 'comprar';

  const selectedEntry =
    filteredInventory.find((e) => e.uid === selectedUid) ?? filteredInventory[0] ?? null;
  const activeShopId = filteredShopIds.includes(selectedShopItemId)
    ? selectedShopItemId
    : filteredShopIds[0] ?? null;

  const selectedItem: GameItem | null = isShopBuy
    ? activeShopId
      ? ITEMS_CATALOG[activeShopId] ?? null
      : null
    : selectedEntry
    ? ITEMS_CATALOG[selectedEntry.itemId] ?? null
    : null;

  const activeRecipe: CraftingRecipe | null =
    filteredRecipes.find((r) => r.id === selectedRecipeId) ?? filteredRecipes[0] ?? null;

  const canCraftRecipe = (recipe: CraftingRecipe): boolean => {
    if ((recipe.goldCost ?? 0) > gold) return false;
    return recipe.ingredients.every((req) => {
      const counts = getOwnedCount(
        req.itemId,
        inventory,
        equipment,
        Boolean(recipe.acceptsEquippedWeapon)
      );
      return counts.total >= req.quantity;
    });
  };

  const selectedQuote = selectedItem
    ? computeDynamicMarketQuote(selectedItem, marketState, quests)
    : null;
  const buyPrice = selectedQuote ? selectedQuote.buyPrice : 0;
  const sellPrice = selectedQuote ? selectedQuote.sellPrice : 0;
  const completedQuestsCount = quests.filter((q) => q.status === 'completada').length;

  const headerTitle =
    mode === 'tienda'
      ? 'Comercio con Mercader Kael'
      : mode === 'crafteo'
      ? 'Mesa de Alquimia y Forja'
      : 'Inventario del Aventurero';

  const headerSubtitle =
    mode === 'tienda'
      ? 'Compra equipamiento y suministros o vende objetos de tu mochila'
      : mode === 'crafteo'
      ? 'Combina plantas, pieles y runas para destilar pociones o mejorar tus armas'
      : `${inventory.length} / 28 espacios ocupados`;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-4xl max-h-[86vh] bg-[#0e1118] border border-[#b48e4a]/45 rounded-xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {mode === 'tienda' ? (
              <Store className="w-5 h-5 text-[#d4af5f]" />
            ) : mode === 'crafteo' ? (
              <Hammer className="w-5 h-5 text-[#d4af5f]" />
            ) : (
              <Backpack className="w-5 h-5 text-[#d4af5f]" />
            )}
            <div>
              <h2 className="font-display text-xl text-[#f3e6c8]">{headerTitle}</h2>
              <p className="text-xs text-stone-400">{headerSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode Switcher: Mochila | Tienda | Crafteo */}
            <div className="flex items-center p-1 rounded-lg bg-[#141821] border border-white/10">
              <button
                onClick={() => setMode('mochila')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  mode === 'mochila'
                    ? 'bg-[#b48e4a] text-[#0b0d12] font-semibold'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <Backpack className="w-3.5 h-3.5" />
                <span>Mochila</span>
              </button>
              <button
                onClick={() => setMode('tienda')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  mode === 'tienda'
                    ? 'bg-[#b48e4a] text-[#0b0d12] font-semibold'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Tienda</span>
              </button>
              <button
                onClick={() => setMode('crafteo')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  mode === 'crafteo'
                    ? 'bg-[#b48e4a] text-[#0b0d12] font-semibold'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <Hammer className="w-3.5 h-3.5" />
                <span>Crafteo</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 font-mono-num text-sm font-semibold text-amber-300 pl-2">
              <Coins className="w-4 h-4" />
              <span>{gold} Oro</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Cerrar inventario"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          {mode === 'crafteo' ? (
            <div className="w-full flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-x-auto">
                {(
                  [
                    ['todo', 'Todas las Recetas'],
                    ['Alquimia', 'Alquimia (Pociones)'],
                    ['Forja y Mejora', 'Forja y Mejora de Armas'],
                  ] as [CraftFilterKey, string][]
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setCraftFilter(key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                      craftFilter === key
                        ? 'bg-[#b48e4a] text-[#0b0d12] font-semibold'
                        : 'bg-[#161a24] text-stone-300 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {onOpenAlchemy && (
                <button
                  onClick={onOpenAlchemy}
                  className="px-3 py-1.5 rounded-md bg-emerald-950/75 hover:bg-emerald-900/80 border border-emerald-500/45 text-emerald-200 text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>Laboratorio de Alquimia [Q]</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto">
              {(
                [
                  ['todo', 'Todo'],
                  ['equipo', 'Armas y Equipo'],
                  ['montura', 'Monturas'],
                  ['consumible', 'Pociones'],
                  ['material', 'Materiales'],
                  ['reliquia', 'Muestras de Estudio'],
                ] as [FilterKey, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                    filter === key
                      ? 'bg-[#b48e4a] text-[#0b0d12] font-semibold'
                      : 'bg-[#161a24] text-stone-300 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {mode === 'tienda' && (
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#141821] border border-white/10">
              <button
                onClick={() => setShopSubMode('comprar')}
                className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  shopSubMode === 'comprar'
                    ? 'bg-emerald-600/80 text-white font-semibold'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                Comprar
              </button>
              <button
                onClick={() => setShopSubMode('vender')}
                className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  shopSubMode === 'vender'
                    ? 'bg-amber-600/80 text-white font-semibold'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                Vender ({inventory.length})
              </button>
            </div>
          )}
        </div>

        {/* Daily Market Bulletin Bar (Shop Only) */}
        {mode === 'tienda' && (
          <div className="px-6 py-2.5 border-b border-white/10 bg-[#111620] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-200 min-w-0">
              <TrendingUp className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="truncate">{marketState.headline}</span>
            </div>
            <div className="font-mono-num text-[11px] text-stone-300 shrink-0">
              Prestigio ({completedQuestsCount} misiones):{' '}
              {completedQuestsCount > 0 ? (
                <span className="text-emerald-300">
                  -{Math.min(20, completedQuestsCount * 4)}% compra / +
                  {Math.min(25, completedQuestsCount * 5)}% venta
                </span>
              ) : (
                <span className="text-stone-400">Sin bonificación aún</span>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        {mode === 'crafteo' ? (
          <div className="flex-1 overflow-y-auto rpg-scroll p-6 grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Recipe List */}
            <div className="md:col-span-7 space-y-2.5 content-start">
              {filteredRecipes.map((recipe) => {
                const resultItem = ITEMS_CATALOG[recipe.resultItemId];
                if (!resultItem) return null;
                const rarity = RARITY_COLORS[resultItem.rarity];
                const ready = canCraftRecipe(recipe);
                const isSelected = activeRecipe?.id === recipe.id;

                return (
                  <button
                    key={recipe.id}
                    onClick={() => setSelectedRecipeId(recipe.id)}
                    className={`w-full text-left p-3.5 rounded-lg border transition-colors flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-[#1b202c] border-[#d4af5f]'
                        : `${rarity.bg} ${rarity.border} hover:border-white/30`
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {recipe.category === 'Alquimia' ? (
                          <FlaskConical className="w-4 h-4 text-emerald-300 shrink-0" />
                        ) : (
                          <Hammer className="w-4 h-4 text-amber-300 shrink-0" />
                        )}
                        <span className={`text-sm font-semibold truncate ${rarity.text}`}>
                          {recipe.name}
                        </span>
                      </div>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded shrink-0 ${
                          ready
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                            : 'bg-black/40 text-stone-400 border border-white/10'
                        }`}
                      >
                        {ready ? 'Disponible' : 'Faltan materiales'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-400">
                      <span>
                        {recipe.category} · Resultado: {resultItem.name}
                      </span>
                      {recipe.goldCost ? (
                        <span
                          className={`font-mono-num ${
                            gold >= recipe.goldCost ? 'text-amber-300' : 'text-rose-400'
                          }`}
                        >
                          {recipe.goldCost} Oro
                        </span>
                      ) : (
                        <span className="text-stone-500">Sin coste de oro</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Recipe Inspector */}
            <div className="md:col-span-5 bg-[#131720] border border-white/10 rounded-lg p-5 flex flex-col justify-between gap-4">
              {activeRecipe && ITEMS_CATALOG[activeRecipe.resultItemId] ? (
                (() => {
                  const resultItem = ITEMS_CATALOG[activeRecipe.resultItemId];
                  const rarity = RARITY_COLORS[resultItem.rarity];
                  const craftable = canCraftRecipe(activeRecipe);
                  const upgradesEquipped = Boolean(
                    activeRecipe.acceptsEquippedWeapon &&
                      activeRecipe.ingredients.some((req) => {
                        const counts = getOwnedCount(req.itemId, inventory, equipment, true);
                        return counts.inInventory < req.quantity && counts.equippedMatch;
                      })
                  );

                  return (
                    <>
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-stone-400">
                            {activeRecipe.category} · {rarity.label}
                          </div>
                          <h3 className={`font-display text-lg font-bold mt-1 ${rarity.text}`}>
                            {resultItem.name}
                            {activeRecipe.resultQuantity > 1
                              ? ` x${activeRecipe.resultQuantity}`
                              : ''}
                          </h3>
                        </div>

                        <p className="text-xs text-stone-300 leading-relaxed">
                          {activeRecipe.description}
                        </p>

                        {resultItem.bonuses && (
                          <div className="pt-2 border-t border-white/10 space-y-1 text-xs text-emerald-300 font-mono-num">
                            {Object.entries(resultItem.bonuses).map(([k, v]) => (
                              <div key={k}>
                                + {v} {BONUS_LABELS[k] ?? k}
                              </div>
                            ))}
                          </div>
                        )}

                        {resultItem.healHp && (
                          <div className="text-xs text-emerald-300 font-mono-num">
                            Restaura +{resultItem.healHp} HP
                          </div>
                        )}
                        {resultItem.restoreMana && (
                          <div className="text-xs text-sky-300 font-mono-num">
                            Restaura +{resultItem.restoreMana} Maná
                          </div>
                        )}

                        {/* Required Ingredients */}
                        <div className="pt-3 border-t border-white/10 space-y-2">
                          <div className="text-xs font-semibold text-stone-200">
                            Ingredientes Requeridos
                          </div>
                          <div className="space-y-1.5">
                            {activeRecipe.ingredients.map((req) => {
                              const ingItem = ITEMS_CATALOG[req.itemId];
                              const counts = getOwnedCount(
                                req.itemId,
                                inventory,
                                equipment,
                                Boolean(activeRecipe.acceptsEquippedWeapon)
                              );
                              const ok = counts.total >= req.quantity;
                              const usingEquipped =
                                counts.inInventory < req.quantity && counts.equippedMatch;

                              return (
                                <div
                                  key={req.itemId}
                                  className="flex items-center justify-between gap-2 text-xs px-2.5 py-1.5 rounded bg-black/30 border border-white/10"
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {ok && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                                    <span
                                      className={`truncate ${
                                        ok ? 'text-stone-200' : 'text-rose-300'
                                      }`}
                                    >
                                      {ingItem?.name ?? req.itemId}
                                      {usingEquipped ? ' (Equipada)' : ''}
                                    </span>
                                  </div>
                                  <span
                                    className={`font-mono-num shrink-0 ${
                                      ok ? 'text-emerald-300' : 'text-rose-400'
                                    }`}
                                  >
                                    {counts.total} / {req.quantity}
                                  </span>
                                </div>
                              );
                            })}

                            {activeRecipe.goldCost && (
                              <div className="flex items-center justify-between gap-2 text-xs px-2.5 py-1.5 rounded bg-black/30 border border-white/10">
                                <span className="text-stone-300">Coste de Forja / Alquimia</span>
                                <span
                                  className={`font-mono-num ${
                                    gold >= activeRecipe.goldCost
                                      ? 'text-amber-300'
                                      : 'text-rose-400'
                                  }`}
                                >
                                  {activeRecipe.goldCost} Oro
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/10 space-y-2">
                        {upgradesEquipped && (
                          <div className="text-[11px] text-amber-300/90">
                            Mejorará directamente el arma que llevas equipada.
                          </div>
                        )}
                        <button
                          disabled={!craftable}
                          onClick={() => onCraftRecipe(activeRecipe.id)}
                          className="w-full py-2.5 px-4 rounded-lg bg-[#b48e4a] hover:bg-[#c8a056] disabled:bg-white/10 disabled:text-stone-500 text-[#0b0d12] text-sm font-semibold whitespace-nowrap transition-colors"
                        >
                          {!craftable
                            ? 'Recursos insuficientes'
                            : upgradesEquipped
                            ? 'Forjar y Equipar Mejora'
                            : activeRecipe.category === 'Alquimia'
                            ? 'Crear Poción'
                            : 'Forjar Mejora'}
                        </button>
                      </div>
                    </>
                  );
                })()
              ) : (
                <div className="text-sm text-stone-400 my-auto text-center">
                  Selecciona una receta para ver sus ingredientes.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto rpg-scroll p-6 grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Item List */}
            <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5 content-start">
              {isShopBuy ? (
                filteredShopIds.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-sm text-stone-400 border border-dashed border-white/10 rounded-lg">
                    El mercader no tiene objetos en esta categoría.
                  </div>
                ) : (
                  filteredShopIds.map((itemId) => {
                    const item = ITEMS_CATALOG[itemId];
                    if (!item) return null;
                    const rarity = RARITY_COLORS[item.rarity];
                    const quote = computeDynamicMarketQuote(item, marketState, quests);
                    const price = quote.buyPrice;
                    const affordable = gold >= price;
                    const outOfStock = quote.stock <= 0;
                    const isSelected = activeShopId === itemId;
                    const ownedCount = inventory
                      .filter((e) => e.itemId === itemId)
                      .reduce((acc, e) => acc + e.quantity, 0);

                    return (
                      <button
                        key={itemId}
                        onClick={() => setSelectedShopItemId(itemId)}
                        className={`text-left p-3 rounded-lg border transition-colors flex flex-col gap-1 ${
                          isSelected
                            ? 'bg-[#1b202c] border-[#d4af5f]'
                            : `${rarity.bg} ${rarity.border} hover:border-white/30`
                        } ${outOfStock ? 'opacity-70' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm font-semibold truncate ${rarity.text}`}>
                            {item.name}
                          </span>
                          <div className="flex items-center gap-1.5 font-mono-num text-xs shrink-0">
                            {quote.buyDeltaPct !== 0 && (
                              <span
                                className={
                                  quote.buyDeltaPct > 0 ? 'text-rose-300' : 'text-emerald-300'
                                }
                              >
                                {quote.buyDeltaPct > 0 ? `+${quote.buyDeltaPct}%` : `${quote.buyDeltaPct}%`}
                              </span>
                            )}
                            <span
                              className={
                                outOfStock
                                  ? 'text-stone-500 line-through'
                                  : affordable
                                  ? 'text-amber-300'
                                  : 'text-rose-400'
                              }
                            >
                              {price} Oro
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-stone-400 gap-2">
                          <span className="truncate">
                            {rarity.label} ·{' '}
                            <span
                              className={
                                outOfStock
                                  ? 'text-rose-300'
                                  : quote.stock <= 1
                                  ? 'text-amber-300'
                                  : 'text-stone-300'
                              }
                            >
                              {outOfStock ? 'Agotado hoy' : `Stock: ${quote.stock}/${quote.maxStock}`}
                            </span>
                          </span>
                          {ownedCount > 0 && (
                            <span className="font-mono-num text-stone-300 shrink-0">
                              Mochila: {ownedCount}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )
              ) : filteredInventory.length === 0 ? (
                <div className="col-span-full py-12 text-center text-sm text-stone-400 border border-dashed border-white/10 rounded-lg">
                  No hay objetos en esta categoría.
                </div>
              ) : (
                filteredInventory.map((entry) => {
                  const item = ITEMS_CATALOG[entry.itemId];
                  if (!item) return null;
                  const rarity = RARITY_COLORS[item.rarity];
                  const isSelected = selectedEntry?.uid === entry.uid;
                  const quote = computeDynamicMarketQuote(item, marketState, quests);
                  const sPrice = quote.sellPrice;

                  return (
                    <button
                      key={entry.uid}
                      onClick={() => setSelectedUid(entry.uid)}
                      className={`text-left p-3 rounded-lg border transition-colors flex flex-col gap-1 ${
                        isSelected
                          ? 'bg-[#1b202c] border-[#d4af5f]'
                          : `${rarity.bg} ${rarity.border} hover:border-white/30`
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm font-semibold truncate ${rarity.text}`}>
                          {item.name}
                        </span>
                        {entry.quantity > 1 && (
                          <span className="font-mono-num text-xs text-stone-300 shrink-0">
                            x{entry.quantity}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-stone-400 gap-2">
                        <span className="truncate">
                          {rarity.label} · {item.slot ? `Ranura: ${item.slot}` : item.category}
                        </span>
                        {mode === 'tienda' && (
                          <span className="font-mono-num text-amber-300 shrink-0 flex items-center gap-1">
                            <span>+{sPrice} Oro</span>
                            {quote.sellDeltaPct !== 0 && (
                              <span
                                className={
                                  quote.sellDeltaPct > 0 ? 'text-emerald-300' : 'text-rose-300'
                                }
                              >
                                ({quote.sellDeltaPct > 0 ? `+${quote.sellDeltaPct}%` : `${quote.sellDeltaPct}%`})
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Item Inspector */}
            <div className="md:col-span-5 bg-[#131720] border border-white/10 rounded-lg p-5 flex flex-col justify-between gap-4">
              {selectedItem && (isShopBuy || selectedEntry) ? (
                <>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-stone-400">
                        {RARITY_COLORS[selectedItem.rarity].label} ·{' '}
                        {isShopBuy
                          ? `Precio compra: ${buyPrice} oro`
                          : mode === 'tienda'
                          ? `Precio venta: ${sellPrice} oro`
                          : `Valor: ${selectedItem.valueGold} oro`}
                      </div>
                      <h3
                        className={`font-display text-lg font-bold mt-1 ${
                          RARITY_COLORS[selectedItem.rarity].text
                        }`}
                      >
                        {selectedItem.name}
                      </h3>
                    </div>

                    <p className="text-sm text-stone-300 leading-relaxed">
                      {selectedItem.description}
                    </p>

                    {selectedItem.bonuses && (
                      <div className="pt-2 border-t border-white/10 space-y-1 text-xs text-emerald-300 font-mono-num">
                        {Object.entries(selectedItem.bonuses).map(([k, v]) => (
                          <div key={k}>
                            + {v} {BONUS_LABELS[k] ?? k}
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedItem.healHp && (
                      <div className="text-xs text-emerald-300 font-mono-num">
                        Restaura +{selectedItem.healHp} HP
                      </div>
                    )}
                    {selectedItem.restoreMana && (
                      <div className="text-xs text-sky-300 font-mono-num">
                        Restaura +{selectedItem.restoreMana} Maná
                      </div>
                    )}
                    {selectedItem.buffEffect && (
                      <div className="p-2.5 rounded-md bg-emerald-950/35 border border-emerald-500/35 space-y-1">
                        <div className="text-xs font-semibold text-emerald-300 flex items-center justify-between gap-2">
                          <span>{selectedItem.buffEffect.name}</span>
                          <span className="font-mono-num text-amber-300">
                            {selectedItem.buffEffect.durationSec}s
                          </span>
                        </div>
                        <div className="text-xs text-stone-200">
                          {selectedItem.buffEffect.summary}
                        </div>
                      </div>
                    )}
                    {selectedItem.category === 'material' && (
                      <div className="text-xs text-amber-300/90 pt-2 border-t border-white/10">
                        Ingrediente recolectable. Úsalo en Crafteo o en el Laboratorio de Alquimia
                        [Q] para destilar pociones únicas.
                      </div>
                    )}
                    {mode === 'tienda' && selectedQuote && (
                      <div className="p-3 rounded-md bg-black/35 border border-white/10 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#f3e6c8] flex items-center gap-1.5">
                            {selectedQuote.buyDeltaPct < 0 ? (
                              <TrendingDown className="w-3.5 h-3.5 text-emerald-300" />
                            ) : (
                              <TrendingUp className="w-3.5 h-3.5 text-amber-300" />
                            )}
                            <span>Cotización del Día {marketState.dayNumber}</span>
                          </span>
                          <span className="font-mono-num text-[11px] text-stone-300">
                            Base:{' '}
                            {isShopBuy
                              ? `${selectedQuote.baseBuyPrice} Oro`
                              : `${selectedQuote.baseSellPrice} Oro`}
                          </span>
                        </div>
                        <div className="space-y-0.5 text-[11px] text-stone-300">
                          {selectedQuote.reasons.map((r, idx) => (
                            <div key={idx}>· {r}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Contextual Action Buttons */}
                  {mode === 'mochila' && selectedEntry ? (
                    <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                      {selectedItem.category !== 'material' ? (
                        <button
                          onClick={() => onUseOrEquip(selectedEntry.uid)}
                          className="flex-1 py-2 px-4 rounded-lg bg-[#b48e4a] hover:bg-[#c8a056] text-[#0b0d12] text-sm font-semibold whitespace-nowrap transition-colors"
                        >
                          {selectedItem.slot === 'montura'
                            ? 'Montar Criatura'
                            : selectedItem.slot
                            ? 'Equipar'
                            : selectedItem.studySpeciesId
                            ? 'Analizar en Bestiario'
                            : 'Usar'}
                        </button>
                      ) : (
                        <button
                          onClick={() => setMode('crafteo')}
                          className="flex-1 py-2 px-4 rounded-lg bg-[#b48e4a] hover:bg-[#c8a056] text-[#0b0d12] text-sm font-semibold whitespace-nowrap transition-colors"
                        >
                          Ir a Crafteo
                        </button>
                      )}
                      <button
                        onClick={() => onDropItem(selectedEntry.uid)}
                        className="py-2 px-4 rounded-lg bg-white/10 hover:bg-red-900/50 text-stone-300 hover:text-red-200 text-sm font-medium whitespace-nowrap transition-colors"
                      >
                        Descartar
                      </button>
                    </div>
                  ) : isShopBuy ? (
                    <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                      <button
                        disabled={gold < buyPrice || (selectedQuote?.stock ?? 0) <= 0}
                        onClick={() => onBuyItem(selectedItem.id)}
                        className="flex-1 py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-white/10 disabled:text-stone-500 text-white text-sm font-semibold whitespace-nowrap transition-colors"
                      >
                        {(selectedQuote?.stock ?? 0) <= 0
                          ? 'Agotado hoy (vende para reponer)'
                          : gold >= buyPrice
                          ? `Comprar (${buyPrice} Oro)`
                          : `Oro insuficiente (${buyPrice} Oro)`}
                      </button>
                    </div>
                  ) : selectedEntry ? (
                    <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                      <button
                        onClick={() => onSellItem(selectedEntry.uid, false)}
                        className="flex-1 py-2 px-4 rounded-lg bg-[#b48e4a] hover:bg-[#c8a056] text-[#0b0d12] text-sm font-semibold whitespace-nowrap transition-colors"
                      >
                        Vender (+{sellPrice} Oro)
                      </button>
                      {selectedEntry.quantity > 1 && (
                        <button
                          onClick={() => onSellItem(selectedEntry.uid, true)}
                          className="py-2 px-3 rounded-lg bg-white/10 hover:bg-amber-700/50 text-amber-200 text-xs font-semibold whitespace-nowrap transition-colors"
                        >
                          Todo (+{sellPrice * selectedEntry.quantity})
                        </button>
                      )}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="text-sm text-stone-400 my-auto text-center">
                  Selecciona un objeto para ver sus detalles.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
