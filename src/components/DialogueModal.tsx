import React, { useEffect } from 'react';
import { MessageSquare, Sparkles, Store, ScrollText, BookOpen, Gift, X, Moon, Sun, Sunset, Sunrise } from 'lucide-react';
import { getNpcDynamicContext } from '../game/data';
import { WEATHER_PRESETS } from '../game/weatherShader';
import { DayTimeSnapshot, DialogueChoice, DialogueNode, WeatherType } from '../game/types';

interface DialogueModalProps {
  node: DialogueNode;
  dayTime: DayTimeSnapshot;
  weather: WeatherType;
  marketHeadline?: string;
  claimedRewards: string[];
  unlockedQuests: string[];
  onSelectChoice: (choice: DialogueChoice) => void;
  onClose: () => void;
}

function getChoiceIcon(choice: DialogueChoice) {
  if (choice.action === 'night_blessing') return <Moon className="w-3.5 h-3.5 text-sky-300 shrink-0" />;
  if (choice.unlockQuestId) return <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />;
  if (choice.grantRewardId) return <Gift className="w-3.5 h-3.5 text-emerald-300 shrink-0" />;
  if (choice.action === 'open_shop') return <Store className="w-3.5 h-3.5 text-amber-300 shrink-0" />;
  if (choice.action === 'open_quests') return <ScrollText className="w-3.5 h-3.5 text-sky-300 shrink-0" />;
  if (choice.action === 'open_bestiary') return <BookOpen className="w-3.5 h-3.5 text-indigo-300 shrink-0" />;
  return null;
}

export const DialogueModal: React.FC<DialogueModalProps> = ({
  node,
  dayTime,
  weather,
  marketHeadline,
  claimedRewards,
  unlockedQuests,
  onSelectChoice,
  onClose,
}) => {
  const isNightWindow = dayTime.phase === 'noche' || dayTime.phase === 'ocaso';
  const isRootNode = node.id === 'valen_root' || node.id === 'kael_root';
  const npcContext = getNpcDynamicContext(node.npcId, dayTime.phase, weather);
  const displayText =
    isRootNode && npcContext.greetingOverride ? npcContext.greetingOverride : node.text;

  const visibleChoices = node.choices.filter((c) => {
    if (c.hideIfRewardClaimed && claimedRewards.includes(c.hideIfRewardClaimed)) return false;
    if (c.hideIfQuestUnlocked && unlockedQuests.includes(c.hideIfQuestUnlocked)) return false;
    if (c.onlyAtNight && !isNightWindow) return false;
    if (c.onlyAtDay && isNightWindow) return false;
    return true;
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Digit1' && visibleChoices[0]) onSelectChoice(visibleChoices[0]);
      else if (e.code === 'Digit2' && visibleChoices[1]) onSelectChoice(visibleChoices[1]);
      else if (e.code === 'Digit3' && visibleChoices[2]) onSelectChoice(visibleChoices[2]);
      else if (e.code === 'Digit4' && visibleChoices[3]) onSelectChoice(visibleChoices[3]);
      else if (e.code === 'Digit5' && visibleChoices[4]) onSelectChoice(visibleChoices[4]);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onSelectChoice, visibleChoices]);

  const phaseIcon =
    dayTime.phase === 'noche' ? (
      <Moon className="w-3.5 h-3.5 text-indigo-300" />
    ) : dayTime.phase === 'ocaso' ? (
      <Sunset className="w-3.5 h-3.5 text-amber-300" />
    ) : dayTime.phase === 'amanecer' ? (
      <Sunrise className="w-3.5 h-3.5 text-rose-300" />
    ) : (
      <Sun className="w-3.5 h-3.5 text-amber-300" />
    );

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/65 p-4">
      <div className="w-full max-w-2xl bg-[#0e1118] border border-[#b48e4a]/55 rounded-xl overflow-hidden shadow-2xl">
        {/* Speaker Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/10 bg-[#121620]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#b48e4a]/15 border border-[#b48e4a]/45 flex items-center justify-center text-[#d4af5f] shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-[#f3e6c8]">
                {node.speakerName}
              </h2>
              <p className="text-xs text-stone-400">
                {node.speakerTitle} · <span className="text-amber-300/90">{npcContext.statusLabel}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 rounded-md bg-[#0b0d13] border border-white/10 flex items-center gap-1.5 text-[11px] text-stone-300">
              {phaseIcon}
              <span className="font-mono-num">Día {dayTime.dayNumber} · {dayTime.formattedTime}</span>
              <span>· {dayTime.phaseLabel}</span>
              <span className="text-stone-500">({WEATHER_PRESETS[weather].label})</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Cerrar diálogo"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Narrative Line */}
        <div className="px-6 py-5 border-b border-white/10 space-y-2.5">
          <p className="text-sm sm:text-base text-[#ece6d8] leading-relaxed">
            “{displayText}”
          </p>
          {node.npcId === 'npc_kael' && marketHeadline && (
            <div className="text-xs text-amber-200/90 bg-black/35 border border-[#b48e4a]/30 rounded-md px-3 py-2">
              {marketHeadline}
            </div>
          )}
        </div>

        {/* Decision Choices */}
        <div className="p-5 space-y-2.5 bg-[#0c0e14]">
          <div className="text-[11px] uppercase tracking-wider text-stone-400 font-medium mb-1">
            Elige una respuesta (Clic o tecla 1-{visibleChoices.length})
          </div>
          {visibleChoices.map((choice, index) => (
            <button
              key={choice.id}
              onClick={() => onSelectChoice(choice)}
              className="w-full text-left px-4 py-3 rounded-lg bg-[#141822] hover:bg-[#1b2130] border border-white/10 hover:border-[#d4af5f] transition-colors flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono-num text-xs font-bold text-[#d4af5f] shrink-0">
                  [{index + 1}]
                </span>
                <span className="text-sm text-stone-200 group-hover:text-white">
                  {choice.text}
                </span>
              </div>

              {choice.hintLabel && (
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-300 shrink-0 whitespace-nowrap">
                  {getChoiceIcon(choice)}
                  <span>{choice.hintLabel}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
