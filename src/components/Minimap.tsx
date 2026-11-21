import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Compass, Lock, Sparkles } from 'lucide-react';
import { CHUNK_SIZE } from '../game/chunks';
import { FastTravelShrineInfo, MinimapSnapshot } from '../game/types';

interface MinimapProps {
  snapshot: MinimapSnapshot;
  fastTravelOpen: boolean;
  onToggleFastTravel: () => void;
  onTeleportShrine: (shrineId: string) => void;
}

interface RadarHitTarget {
  shrine: FastTravelShrineInfo;
  x: number;
  y: number;
  isEdge: boolean;
}

const MAP_SIZE = 164;
const MAP_CENTER = MAP_SIZE / 2;
const MAP_SCALE = 2.0; // pixels per world meter

export const Minimap: React.FC<MinimapProps> = ({
  snapshot,
  fastTravelOpen,
  onToggleFastTravel,
  onTeleportShrine,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hitTargetsRef = useRef<RadarHitTarget[]>([]);
  const [hoveredShrine, setHoveredShrine] = useState<FastTravelShrineInfo | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = MAP_SIZE;
    const cx = MAP_CENTER;
    const cy = MAP_CENTER;
    const scale = MAP_SCALE;

    ctx.clearRect(0, 0, size, size);

    // Circular radar mask
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 3, 0, Math.PI * 2);
    ctx.clip();

    // Base dark map surface
    ctx.fillStyle = '#0c1018';
    ctx.fillRect(0, 0, size, size);

    // Subtle grid lines anchored to world coordinates
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.lineWidth = 1;
    const gridStep = 10 * scale;
    const offX = ((-snapshot.playerX * scale) % gridStep + gridStep) % gridStep;
    const offY = ((-snapshot.playerZ * scale) % gridStep + gridStep) % gridStep;
    for (let x = offX; x < size; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
    for (let y = offY; y < size; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }

    // Minecraft-style world chunk borders (32m sectors centered on 0,0)
    const chunkStep = CHUNK_SIZE * scale;
    const chunkHalf = CHUNK_SIZE * 0.5;
    const cOffX = (((chunkHalf - snapshot.playerX) * scale) % chunkStep + chunkStep) % chunkStep;
    const cOffY = (((chunkHalf - snapshot.playerZ) * scale) % chunkStep + chunkStep) % chunkStep;
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    for (let x = cOffX; x < size; x += chunkStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
    for (let y = cOffY; y < size; y += chunkStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }
    ctx.restore();

    // Sanctuary ring
    const sancX = cx + (0 - snapshot.playerX) * scale;
    const sancY = cy + (0 - snapshot.playerZ) * scale;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.24)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(sancX, sancY, 11 * scale, 0, Math.PI * 2);
    ctx.stroke();

    // World boundary circle
    ctx.strokeStyle = 'rgba(212, 164, 74, 0.32)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sancX, sancY, snapshot.worldRadius * scale, 0, Math.PI * 2);
    ctx.stroke();

    // Pillars / Obstacles
    ctx.fillStyle = '#475569';
    for (const p of snapshot.pillars) {
      const px = cx + (p.x - snapshot.playerX) * scale;
      const py = cy + (p.z - snapshot.playerZ) * scale;
      ctx.beginPath();
      ctx.arc(px, py, Math.max(2.2, p.r * scale), 0, Math.PI * 2);
      ctx.fill();
    }

    // Non-shrine Entities
    for (const ent of snapshot.entities) {
      if (ent.kind === 'shrine') continue;
      const ex = cx + (ent.x - snapshot.playerX) * scale;
      const ey = cy + (ent.z - snapshot.playerZ) * scale;

      if (ent.kind === 'npc') {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(ex, ey, 3.8, 0, Math.PI * 2);
        ctx.fill();
      } else if (ent.kind === 'portal') {
        ctx.save();
        ctx.strokeStyle = '#e879f9';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(ex, ey, 6.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.moveTo(ex, ey - 4.2);
        ctx.lineTo(ex + 4.2, ey);
        ctx.lineTo(ex, ey + 4.2);
        ctx.lineTo(ex - 4.2, ey);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (ent.kind === 'remote_player') {
        ctx.fillStyle = ent.colorHex ?? '#38bdf8';
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(ex, ey, 3.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (ent.kind === 'chest') {
        ctx.fillStyle = '#eab308';
        ctx.fillRect(ex - 2.5, ey - 2.5, 5, 5);
      } else if (ent.kind === 'lore') {
        ctx.fillStyle = ent.discovered ? '#34d399' : '#fbbf24';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1;
        ctx.fillRect(ex - 2.5, ey - 3, 5, 6);
        ctx.strokeRect(ex - 2.5, ey - 3, 5, 6);
      } else if (ent.kind === 'door') {
        ctx.fillStyle = '#d4af5f';
        ctx.fillRect(ex - 5, ey - 1.5, 10, 3);
      } else if (ent.kind === 'clan_npc') {
        ctx.fillStyle = ent.discovered ? '#22d3ee' : '#38bdf8';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ex, ey, 3.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (ent.kind === 'herb') {
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.arc(ex, ey, 2.3, 0, Math.PI * 2);
        ctx.fill();
      } else if (ent.kind === 'boss') {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(ex, ey, 4.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fecaca';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.fillStyle = '#f87171';
        ctx.beginPath();
        ctx.arc(ex, ey, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Player FOV cone (camera faces -Z when yaw=0, +yaw rotates left)
    const lookAngle = -snapshot.playerYaw - Math.PI / 2;
    ctx.fillStyle = 'rgba(236, 230, 216, 0.14)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, 26, lookAngle - 0.55, lookAngle + 0.55);
    ctx.closePath();
    ctx.fill();

    // Fast-Travel Shrine markers (drawn inside radar, plus edge beacons for distant discovered shrines)
    const hitTargets: RadarHitTarget[] = [];
    const maxRadarRadius = cx - 10;

    for (const shrine of snapshot.shrines) {
      const rawDx = (shrine.x - snapshot.playerX) * scale;
      const rawDy = (shrine.z - snapshot.playerZ) * scale;
      const dist = Math.hypot(rawDx, rawDy);
      const isEdge = dist > maxRadarRadius;

      let sx = cx + rawDx;
      let sy = cy + rawDy;
      if (isEdge && shrine.discovered) {
        const ratio = maxRadarRadius / dist;
        sx = cx + rawDx * ratio;
        sy = cy + rawDy * ratio;
      }

      if (!isEdge || shrine.discovered) {
        if (shrine.discovered) {
          const isHovered = hoveredShrine?.id === shrine.id;
          // Outer teleport halo
          ctx.strokeStyle = isHovered
            ? 'rgba(250, 204, 21, 0.95)'
            : 'rgba(56, 189, 248, 0.72)';
          ctx.lineWidth = isHovered ? 1.8 : 1.2;
          ctx.beginPath();
          ctx.arc(sx, sy, isHovered ? 7.5 : 6.2, 0, Math.PI * 2);
          ctx.stroke();

          // Diamond beacon
          ctx.fillStyle = isHovered ? '#fde047' : '#38bdf8';
          ctx.beginPath();
          ctx.moveTo(sx, sy - 4.8);
          ctx.lineTo(sx + 4.8, sy);
          ctx.lineTo(sx, sy + 4.8);
          ctx.lineTo(sx - 4.8, sy);
          ctx.closePath();
          ctx.fill();

          // Bright white core
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
          ctx.fill();

          hitTargets.push({ shrine, x: sx, y: sy, isEdge });
        } else {
          // Dormant undiscovered shrine diamond outline
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(sx, sy - 4);
          ctx.lineTo(sx + 4, sy);
          ctx.lineTo(sx, sy + 4);
          ctx.lineTo(sx - 4, sy);
          ctx.closePath();
          ctx.stroke();
        }
      }
    }
    hitTargetsRef.current = hitTargets;

    // Player direction arrow
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(lookAngle + Math.PI / 2);
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4.5, 5);
    ctx.lineTo(0, 2.5);
    ctx.lineTo(-4.5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore();

    // Outer bronze border
    ctx.strokeStyle = 'rgba(197, 147, 56, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
    ctx.stroke();
  }, [hoveredShrine, snapshot]);

  const findShrineAtPoint = (clientX: number, clientY: number): FastTravelShrineInfo | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * MAP_SIZE;
    const y = ((clientY - rect.top) / rect.height) * MAP_SIZE;

    let closest: FastTravelShrineInfo | null = null;
    let minD = 12;
    for (const target of hitTargetsRef.current) {
      const d = Math.hypot(x - target.x, y - target.y);
      if (d <= minD) {
        minD = d;
        closest = target.shrine;
      }
    }
    return closest;
  };

  const discoveredCount = snapshot.shrines.filter((s) => s.discovered).length;
  const totalCount = snapshot.shrines.length;

  return (
    <div className="flex flex-col items-end gap-1.5 pointer-events-auto">
      <div className="w-[196px] bg-[#0c0e14]/92 border border-[#b48e4a]/45 rounded-lg p-2.5 flex flex-col items-center gap-1.5 shadow-lg">
        <div className="relative w-[164px] h-[164px]">
          <canvas
            ref={canvasRef}
            width={MAP_SIZE}
            height={MAP_SIZE}
            onMouseMove={(e) => setHoveredShrine(findShrineAtPoint(e.clientX, e.clientY))}
            onMouseLeave={() => setHoveredShrine(null)}
            onClick={(e) => {
              const hit = findShrineAtPoint(e.clientX, e.clientY);
              if (hit) {
                onTeleportShrine(hit.id);
              }
            }}
            className={`block w-full h-full ${hoveredShrine ? 'cursor-pointer' : 'cursor-default'}`}
            title={
              hoveredShrine
                ? `Teletransportar a ${hoveredShrine.name}`
                : 'Haz clic en un Santuario azul para viajar rápido'
            }
          />
          <span className="pointer-events-none absolute top-0.5 left-1/2 -translate-x-1/2 text-[10px] font-mono-num font-bold text-[#d4af5f]">
            N
          </span>
          <span className="pointer-events-none absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[10px] font-mono-num text-stone-400">
            S
          </span>
          <span className="pointer-events-none absolute left-1 top-1/2 -translate-y-1/2 text-[10px] font-mono-num text-stone-400">
            O
          </span>
          <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] font-mono-num text-stone-400">
            E
          </span>
        </div>

        {hoveredShrine ? (
          <div className="w-full px-2 py-1 rounded bg-sky-950/90 border border-sky-400/50 text-[11px] text-sky-200 text-center truncate">
            Viajar a {hoveredShrine.name}
          </div>
        ) : (
          <div className="w-full space-y-1">
            <div className="w-full flex items-center justify-between text-[11px] text-stone-300 px-1 gap-2">
              <span className="truncate font-medium text-[#ece6d8]">{snapshot.zoneName}</span>
              <span className="font-mono-num text-stone-400 shrink-0">
                {Math.round(snapshot.playerX)},{Math.round(snapshot.playerZ)}
              </span>
            </div>
            <div className="w-full flex items-center justify-between px-1 text-[10px]">
              <span
                className={`px-1.5 py-0.5 rounded border font-semibold ${
                  snapshot.isSafeZone
                    ? 'bg-emerald-950/70 border-emerald-500/45 text-emerald-300'
                    : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                }`}
              >
                {snapshot.isSafeZone ? 'Zona Segura' : 'Zona Hostil'}
              </span>
              <span className="text-stone-400 font-mono-num">
                {snapshot.mapId === 'plaza' ? 'Mapa: Plaza' : 'Mapa: Templo'}
              </span>
            </div>
          </div>
        )}

        <div className="w-full flex items-center justify-between text-[10px] text-stone-400 px-1 border-t border-white/10 pt-1">
          <span className="text-fuchsia-300">Portal</span>
          <span aria-hidden="true">·</span>
          <span className="text-sky-300">Jugadores</span>
          <span aria-hidden="true">·</span>
          <span className="text-red-400">Enemigos</span>
        </div>

        {/* Fast Travel Waypoints Toggle */}
        <button
          onClick={onToggleFastTravel}
          className="w-full px-2.5 py-1.5 rounded-md bg-[#141822] hover:bg-[#1a2030] border border-sky-500/35 hover:border-sky-400/70 text-[11px] text-sky-200 flex items-center justify-between gap-1.5 transition-colors whitespace-nowrap"
          title={
            snapshot.mapId === 'plaza'
              ? 'Viajar a los Santuarios del Templo del Velo [T]'
              : 'Abrir lista de Santuarios de Viaje Rápido [T]'
          }
        >
          <span className="flex items-center gap-1.5 min-w-0">
            <Compass className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="truncate font-medium">Viaje Rápido</span>
          </span>
          <span className="flex items-center gap-1 font-mono-num text-[10px] text-stone-300 shrink-0">
            <span>
              {discoveredCount}/{totalCount}
            </span>
            <span className="text-stone-400">[T]</span>
            {fastTravelOpen ? (
              <ChevronUp className="w-3 h-3 text-stone-400" />
            ) : (
              <ChevronDown className="w-3 h-3 text-stone-400" />
            )}
          </span>
        </button>

        {/* Fast Travel Waypoint List */}
        {fastTravelOpen && snapshot.shrines.length > 0 && (
          <div className="w-full pt-1.5 border-t border-white/10 space-y-1 max-h-48 overflow-y-auto rpg-scroll">
            {snapshot.shrines.map((shrine) => {
              const dist = Math.hypot(
                shrine.x - snapshot.playerX,
                shrine.z - snapshot.playerZ
              );
              const isNear = dist < 9.5;
              return shrine.discovered ? (
                <button
                  key={shrine.id}
                  onClick={() => onTeleportShrine(shrine.id)}
                  className="w-full text-left px-2 py-1.5 rounded bg-sky-950/55 hover:bg-sky-900/75 border border-sky-500/35 hover:border-sky-300/70 transition-colors flex items-center justify-between gap-1.5"
                >
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-sky-200 truncate flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-sky-400 shrink-0" />
                      <span className="truncate">{shrine.zoneName}</span>
                    </div>
                    <div className="text-[10px] text-stone-400 truncate">{shrine.name}</div>
                  </div>
                  <span className="text-[10px] font-medium text-sky-300 shrink-0">
                    {isNear ? 'Aquí' : 'Viajar'}
                  </span>
                </button>
              ) : (
                <div
                  key={shrine.id}
                  className="w-full text-left px-2 py-1.5 rounded bg-black/35 border border-white/5 flex items-center justify-between gap-1.5 opacity-70"
                >
                  <div className="min-w-0">
                    <div className="text-[11px] text-stone-400 truncate flex items-center gap-1">
                      <Lock className="w-3 h-3 text-stone-500 shrink-0" />
                      <span className="truncate">{shrine.zoneName}</span>
                    </div>
                    <div className="text-[10px] text-stone-500 truncate">Sin descubrir</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
