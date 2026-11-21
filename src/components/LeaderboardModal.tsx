import React, { useEffect, useState } from 'react';
import {
  Coins,
  Crown,
  Flame,
  LogIn,
  RefreshCw,
  Skull,
  TrendingUp,
  X,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import { subscribeTopLeaderboard } from '../firebase';
import {
  CLASSES_CATALOG,
  DIFFICULTIES_CATALOG,
  RACES_CATALOG,
} from '../game/data';
import {
  ClassId,
  DifficultyId,
  LeaderboardEntry,
  LeaderboardMetric,
  RaceId,
} from '../game/types';

interface LeaderboardModalProps {
  firebaseUser: User | null;
  playerName: string;
  clanName: string;
  clanTag: string;
  clanColor: string;
  titleName?: string;
  raceId: RaceId;
  classId: ClassId;
  difficultyId: DifficultyId;
  gold: number;
  kills: number;
  level: number;
  rebirths: number;
  cloudSyncBusy: boolean;
  onLinkGoogleAccount: () => void;
  onSyncNow: () => void;
  onClose: () => void;
}

const METRIC_TABS: {
  id: LeaderboardMetric;
  label: string;
  unitLabel: string;
  icon: React.ReactNode;
}[] = [
  { id: 'gold', label: 'Top Dinero', unitLabel: 'Oro', icon: <Coins className="w-3.5 h-3.5 text-amber-300" /> },
  { id: 'kills', label: 'Top Kills', unitLabel: 'Bajas', icon: <Skull className="w-3.5 h-3.5 text-rose-300" /> },
  { id: 'level', label: 'Top Nivel', unitLabel: 'Nivel', icon: <TrendingUp className="w-3.5 h-3.5 text-sky-300" /> },
  { id: 'rebirths', label: 'Top Renacimientos', unitLabel: 'Renac.', icon: <Flame className="w-3.5 h-3.5 text-fuchsia-300" /> },
];

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  firebaseUser,
  playerName,
  clanName,
  clanTag,
  clanColor,
  titleName,
  raceId,
  classId,
  difficultyId,
  gold,
  kills,
  level,
  rebirths,
  cloudSyncBusy,
  onLinkGoogleAccount,
  onSyncNow,
  onClose,
}) => {
  const [metric, setMetric] = useState<LeaderboardMetric>('gold');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseUser) {
      setEntries([]);
      setErrorMsg(null);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    const unsub = subscribeTopLeaderboard(
      metric,
      20,
      (rows) => {
        setEntries(rows);
        setLoading(false);
      },
      (err) => {
        let msg = err.message;
        try {
          const parsed = JSON.parse(err.message) as { error?: string };
          if (parsed.error) msg = parsed.error;
        } catch {
          // ignore
        }
        setErrorMsg(msg);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [firebaseUser, metric]);

  const activeTabInfo = METRIC_TABS.find((t) => t.id === metric) ?? METRIC_TABS[0];

  const getMetricValue = (entry: Pick<LeaderboardEntry, 'gold' | 'kills' | 'level' | 'rebirths'>) => {
    if (metric === 'gold') return entry.gold.toLocaleString('es-ES');
    if (metric === 'kills') return entry.kills.toLocaleString('es-ES');
    if (metric === 'level') return `Nv. ${entry.level}`;
    return `R${entry.rebirths}`;
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-4xl max-h-[88vh] bg-[#0e1118] border border-[#b48e4a]/50 rounded-xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="font-display text-xl text-[#f3e6c8] flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-300" />
              <span>Clasificación Global (Top)</span>
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Rankings en tiempo real del Valle del Velo por Dinero, Kills, Nivel y Renacimientos.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {firebaseUser && (
              <button
                onClick={onSyncNow}
                disabled={cloudSyncBusy}
                className="px-3 py-1.5 rounded-lg bg-[#161c29] hover:bg-[#1f283b] border border-[#b48e4a]/45 text-xs text-amber-200 flex items-center gap-1.5 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${cloudSyncBusy ? 'animate-spin' : ''}`} />
                <span>Actualizar mi marca</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Cerrar Top"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-6 py-3 border-b border-white/10 bg-[#11151f] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {METRIC_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMetric(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  metric === tab.id
                    ? 'bg-[#b48e4a] text-[#0b0d12] font-semibold'
                    : 'bg-[#161a24] text-stone-300 hover:text-white'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Local Player Summary */}
          <div className="text-xs text-stone-300 font-mono-num">
            Tu marca ({activeTabInfo.unitLabel}):{' '}
            <strong className="text-amber-300">
              {getMetricValue({ gold, kills, level, rebirths })}
            </strong>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto rpg-scroll p-6 space-y-4">
          {!firebaseUser ? (
            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-[#131823] border border-sky-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-display text-base text-[#f3e6c8]">
                    Vincula tu cuenta para ver y entrar al Top Global
                  </h3>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    Inicia sesión con Google para consultar la clasificación mundial y publicar tus marcas de Oro, Kills, Nivel y Renacimientos.
                  </p>
                </div>
                <button
                  onClick={onLinkGoogleAccount}
                  disabled={cloudSyncBusy}
                  className="px-4 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-[#071019] text-xs font-bold flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Vincular con Google</span>
                </button>
              </div>

              {/* Local Solo Preview Card */}
              <div className="p-4 rounded-xl bg-[#121620] border border-white/10">
                <div className="text-[11px] text-stone-400 mb-2">Tu progreso local actual</div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="px-1.5 py-0.5 rounded border text-[10px] font-mono-num font-bold"
                        style={{
                          borderColor: `${clanColor}88`,
                          backgroundColor: `${clanColor}22`,
                          color: clanColor,
                        }}
                        title={`Clan: ${clanName}`}
                      >
                        [{clanTag}]
                      </span>
                      <span className="font-display text-sm font-bold text-[#f3e6c8]">
                        {playerName}{' '}
                        {titleName ? (
                          <span className="text-amber-300 font-normal">· {titleName}</span>
                        ) : null}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-400">
                      {clanName} · {RACES_CATALOG.find((r) => r.id === raceId)?.name} ·{' '}
                      {CLASSES_CATALOG.find((c) => c.id === classId)?.name} ·{' '}
                      {DIFFICULTIES_CATALOG.find((d) => d.id === difficultyId)?.name}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 font-mono-num text-xs">
                    <span className="text-amber-300">{gold} Oro</span>
                    <span className="text-rose-300">{kills} Kills</span>
                    <span className="text-sky-300">Nv. {level}</span>
                    <span className="text-fuchsia-300">R{rebirths}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : errorMsg ? (
            <div className="p-4 rounded-xl bg-rose-950/35 border border-rose-500/40 text-xs text-rose-200">
              No se pudo cargar la clasificación: {errorMsg}
            </div>
          ) : loading ? (
            <div className="py-12 text-center text-sm text-stone-400">
              Cargando clasificación en tiempo real...
            </div>
          ) : entries.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-sm text-stone-300">
                Aún no hay héroes registrados en este Top.
              </p>
              <button
                onClick={onSyncNow}
                className="px-4 py-2 rounded-lg bg-[#b48e4a] hover:bg-[#c8a056] text-[#0b0d12] text-xs font-semibold transition-colors"
              >
                Publicar mi puntuación ahora
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry, idx) => {
                const isSelf = entry.uid === firebaseUser.uid;
                const raceDef = RACES_CATALOG.find((r) => r.id === entry.raceId);
                const classDef = CLASSES_CATALOG.find((c) => c.id === entry.classId);
                const diffDef = DIFFICULTIES_CATALOG.find((d) => d.id === entry.difficultyId);

                return (
                  <div
                    key={entry.uid}
                    className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 transition-colors ${
                      isSelf
                        ? 'bg-[#1a2030] border-[#d4af5f]'
                        : 'bg-[#131722] border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono-num text-xs font-bold shrink-0 ${
                          idx === 0
                            ? 'bg-amber-400/20 border border-amber-400 text-amber-300'
                            : idx === 1
                            ? 'bg-slate-300/15 border border-slate-300/60 text-slate-200'
                            : idx === 2
                            ? 'bg-orange-400/15 border border-orange-400/60 text-orange-300'
                            : 'bg-white/5 border border-white/10 text-stone-400'
                        }`}
                      >
                        #{idx + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {entry.clanTag && (
                            <span
                              className="px-1.5 py-0.5 rounded border text-[10px] font-mono-num font-bold shrink-0"
                              style={{
                                borderColor: `${entry.clanColor ?? '#d4af5f'}88`,
                                backgroundColor: `${entry.clanColor ?? '#d4af5f'}22`,
                                color: entry.clanColor ?? '#d4af5f',
                              }}
                              title={entry.clanName ? `Clan: ${entry.clanName}` : undefined}
                            >
                              [{entry.clanTag}]
                            </span>
                          )}
                          <span className="font-display text-sm font-bold text-[#f3e6c8] truncate">
                            {entry.playerName}
                          </span>
                          {entry.titleName && (
                            <span className="text-[11px] text-amber-300 truncate">
                              {entry.titleName}
                            </span>
                          )}
                          {isSelf && (
                            <span className="px-1.5 py-0.5 rounded bg-[#b48e4a]/25 text-[10px] font-semibold text-amber-200">
                              Tú
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-stone-400 truncate">
                          {entry.clanName ? `${entry.clanName} · ` : ''}
                          <span className={raceDef?.colorClass}>{raceDef?.name ?? entry.raceId}</span>
                          {' · '}
                          <span className={classDef?.colorClass}>{classDef?.name ?? entry.classId}</span>
                          {' · '}
                          <span className={diffDef?.colorClass}>{diffDef?.name ?? entry.difficultyId}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 font-mono-num text-xs shrink-0">
                      <div className="hidden sm:flex items-center gap-3 text-[11px] text-stone-400">
                        <span>{entry.gold}o</span>
                        <span>{entry.kills}k</span>
                        <span>Nv.{entry.level}</span>
                        <span>R{entry.rebirths}</span>
                      </div>
                      <div className="px-3 py-1 rounded-lg bg-[#0c0f16] border border-[#b48e4a]/40 text-sm font-bold text-[#f3e6c8]">
                        {getMetricValue(entry)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
