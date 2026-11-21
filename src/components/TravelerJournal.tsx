import React, { useMemo, useState } from 'react';
import { Camera, Compass, Lock, MapPin, Sparkles } from 'lucide-react';
import { JOURNAL_POI_CATALOG } from '../game/data';
import { JournalPoiCategory, JournalPoiDefinition, TravelerJournalEntry } from '../game/types';
import { WEATHER_PRESETS } from '../game/weatherShader';

type JournalFilter = 'todo' | JournalPoiCategory;

interface TravelerJournalProps {
  entries: TravelerJournalEntry[];
  worldRadius: number;
}

export const TravelerJournal: React.FC<TravelerJournalProps> = ({
  entries,
  worldRadius,
}) => {
  const [filter, setFilter] = useState<JournalFilter>('todo');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const entryByPoiId = useMemo(() => {
    const map: Record<string, TravelerJournalEntry> = {};
    entries.forEach((e) => {
      map[e.poiId] = e;
    });
    return map;
  }, [entries]);

  const [selectedPoiId, setSelectedPoiId] = useState<string>(
    entries[entries.length - 1]?.poiId ?? JOURNAL_POI_CATALOG[0]?.id ?? ''
  );

  const totalCount = JOURNAL_POI_CATALOG.length;
  const discoveredCount = entries.length;
  const pct = totalCount > 0 ? Math.round((discoveredCount / totalCount) * 100) : 0;

  const filteredPois = useMemo(
    () =>
      JOURNAL_POI_CATALOG.filter((poi) => filter === 'todo' || poi.category === filter),
    [filter]
  );

  const selectedPoi: JournalPoiDefinition | null =
    filteredPois.find((p) => p.id === selectedPoiId) ??
    JOURNAL_POI_CATALOG.find((p) => p.id === selectedPoiId) ??
    filteredPois[0] ??
    null;

  const activeEntry = selectedPoi ? entryByPoiId[selectedPoi.id] ?? null : null;

  const formatTime = (ts: number) => {
    try {
      return new Date(ts).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '--:--';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Filter Bar & Valley Exploration Progress */}
      <div className="px-6 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {(
            [
              ['todo', 'Todos'],
              ['Zona', 'Zonas'],
              ['Santuario', 'Santuarios'],
              ['Reliquia', 'Reliquias'],
            ] as [JournalFilter, string][]
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

        <div className="flex items-center gap-2.5 min-w-[190px]">
          <span className="font-mono-num text-xs text-stone-300">
            {discoveredCount}/{totalCount}
          </span>
          <div className="flex-1 h-2 bg-black/60 rounded-sm overflow-hidden border border-white/10">
            <div
              className="h-full bg-[#d4af5f] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="font-mono-num text-xs text-amber-300">{pct}%</span>
        </div>
      </div>

      {/* Split Layout: Visual Snapshots Gallery + Field Inspector */}
      <div className="flex-1 overflow-y-auto rpg-scroll p-6 grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Snapshots Gallery */}
        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3 content-start">
          {filteredPois.map((poi) => {
            const captured = entryByPoiId[poi.id];
            const isSelected = selectedPoi?.id === poi.id;
            const imgBroken = !captured?.imageDataUrl || failedImages[poi.id];

            return (
              <button
                key={poi.id}
                onClick={() => setSelectedPoiId(poi.id)}
                className={`text-left rounded-lg border overflow-hidden transition-colors flex flex-col ${
                  isSelected
                    ? 'bg-[#1b202c] border-[#d4af5f]'
                    : captured
                    ? 'bg-[#141821] border-amber-500/30 hover:border-white/30'
                    : 'bg-[#10131a] border-white/10 hover:border-white/20 opacity-80'
                }`}
              >
                {/* 16:9 Thumbnail Viewport */}
                <div className="relative aspect-video w-full bg-[#090b10] border-b border-white/10 overflow-hidden flex items-center justify-center">
                  {captured ? (
                    !imgBroken ? (
                      <img
                        src={captured.imageDataUrl}
                        alt={captured.title}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [poi.id]: true }))
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#192030] via-[#121622] to-[#0a0c12] flex flex-col items-center justify-center gap-1.5 p-3 text-center">
                        <Camera className="w-5 h-5 text-amber-300/80" />
                        <span className="text-[11px] font-medium text-[#f3e6c8] line-clamp-1">
                          {captured.title}
                        </span>
                      </div>
                    )
                  ) : (
                    <div className="w-full h-full bg-gradient-to-b from-[#0d1018] to-[#090b10] flex flex-col items-center justify-center gap-1.5 p-3 text-center">
                      <Lock className="w-4 h-4 text-stone-500" />
                      <span className="text-[10px] text-stone-500">
                        Instantánea sin capturar
                      </span>
                    </div>
                  )}
                </div>

                {/* Metadata Footer (Zero-Pill Clean Typography) */}
                <div className="p-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-semibold truncate ${
                        captured ? 'text-[#f3e6c8]' : 'text-stone-400'
                      }`}
                    >
                      {captured ? captured.title : 'Punto de interés oculto'}
                    </span>
                    {captured ? (
                      <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
                    ) : (
                      <Lock className="w-3 h-3 text-stone-500 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[11px] text-stone-400">
                    <span className="truncate">
                      {poi.category} · {poi.zoneName}
                    </span>
                    {captured && (
                      <span className="font-mono-num text-[10px] text-stone-400 shrink-0">
                        ({captured.x}, {captured.z})
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Detailed Visual Field Record */}
        <div className="md:col-span-5 bg-[#131720] border border-[#b48e4a]/30 rounded-lg p-5 flex flex-col justify-between gap-4 self-start">
          {selectedPoi ? (
            activeEntry ? (
              <>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-amber-300/90 font-medium">
                      {activeEntry.category} · {activeEntry.zoneName}
                    </div>
                    <h3 className="font-display text-lg text-[#f3e6c8] mt-1">
                      {activeEntry.title}
                    </h3>
                  </div>

                  {/* Full Snapshot View */}
                  <div className="aspect-video w-full rounded-md overflow-hidden border border-white/15 bg-[#090b10] flex items-center justify-center">
                    {activeEntry.imageDataUrl && !failedImages[activeEntry.poiId] ? (
                      <img
                        src={activeEntry.imageDataUrl}
                        alt={`Instantánea de ${activeEntry.title}`}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImages((prev) => ({
                            ...prev,
                            [activeEntry.poiId]: true,
                          }))
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#1a2234] to-[#0b0d14] flex flex-col items-center justify-center gap-2 p-4 text-center">
                        <Camera className="w-6 h-6 text-amber-300" />
                        <span className="text-xs text-[#f3e6c8]">
                          {activeEntry.title}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Field Note */}
                  <p className="text-sm text-stone-200 leading-relaxed">
                    {activeEntry.fieldNote}
                  </p>

                  {/* Valley Radar Pin Locator */}
                  <div className="p-3 rounded-md bg-[#0d1017] border border-white/10 flex items-center gap-3">
                    <ValleyPinLocator
                      targetX={activeEntry.x}
                      targetZ={activeEntry.z}
                      allCaptured={entries}
                      worldRadius={worldRadius}
                    />
                    <div className="space-y-1 text-xs min-w-0">
                      <div className="text-stone-300 font-medium flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                        <span className="truncate">Posición en el Valle</span>
                      </div>
                      <div className="font-mono-num text-[11px] text-stone-400">
                        Coords: X {activeEntry.x} · Z {activeEntry.z}
                      </div>
                      <div className="text-[11px] text-stone-400">
                        Clima: {WEATHER_PRESETS[activeEntry.weather]?.label ?? activeEntry.weather}
                      </div>
                      <div className="font-mono-num text-[11px] text-stone-400">
                        Registrado: {formatTime(activeEntry.capturedAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 px-3 text-center space-y-3">
                <div className="w-11 h-11 rounded-lg bg-[#191e2a] border border-white/10 flex items-center justify-center mx-auto text-stone-400">
                  <Compass className="w-5 h-5" />
                </div>
                <div className="text-xs uppercase tracking-wider text-stone-400">
                  {selectedPoi.category} · {selectedPoi.zoneName}
                </div>
                <h3 className="font-display text-lg text-stone-200">
                  Área Sin Cartografiar
                </h3>
                <p className="text-sm text-stone-300 leading-relaxed">
                  {selectedPoi.discoveryHint}
                </p>
                <div className="text-xs text-stone-400">
                  La cámara del diario tomará una instantánea automática al descubrir este punto de interés.
                </div>
              </div>
            )
          ) : (
            <div className="text-sm text-stone-400 text-center py-8">
              Explora el valle para capturar instantáneas en tu Diario de Viajero.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ValleyPinLocator: React.FC<{
  targetX: number;
  targetZ: number;
  allCaptured: TravelerJournalEntry[];
  worldRadius: number;
}> = ({ targetX, targetZ, allCaptured, worldRadius }) => {
  const toSvg = (val: number) => 40 + (val / worldRadius) * 32;
  const cx = Math.max(8, Math.min(72, toSvg(targetX)));
  const cy = Math.max(8, Math.min(72, toSvg(targetZ)));

  return (
    <svg
      viewBox="0 0 80 80"
      className="w-16 h-16 shrink-0 rounded bg-[#080a0f] border border-[#b48e4a]/35"
      aria-label="Ubicación en el mapa del valle"
    >
      <circle
        cx="40"
        cy="40"
        r="34"
        fill="none"
        stroke="rgba(180,142,74,0.28)"
        strokeWidth="1"
      />
      <line x1="40" y1="6" x2="40" y2="74" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <line x1="6" y1="40" x2="74" y2="40" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      {allCaptured.map((e) => (
        <circle
          key={e.poiId}
          cx={Math.max(8, Math.min(72, toSvg(e.x)))}
          cy={Math.max(8, Math.min(72, toSvg(e.z)))}
          r="2"
          fill="rgba(148,163,184,0.55)"
        />
      ))}
      <circle
        cx={cx}
        cy={cy}
        r="5.5"
        fill="none"
        stroke="#fbbf24"
        strokeWidth="1.2"
        strokeOpacity="0.6"
      />
      <circle cx={cx} cy={cy} r="2.6" fill="#fbbf24" />
    </svg>
  );
};
