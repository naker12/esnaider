import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { getClanBadgeInfo } from './game/data';
import {
  ChatChannel,
  ChatMessage,
  ClassId,
  CloudPlayerProfile,
  DifficultyId,
  DragonHeartId,
  LeaderboardEntry,
  LeaderboardMetric,
  OnlinePlayerState,
  RaceId,
  WorldMapId,
} from './game/types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

let connectionTested = false;
export async function testConnection(): Promise<void> {
  if (connectionTested) return;
  connectionTested = true;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

export { onAuthStateChanged };
export type { User };

export async function signInWithGoogleAccount(): Promise<User> {
  const res = await signInWithPopup(auth, googleProvider);
  return res.user;
}

export async function signOutAccount(): Promise<void> {
  await setPlayerOffline().catch(() => {});
  await signOut(auth);
}

// Payload sanitization aligned strictly with firebase-blueprint.json constraints
const VALID_ID_REGEX = /^[a-zA-Z0-9_-]+$/;
const VALID_RACES: RaceId[] = ['humano', 'elfo', 'enano', 'draconido', 'espectro_raza'];
const VALID_CLASSES: ClassId[] = [
  'caballero_runico',
  'piromago',
  'asesino_sombras',
  'paladin_solar',
  'cazador_dragones',
];
const VALID_DIFFICULTIES: DifficultyId[] = ['normal', 'dificil', 'pesadilla', 'abismal', 'infierno'];
const VALID_MAPS: WorldMapId[] = ['plaza', 'templo'];

export function sanitizePlayerName(raw: string): string {
  const trimmed = raw.trim().slice(0, 24);
  return trimmed.length > 0 ? trimmed : 'Vaelen';
}

function clampInt(n: number, min: number, max: number): number {
  const parsed = Math.floor(Number.isFinite(n) ? n : min);
  return Math.max(min, Math.min(max, parsed));
}

function clampCoord(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Number(Math.max(-290, Math.min(290, n)).toFixed(2));
}

function clampYaw(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Number(Math.max(-99, Math.min(99, n)).toFixed(3));
}

function sanitizeHeartsMap(
  raw: Record<DragonHeartId, number>
): Record<DragonHeartId, number> {
  return {
    corazon_dragon_rojo: clampInt(raw.corazon_dragon_rojo ?? 0, 0, 99999),
    corazon_dragon_negro: clampInt(raw.corazon_dragon_negro ?? 0, 0, 99999),
    corazon_dragon_verde: clampInt(raw.corazon_dragon_verde ?? 0, 0, 99999),
    corazon_dragon_celeste: clampInt(raw.corazon_dragon_celeste ?? 0, 0, 99999),
    corazon_dragon_amarillo: clampInt(raw.corazon_dragon_amarillo ?? 0, 0, 99999),
  };
}

export async function loadCloudPlayerProfile(uid: string): Promise<CloudPlayerProfile | null> {
  if (!uid || !VALID_ID_REGEX.test(uid)) return null;
  const path = `players/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'players', uid));
    if (!snap.exists()) return null;
    const d = snap.data();
    const clanBadge =
      typeof d.clanName === 'string' && d.clanName.trim().length > 0
        ? getClanBadgeInfo(
            d.clanName,
            typeof d.clanTag === 'string' ? d.clanTag : undefined,
            typeof d.clanColor === 'string' ? d.clanColor : undefined
          )
        : undefined;
    return {
      uid: String(d.uid),
      playerName: sanitizePlayerName(String(d.playerName ?? 'Vaelen')),
      clanName: clanBadge?.clanName,
      clanTag: clanBadge?.clanTag,
      clanColor: clanBadge?.clanColor,
      raceId: VALID_RACES.includes(d.raceId) ? d.raceId : 'humano',
      classId: VALID_CLASSES.includes(d.classId) ? d.classId : 'caballero_runico',
      difficultyId: VALID_DIFFICULTIES.includes(d.difficultyId) ? d.difficultyId : 'normal',
      selectedTitleId: typeof d.selectedTitleId === 'string' ? d.selectedTitleId.slice(0, 64) : undefined,
      level: clampInt(Number(d.level ?? 1), 1, 9999),
      xp: clampInt(Number(d.xp ?? 0), 0, 1000000000),
      gold: clampInt(Number(d.gold ?? 0), 0, 1000000000),
      kills: clampInt(Number(d.kills ?? 0), 0, 1000000000),
      rebirths: clampInt(Number(d.rebirths ?? 0), 0, 10000),
      attributePoints: clampInt(Number(d.attributePoints ?? 0), 0, 500000),
      talentPoints: clampInt(Number(d.talentPoints ?? 0), 0, 50000),
      attributes: {
        fuerza: clampInt(Number(d.attributes?.fuerza ?? 8), 1, 100000),
        agilidad: clampInt(Number(d.attributes?.agilidad ?? 7), 1, 100000),
        vitalidad: clampInt(Number(d.attributes?.vitalidad ?? 8), 1, 100000),
        inteligencia: clampInt(Number(d.attributes?.inteligencia ?? 6), 1, 100000),
        suerte: clampInt(Number(d.attributes?.suerte ?? 5), 1, 100000),
      },
      dragonHearts: sanitizeHeartsMap(d.dragonHearts ?? {}),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveCloudPlayerProfile(
  profile: Omit<CloudPlayerProfile, 'uid'>,
  titleName?: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !VALID_ID_REGEX.test(user.uid)) return;

  const uid = user.uid;
  const playerPath = `players/${uid}`;
  const leaderboardPath = `leaderboard/${uid}`;

  const cleanName = sanitizePlayerName(profile.playerName);
  const clanBadge = getClanBadgeInfo(
    profile.clanName ?? 'Guardia del Bastión',
    profile.clanTag,
    profile.clanColor
  );
  const cleanRace = VALID_RACES.includes(profile.raceId) ? profile.raceId : 'humano';
  const cleanClass = VALID_CLASSES.includes(profile.classId) ? profile.classId : 'caballero_runico';
  const cleanDifficulty = VALID_DIFFICULTIES.includes(profile.difficultyId)
    ? profile.difficultyId
    : 'normal';
  const cleanLevel = clampInt(profile.level, 1, 9999);
  const cleanXp = clampInt(profile.xp, 0, 1000000000);
  const cleanGold = clampInt(profile.gold, 0, 1000000000);
  const cleanKills = clampInt(profile.kills, 0, 1000000000);
  const cleanRebirths = clampInt(profile.rebirths, 0, 10000);

  // 1. Save private owner profile
  try {
    const existingSnap = await getDoc(doc(db, 'players', uid));
    const existingCreatedAt = existingSnap.exists() ? existingSnap.data()?.createdAt : null;

    const payload: Record<string, unknown> = {
      uid,
      playerName: cleanName,
      clanName: clanBadge.clanName,
      clanTag: clanBadge.clanTag,
      clanColor: clanBadge.clanColor,
      raceId: cleanRace,
      classId: cleanClass,
      difficultyId: cleanDifficulty,
      level: cleanLevel,
      xp: cleanXp,
      gold: cleanGold,
      kills: cleanKills,
      rebirths: cleanRebirths,
      attributePoints: clampInt(profile.attributePoints, 0, 500000),
      talentPoints: clampInt(profile.talentPoints, 0, 50000),
      attributes: {
        fuerza: clampInt(profile.attributes.fuerza, 1, 100000),
        agilidad: clampInt(profile.attributes.agilidad, 1, 100000),
        vitalidad: clampInt(profile.attributes.vitalidad, 1, 100000),
        inteligencia: clampInt(profile.attributes.inteligencia, 1, 100000),
        suerte: clampInt(profile.attributes.suerte, 1, 100000),
      },
      dragonHearts: sanitizeHeartsMap(profile.dragonHearts),
      createdAt: existingCreatedAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (profile.selectedTitleId) {
      payload.selectedTitleId = profile.selectedTitleId.slice(0, 64);
    }

    await setDoc(doc(db, 'players', uid), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, playerPath);
  }

  // 2. Publish public non-PII leaderboard entry
  try {
    const existingLbSnap = await getDoc(doc(db, 'leaderboard', uid));
    const existingLbCreatedAt = existingLbSnap.exists() ? existingLbSnap.data()?.createdAt : null;

    const lbPayload: Record<string, unknown> = {
      uid,
      playerName: cleanName,
      clanName: clanBadge.clanName,
      clanTag: clanBadge.clanTag,
      clanColor: clanBadge.clanColor,
      raceId: cleanRace,
      classId: cleanClass,
      difficultyId: cleanDifficulty,
      gold: cleanGold,
      kills: cleanKills,
      level: cleanLevel,
      rebirths: cleanRebirths,
      createdAt: existingLbCreatedAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (titleName && titleName.trim().length > 0) {
      lbPayload.titleName = titleName.trim().slice(0, 48);
    }

    await setDoc(doc(db, 'leaderboard', uid), lbPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, leaderboardPath);
  }
}

export function subscribeTopLeaderboard(
  metric: LeaderboardMetric,
  maxRows: number,
  onData: (entries: LeaderboardEntry[]) => void,
  onError: (err: Error) => void
): () => void {
  if (!auth.currentUser) {
    onData([]);
    return () => {};
  }

  const minFloor = metric === 'level' ? 1 : 0;
  const q = query(
    collection(db, 'leaderboard'),
    where(metric, '>=', minFloor),
    orderBy(metric, 'desc'),
    limit(maxRows)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const rows: LeaderboardEntry[] = snapshot.docs.map((d) => {
        const data = d.data();
        const ts = data.updatedAt as Timestamp | undefined;
        const badge =
          typeof data.clanName === 'string' && data.clanName.trim().length > 0
            ? getClanBadgeInfo(
                data.clanName,
                typeof data.clanTag === 'string' ? data.clanTag : undefined,
                typeof data.clanColor === 'string' ? data.clanColor : undefined
              )
            : undefined;
        return {
          uid: String(data.uid ?? d.id),
          playerName: String(data.playerName ?? 'Aventurero'),
          clanName: badge?.clanName,
          clanTag: badge?.clanTag,
          clanColor: badge?.clanColor,
          titleName: typeof data.titleName === 'string' ? data.titleName : undefined,
          raceId: VALID_RACES.includes(data.raceId) ? data.raceId : 'humano',
          classId: VALID_CLASSES.includes(data.classId) ? data.classId : 'caballero_runico',
          difficultyId: VALID_DIFFICULTIES.includes(data.difficultyId)
            ? data.difficultyId
            : 'normal',
          gold: Number(data.gold ?? 0),
          kills: Number(data.kills ?? 0),
          level: Number(data.level ?? 1),
          rebirths: Number(data.rebirths ?? 0),
          updatedAtMs: ts && typeof ts.toMillis === 'function' ? ts.toMillis() : undefined,
        };
      });
      onData(rows);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, `leaderboard?sort=${metric}`);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

// ============================================================
// Online Multiplayer Presence & 3D Transform Sync
// ============================================================

let lastPresenceSnapshot: Omit<OnlinePlayerState, 'uid' | 'isOnline' | 'updatedAtMs'> | null = null;

export async function publishOnlinePresence(
  state: Omit<OnlinePlayerState, 'uid' | 'isOnline' | 'updatedAtMs'>
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !VALID_ID_REGEX.test(user.uid)) return;

  lastPresenceSnapshot = state;
  const uid = user.uid;
  const path = `online_players/${uid}`;
  const clanBadge = getClanBadgeInfo(state.clanName, state.clanTag, state.clanColor);

  const payload: Record<string, unknown> = {
    uid,
    playerName: sanitizePlayerName(state.playerName),
    clanName: clanBadge.clanName,
    clanTag: clanBadge.clanTag,
    clanColor: clanBadge.clanColor,
    raceId: VALID_RACES.includes(state.raceId) ? state.raceId : 'humano',
    classId: VALID_CLASSES.includes(state.classId) ? state.classId : 'caballero_runico',
    level: clampInt(state.level, 1, 9999),
    rebirths: clampInt(state.rebirths, 0, 10000),
    mapId: VALID_MAPS.includes(state.mapId) ? state.mapId : 'plaza',
    x: clampCoord(state.x),
    z: clampCoord(state.z),
    yaw: clampYaw(state.yaw),
    isMoving: Boolean(state.isMoving),
    isOnline: true,
    updatedAt: serverTimestamp(),
  };

  if (state.titleName && state.titleName.trim().length > 0) {
    payload.titleName = state.titleName.trim().slice(0, 48);
  }

  try {
    await setDoc(doc(db, 'online_players', uid), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function setPlayerOffline(): Promise<void> {
  const user = auth.currentUser;
  if (!user || !VALID_ID_REGEX.test(user.uid) || !lastPresenceSnapshot) return;

  const uid = user.uid;
  const path = `online_players/${uid}`;
  const clanBadge = getClanBadgeInfo(
    lastPresenceSnapshot.clanName,
    lastPresenceSnapshot.clanTag,
    lastPresenceSnapshot.clanColor
  );

  const payload: Record<string, unknown> = {
    uid,
    playerName: sanitizePlayerName(lastPresenceSnapshot.playerName),
    clanName: clanBadge.clanName,
    clanTag: clanBadge.clanTag,
    clanColor: clanBadge.clanColor,
    raceId: VALID_RACES.includes(lastPresenceSnapshot.raceId)
      ? lastPresenceSnapshot.raceId
      : 'humano',
    classId: VALID_CLASSES.includes(lastPresenceSnapshot.classId)
      ? lastPresenceSnapshot.classId
      : 'caballero_runico',
    level: clampInt(lastPresenceSnapshot.level, 1, 9999),
    rebirths: clampInt(lastPresenceSnapshot.rebirths, 0, 10000),
    mapId: VALID_MAPS.includes(lastPresenceSnapshot.mapId)
      ? lastPresenceSnapshot.mapId
      : 'plaza',
    x: clampCoord(lastPresenceSnapshot.x),
    z: clampCoord(lastPresenceSnapshot.z),
    yaw: clampYaw(lastPresenceSnapshot.yaw),
    isMoving: false,
    isOnline: false,
    updatedAt: serverTimestamp(),
  };
  if (lastPresenceSnapshot.titleName && lastPresenceSnapshot.titleName.trim().length > 0) {
    payload.titleName = lastPresenceSnapshot.titleName.trim().slice(0, 48);
  }

  try {
    await setDoc(doc(db, 'online_players', uid), payload);
  } catch {
    // Ignore transient network errors during unload/sign-out
  }
}

export function subscribeOnlinePlayers(
  onData: (players: OnlinePlayerState[]) => void,
  onError: (err: Error) => void
): () => void {
  if (!auth.currentUser) {
    onData([]);
    return () => {};
  }

  const q = query(
    collection(db, 'online_players'),
    where('isOnline', '==', true),
    limit(60)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const now = Date.now();
      const players: OnlinePlayerState[] = [];
      for (const d of snapshot.docs) {
        const data = d.data();
        const ts = data.updatedAt as Timestamp | undefined;
        const updatedAtMs = ts && typeof ts.toMillis === 'function' ? ts.toMillis() : now;
        // Filter out stale sessions inactive > 90 seconds
        if (now - updatedAtMs > 90_000) continue;
        const badge = getClanBadgeInfo(
          String(data.clanName ?? 'Guardia del Bastión'),
          typeof data.clanTag === 'string' ? data.clanTag : undefined,
          typeof data.clanColor === 'string' ? data.clanColor : undefined
        );
        players.push({
          uid: String(data.uid ?? d.id),
          playerName: sanitizePlayerName(String(data.playerName ?? 'Aventurero')),
          clanName: badge.clanName,
          clanTag: badge.clanTag,
          clanColor: badge.clanColor,
          raceId: VALID_RACES.includes(data.raceId) ? data.raceId : 'humano',
          classId: VALID_CLASSES.includes(data.classId) ? data.classId : 'caballero_runico',
          level: clampInt(Number(data.level ?? 1), 1, 9999),
          rebirths: clampInt(Number(data.rebirths ?? 0), 0, 10000),
          titleName: typeof data.titleName === 'string' ? data.titleName : undefined,
          mapId: VALID_MAPS.includes(data.mapId) ? data.mapId : 'plaza',
          x: Number(data.x ?? 0),
          z: Number(data.z ?? 0),
          yaw: Number(data.yaw ?? 0),
          isMoving: Boolean(data.isMoving),
          isOnline: Boolean(data.isOnline),
          updatedAtMs,
        });
      }
      onData(players);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'online_players');
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

// ============================================================
// Real-Time Multiplayer Chat (Global & Clan)
// ============================================================

export async function sendChatMessage(input: {
  playerName: string;
  clanName: string;
  clanTag: string;
  clanColor: string;
  channel: ChatChannel;
  mapId: WorldMapId;
  text: string;
}): Promise<void> {
  const user = auth.currentUser;
  if (!user || !VALID_ID_REGEX.test(user.uid)) {
    throw new Error('Debes vincular tu cuenta Google para chatear en línea.');
  }

  const cleanText = input.text.trim().slice(0, 240);
  if (!cleanText) return;

  const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const path = `chat_messages/${messageId}`;
  const clanBadge = getClanBadgeInfo(input.clanName, input.clanTag, input.clanColor);

  const payload = {
    id: messageId,
    uid: user.uid,
    playerName: sanitizePlayerName(input.playerName),
    clanName: clanBadge.clanName,
    clanTag: clanBadge.clanTag,
    clanColor: clanBadge.clanColor,
    channel: input.channel === 'clan' ? 'clan' : 'global',
    mapId: VALID_MAPS.includes(input.mapId) ? input.mapId : 'plaza',
    text: cleanText,
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'chat_messages', messageId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeChatMessages(
  maxMessages: number,
  onData: (messages: ChatMessage[]) => void,
  onError: (err: Error) => void
): () => void {
  if (!auth.currentUser) {
    onData([]);
    return () => {};
  }

  const q = query(
    collection(db, 'chat_messages'),
    where('channel', 'in', ['global', 'clan']),
    orderBy('createdAt', 'desc'),
    limit(maxMessages)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const msgs: ChatMessage[] = snapshot.docs.map((d) => {
        const data = d.data();
        const ts = data.createdAt as Timestamp | undefined;
        const badge = getClanBadgeInfo(
          String(data.clanName ?? 'Guardia del Bastión'),
          typeof data.clanTag === 'string' ? data.clanTag : undefined,
          typeof data.clanColor === 'string' ? data.clanColor : undefined
        );
        return {
          id: String(data.id ?? d.id),
          uid: String(data.uid ?? ''),
          playerName: sanitizePlayerName(String(data.playerName ?? 'Aventurero')),
          clanName: badge.clanName,
          clanTag: badge.clanTag,
          clanColor: badge.clanColor,
          channel: data.channel === 'clan' ? 'clan' : 'global',
          mapId: VALID_MAPS.includes(data.mapId) ? data.mapId : 'plaza',
          text: String(data.text ?? ''),
          createdAtMs: ts && typeof ts.toMillis === 'function' ? ts.toMillis() : Date.now(),
        };
      });
      msgs.reverse();
      onData(msgs);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'chat_messages');
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}
