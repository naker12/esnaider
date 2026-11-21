import React from 'react';
import { Boxes, Layers, X } from 'lucide-react';
import { ExtensionModuleSlot } from '../game/types';

interface ExtensionsModalProps {
  modules: ExtensionModuleSlot[];
  onToggleModule: (id: string) => void;
  onClose: () => void;
}

export const ExtensionsModal: React.FC<ExtensionsModalProps> = ({
  modules,
  onToggleModule,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-4xl max-h-[86vh] bg-[#0e1118] border border-[#b48e4a]/45 rounded-xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Boxes className="w-5 h-5 text-[#d4af5f]" />
            <div>
              <h2 className="font-display text-xl text-[#f3e6c8]">
                Espacios de Expansión y Módulos del RPG
              </h2>
              <p className="text-xs text-stone-400">
                Arquitectura preparada con ranuras abiertas para acoplar nuevos sistemas, habilidades (4–6) y mecánicas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Cerrar módulos"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto rpg-scroll p-6 space-y-5">
          <div className="p-4 rounded-lg bg-[#141821] border border-white/10 text-xs text-stone-300 leading-relaxed flex items-start gap-3">
            <Layers className="w-4 h-4 text-[#d4af5f] shrink-0 mt-0.5" />
            <div>
              El motor incluye un registro modular en <span className="font-mono-num text-amber-300">src/game/extensions.ts</span>, una ranura de equipamiento extra (<span className="font-mono-num text-amber-300">runa_extra</span>) en Personaje y 3 ranuras de acción libres (<span className="font-mono-num text-amber-300">Teclas 4, 5 y 6</span>) en la barra inferior listas para recibir nuevas mecánicas.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {modules.map((mod) => (
              <div
                key={mod.id}
                className={`p-4 rounded-lg border flex flex-col justify-between gap-3 ${
                  mod.enabled
                    ? 'bg-[#171d29] border-amber-400/60'
                    : 'bg-[#12161f] border-white/10'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-stone-400">
                      {mod.category} · {mod.status === 'activo_demo' ? 'Conectado' : 'Espacio Reservado'}
                    </span>
                    <span
                      className={`text-[11px] font-medium ${
                        mod.enabled ? 'text-emerald-300' : 'text-stone-400'
                      }`}
                    >
                      {mod.enabled ? 'Activo' : 'En espera'}
                    </span>
                  </div>
                  <h3 className="font-display text-base text-[#f3e6c8]">{mod.name}</h3>
                  <p className="text-xs text-stone-300 leading-relaxed">{mod.description}</p>
                </div>

                <div className="pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
                  <span className="font-mono-num text-[11px] text-stone-400 truncate">
                    {mod.hookPoint}
                  </span>
                  <button
                    onClick={() => onToggleModule(mod.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                      mod.enabled
                        ? 'bg-white/15 hover:bg-white/25 text-stone-200'
                        : 'bg-[#b48e4a]/25 hover:bg-[#b48e4a]/45 text-amber-200'
                    }`}
                  >
                    {mod.enabled ? 'Desactivar' : 'Reservar / Activar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
