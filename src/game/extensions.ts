import { ComputedStats, GameItem, MonsterSpecies, Quest } from './types';

/**
 * Arquitectura Modular de Expansión ("Crónicas del Velo")
 * ------------------------------------------------------------------
 * Este registro permite acoplar nuevos sistemas sin modificar el núcleo
 * del motor 3D ni la interfaz base:
 *  - Nuevos monstruos -> registerMonster()
 *  - Nuevos objetos/equipo -> registerItem()
 *  - Nuevas misiones -> registerQuest()
 *  - Modificadores de combate / pasivas -> registerCombatHook()
 *  - Habilidades en ranuras 4, 5 y 6 -> registerAbilitySlot()
 */

export interface CombatHookContext {
  playerLevel: number;
  stats: ComputedStats;
  targetSpeciesId: string;
  baseDamage: number;
  isCrit: boolean;
}

export interface RpgExtensionPlugin {
  id: string;
  name: string;
  items?: GameItem[];
  monsters?: MonsterSpecies[];
  quests?: Quest[];
  onModifyOutgoingDamage?: (ctx: CombatHookContext) => number;
  onTickRegenBonus?: (stats: ComputedStats) => { hpBonus: number; manaBonus: number };
}

class GameExtensionRegistry {
  private plugins: Map<string, RpgExtensionPlugin> = new Map();

  registerPlugin(plugin: RpgExtensionPlugin): void {
    this.plugins.set(plugin.id, plugin);
  }

  unregisterPlugin(id: string): void {
    this.plugins.delete(id);
  }

  getActivePlugins(): RpgExtensionPlugin[] {
    return Array.from(this.plugins.values());
  }

  applyDamageHooks(ctx: CombatHookContext): number {
    let dmg = ctx.baseDamage;
    for (const plugin of this.plugins.values()) {
      if (plugin.onModifyOutgoingDamage) {
        dmg = plugin.onModifyOutgoingDamage({ ...ctx, baseDamage: dmg });
      }
    }
    return dmg;
  }

  getRegenBonuses(stats: ComputedStats): { hpBonus: number; manaBonus: number } {
    let hpBonus = 0;
    let manaBonus = 0;
    for (const plugin of this.plugins.values()) {
      if (plugin.onTickRegenBonus) {
        const res = plugin.onTickRegenBonus(stats);
        hpBonus += res.hpBonus;
        manaBonus += res.manaBonus;
      }
    }
    return { hpBonus, manaBonus };
  }
}

export const extensionRegistry = new GameExtensionRegistry();
