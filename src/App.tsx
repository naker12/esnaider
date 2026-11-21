import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AchievementsModal } from './components/AchievementsModal';
import { AlchemyModal } from './components/AlchemyModal';
import { BestiaryModal } from './components/BestiaryModal';
import { CharacterModal } from './components/CharacterModal';
import { ClanModal } from './components/ClanModal';
import { DialogueModal } from './components/DialogueModal';
import { ExtensionsModal } from './components/ExtensionsModal';
import { FirestoreErrorBoundary } from './components/FirestoreErrorBoundary';
import { GameHud } from './components/GameHud';
import { HeroAccountModal } from './components/HeroAccountModal';
import { InventoryModal, InventoryMode } from './components/InventoryModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { QuestsModal } from './components/QuestsModal';
import { RebirthModal } from './components/RebirthModal';
import {
  auth,
  loadCloudPlayerProfile,
  onAuthStateChanged,
  publishOnlinePresence,
  saveCloudPlayerProfile,
  sendChatMessage,
  setPlayerOffline,
  signInWithGoogleAccount,
  signOutAccount,
  subscribeChatMessages,
  subscribeOnlinePlayers,
  User,
} from './firebase';
import { soundEngine } from './game/audio';
import {
  ACHIEVEMENTS_CATALOG,
  ALCHEMY_FORMULAS,
  CLAN_NPCS_CATALOG,
  CLAN_ROLE_INFO,
  CLASSES_CATALOG,
  computeBestiaryCompletionPct,
  computeClanBonuses,
  computeDynamicMarketQuote,
  computePlayerStats,
  CRAFTING_RECIPES,
  createDailyMarketState,
  DIALOGUE_REWARDS,
  DIALOGUE_TREES,
  DIFFICULTIES_CATALOG,
  DRAGON_HEARTS_META,
  getClanBadgeInfo,
  getRebirthDamageMultiplier,
  getRebirthRequiredLevel,
  getSkillsForBuild,
  getUnlockedTitleIds,
  getXpForNextLevel,
  HIDDEN_QUESTS_CATALOG,
  INITIAL_ATTRIBUTES,
  INITIAL_BESTIARY,
  INITIAL_CLAN_MEMBERS,
  INITIAL_EQUIPMENT,
  INITIAL_EXTENSION_MODULES,
  INITIAL_INVENTORY,
  INITIAL_QUESTS,
  ITEMS_CATALOG,
  LORE_CODEX_CATALOG,
  MAX_LEVEL,
  MONSTER_SPECIES,
  RACES_CATALOG,
  TALENTS_CATALOG,
  TITLES_CATALOG,
} from './game/data';
import { FirstPersonRpgEngine, WORLD_RADIUS } from './game/engine';
import { extensionRegistry } from './game/extensions';
import { WEATHER_PRESETS } from './game/weatherShader';
import {
  AchievementMetrics,
  AchievementToast,
  ActiveAlchemyBuff,
  ActiveModal,
  BaseAttributes,
  BestiaryProgressEntry,
  ChatChannel,
  ChatMessage,
  ClanMemberState,
  ClanRole,
  ClassId,
  CombatLogMessage,
  ComputedStats,
  DayTimeSnapshot,
  DialogueChoice,
  DifficultyId,
  DragonHeartId,
  EquipmentSlot,
  ExtensionModuleSlot,
  FloatingDamage,
  GameItem,
  InventoryEntry,
  MarketState,
  MinimapSnapshot,
  MonsterSpeciesId,
  NpcId,
  OnlinePlayerState,
  PlayerStatusEffect,
  Quest,
  RaceId,
  SkillSlot,
  TargetInfo,
  TravelerJournalEntry,
  WeatherType,
  WorldMapId,
} from './game/types';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<FirstPersonRpgEngine | null>(null);

  // Core RPG State
  const [raceId, setRaceId] = useState<RaceId>('humano');
  const [classId, setClassId] = useState<ClassId>('caballero_runico');
  const [difficultyId, setDifficultyId] = useState<DifficultyId>('normal');
  const [rebirths, setRebirths] = useState(0);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [gold, setGold] = useState(40);
  const [attributePoints, setAttributePoints] = useState(2);
  const [talentPoints, setTalentPoints] = useState(0);
  const [talentRanks, setTalentRanks] = useState<Record<string, number>>({});
  const [attributes, setAttributes] = useState<BaseAttributes>(INITIAL_ATTRIBUTES);
  const [equipment, setEquipment] = useState<Record<EquipmentSlot, string | null>>(INITIAL_EQUIPMENT);
  const [inventory, setInventory] = useState<InventoryEntry[]>(INITIAL_INVENTORY);
  const [bestiary, setBestiary] = useState<Record<MonsterSpeciesId, BestiaryProgressEntry>>(INITIAL_BESTIARY);
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [modules, setModules] = useState<ExtensionModuleSlot[]>(INITIAL_EXTENSION_MODULES);
  const [skills, setSkills] = useState<SkillSlot[]>(() =>
    getSkillsForBuild('humano', 'caballero_runico', 0)
  );
  const [clanName, setClanName] = useState('Guardia del Bastión');
  const [clanTag, setClanTag] = useState('GDB');
  const [clanColor, setClanColor] = useState('#d4af5f');
  const [clanMembers, setClanMembers] = useState<ClanMemberState[]>(INITIAL_CLAN_MEMBERS);
  const [activeBuffs, setActiveBuffs] = useState<ActiveAlchemyBuff[]>([]);

  // Firebase Account, Cloud Sync & Online Multiplayer State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [cloudSyncBusy, setCloudSyncBusy] = useState(false);
  const [cloudStatusMessage, setCloudStatusMessage] = useState<string | null>(null);
  const [currentMapId, setCurrentMapId] = useState<WorldMapId>('plaza');
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayerState[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatChannel, setChatChannel] = useState<ChatChannel>('global');
  const [chatOpen, setChatOpen] = useState(true);

  const clanBonuses = useMemo(() => computeClanBonuses(clanMembers), [clanMembers]);

  const stats: ComputedStats = useMemo(
    () =>
      computePlayerStats(
        level,
        attributes,
        equipment,
        bestiary,
        talentRanks,
        clanBonuses.statBonuses,
        activeBuffs,
        raceId,
        classId,
        rebirths
      ),
    [
      level,
      attributes,
      equipment,
      bestiary,
      talentRanks,
      clanBonuses.statBonuses,
      activeBuffs,
      raceId,
      classId,
      rebirths,
    ]
  );

  const xpToNext = useMemo(() => getXpForNextLevel(level), [level]);

  const [hp, setHp] = useState(stats.maxHp);
  const [mana, setMana] = useState(stats.maxMana);
  const [isDead, setIsDead] = useState(false);

  // Milestones & Achievements State
  const [chestsOpened, setChestsOpened] = useState(0);
  const [tradesCompleted, setTradesCompleted] = useState(0);
  const [discoveredShrinesCount, setDiscoveredShrinesCount] = useState(1);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Record<string, number>>({});
  const [achievementToasts, setAchievementToasts] = useState<AchievementToast[]>([]);
  const [hasUnseenAchievements, setHasUnseenAchievements] = useState(false);
  const unlockedAchievementsRef = useRef<Record<string, number>>({});
  const [playerName, setPlayerName] = useState('Vaelen');
  const [selectedTitleId, setSelectedTitleId] = useState<string | null>('titulo_iniciado');
  const prevUnlockedTitlesRef = useRef<string[]>(['titulo_iniciado']);

  // Dialogue & Lore Codex State
  const [activeNpcId, setActiveNpcId] = useState<NpcId>('npc_valen');
  const [dialogueNodeId, setDialogueNodeId] = useState<string>('valen_root');
  const [claimedDialogueRewards, setClaimedDialogueRewards] = useState<string[]>([]);
  const [unlockedHiddenQuests, setUnlockedHiddenQuests] = useState<string[]>([]);
  const [discoveredLoreIds, setDiscoveredLoreIds] = useState<string[]>([]);
  const discoveredLoreRef = useRef<string[]>([]);
  const [journalEntries, setJournalEntries] = useState<TravelerJournalEntry[]>([]);

  // HUD & UI State (starts on Hero/Account modal so player can enter name, link account & pick Race/Class/Difficulty)
  const [activeModal, setActiveModal] = useState<ActiveModal>('cuenta');
  const [inventoryMode, setInventoryMode] = useState<InventoryMode>('mochila');
  const [fastTravelOpen, setFastTravelOpen] = useState(false);
  const [pointerLocked, setPointerLocked] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [weather, setWeather] = useState<WeatherType>('despejado');
  const [dayTime, setDayTime] = useState<DayTimeSnapshot>({
    dayNumber: 1,
    hour: 9.5,
    formattedTime: '09:30',
    phase: 'dia',
    phaseLabel: 'Día',
    isNight: false,
    visibilityMeters: 112,
  });
  const [marketState, setMarketState] = useState<MarketState>(() =>
    createDailyMarketState(1, INITIAL_QUESTS)
  );
  const [playerStatuses, setPlayerStatuses] = useState<PlayerStatusEffect[]>([]);
  const [target, setTarget] = useState<TargetInfo | null>(null);
  const [combatLogs, setCombatLogs] = useState<CombatLogMessage[]>([
    {
      id: 'init-1',
      text: 'Bienvenido a la Plaza del Alba (Zona Segura). Cruza el Portal Norte para entrar al Templo del Velo.',
      tone: 'info',
      timestamp: Date.now(),
    },
  ]);
  const [floatingDamages, setFloatingDamages] = useState<FloatingDamage[]>([]);
  const [minimap, setMinimap] = useState<MinimapSnapshot>({
    mapId: 'plaza',
    isSafeZone: true,
    playerX: 0,
    playerZ: 12,
    playerYaw: 0,
    worldRadius: WORLD_RADIUS,
    zoneName: 'Plaza del Alba (Zona Segura)',
    pillars: [],
    entities: [],
    shrines: [],
  });

  // Mutable refs for WebGL loop access without re-mounting engine
  const statsRef = useRef(stats);
  statsRef.current = stats;
  const levelRef = useRef(level);
  levelRef.current = level;
  const xpRef = useRef(xp);
  xpRef.current = xp;
  const raceRef = useRef(raceId);
  raceRef.current = raceId;
  const classRef = useRef(classId);
  classRef.current = classId;
  const difficultyRef = useRef(difficultyId);
  difficultyRef.current = difficultyId;
  const rebirthsRef = useRef(rebirths);
  rebirthsRef.current = rebirths;
  const bestiaryRef = useRef(bestiary);
  bestiaryRef.current = bestiary;
  const equipmentRef = useRef(equipment);
  equipmentRef.current = equipment;
  const manaRef = useRef(mana);
  manaRef.current = mana;
  const clanBonusesRef = useRef(clanBonuses);
  clanBonusesRef.current = clanBonuses;
  const activeBuffsRef = useRef(activeBuffs);
  activeBuffsRef.current = activeBuffs;
  const questsRef = useRef(quests);
  questsRef.current = quests;
  const modalOpenRef = useRef(false);
  modalOpenRef.current = activeModal !== null || isDead;

  const pushLog = useCallback(
    (text: string, tone: CombatLogMessage['tone'] = 'info') => {
      setCombatLogs((prev) => [
        ...prev.slice(-18),
        { id: `${Date.now()}-${Math.random()}`, text, tone, timestamp: Date.now() },
      ]);
    },
    []
  );

  const addItemToInventory = useCallback((itemId: string, qty = 1) => {
    const def = ITEMS_CATALOG[itemId];
    if (!def) return;
    setInventory((prev) => {
      if (def.stackable) {
        const idx = prev.findIndex((e) => e.itemId === itemId);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + qty };
          return copy;
        }
      }
      return [...prev, { uid: `item-${Date.now()}-${Math.random()}`, itemId, quantity: qty }];
    });
  }, []);

  const syncQuestStudyObjectives = useCallback(
    (updatedBestiary: Record<MonsterSpeciesId, BestiaryProgressEntry>) => {
      const sightedCount = Object.values(updatedBestiary).filter((b) => b.sighted).length;
      setQuests((prev) =>
        prev.map((q) => {
          if (q.status === 'completada') return q;
          const nextObjs = q.objectives.map((obj) => {
            if (obj.type !== 'study') return obj;
            if (obj.targetId === 'any_sighted') {
              return { ...obj, current: Math.min(obj.required, sightedCount) };
            }
            const entry = updatedBestiary[obj.targetId as MonsterSpeciesId];
            return {
              ...obj,
              current: Math.min(obj.required, entry ? entry.studyPoints : obj.current),
            };
          });
          const allDone = nextObjs.every((o) => o.current >= o.required);
          return {
            ...q,
            objectives: nextObjs,
            status: allDone ? 'lista_recompensa' : q.status,
          };
        })
      );
    },
    []
  );

  const applyBestiaryStudy = useCallback(
    (speciesId: MonsterSpeciesId, points: number, sightedOnly = false) => {
      const spec = MONSTER_SPECIES[speciesId];
      setBestiary((prev) => {
        const cur = prev[speciesId];
        const nextPoints = Math.min(100, cur.studyPoints + points);
        const becameMastered = cur.studyPoints < 100 && nextPoints >= 100;
        const firstSight = !cur.sighted;

        const nextState = {
          ...prev,
          [speciesId]: {
            ...cur,
            sighted: true,
            studyPoints: nextPoints,
          },
        };

        if (firstSight && sightedOnly) {
          pushLog(`Bestiario actualizado: ${spec.name} avistado.`, 'study');
        } else if (!sightedOnly) {
          pushLog(
            `Estudio de ${spec.name}: +${points} pts (${nextPoints}%).`,
            'study'
          );
        }
        if (becameMastered) {
          pushLog(
            `¡Maestría alcanzada! ${spec.name} al 100%: ${spec.studyMasteryBonus}`,
            'quest'
          );
        }

        queueMicrotask(() => syncQuestStudyObjectives(nextState));
        return nextState;
      });
    },
    [pushLog, syncQuestStudyObjectives]
  );

  const grantXpAndCheckLevel = useCallback(
    (gainedXp: number) => {
      if (levelRef.current >= MAX_LEVEL) {
        xpRef.current = 0;
        setXp(0);
        return;
      }

      let total = xpRef.current + gainedXp;
      const prevLevel = levelRef.current;
      let curLvl = prevLevel;
      let threshold = getXpForNextLevel(curLvl);
      let leveled = false;

      while (curLvl < MAX_LEVEL && total >= threshold) {
        total -= threshold;
        curLvl += 1;
        threshold = getXpForNextLevel(curLvl);
        leveled = true;
      }

      if (curLvl >= MAX_LEVEL) {
        total = 0;
      }

      xpRef.current = total;
      setXp(total);

      if (leveled) {
        const gainedLevels = curLvl - prevLevel;
        const gainedTalents = Math.floor(curLvl / 5) - Math.floor(prevLevel / 5);
        levelRef.current = curLvl;
        setLevel(curLvl);
        setAttributePoints((pts) => pts + gainedLevels * 3);
        if (gainedTalents > 0) {
          setTalentPoints((pts) => pts + gainedTalents);
          pushLog(
            `¡Nivel ${curLvl} alcanzado! +${gainedTalents} punto(s) de talento para tu Árbol de Talentos [C].`,
            'quest'
          );
        }
        soundEngine.playLevelUp();
        pushLog(
          curLvl >= MAX_LEVEL
            ? `¡Has alcanzado el Nivel Máximo ${MAX_LEVEL}! Puedes realizar un Renacimiento [N].`
            : `¡Subiste a Nivel ${curLvl}! +${gainedLevels * 3} puntos de atributo disponibles [C].`,
          'quest'
        );
        setHp(statsRef.current.maxHp + 14 * gainedLevels);
        setMana(statsRef.current.maxMana + 8 * gainedLevels);
      }
    },
    [pushLog]
  );

  const unlockLoreFragment = useCallback(
    (loreId: string, notifyIfAlreadyKnown = false) => {
      const entry = LORE_CODEX_CATALOG.find((l) => l.id === loreId);
      if (!entry) return;
      if (discoveredLoreRef.current.includes(loreId)) {
        if (notifyIfAlreadyKnown) {
          pushLog(
            `Ya registraste "${entry.title}" en tu Códice de Historia [M].`,
            'study'
          );
        }
        return;
      }
      const next = [...discoveredLoreRef.current, loreId];
      discoveredLoreRef.current = next;
      setDiscoveredLoreIds(next);
      grantXpAndCheckLevel(entry.xpReward);
      soundEngine.playStudy();
      pushLog(
        `¡Códice de Historia: "${entry.title}" descubierto (+${entry.xpReward} XP)! [M]`,
        'study'
      );
    },
    [grantXpAndCheckLevel, pushLog]
  );

  const achievementMetrics: AchievementMetrics = useMemo(() => {
    const entries = Object.values(bestiary);
    const totalKills = entries.reduce((sum, e) => sum + e.kills, 0);
    const wyvernKills = bestiary.wyvern_ceniza?.kills ?? 0;
    const sightedSpeciesCount = entries.filter((e) => e.sighted).length;
    const bestiaryCompletionPct = computeBestiaryCompletionPct(bestiary);
    const questsCompleted = quests.filter((q) => q.status === 'completada').length;

    return {
      level,
      totalKills,
      wyvernKills,
      bestiaryCompletionPct,
      sightedSpeciesCount,
      chestsOpened,
      tradesCompleted,
      questsCompleted,
      discoveredShrinesCount,
    };
  }, [bestiary, chestsOpened, discoveredShrinesCount, level, quests, tradesCompleted]);

  const unlockedTitleIds = useMemo(
    () => getUnlockedTitleIds(unlockedAchievements, quests),
    [unlockedAchievements, quests]
  );

  const activeTitle = useMemo(
    () =>
      TITLES_CATALOG.find(
        (t) => t.id === selectedTitleId && unlockedTitleIds.includes(t.id)
      ) ?? null,
    [selectedTitleId, unlockedTitleIds]
  );

  useEffect(() => {
    const newlyUnlocked = unlockedTitleIds.filter(
      (id) => !prevUnlockedTitlesRef.current.includes(id)
    );
    if (newlyUnlocked.length > 0) {
      prevUnlockedTitlesRef.current = unlockedTitleIds;
      newlyUnlocked.forEach((id) => {
        const def = TITLES_CATALOG.find((t) => t.id === id);
        if (def) {
          pushLog(
            `¡Nuevo título desbloqueado: "${def.name}"! Equípalo en Personaje [C].`,
            'quest'
          );
        }
      });
    }
  }, [unlockedTitleIds, pushLog]);

  // Evaluate and unlock achievements whenever metrics change
  useEffect(() => {
    const newlyUnlocked = ACHIEVEMENTS_CATALOG.filter(
      (ach) => !unlockedAchievementsRef.current[ach.id] && ach.getCurrent(achievementMetrics) >= ach.target
    );
    if (newlyUnlocked.length === 0) return;

    const now = Date.now();
    const updatedMap = { ...unlockedAchievementsRef.current };
    let totalBonusGold = 0;
    let totalBonusXp = 0;
    const newToasts: AchievementToast[] = [];

    newlyUnlocked.forEach((ach) => {
      updatedMap[ach.id] = now;
      totalBonusGold += ach.rewardGold ?? 0;
      totalBonusXp += ach.rewardXp ?? 0;
      newToasts.push({
        id: `ach-toast-${ach.id}-${now}`,
        achievementId: ach.id,
        title: ach.title,
        description: ach.description,
        category: ach.category,
        rewardGold: ach.rewardGold,
        rewardXp: ach.rewardXp,
      });
      pushLog(`¡Logro desbloqueado: ${ach.title}! [L]`, 'quest');
    });

    unlockedAchievementsRef.current = updatedMap;
    setUnlockedAchievements(updatedMap);
    setHasUnseenAchievements(true);
    soundEngine.playEvent('ui:achievement');

    if (totalBonusGold > 0) {
      setGold((g) => g + totalBonusGold);
    }
    if (totalBonusXp > 0) {
      grantXpAndCheckLevel(totalBonusXp);
    }

    setAchievementToasts((prev) => [...prev.slice(-2), ...newToasts]);
    newToasts.forEach((toast) => {
      window.setTimeout(() => {
        setAchievementToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 4800);
    });
  }, [achievementMetrics, grantXpAndCheckLevel, pushLog]);

  // Mount Three.js FirstPersonRpgEngine once
  useEffect(() => {
    const mountEl = canvasMountRef.current;
    if (!mountEl) return;

    const engine = new FirstPersonRpgEngine(mountEl, {
      getStats: () => statsRef.current,
      getPlayerLevel: () => levelRef.current,
      getBestiary: () => bestiaryRef.current,
      getEquippedMountId: () => equipmentRef.current.montura,
      getDifficultyId: () => difficultyRef.current,
      getRaceId: () => raceRef.current,
      getClassId: () => classRef.current,
      getRebirths: () => rebirthsRef.current,
      isModalOpen: () => modalOpenRef.current,
      onPointerLockChange: (locked) => setPointerLocked(locked),
      onBlockStateChange: (blocking) => setIsBlocking(blocking),
      onPlayerDamaged: (amount, attackerName, blocked) => {
        setHp((prev) => {
          const next = Math.max(0, prev - amount);
          if (next <= 0) {
            setIsDead(true);
            engine.releasePointerLock();
          } else if (next / statsRef.current.maxHp <= 0.28) {
            soundEngine.playEvent('combat:low_hp');
          }
          return next;
        });
        pushLog(
          blocked
            ? `¡Bloqueaste el golpe de ${attackerName}! (-${amount} HP)`
            : `${attackerName} te golpea por ${amount} de daño.`,
          blocked ? 'info' : 'damage'
        );
      },
      onPlayerHealed: (healHp, restoreMana) => {
        setHp((prev) => Math.min(statsRef.current.maxHp, prev + healHp));
        if (restoreMana > 0) {
          setMana((prev) => Math.min(statsRef.current.maxMana, prev + restoreMana));
        }
      },
      onPlayerStatusesChange: (statuses) => {
        setPlayerStatuses(statuses);
      },
      onSpendMana: (cost) => {
        if (manaRef.current < cost) return false;
        setMana((prev) => Math.max(0, prev - cost));
        return true;
      },
      onMonsterKilled: (speciesId, xpGain, goldGain, drops) => {
        const spec = MONSTER_SPECIES[speciesId];
        setGold((g) => g + goldGain);
        grantXpAndCheckLevel(xpGain);

        drops.forEach((itemId) => addItemToInventory(itemId, 1));
        const dropNames = drops.map((id) => ITEMS_CATALOG[id]?.name ?? id).join(', ');
        pushLog(
          `${spec.name} derrotado (+${xpGain} XP, +${goldGain} Oro${
            dropNames ? `, botín: ${dropNames}` : ''
          }).`,
          'loot'
        );

        // Update bestiary kills & study
        setBestiary((prev) => {
          const cur = prev[speciesId];
          const nextPoints = Math.min(100, cur.studyPoints + 20);
          const nextState = {
            ...prev,
            [speciesId]: {
              ...cur,
              sighted: true,
              kills: cur.kills + 1,
              studyPoints: nextPoints,
            },
          };
          queueMicrotask(() => syncQuestStudyObjectives(nextState));
          return nextState;
        });

        // Update kill quests
        setQuests((prev) =>
          prev.map((q) => {
            if (q.status === 'completada') return q;
            const nextObjs = q.objectives.map((obj) => {
              if (obj.type === 'kill' && obj.targetId === speciesId) {
                return { ...obj, current: Math.min(obj.required, obj.current + 1) };
              }
              return obj;
            });
            const allDone = nextObjs.every((o) => o.current >= o.required);
            if (allDone && q.status !== 'lista_recompensa') {
              pushLog(`¡Misión lista para reclamar: ${q.title}! [M]`, 'quest');
              if (q.id === 'mision_ruinas') {
                queueMicrotask(() => unlockLoreFragment('lore_area_ruinas'));
              }
            }
            return {
              ...q,
              objectives: nextObjs,
              status: allDone ? 'lista_recompensa' : q.status,
            };
          })
        );

        if (speciesId === 'wyvern_ceniza') {
          unlockLoreFragment('lore_area_altar');
        }
      },
      onMonsterStudy: (speciesId, points, sightedOnly) => {
        applyBestiaryStudy(speciesId, points, sightedOnly);
      },
      onChestOpened: (goldGain, itemIds) => {
        setChestsOpened((c) => c + 1);
        setGold((g) => g + goldGain);
        itemIds.forEach((id) => addItemToInventory(id, 1));
        const names = itemIds.map((id) => ITEMS_CATALOG[id]?.name ?? id).join(', ');
        pushLog(`Cofre abierto: +${goldGain} Oro, ${names}.`, 'loot');
      },
      onShrineDiscovered: (_shrineId, shrineName, zoneName, discoveredCount) => {
        setDiscoveredShrinesCount(discoveredCount);
        grantXpAndCheckLevel(35);
        pushLog(
          `¡Santuario sintonizado: ${shrineName} (${zoneName})! +35 XP. Teletransporte activado en el minimapa [T].`,
          'quest'
        );
      },
      onFastTravel: (_shrineId, shrineName, zoneName) => {
        setFastTravelOpen(false);
        pushLog(`Viaje rápido completado: ${shrineName} (${zoneName}).`, 'heal');
        if (zoneName === 'Atrio Antiguo') unlockLoreFragment('lore_area_atrio');
        if (zoneName === 'Cráter Basáltico') unlockLoreFragment('lore_area_crater');
      },
      onLoreObjectInteract: (loreId) => {
        unlockLoreFragment(loreId, true);
      },
      onZoneEntered: (zoneName) => {
        if (zoneName === 'Atrio Antiguo') {
          unlockLoreFragment('lore_area_atrio');
        } else if (zoneName === 'Cráter Basáltico') {
          unlockLoreFragment('lore_area_crater');
        }
      },
      onMapChange: (nextMapId) => {
        setCurrentMapId(nextMapId);
      },
      isDebuffImmune: () =>
        activeBuffsRef.current.some((b) => b.immuneToDebuffs && b.remaining > 0),
      onClanNpcRescued: (npcId) => {
        const def = CLAN_NPCS_CATALOG.find((c) => c.id === npcId);
        setClanMembers((prev) =>
          prev.map((m) => (m.id === npcId ? { ...m, rescued: true } : m))
        );
        soundEngine.playStudy();
        if (def) {
          pushLog(
            `¡Has rescatado a ${def.name}! Abre Clan [K] para invitarlo a tu base del Santuario.`,
            'quest'
          );
        }
      },
      onClanNpcBaseInteract: () => {
        setActiveModal('clan');
        engine.releasePointerLock();
      },
      onHerbHarvested: (itemId, quantity, nodeName) => {
        addItemToInventory(itemId, quantity);
        const item = ITEMS_CATALOG[itemId];
        soundEngine.playStudy();
        pushLog(
          `Recolectado ${nodeName}: +${quantity} ${item?.name ?? itemId} para Alquimia [Q].`,
          'loot'
        );
      },
      onNpcInteract: () => {
        setActiveNpcId('npc_valen');
        setDialogueNodeId(DIALOGUE_TREES.npc_valen.startNodeId);
        setActiveModal('dialogo');
        engine.releasePointerLock();
      },
      onMerchantInteract: () => {
        setActiveNpcId('npc_kael');
        setDialogueNodeId(DIALOGUE_TREES.npc_kael.startNodeId);
        setActiveModal('dialogo');
        engine.releasePointerLock();
      },
      onLog: (text, tone) => pushLog(text, tone),
      onFloatingDamage: (dmg) => {
        setFloatingDamages((prev) => [...prev.slice(-10), dmg]);
        setTimeout(() => {
          setFloatingDamages((prev) => prev.filter((item) => item.id !== dmg.id));
        }, 900);
      },
      onTargetChange: (t) => setTarget(t),
      onMinimapUpdate: (snap) => setMinimap(snap),
      onSkillCooldowns: (cds) => {
        setSkills((prev) =>
          prev.map((sk) => ({ ...sk, remainingCooldown: cds[sk.slotIndex] ?? 0 }))
        );
      },
      onSkillTriggerKey: (slotIdx) => {
        engine.triggerSkill(slotIdx);
      },
      onWeatherChange: (nextWeather) => {
        setWeather(nextWeather);
        pushLog(`El clima cambia a ${WEATHER_PRESETS[nextWeather].label}.`, 'info');
      },
      onDayTimeChange: (nextDayTime) => {
        setDayTime(nextDayTime);
      },
      onNewDay: (newDay) => {
        setMarketState((prev) => {
          const next = createDailyMarketState(newDay, questsRef.current, prev.stockByItemId);
          queueMicrotask(() => pushLog(next.headline, 'info'));
          return next;
        });
      },
      onJournalSnapshotCaptured: (entry) => {
        setJournalEntries((prev) => {
          if (prev.some((e) => e.poiId === entry.poiId)) return prev;
          return [...prev, entry];
        });
        if (entry.poiId !== 'poi_zone_bastion') {
          pushLog(`Diario de Viajero: instantánea guardada de "${entry.title}" [M].`, 'study');
        }
      },
    });

    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [addItemToInventory, applyBestiaryStudy, grantXpAndCheckLevel, pushLog, syncQuestStudyObjectives, unlockLoreFragment]);

  // Passive HP & Mana Regeneration Loop
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (isDead) return;
      const s = statsRef.current;
      const extBonus = extensionRegistry.getRegenBonuses(s);
      const hpTick = (s.regenHp + extBonus.hpBonus) * 0.25;
      const manaTick = (s.regenMana + extBonus.manaBonus) * 0.25;
      setHp((prev) => {
        if (prev > 0 && prev / s.maxHp <= 0.28) {
          soundEngine.playEvent('combat:low_hp');
        }
        return prev < s.maxHp ? Math.min(s.maxHp, prev + hpTick) : s.maxHp;
      });
      setMana((prev) => (prev < s.maxMana ? Math.min(s.maxMana, prev + manaTick) : s.maxMana));
    }, 250);
    return () => clearInterval(timer);
  }, [isDead]);

  // Keep 3D world Clan NPCs synced with React Clan state
  useEffect(() => {
    engineRef.current?.syncClanNpcs(clanMembers);
  }, [clanMembers]);

  // Keep Skills Hotbar (Slots 4-6) synced with Race, Class & Rebirth multiplier
  useEffect(() => {
    setSkills((prev) => {
      const prevCds: Record<number, number> = {};
      prev.forEach((s) => {
        prevCds[s.slotIndex] = s.remainingCooldown;
      });
      return getSkillsForBuild(raceId, classId, rebirths, prevCds);
    });
  }, [raceId, classId, rebirths]);

  // Sync monster HP/ATK/DEF/Speed & encounter scaling when difficulty, level, or rebirths change
  useEffect(() => {
    engineRef.current?.syncDifficultyScale();
  }, [difficultyId, level, rebirths]);

  // Clamp HP/Mana if temporary maxHp/maxMana buffs expire
  useEffect(() => {
    setHp((prev) => Math.min(prev, stats.maxHp));
    setMana((prev) => Math.min(prev, stats.maxMana));
  }, [stats.maxHp, stats.maxMana]);

  // Prolonged Alchemy Buff Countdown Loop
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (isDead || activeModal !== null) return;
      setActiveBuffs((prev) => {
        if (prev.length === 0) return prev;
        const expiredNames: string[] = [];
        const next: ActiveAlchemyBuff[] = [];
        for (const b of prev) {
          const rem = Math.max(0, Number((b.remaining - 0.25).toFixed(2)));
          if (rem > 0) {
            next.push({ ...b, remaining: rem });
          } else {
            expiredNames.push(b.name);
          }
        }
        if (expiredNames.length > 0) {
          queueMicrotask(() =>
            pushLog(`Efecto alquímico finalizado: ${expiredNames.join(', ')}.`, 'info')
          );
        }
        return next;
      });
    }, 250);
    return () => clearInterval(timer);
  }, [activeModal, isDead, pushLog]);

  // Clan Passive Resource Production Loop (every 25s)
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (isDead) return;
      const b = clanBonusesRef.current;
      if (
        b.goldPerCycle <= 0 &&
        b.xpPerCycle <= 0 &&
        b.studyPointsPerCycle <= 0 &&
        b.herbsPerCycle <= 0
      ) {
        return;
      }

      const logParts: string[] = [];
      if (b.goldPerCycle > 0) {
        setGold((g) => g + b.goldPerCycle);
        logParts.push(`+${b.goldPerCycle} Oro`);
      }
      if (b.xpPerCycle > 0) {
        grantXpAndCheckLevel(b.xpPerCycle);
        logParts.push(`+${b.xpPerCycle} XP`);
      }
      if (b.herbsPerCycle > 0) {
        const pool = ['hierba_solar', 'flor_eterea', 'raiz_lunaria', 'extracto_goblin', 'extracto_espectral'];
        const pickedNames: string[] = [];
        for (let i = 0; i < b.herbsPerCycle; i++) {
          const itemId = pool[Math.floor(Math.random() * pool.length)];
          addItemToInventory(itemId, 1);
          pickedNames.push(ITEMS_CATALOG[itemId]?.name ?? itemId);
        }
        logParts.push(pickedNames.join(', '));
      }
      if (b.studyPointsPerCycle > 0) {
        const speciesOrder = Object.keys(bestiaryRef.current) as MonsterSpeciesId[];
        const targetSpecies =
          speciesOrder.find((id) => bestiaryRef.current[id].studyPoints < 100) ?? speciesOrder[0];
        if (targetSpecies) {
          applyBestiaryStudy(targetSpecies, b.studyPointsPerCycle, false);
          logParts.push(`+${b.studyPointsPerCycle} estudio`);
        }
      }

      pushLog(`Producción del Clan (${clanName}): ${logParts.join(' · ')}.`, 'loot');
    }, 25000);
    return () => clearInterval(timer);
  }, [addItemToInventory, applyBestiaryStudy, clanName, grantXpAndCheckLevel, isDead, pushLog]);

  const openModal = useCallback((modal: ActiveModal) => {
    if (modal === 'inventario') {
      setInventoryMode('mochila');
    }
    if (modal === 'logros') {
      setHasUnseenAchievements(false);
    }
    setActiveModal((prev) => {
      const next = prev === modal ? null : modal;
      if (next !== null) {
        engineRef.current?.releasePointerLock();
      }
      return next;
    });
  }, []);

  const handleUseQuickPotion = useCallback(() => {
    const idx =
      inventory.find((e) => e.itemId === 'pocion_vida') ??
      inventory.find((e) => e.itemId === 'pocion_gran_vitalidad');
    if (!idx) {
      pushLog('No te quedan pociones curativas en la mochila.', 'info');
      return;
    }
    const item = ITEMS_CATALOG[idx.itemId];
    if (!item?.healHp) return;
    soundEngine.playHeal();
    setHp((prev) => Math.min(statsRef.current.maxHp, prev + item.healHp!));
    if (item.restoreMana) {
      setMana((prev) => Math.min(statsRef.current.maxMana, prev + item.restoreMana!));
    }
    const cleansed =
      item.id === 'pocion_gran_vitalidad'
        ? engineRef.current?.cleanseStatuses() ?? []
        : [];
    pushLog(
      `${item.name} usada: +${item.healHp} HP${item.restoreMana ? `, +${item.restoreMana} Maná` : ''}${
        cleansed.length > 0 ? ` · Purifica ${cleansed.join(', ')}` : ''
      }.`,
      'heal'
    );
    setInventory((prev) =>
      prev
        .map((e) => (e.uid === idx.uid ? { ...e, quantity: e.quantity - 1 } : e))
        .filter((e) => e.quantity > 0)
    );
  }, [inventory, pushLog]);

  // Keyboard shortcuts for RPG menus & quick potion
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isDead) return;
      const targetEl = e.target as HTMLElement | null;
      if (
        targetEl &&
        (targetEl.tagName === 'INPUT' ||
          targetEl.tagName === 'TEXTAREA' ||
          targetEl.tagName === 'SELECT')
      ) {
        return;
      }
      if (e.code === 'KeyI') openModal('inventario');
      else if (e.code === 'KeyC') openModal('personaje');
      else if (e.code === 'KeyM') openModal('misiones');
      else if (e.code === 'KeyB') openModal('bestiario');
      else if (e.code === 'KeyK') openModal('clan');
      else if (e.code === 'KeyQ') openModal('alquimia');
      else if (e.code === 'KeyL') openModal('logros');
      else if (e.code === 'KeyN') openModal('renacimiento');
      else if (e.code === 'KeyU') openModal('top');
      else if (e.code === 'KeyY') openModal('cuenta');
      else if (e.code === 'KeyX') openModal('modulos');
      else if (e.code === 'KeyV' && activeModal === null) engineRef.current?.cycleWeather();
      else if (e.code === 'KeyH' && activeModal === null) engineRef.current?.advanceDayPhase();
      else if (e.code === 'KeyT' && activeModal === null) {
        setFastTravelOpen((prev) => {
          const next = !prev;
          if (next) engineRef.current?.releasePointerLock();
          return next;
        });
      }
      else if (e.code === 'KeyR' && activeModal === null) handleUseQuickPotion();
      else if (e.code === 'Escape' && activeModal !== null) setActiveModal(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeModal, handleUseQuickPotion, isDead, openModal]);

  const applyConsumableItemEffects = useCallback(
    (item: GameItem) => {
      if (item.healHp) {
        soundEngine.playHeal();
        setHp((prev) => Math.min(statsRef.current.maxHp, prev + item.healHp!));
        pushLog(`Restaurado +${item.healHp} HP.`, 'heal');
      }
      if (item.restoreMana) {
        soundEngine.playHeal();
        setMana((prev) => Math.min(statsRef.current.maxMana, prev + item.restoreMana!));
        pushLog(`Restaurado +${item.restoreMana} Maná.`, 'heal');
      }
      if (
        item.id === 'pocion_gran_vitalidad' ||
        item.id === 'elixir_supremo_velo' ||
        item.buffEffect?.cleanseDebuffs
      ) {
        const cleansed = engineRef.current?.cleanseStatuses() ?? [];
        if (cleansed.length > 0) {
          pushLog(`${item.name} purifica ${cleansed.join(', ')}.`, 'heal');
        }
      }
      if (item.buffEffect) {
        const buff = item.buffEffect;
        const duration = Math.round(buff.durationSec * clanBonusesRef.current.alchemyDurationMult);
        soundEngine.playHeal();
        setActiveBuffs((prev) => {
          const without = prev.filter((b) => b.id !== buff.id);
          return [
            ...without,
            {
              id: buff.id,
              name: buff.name,
              remaining: duration,
              duration,
              tone: buff.tone,
              summary: buff.summary,
              bonuses: buff.bonuses,
              immuneToDebuffs: buff.immuneToDebuffs,
            },
          ];
        });
        pushLog(`Efecto alquímico activo: ${buff.name} (${duration}s) — ${buff.summary}.`, 'heal');
      }
    },
    [pushLog]
  );

  const handleUseOrEquip = (uid: string) => {
    const entry = inventory.find((e) => e.uid === uid);
    if (!entry) return;
    const item = ITEMS_CATALOG[entry.itemId];
    if (!item) return;

    if (item.slot) {
      const targetSlot = item.slot;
      const previouslyEquipped = equipment[targetSlot];
      setEquipment((prev) => ({ ...prev, [targetSlot]: item.id }));
      setInventory((prev) => {
        const without = prev.filter((e) => e.uid !== uid);
        if (previouslyEquipped) {
          return [
            ...without,
            { uid: `unq-${Date.now()}-${Math.random()}`, itemId: previouslyEquipped, quantity: 1 },
          ];
        }
        return without;
      });
      if (targetSlot === 'montura') {
        soundEngine.playStudy();
        pushLog(
          `Montura equipada: ${item.name} (+${item.bonuses?.velocidadMovimiento ?? 0} m/s).`,
          'loot'
        );
      } else {
        pushLog(`Equipado: ${item.name} en ranura ${targetSlot}.`, 'loot');
      }
    } else if (item.studySpeciesId) {
      applyBestiaryStudy(item.studySpeciesId, item.studyPoints ?? 30, false);
      soundEngine.playStudy();
      setInventory((prev) =>
        prev
          .map((e) => (e.uid === uid ? { ...e, quantity: e.quantity - 1 } : e))
          .filter((e) => e.quantity > 0)
      );
    } else {
      applyConsumableItemEffects(item);
      setInventory((prev) =>
        prev
          .map((e) => (e.uid === uid ? { ...e, quantity: e.quantity - 1 } : e))
          .filter((e) => e.quantity > 0)
      );
    }
  };

  const handleUnequip = (slot: EquipmentSlot) => {
    const itemId = equipment[slot];
    if (!itemId) return;
    setEquipment((prev) => ({ ...prev, [slot]: null }));
    addItemToInventory(itemId, 1);
    pushLog(`Desequipado: ${ITEMS_CATALOG[itemId]?.name ?? itemId}.`, 'info');
  };

  const handleSpendAttribute = (attr: keyof BaseAttributes) => {
    if (attributePoints <= 0) return;
    setAttributePoints((p) => p - 1);
    setAttributes((prev) => ({ ...prev, [attr]: prev[attr] + 1 }));
  };

  const handleSpendTalent = (talentId: string) => {
    if (talentPoints <= 0) return;
    const node = TALENTS_CATALOG.find((t) => t.id === talentId);
    if (!node) return;
    const currentRank = talentRanks[talentId] ?? 0;
    if (currentRank >= node.maxRank) return;
    if (node.requiresTalentId && (talentRanks[node.requiresTalentId] ?? 0) < 1) return;

    setTalentPoints((p) => p - 1);
    setTalentRanks((prev) => ({ ...prev, [talentId]: currentRank + 1 }));
    soundEngine.playStudy();
    pushLog(
      `Talento mejorado: ${node.name} (Rango ${currentRank + 1}/${node.maxRank}).`,
      'quest'
    );
  };

  const handleSelectDialogueChoice = (choice: DialogueChoice) => {
    if (choice.grantRewardId && !claimedDialogueRewards.includes(choice.grantRewardId)) {
      const reward = DIALOGUE_REWARDS[choice.grantRewardId];
      if (reward) {
        setClaimedDialogueRewards((prev) => [...prev, choice.grantRewardId!]);
        if (reward.gold) setGold((g) => g + reward.gold!);
        if (reward.xp) grantXpAndCheckLevel(reward.xp);
        if (reward.itemId) addItemToInventory(reward.itemId, 1);
        soundEngine.playEvent('ui:trade_coin');
        pushLog(reward.logText, 'loot');
      }
    }

    if (choice.unlockQuestId && !unlockedHiddenQuests.includes(choice.unlockQuestId)) {
      const hiddenQuest = HIDDEN_QUESTS_CATALOG[choice.unlockQuestId];
      if (hiddenQuest) {
        setUnlockedHiddenQuests((prev) => [...prev, choice.unlockQuestId!]);
        // Sync current bestiary study points immediately if hidden quest has study objective
        const syncedObjectives = hiddenQuest.objectives.map((obj) => {
          if (obj.type === 'study') {
            const entry = bestiary[obj.targetId as MonsterSpeciesId];
            if (entry) {
              return { ...obj, current: Math.min(obj.required, entry.studyPoints) };
            }
          }
          return obj;
        });
        const allDone = syncedObjectives.every((o) => o.current >= o.required);
        setQuests((prev) => {
          if (prev.some((q) => q.id === hiddenQuest.id)) return prev;
          return [
            ...prev,
            {
              ...hiddenQuest,
              objectives: syncedObjectives,
              status: allDone ? 'lista_recompensa' : 'activa',
            },
          ];
        });
        soundEngine.playEvent('ui:level_up');
        pushLog(`¡Misión oculta desbloqueada: ${hiddenQuest.title}! [M]`, 'quest');
      }
    }

    if (choice.nextNodeId && DIALOGUE_TREES[activeNpcId]?.nodes[choice.nextNodeId]) {
      setDialogueNodeId(choice.nextNodeId);
      return;
    }

    if (choice.action === 'open_quests') {
      setActiveModal('misiones');
    } else if (choice.action === 'open_shop') {
      setInventoryMode('tienda');
      setActiveModal('inventario');
    } else if (choice.action === 'open_bestiary') {
      setActiveModal('bestiario');
    } else if (choice.action === 'night_blessing') {
      const healHp = Math.round(stats.maxHp * 0.5);
      const restoreMana = Math.round(stats.maxMana * 0.5);
      setHp((prev) => Math.min(stats.maxHp, prev + healHp));
      setMana((prev) => Math.min(stats.maxMana, prev + restoreMana));
      const cleansed = engineRef.current?.cleanseStatuses() ?? [];
      soundEngine.playHeal();
      pushLog(
        `Bendición Nocturna de Valen: +${healHp} HP, +${restoreMana} Maná${
          cleansed.length > 0 ? ` · Purifica ${cleansed.join(', ')}` : ''
        }.`,
        'heal'
      );
      setActiveModal(null);
    } else {
      setActiveModal(null);
    }
  };

  const handleClaimQuest = (questId: string) => {
    const q = quests.find((x) => x.id === questId);
    if (!q || q.status !== 'lista_recompensa') return;
    setQuests((prev) =>
      prev.map((x) => (x.id === questId ? { ...x, status: 'completada' } : x))
    );
    setGold((g) => g + q.rewards.gold);
    grantXpAndCheckLevel(q.rewards.xp);
    if (q.rewards.itemId) {
      addItemToInventory(q.rewards.itemId, 1);
    }
    soundEngine.playLevelUp();
    pushLog(
      `Misión completada: ${q.title} (+${q.rewards.xp} XP, +${q.rewards.gold} Oro). Precios en tienda mejorados.`,
      'quest'
    );
  };

  const handleAnalyzeSampleFromBestiary = (speciesId: MonsterSpeciesId) => {
    const sample = inventory.find((e) => ITEMS_CATALOG[e.itemId]?.studySpeciesId === speciesId);
    if (!sample) return;
    const item = ITEMS_CATALOG[sample.itemId];
    soundEngine.playStudy();
    applyBestiaryStudy(speciesId, item?.studyPoints ?? 35, false);
    setInventory((prev) =>
      prev
        .map((e) => (e.uid === sample.uid ? { ...e, quantity: e.quantity - 1 } : e))
        .filter((e) => e.quantity > 0)
    );
  };

  const handleToggleModule = (id: string) => {
    setModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    );
    const mod = modules.find((m) => m.id === id);
    if (mod) {
      if (!mod.enabled && mod.id === 'mod_talentos') {
        extensionRegistry.registerPlugin({
          id: 'mod_talentos',
          name: mod.name,
          onModifyOutgoingDamage: (ctx) => ctx.baseDamage * 1.05,
        });
        pushLog('Módulo experimental activado: +5% Daño desde gancho de extensión.', 'quest');
      } else if (mod.enabled && mod.id === 'mod_talentos') {
        extensionRegistry.unregisterPlugin('mod_talentos');
      }
    }
  };

  const handleBuyItem = (itemId: string) => {
    const item = ITEMS_CATALOG[itemId];
    if (!item) return;
    const quote = computeDynamicMarketQuote(item, marketState, quests);
    if (quote.stock <= 0) {
      pushLog(`Mercader Kael no tiene existencias de ${item.name} hasta mañana.`, 'info');
      return;
    }
    const price = quote.buyPrice;
    if (gold < price) {
      pushLog(`Oro insuficiente para comprar ${item.name} (${price} Oro).`, 'info');
      return;
    }
    if (!item.stackable && inventory.length >= 28) {
      pushLog('Tu mochila está llena (28/28 espacios).', 'info');
      return;
    }
    setGold((g) => g - price);
    setMarketState((prev) => ({
      ...prev,
      stockByItemId: {
        ...prev.stockByItemId,
        [itemId]: Math.max(0, (prev.stockByItemId[itemId] ?? quote.stock) - 1),
      },
    }));
    addItemToInventory(itemId, 1);
    setTradesCompleted((t) => t + 1);
    soundEngine.playEvent('ui:trade_coin');
    pushLog(`Compraste ${item.name} por ${price} Oro (stock restante: ${Math.max(0, quote.stock - 1)}).`, 'loot');
  };

  const handleSellItem = (uid: string, sellAll = false) => {
    const entry = inventory.find((e) => e.uid === uid);
    if (!entry) return;
    const item = ITEMS_CATALOG[entry.itemId];
    if (!item) return;
    const qtyToSell = sellAll ? entry.quantity : 1;
    const quote = computeDynamicMarketQuote(item, marketState, quests);
    const totalGold = quote.sellPrice * qtyToSell;

    setGold((g) => g + totalGold);
    setInventory((prev) =>
      prev
        .map((e) => (e.uid === uid ? { ...e, quantity: e.quantity - qtyToSell } : e))
        .filter((e) => e.quantity > 0)
    );
    setMarketState((prev) => ({
      ...prev,
      stockByItemId: {
        ...prev.stockByItemId,
        [item.id]: (prev.stockByItemId[item.id] ?? quote.stock) + qtyToSell,
      },
    }));
    setTradesCompleted((t) => t + 1);
    soundEngine.playEvent('ui:trade_coin');
    pushLog(
      `Vendiste ${qtyToSell > 1 ? `${qtyToSell}x ` : ''}${item.name} por +${totalGold} Oro.`,
      'loot'
    );
  };

  const handleCraftRecipe = (recipeId: string) => {
    const recipe = CRAFTING_RECIPES.find((r) => r.id === recipeId);
    if (!recipe) return;
    const resultItem = ITEMS_CATALOG[recipe.resultItemId];
    if (!resultItem) return;

    const goldCost = recipe.goldCost ?? 0;
    if (gold < goldCost) {
      pushLog(`Oro insuficiente para craftear ${resultItem.name} (${goldCost} Oro).`, 'info');
      return;
    }

    let useEquippedWeapon = false;
    const neededFromInv: Record<string, number> = {};

    for (const req of recipe.ingredients) {
      const invQty = inventory
        .filter((e) => e.itemId === req.itemId)
        .reduce((sum, e) => sum + e.quantity, 0);
      const reqItem = ITEMS_CATALOG[req.itemId];
      const canUseEquipped = Boolean(
        recipe.acceptsEquippedWeapon && reqItem?.slot === 'arma' && equipment.arma === req.itemId
      );

      if (invQty >= req.quantity) {
        neededFromInv[req.itemId] = req.quantity;
      } else if (canUseEquipped && invQty + 1 >= req.quantity) {
        neededFromInv[req.itemId] = Math.max(0, req.quantity - 1);
        useEquippedWeapon = true;
      } else {
        pushLog(`Faltan ingredientes para crear ${resultItem.name}.`, 'info');
        return;
      }
    }

    // Estimate slots freed when consuming stackable/non-stackable ingredients
    let slotsAfterConsume = inventory.length;
    const simCopy = inventory.map((e) => ({ ...e }));
    Object.entries(neededFromInv).forEach(([itemId, qtyNeeded]) => {
      let rem = qtyNeeded;
      for (const entry of simCopy) {
        if (entry.itemId !== itemId || rem <= 0) continue;
        const take = Math.min(entry.quantity, rem);
        entry.quantity -= take;
        rem -= take;
      }
    });
    slotsAfterConsume = simCopy.filter((e) => e.quantity > 0).length;

    const willAutoEquipResult = useEquippedWeapon && resultItem.slot === 'arma';
    if (!willAutoEquipResult && !resultItem.stackable && slotsAfterConsume >= 28) {
      pushLog('Tu mochila está llena (28/28 espacios) para guardar el objeto creado.', 'info');
      return;
    }

    if (goldCost > 0) {
      setGold((g) => g - goldCost);
    }

    setInventory((prev) => {
      const remaining = { ...neededFromInv };
      const nextInv = prev
        .map((entry) => {
          const toDeduct = remaining[entry.itemId] ?? 0;
          if (toDeduct <= 0) return entry;
          const take = Math.min(entry.quantity, toDeduct);
          remaining[entry.itemId] = toDeduct - take;
          return { ...entry, quantity: entry.quantity - take };
        })
        .filter((entry) => entry.quantity > 0);

      if (willAutoEquipResult) {
        return nextInv;
      }

      if (resultItem.stackable) {
        const idx = nextInv.findIndex((e) => e.itemId === resultItem.id);
        if (idx >= 0) {
          nextInv[idx] = {
            ...nextInv[idx],
            quantity: nextInv[idx].quantity + recipe.resultQuantity,
          };
          return nextInv;
        }
      }
      return [
        ...nextInv,
        {
          uid: `craft-${Date.now()}-${Math.random()}`,
          itemId: resultItem.id,
          quantity: recipe.resultQuantity,
        },
      ];
    });

    if (willAutoEquipResult) {
      setEquipment((prev) => ({ ...prev, arma: resultItem.id }));
    }

    soundEngine.playEvent('ui:craft');
    pushLog(
      willAutoEquipResult
        ? `¡Arma mejorada y equipada: ${resultItem.name}!`
        : `Objeto creado: ${recipe.resultQuantity > 1 ? `${recipe.resultQuantity}x ` : ''}${resultItem.name}.`,
      'loot'
    );
  };

  const handleBrewAlchemyFormula = (formulaId: string, useImmediately = false) => {
    const formula = ALCHEMY_FORMULAS.find((f) => f.id === formulaId);
    if (!formula) return;
    const resultItem = ITEMS_CATALOG[formula.resultItemId];
    if (!resultItem) return;

    const needed: Record<string, number> = {};
    for (const req of formula.ingredients) {
      const owned = inventory
        .filter((e) => e.itemId === req.itemId)
        .reduce((sum, e) => sum + e.quantity, 0);
      if (owned < req.quantity) {
        pushLog(`Faltan hierbas o extractos para destilar ${resultItem.name}.`, 'info');
        return;
      }
      needed[req.itemId] = req.quantity;
    }

    setInventory((prev) => {
      const rem = { ...needed };
      const afterConsume = prev
        .map((entry) => {
          const takeMax = rem[entry.itemId] ?? 0;
          if (takeMax <= 0) return entry;
          const taken = Math.min(entry.quantity, takeMax);
          rem[entry.itemId] = takeMax - taken;
          return { ...entry, quantity: entry.quantity - taken };
        })
        .filter((e) => e.quantity > 0);

      if (useImmediately) {
        if (formula.resultQuantity > 1) {
          const idx = afterConsume.findIndex((e) => e.itemId === resultItem.id);
          if (idx >= 0) {
            afterConsume[idx] = {
              ...afterConsume[idx],
              quantity: afterConsume[idx].quantity + (formula.resultQuantity - 1),
            };
            return afterConsume;
          }
          return [
            ...afterConsume,
            {
              uid: `alq-${Date.now()}-${Math.random()}`,
              itemId: resultItem.id,
              quantity: formula.resultQuantity - 1,
            },
          ];
        }
        return afterConsume;
      }

      if (resultItem.stackable) {
        const idx = afterConsume.findIndex((e) => e.itemId === resultItem.id);
        if (idx >= 0) {
          afterConsume[idx] = {
            ...afterConsume[idx],
            quantity: afterConsume[idx].quantity + formula.resultQuantity,
          };
          return afterConsume;
        }
      }
      return [
        ...afterConsume,
        {
          uid: `alq-${Date.now()}-${Math.random()}`,
          itemId: resultItem.id,
          quantity: formula.resultQuantity,
        },
      ];
    });

    soundEngine.playEvent('ui:craft');
    if (useImmediately) {
      applyConsumableItemEffects(resultItem);
    } else {
      pushLog(`Alquimia completada: ${resultItem.name} añadida a tu mochila.`, 'loot');
    }
  };

  const handleInviteClanMember = (npcId: string) => {
    const def = CLAN_NPCS_CATALOG.find((c) => c.id === npcId);
    setClanMembers((prev) =>
      prev.map((m) =>
        m.id === npcId && m.rescued
          ? {
              ...m,
              invited: true,
              role: m.role === 'ninguno' && def ? def.preferredRole : m.role,
            }
          : m
      )
    );
    soundEngine.playLevelUp();
    if (def) {
      const roleLabel = CLAN_ROLE_INFO[def.preferredRole].label;
      pushLog(
        `${def.name} se ha trasladado al Santuario del Bastión como ${roleLabel}.`,
        'quest'
      );
    }
  };

  const handleAssignClanRole = (npcId: string, role: ClanRole) => {
    const def = CLAN_NPCS_CATALOG.find((c) => c.id === npcId);
    setClanMembers((prev) =>
      prev.map((m) => (m.id === npcId && m.invited ? { ...m, role } : m))
    );
    soundEngine.playStudy();
    if (def) {
      pushLog(
        role === 'ninguno'
          ? `${def.name} queda en descanso en el Santuario.`
          : `${def.name} ahora cumple el rol de ${CLAN_ROLE_INFO[role].label} en ${clanName}.`,
        'info'
      );
    }
  };

  const handleRespawn = () => {
    setIsDead(false);
    setHp(stats.maxHp);
    setMana(stats.maxMana);
    engineRef.current?.respawnAtSanctuary();
    pushLog('Has despertado en el Santuario de Luz Eterna.', 'heal');
  };

  const getDragonHeartsMap = useCallback(
    (inv: InventoryEntry[]): Record<DragonHeartId, number> => {
      const map: Record<DragonHeartId, number> = {
        corazon_dragon_rojo: 0,
        corazon_dragon_negro: 0,
        corazon_dragon_verde: 0,
        corazon_dragon_celeste: 0,
        corazon_dragon_amarillo: 0,
      };
      for (const e of inv) {
        if (e.itemId in map) {
          map[e.itemId as DragonHeartId] += e.quantity;
        }
      }
      return map;
    },
    []
  );

  const buildCloudProfilePayload = useCallback(() => {
    return {
      playerName,
      clanName,
      clanTag,
      clanColor,
      raceId,
      classId,
      difficultyId,
      selectedTitleId: selectedTitleId ?? undefined,
      level,
      xp,
      gold,
      kills: achievementMetrics.totalKills,
      rebirths,
      attributePoints,
      talentPoints,
      attributes,
      dragonHearts: getDragonHeartsMap(inventory),
    };
  }, [
    achievementMetrics.totalKills,
    attributePoints,
    attributes,
    clanColor,
    clanName,
    clanTag,
    classId,
    difficultyId,
    getDragonHeartsMap,
    gold,
    inventory,
    level,
    playerName,
    raceId,
    rebirths,
    selectedTitleId,
    talentPoints,
    xp,
  ]);

  const applyCloudProfileToLocal = useCallback(
    (cloud: Awaited<ReturnType<typeof loadCloudPlayerProfile>>) => {
      if (!cloud) return;
      setPlayerName(cloud.playerName);
      if (cloud.clanName) {
        const badge = getClanBadgeInfo(cloud.clanName, cloud.clanTag, cloud.clanColor);
        setClanName(badge.clanName);
        setClanTag(badge.clanTag);
        setClanColor(badge.clanColor);
      }
      setRaceId(cloud.raceId);
      setClassId(cloud.classId);
      setDifficultyId(cloud.difficultyId);
      if (cloud.selectedTitleId) setSelectedTitleId(cloud.selectedTitleId);
      levelRef.current = cloud.level;
      setLevel(cloud.level);
      xpRef.current = cloud.xp;
      setXp(cloud.xp);
      setGold(cloud.gold);
      setRebirths(cloud.rebirths);
      setAttributePoints(cloud.attributePoints);
      setTalentPoints(cloud.talentPoints);
      setAttributes(cloud.attributes);

      // Sync Dragon Heart counts in inventory & restore total kills baseline
      setInventory((prev) => {
        const nonHearts = prev.filter((e) => !e.itemId.startsWith('corazon_dragon_'));
        const heartEntries: InventoryEntry[] = [];
        (Object.keys(cloud.dragonHearts) as DragonHeartId[]).forEach((hId) => {
          const qty = cloud.dragonHearts[hId] ?? 0;
          if (qty > 0) {
            heartEntries.push({
              uid: `cloud-heart-${hId}-${Date.now()}`,
              itemId: hId,
              quantity: qty,
            });
          }
        });
        return [...nonHearts, ...heartEntries];
      });

      setBestiary((prev) => {
        const currentKills = Object.values(prev).reduce((s, b) => s + b.kills, 0);
        if (cloud.kills > currentKills) {
          const diff = cloud.kills - currentKills;
          return {
            ...prev,
            goblin_merodeador: {
              ...prev.goblin_merodeador,
              sighted: true,
              kills: prev.goblin_merodeador.kills + diff,
            },
          };
        }
        return prev;
      });
    },
    []
  );

  // Firebase Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const cloud = await loadCloudPlayerProfile(user.uid);
          if (
            cloud &&
            levelRef.current === 1 &&
            rebirthsRef.current === 0 &&
            xpRef.current === 0
          ) {
            applyCloudProfileToLocal(cloud);
            setCloudStatusMessage(
              `Progreso cargado desde la nube para ${cloud.playerName} (Nv.${cloud.level}, R${cloud.rebirths}).`
            );
            pushLog(`Sesión vinculada: progreso de ${cloud.playerName} restaurado.`, 'quest');
          } else if (cloud) {
            setCloudStatusMessage(
              `Cuenta conectada. En la nube existe ${cloud.playerName} (Nv.${cloud.level}, R${cloud.rebirths}).`
            );
          } else {
            setCloudStatusMessage('Cuenta Google vinculada. Guardando progreso inicial...');
            await saveCloudPlayerProfile(buildCloudProfilePayload(), activeTitle?.name);
          }
        } catch (err) {
          setCloudStatusMessage(
            err instanceof Error ? err.message : 'Error al sincronizar con la nube.'
          );
        }
      } else {
        setCloudStatusMessage(null);
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced auto-sync when signed in
  useEffect(() => {
    if (!firebaseUser) return;
    const timer = window.setTimeout(() => {
      void saveCloudPlayerProfile(buildCloudProfilePayload(), activeTitle?.name).catch(() => {});
    }, 3500);
    return () => clearTimeout(timer);
  }, [
    firebaseUser,
    playerName,
    clanName,
    clanTag,
    clanColor,
    raceId,
    classId,
    difficultyId,
    level,
    gold,
    achievementMetrics.totalKills,
    rebirths,
    buildCloudProfilePayload,
    activeTitle?.name,
  ]);

  // Real-time Online Players & Chat Subscriptions
  useEffect(() => {
    if (!firebaseUser) {
      setOnlinePlayers([]);
      setChatMessages([]);
      return;
    }

    const unsubPlayers = subscribeOnlinePlayers(
      (players) => setOnlinePlayers(players),
      () => {}
    );
    const unsubChat = subscribeChatMessages(
      60,
      (msgs) => setChatMessages(msgs),
      () => {}
    );

    const handleUnload = () => {
      void setPlayerOffline();
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      unsubPlayers();
      unsubChat();
      void setPlayerOffline();
    };
  }, [firebaseUser]);

  // Sync remote 3D avatars whenever active players list or local UID changes
  useEffect(() => {
    engineRef.current?.syncOnlinePlayers(onlinePlayers, firebaseUser?.uid ?? null);
  }, [onlinePlayers, firebaseUser?.uid]);

  // Publish local online presence & 3D position with smart delta + heartbeat throttling
  const lastPublishedPresenceRef = useRef<{
    mapId: WorldMapId;
    x: number;
    z: number;
    yaw: number;
    clanName: string;
    clanTag: string;
    clanColor: string;
    playerName: string;
    level: number;
    rebirths: number;
    ts: number;
  } | null>(null);

  useEffect(() => {
    if (!firebaseUser) {
      lastPublishedPresenceRef.current = null;
      return;
    }

    const pushPresence = (force: boolean) => {
      const tf = engineRef.current?.getOnlineTransform() ?? {
        mapId: currentMapId,
        x: 0,
        z: 12,
        yaw: 0,
        isMoving: false,
      };
      const now = Date.now();
      const prev = lastPublishedPresenceRef.current;
      const distMoved = prev ? Math.hypot(tf.x - prev.x, tf.z - prev.z) : 999;
      const yawDiff = prev ? Math.abs(tf.yaw - prev.yaw) : 999;
      const identityChanged =
        !prev ||
        prev.mapId !== tf.mapId ||
        prev.clanName !== clanName ||
        prev.clanTag !== clanTag ||
        prev.clanColor !== clanColor ||
        prev.playerName !== playerName ||
        prev.level !== level ||
        prev.rebirths !== rebirths;
      const heartbeatDue = !prev || now - prev.ts >= 15_000;

      if (!force && !identityChanged && !heartbeatDue && distMoved < 0.35 && yawDiff < 0.14) {
        return;
      }

      lastPublishedPresenceRef.current = {
        mapId: tf.mapId,
        x: tf.x,
        z: tf.z,
        yaw: tf.yaw,
        clanName,
        clanTag,
        clanColor,
        playerName,
        level,
        rebirths,
        ts: now,
      };

      void publishOnlinePresence({
        playerName,
        clanName,
        clanTag,
        clanColor,
        raceId,
        classId,
        level,
        rebirths,
        titleName: activeTitle?.name,
        mapId: tf.mapId,
        x: tf.x,
        z: tf.z,
        yaw: tf.yaw,
        isMoving: tf.isMoving,
      }).catch(() => {});
    };

    pushPresence(true);
    const timer = window.setInterval(() => pushPresence(false), 450);
    return () => clearInterval(timer);
  }, [
    firebaseUser,
    playerName,
    clanName,
    clanTag,
    clanColor,
    raceId,
    classId,
    level,
    rebirths,
    activeTitle?.name,
    currentMapId,
  ]);

  const handleLinkGoogleAccount = async () => {
    setCloudSyncBusy(true);
    setCloudStatusMessage(null);
    try {
      const user = await signInWithGoogleAccount();
      setFirebaseUser(user);
      setCloudStatusMessage('Cuenta Google vinculada correctamente.');
      pushLog(`Cuenta vinculada: ${user.displayName || user.email || 'Google'}.`, 'quest');
    } catch (err) {
      setCloudStatusMessage(
        err instanceof Error ? err.message : 'No se pudo completar el inicio de sesión.'
      );
    } finally {
      setCloudSyncBusy(false);
    }
  };

  const handleSignOut = async () => {
    setCloudSyncBusy(true);
    try {
      await signOutAccount();
      setFirebaseUser(null);
      setCloudStatusMessage('Cuenta desvinculada. Jugando en modo local.');
    } finally {
      setCloudSyncBusy(false);
    }
  };

  const handleSaveToCloud = async () => {
    if (!firebaseUser) return;
    setCloudSyncBusy(true);
    try {
      await saveCloudPlayerProfile(buildCloudProfilePayload(), activeTitle?.name);
      setCloudStatusMessage('Progreso guardado en la nube y publicado en el Top Global.');
      pushLog('Partida guardada en la nube y ranking actualizado.', 'quest');
    } catch (err) {
      setCloudStatusMessage(
        err instanceof Error ? err.message : 'No se pudo guardar en la nube.'
      );
    } finally {
      setCloudSyncBusy(false);
    }
  };

  const handleLoadFromCloud = async () => {
    if (!firebaseUser) return;
    setCloudSyncBusy(true);
    try {
      const cloud = await loadCloudPlayerProfile(firebaseUser.uid);
      if (!cloud) {
        setCloudStatusMessage('No hay una partida guardada en la nube todavía.');
      } else {
        applyCloudProfileToLocal(cloud);
        setCloudStatusMessage(
          `Cargado desde la nube: ${cloud.playerName} (Nv.${cloud.level}, R${cloud.rebirths}).`
        );
        pushLog(`Partida cargada desde la nube: ${cloud.playerName}.`, 'quest');
      }
    } catch (err) {
      setCloudStatusMessage(
        err instanceof Error ? err.message : 'No se pudo cargar desde la nube.'
      );
    } finally {
      setCloudSyncBusy(false);
    }
  };

  const handlePerformRebirth = (heartMode: DragonHeartId | 'mix') => {
    const reqLvl = getRebirthRequiredLevel(rebirths);
    if (level < reqLvl) {
      pushLog(`Necesitas alcanzar al menos Nivel ${reqLvl} para renacer.`, 'info');
      return;
    }

    const heartCounts = getDragonHeartsMap(inventory);
    const totalHearts = Object.values(heartCounts).reduce((a, b) => a + b, 0);

    if (heartMode === 'mix') {
      if (totalHearts < 3) {
        pushLog('Necesitas al menos 3 Corazones de Dragón para realizar el Renacimiento.', 'info');
        return;
      }
    } else if (heartCounts[heartMode] < 3) {
      pushLog('No tienes 3 corazones de ese Dragón Elemental todavía.', 'info');
      return;
    }

    // Consume 3 dragon hearts from inventory
    setInventory((prev) => {
      let remaining = 3;
      return prev
        .map((entry) => {
          if (remaining <= 0) return entry;
          const matches =
            heartMode === 'mix'
              ? entry.itemId.startsWith('corazon_dragon_')
              : entry.itemId === heartMode;
          if (!matches) return entry;
          const take = Math.min(entry.quantity, remaining);
          remaining -= take;
          return { ...entry, quantity: entry.quantity - take };
        })
        .filter((e) => e.quantity > 0);
    });

    const nextRebirth = rebirths + 1;
    const nextMult = getRebirthDamageMultiplier(nextRebirth);
    rebirthsRef.current = nextRebirth;
    setRebirths(nextRebirth);
    levelRef.current = 1;
    setLevel(1);
    xpRef.current = 0;
    setXp(0);
    setAttributePoints((p) => p + 5);
    setTalentPoints((p) => p + 1);
    setHp(statsRef.current.maxHp + 35);
    setMana(statsRef.current.maxMana + 15);
    soundEngine.playLevelUp();
    pushLog(
      `¡RENACIMIENTO ${nextRebirth} COMPLETADO! Daño permanente ×${nextMult} (+5 pts de atributo, +1 Talento).`,
      'quest'
    );
    setActiveModal(null);

    if (firebaseUser) {
      window.setTimeout(() => {
        void handleSaveToCloud();
      }, 250);
    }
  };

  const potionCount = inventory
    .filter((e) => e.itemId === 'pocion_vida' || e.itemId === 'pocion_gran_vitalidad')
    .reduce((sum, e) => sum + e.quantity, 0);

  const inventoryMounts = useMemo(
    () => inventory.filter((e) => ITEMS_CATALOG[e.itemId]?.slot === 'montura'),
    [inventory]
  );

  const equippedMount = equipment.montura
    ? ITEMS_CATALOG[equipment.montura] ?? null
    : null;

  const totalDragonHeartsCount = useMemo(
    () =>
      DRAGON_HEARTS_META.reduce(
        (sum, m) =>
          sum +
          inventory
            .filter((e) => e.itemId === m.itemId)
            .reduce((s, e) => s + e.quantity, 0),
        0
      ),
    [inventory]
  );

  const handleUpdateClanIdentity = useCallback(
    (name: string, customTag?: string, customColor?: string) => {
      const badge = getClanBadgeInfo(name, customTag, customColor);
      setClanName(badge.clanName);
      setClanTag(badge.clanTag);
      setClanColor(badge.clanColor);
      soundEngine.playStudy();
      pushLog(`Clan actualizado: [${badge.clanTag}] ${badge.clanName}.`, 'quest');
    },
    [pushLog]
  );

  const handleSendChatMessage = useCallback(
    async (text: string, channel: ChatChannel) => {
      try {
        await sendChatMessage({
          playerName,
          clanName,
          clanTag,
          clanColor,
          channel,
          mapId: currentMapId,
          text,
        });
      } catch (err) {
        pushLog(
          err instanceof Error ? err.message : 'No se pudo enviar el mensaje al chat.',
          'info'
        );
      }
    },
    [clanColor, clanName, clanTag, currentMapId, playerName, pushLog]
  );

  const canRebirthNow =
    level >= getRebirthRequiredLevel(rebirths) && totalDragonHeartsCount >= 3;

  return (
    <FirestoreErrorBoundary>
      <div className="relative w-full h-full bg-[#0b0d12] overflow-hidden">
        {/* Isolated WebGL Viewport Container */}
        <div ref={canvasMountRef} className="w-full h-full" />

        {/* Unobstructed First-Person RPG HUD */}
        <GameHud
          localUid={firebaseUser?.uid ?? null}
          playerName={playerName}
          clanName={clanName}
          clanTag={clanTag}
          clanColor={clanColor}
          currentMapId={currentMapId}
          raceId={raceId}
          classId={classId}
          difficultyId={difficultyId}
          rebirths={rebirths}
          isAccountLinked={Boolean(firebaseUser)}
          canRebirth={canRebirthNow}
          activeTitle={activeTitle}
          equippedMount={equippedMount}
          level={level}
          xp={xp}
          xpToNext={xpToNext}
          hp={hp}
          mana={mana}
          gold={gold}
          attributePoints={attributePoints}
          talentPoints={talentPoints}
          stats={stats}
          minimap={minimap}
          target={target}
          skills={skills}
          combatLogs={combatLogs}
          floatingDamages={floatingDamages}
          pointerLocked={pointerLocked}
          isBlocking={isBlocking}
          muted={muted}
          potionCount={potionCount}
          weather={weather}
          dayTime={dayTime}
          statusEffects={playerStatuses}
          activeBuffs={activeBuffs}
          clanBonuses={clanBonuses}
          hasClanActionPending={clanMembers.some(
            (m) => (m.rescued && !m.invited) || (m.invited && m.role === 'ninguno')
          )}
          fastTravelOpen={fastTravelOpen}
          achievementToasts={achievementToasts}
          hasUnseenAchievements={hasUnseenAchievements}
          onlinePlayers={onlinePlayers}
          chatMessages={chatMessages}
          chatChannel={chatChannel}
          chatOpen={chatOpen}
          onToggleChatOpen={() => setChatOpen((prev) => !prev)}
          onChangeChatChannel={(ch) => setChatChannel(ch)}
          onSendChatMessage={handleSendChatMessage}
          onChatInputFocusChange={(focused) => {
            if (focused) engineRef.current?.releasePointerLock();
          }}
          onLinkGoogleAccount={() => void handleLinkGoogleAccount()}
          onDismissAchievementToast={(toastId) =>
            setAchievementToasts((prev) => prev.filter((t) => t.id !== toastId))
          }
          onCycleWeather={() => engineRef.current?.cycleWeather()}
          onSelectWeather={(nextWeather) => engineRef.current?.setWeather(nextWeather)}
          onAdvanceDayPhase={() => engineRef.current?.advanceDayPhase()}
          onToggleFastTravel={() => {
            setFastTravelOpen((prev) => {
              const next = !prev;
              if (next) engineRef.current?.releasePointerLock();
              return next;
            });
          }}
          onTeleportShrine={(shrineId) => {
            if (!isDead) {
              engineRef.current?.teleportToShrine(shrineId);
            }
          }}
          onToggleMute={() => {
            soundEngine.muted = !muted;
            setMuted(!muted);
          }}
          onOpenModal={openModal}
          onTriggerSkill={(idx) => engineRef.current?.triggerSkill(idx)}
          onUseQuickPotion={handleUseQuickPotion}
          onRequestPointerLock={() => engineRef.current?.requestPointerLock()}
        />

        {/* Active System Modals */}
        {activeModal === 'cuenta' && (
          <HeroAccountModal
            playerName={playerName}
            raceId={raceId}
            classId={classId}
            difficultyId={difficultyId}
            level={level}
            rebirths={rebirths}
            firebaseUser={firebaseUser}
            cloudSyncBusy={cloudSyncBusy}
            cloudStatusMessage={cloudStatusMessage}
            onChangePlayerName={(name) => {
              setPlayerName(name);
              pushLog(`Nombre del héroe actualizado a "${name}".`, 'info');
            }}
            onSelectRace={(nextRace) => {
              setRaceId(nextRace);
              const def = RACES_CATALOG.find((r) => r.id === nextRace);
              if (def) pushLog(`Raza seleccionada: ${def.name} (Activa [4]: ${def.activeSkill.name}).`, 'info');
            }}
            onSelectClass={(nextClass) => {
              setClassId(nextClass);
              const def = CLASSES_CATALOG.find((c) => c.id === nextClass);
              if (def) pushLog(`Clase seleccionada: ${def.name} (Activa [5]: ${def.activeSkill.name}).`, 'info');
            }}
            onSelectDifficulty={(nextDiff) => {
              setDifficultyId(nextDiff);
              const def = DIFFICULTIES_CATALOG.find((d) => d.id === nextDiff);
              if (def) pushLog(`Dificultad cambiada a ${def.name} (HP ×${def.hpMult}, XP ×${def.xpMult}).`, 'quest');
            }}
            onLinkGoogleAccount={() => void handleLinkGoogleAccount()}
            onSignOut={() => void handleSignOut()}
            onSaveToCloud={() => void handleSaveToCloud()}
            onLoadFromCloud={() => void handleLoadFromCloud()}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'top' && (
          <LeaderboardModal
            firebaseUser={firebaseUser}
            playerName={playerName}
            clanName={clanName}
            clanTag={clanTag}
            clanColor={clanColor}
            titleName={activeTitle?.name}
            raceId={raceId}
            classId={classId}
            difficultyId={difficultyId}
            gold={gold}
            kills={achievementMetrics.totalKills}
            level={level}
            rebirths={rebirths}
            cloudSyncBusy={cloudSyncBusy}
            onLinkGoogleAccount={() => void handleLinkGoogleAccount()}
            onSyncNow={() => void handleSaveToCloud()}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'renacimiento' && (
          <RebirthModal
            level={level}
            rebirths={rebirths}
            inventory={inventory}
            onPerformRebirth={handlePerformRebirth}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'inventario' && (
          <InventoryModal
            gold={gold}
            inventory={inventory}
            equipment={equipment}
            marketState={marketState}
            quests={quests}
            initialMode={inventoryMode}
            onUseOrEquip={handleUseOrEquip}
            onDropItem={(uid) =>
              setInventory((prev) => prev.filter((e) => e.uid !== uid))
            }
            onBuyItem={handleBuyItem}
            onSellItem={handleSellItem}
            onCraftRecipe={handleCraftRecipe}
            onOpenAlchemy={() => setActiveModal('alquimia')}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'personaje' && (
          <CharacterModal
            playerName={playerName}
            raceId={raceId}
            classId={classId}
            difficultyId={difficultyId}
            rebirths={rebirths}
            level={level}
            xp={xp}
            xpToNext={xpToNext}
            hp={hp}
            mana={mana}
            attributePoints={attributePoints}
            talentPoints={talentPoints}
            attributes={attributes}
            stats={stats}
            equipment={equipment}
            inventoryMounts={inventoryMounts}
            talentRanks={talentRanks}
            unlockedTitleIds={unlockedTitleIds}
            selectedTitleId={selectedTitleId}
            onSpendAttribute={handleSpendAttribute}
            onSpendTalent={handleSpendTalent}
            onUnequip={handleUnequip}
            onEquipItemUid={handleUseOrEquip}
            onSelectTitle={(titleId) => {
              setSelectedTitleId(titleId);
              soundEngine.playStudy();
              if (titleId) {
                const def = TITLES_CATALOG.find((t) => t.id === titleId);
                if (def) pushLog(`Título equipado: ${playerName} ${def.name}.`, 'info');
              } else {
                pushLog('Título retirado de tu placa de nombre.', 'info');
              }
            }}
            onChangePlayerName={(name) => {
              setPlayerName(name);
              pushLog(`Nombre de personaje actualizado a "${name}".`, 'info');
            }}
            onChangeDifficulty={(nextDiff) => {
              setDifficultyId(nextDiff);
              const def = DIFFICULTIES_CATALOG.find((d) => d.id === nextDiff);
              if (def) pushLog(`Dificultad cambiada a ${def.name}.`, 'quest');
            }}
            onOpenAccount={() => setActiveModal('cuenta')}
            onOpenRebirth={() => setActiveModal('renacimiento')}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'misiones' && (
          <QuestsModal
            quests={quests}
            discoveredLoreIds={discoveredLoreIds}
            journalEntries={journalEntries}
            onClaimReward={handleClaimQuest}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'bestiario' && (
          <BestiaryModal
            bestiary={bestiary}
            inventory={inventory}
            onAnalyzeSample={handleAnalyzeSampleFromBestiary}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'clan' && (
          <ClanModal
            clanName={clanName}
            clanTag={clanTag}
            clanColor={clanColor}
            members={clanMembers}
            bonuses={clanBonuses}
            onUpdateClanIdentity={handleUpdateClanIdentity}
            onInviteMember={handleInviteClanMember}
            onAssignRole={handleAssignClanRole}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'alquimia' && (
          <AlchemyModal
            inventory={inventory}
            activeBuffs={activeBuffs}
            alchemyDurationMult={clanBonuses.alchemyDurationMult}
            activeAlchemistsCount={clanBonuses.activeAlchemists}
            onBrewFormula={handleBrewAlchemyFormula}
            onUsePotionUid={handleUseOrEquip}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'logros' && (
          <AchievementsModal
            metrics={achievementMetrics}
            unlockedMap={unlockedAchievements}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'modulos' && (
          <ExtensionsModal
            modules={modules}
            onToggleModule={handleToggleModule}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'dialogo' && DIALOGUE_TREES[activeNpcId]?.nodes[dialogueNodeId] && (
          <DialogueModal
            node={DIALOGUE_TREES[activeNpcId].nodes[dialogueNodeId]}
            dayTime={dayTime}
            weather={weather}
            marketHeadline={marketState.headline}
            claimedRewards={claimedDialogueRewards}
            unlockedQuests={unlockedHiddenQuests}
            onSelectChoice={handleSelectDialogueChoice}
            onClose={() => setActiveModal(null)}
          />
        )}

        {/* Respawn Overlay on Defeat */}
        {isDead && (
          <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-[#12141c] border border-rose-500/50 rounded-xl p-6 text-center space-y-4 shadow-2xl">
              <h2 className="font-display text-2xl text-rose-300">Has Caído en Combate</h2>
              <p className="text-sm text-stone-300">
                Tu espíritu regresa al Santuario del Bastión. Conservas tu equipo, nivel y progreso de estudio en el Bestiario.
              </p>
              <button
                onClick={handleRespawn}
                className="px-6 py-2.5 rounded-lg bg-[#b48e4a] hover:bg-[#c8a056] text-[#0b0d12] font-semibold text-sm transition-colors"
              >
                Renacer en el Santuario
              </button>
            </div>
          </div>
        )}
      </div>
    </FirestoreErrorBoundary>
  );
}
