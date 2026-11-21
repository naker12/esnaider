import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Globe,
  LogIn,
  MessageSquare,
  Send,
  Shield,
  Users,
} from 'lucide-react';
import {
  ChatChannel,
  ChatMessage,
  OnlinePlayerState,
  WorldMapId,
} from '../game/types';

interface OnlineChatPanelProps {
  isAccountLinked: boolean;
  localUid: string | null;
  playerName: string;
  playerLevel: number;
  playerRebirths: number;
  clanName: string;
  clanTag: string;
  clanColor: string;
  currentMapId: WorldMapId;
  onlinePlayers: OnlinePlayerState[];
  messages: ChatMessage[];
  channel: ChatChannel;
  isOpen: boolean;
  onToggleOpen: () => void;
  onChangeChannel: (channel: ChatChannel) => void;
  onSendMessage: (text: string, channel: ChatChannel) => Promise<void> | void;
  onLinkGoogleAccount: () => void;
  onInputFocusChange?: (focused: boolean) => void;
}

type DrawerTab = 'global' | 'clan' | 'online';

function formatMessageTime(ms?: number): string {
  if (!ms) return '';
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export const OnlineChatPanel: React.FC<OnlineChatPanelProps> = ({
  isAccountLinked,
  localUid,
  playerName,
  playerLevel,
  playerRebirths,
  clanName,
  clanTag,
  clanColor,
  currentMapId,
  onlinePlayers,
  messages,
  channel,
  isOpen,
  onToggleOpen,
  onChangeChannel,
  onSendMessage,
  onLinkGoogleAccount,
  onInputFocusChange,
}) => {
  const [activeTab, setActiveTab] = useState<DrawerTab>(channel);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastSeenCountRef = useRef<number>(messages.length);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (channel === 'global' || channel === 'clan') {
      setActiveTab((prev) => (prev === 'online' ? prev : channel));
    }
  }, [channel]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      lastSeenCountRef.current = messages.length;
    } else if (messages.length > lastSeenCountRef.current) {
      setUnreadCount((c) => c + (messages.length - lastSeenCountRef.current));
      lastSeenCountRef.current = messages.length;
    }
  }, [isOpen, messages.length]);

  const filteredMessages = useMemo(() => {
    if (activeTab === 'clan') {
      return messages.filter(
        (m) =>
          m.channel === 'clan' &&
          m.clanName.trim().toLowerCase() === clanName.trim().toLowerCase()
      );
    }
    // Global tab shows Global messages plus Clan messages belonging to your own clan
    return messages.filter(
      (m) =>
        m.channel === 'global' ||
        m.clanName.trim().toLowerCase() === clanName.trim().toLowerCase()
    );
  }, [activeTab, clanName, messages]);

  useEffect(() => {
    if (isOpen && activeTab !== 'online') {
      scrollEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [filteredMessages.length, isOpen, activeTab]);

  // Combined roster including local hero + remote active players
  const rosterPlayers = useMemo(() => {
    const others = onlinePlayers.filter((p) => !localUid || p.uid !== localUid);
    const sortedOthers = [...others].sort((a, b) => {
      if (a.mapId === currentMapId && b.mapId !== currentMapId) return -1;
      if (a.mapId !== currentMapId && b.mapId === currentMapId) return 1;
      return b.level - a.level;
    });
    return sortedOthers;
  }, [currentMapId, localUid, onlinePlayers]);

  const sameMapOnlineCount =
    1 + rosterPlayers.filter((p) => p.mapId === currentMapId).length;
  const totalOnlineCount = 1 + rosterPlayers.length;

  const handleSelectTab = (tab: DrawerTab) => {
    setActiveTab(tab);
    if (tab === 'global' || tab === 'clan') {
      onChangeChannel(tab);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = draft.trim();
    if (!clean || sending || !isAccountLinked) return;
    const sendChannel: ChatChannel = activeTab === 'clan' ? 'clan' : 'global';
    setSending(true);
    try {
      await onSendMessage(clean, sendChannel);
      setDraft('');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-24 right-4 z-20 pointer-events-auto">
        <button
          onClick={onToggleOpen}
          className="px-3.5 py-2 rounded-lg bg-[#0c0e14]/94 border border-[#b48e4a]/50 hover:border-[#d4af5f] text-xs text-[#f3e6c8] flex items-center gap-2.5 shadow-xl transition-colors"
        >
          <MessageSquare className="w-4 h-4 text-[#d4af5f] shrink-0" />
          <span className="font-semibold">Chat Online</span>
          <span className="font-mono-num text-[11px] text-emerald-300">
            En línea: {totalOnlineCount}
          </span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-amber-500 text-[#0b0d12] font-mono-num text-[10px] font-bold">
              +{unreadCount}
            </span>
          )}
          <ChevronUp className="w-3.5 h-3.5 text-stone-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-24 right-4 z-20 w-80 max-w-[92vw] bg-[#0c0e14]/94 border border-[#b48e4a]/50 rounded-xl flex flex-col overflow-hidden shadow-2xl pointer-events-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-white/10 bg-[#121621]">
        <div className="flex items-center gap-2 min-w-0">
          <MessageSquare className="w-3.5 h-3.5 text-[#d4af5f] shrink-0" />
          <span className="font-display text-xs font-bold text-[#f3e6c8] truncate">
            Chat Online
          </span>
          <span
            className="px-1.5 py-0.5 rounded border text-[10px] font-mono-num font-bold shrink-0"
            style={{
              borderColor: `${clanColor}88`,
              backgroundColor: `${clanColor}22`,
              color: clanColor,
            }}
            title={`Tu clan: ${clanName}`}
          >
            [{clanTag}]
          </span>
        </div>

        <button
          onClick={onToggleOpen}
          className="p-1 rounded text-stone-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          aria-label="Minimizar chat"
          title="Minimizar chat"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 border-b border-white/10 bg-[#10141d] text-[11px]">
        <button
          onClick={() => handleSelectTab('global')}
          className={`py-1.5 px-2 flex items-center justify-center gap-1 font-medium border-b-2 transition-colors ${
            activeTab === 'global'
              ? 'border-[#d4af5f] text-[#f3e6c8] bg-white/5'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Globe className="w-3 h-3 shrink-0" />
          <span>Global</span>
        </button>
        <button
          onClick={() => handleSelectTab('clan')}
          className={`py-1.5 px-2 flex items-center justify-center gap-1 font-medium border-b-2 transition-colors ${
            activeTab === 'clan'
              ? 'border-[#d4af5f] text-[#f3e6c8] bg-white/5'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
          title={`Canal privado de ${clanName}`}
        >
          <Shield className="w-3 h-3 shrink-0" style={{ color: clanColor }} />
          <span className="truncate">Clan [{clanTag}]</span>
        </button>
        <button
          onClick={() => handleSelectTab('online')}
          className={`py-1.5 px-2 flex items-center justify-center gap-1 font-medium border-b-2 transition-colors ${
            activeTab === 'online'
              ? 'border-[#d4af5f] text-emerald-300 bg-white/5'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Users className="w-3 h-3 shrink-0" />
          <span className="font-mono-num">
            {sameMapOnlineCount}/{totalOnlineCount}
          </span>
        </button>
      </div>

      {/* Body */}
      {!isAccountLinked ? (
        <div className="p-4 text-center space-y-2.5 bg-[#0d1018]">
          <p className="text-xs text-stone-300 leading-relaxed">
            Vincula tu cuenta Google para hablar en el chat global/clan y ver a otros jugadores en
            la Plaza y el Templo.
          </p>
          <button
            onClick={onLinkGoogleAccount}
            className="w-full px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-[#071019] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Vincular Cuenta Google [Y]</span>
          </button>
        </div>
      ) : activeTab === 'online' ? (
        <div className="h-52 overflow-y-auto rpg-scroll p-2.5 space-y-1.5 bg-[#0c0f16]">
          <div className="text-[10px] text-stone-400 px-1 flex items-center justify-between">
            <span>
              En este mapa ({currentMapId === 'plaza' ? 'Plaza del Alba' : 'Templo del Velo'}):{' '}
              <strong className="text-emerald-300 font-mono-num">{sameMapOnlineCount}</strong>
            </span>
            <span>
              Total: <strong className="text-stone-200 font-mono-num">{totalOnlineCount}</strong>
            </span>
          </div>

          {/* Local Player Row */}
          <div className="p-2 rounded-lg bg-[#161c2a] border border-[#b48e4a]/45 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs">
                <span
                  className="px-1 py-0.5 rounded border text-[9px] font-mono-num font-bold shrink-0"
                  style={{
                    borderColor: `${clanColor}88`,
                    backgroundColor: `${clanColor}22`,
                    color: clanColor,
                  }}
                >
                  [{clanTag}]
                </span>
                <span className="font-semibold text-[#f3e6c8] truncate">{playerName}</span>
                <span className="text-[10px] text-amber-300 shrink-0">(Tú)</span>
              </div>
              <div className="text-[10px] text-stone-400 truncate mt-0.5">
                {clanName} ·{' '}
                {currentMapId === 'plaza' ? 'Plaza del Alba' : 'Templo del Velo'}
              </div>
            </div>
            <span className="font-mono-num text-[10px] text-sky-300 shrink-0">
              Nv.{playerLevel}
              {playerRebirths > 0 ? ` · R${playerRebirths}` : ''}
            </span>
          </div>

          {/* Remote Players */}
          {rosterPlayers.length === 0 ? (
            <div className="py-5 text-center text-[11px] text-stone-400">
              No hay otros jugadores activos en este momento.
            </div>
          ) : (
            rosterPlayers.map((p) => (
              <div
                key={p.uid}
                className="p-2 rounded-lg bg-[#121620] border border-white/10 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span
                      className="px-1 py-0.5 rounded border text-[9px] font-mono-num font-bold shrink-0"
                      style={{
                        borderColor: `${p.clanColor}88`,
                        backgroundColor: `${p.clanColor}22`,
                        color: p.clanColor,
                      }}
                    >
                      [{p.clanTag}]
                    </span>
                    <span className="font-semibold text-stone-100 truncate">{p.playerName}</span>
                  </div>
                  <div className="text-[10px] text-stone-400 truncate mt-0.5">
                    {p.clanName} ·{' '}
                    <span
                      className={
                        p.mapId === currentMapId ? 'text-emerald-300' : 'text-stone-400'
                      }
                    >
                      {p.mapId === 'plaza' ? 'Plaza del Alba' : 'Templo del Velo'}
                    </span>
                  </div>
                </div>
                <span className="font-mono-num text-[10px] text-sky-300 shrink-0">
                  Nv.{p.level}
                  {p.rebirths > 0 ? ` · R${p.rebirths}` : ''}
                </span>
              </div>
            ))
          )}
        </div>
      ) : (
        <>
          <div className="h-44 overflow-y-auto rpg-scroll p-2.5 space-y-1.5 bg-[#0c0f16]">
            {filteredMessages.length === 0 ? (
              <div className="py-10 text-center text-[11px] text-stone-400">
                {activeTab === 'clan'
                  ? `Aún no hay mensajes en el canal de ${clanName}. ¡Saluda a tu clan!`
                  : 'El chat global está tranquilo. ¡Escribe el primer saludo desde la Plaza!'}
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isSelf = Boolean(localUid && msg.uid === localUid);
                return (
                  <div
                    key={msg.id}
                    className={`rounded-md px-2 py-1.5 text-[11px] leading-snug border ${
                      msg.channel === 'clan'
                        ? 'bg-amber-950/20 border-amber-500/25'
                        : 'bg-[#121620] border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 mb-0.5">
                      <div className="flex items-center gap-1 min-w-0">
                        <span
                          className="font-mono-num text-[10px] font-bold shrink-0"
                          style={{ color: msg.clanColor }}
                          title={`Clan: ${msg.clanName}`}
                        >
                          [{msg.clanTag}]
                        </span>
                        <span
                          className={`font-semibold truncate ${
                            isSelf ? 'text-[#f3e6c8]' : 'text-stone-100'
                          }`}
                        >
                          {msg.playerName}
                        </span>
                        {msg.channel === 'clan' && (
                          <span className="text-[9px] font-semibold text-amber-300 shrink-0">
                            CLAN
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] font-mono-num text-stone-500 shrink-0">
                        {msg.mapId === 'plaza' ? 'Plaza' : 'Templo'} ·{' '}
                        {formatMessageTime(msg.createdAtMs)}
                      </span>
                    </div>
                    <p className="text-stone-200 break-words">{msg.text}</p>
                  </div>
                );
              })
            )}
            <div ref={scrollEndRef} />
          </div>

          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="p-2 border-t border-white/10 bg-[#11151f] flex items-center gap-1.5"
          >
            <input
              ref={inputRef}
              type="text"
              value={draft}
              maxLength={240}
              onChange={(e) => setDraft(e.target.value)}
              onFocus={() => onInputFocusChange?.(true)}
              onBlur={() => onInputFocusChange?.(false)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  inputRef.current?.blur();
                }
              }}
              placeholder={
                activeTab === 'clan'
                  ? `Hablar con [${clanTag}]...`
                  : 'Escribe en el chat global...'
              }
              className="flex-1 min-w-0 px-2.5 py-1.5 rounded-md bg-black/50 border border-white/15 focus:border-[#d4af5f] outline-none text-xs text-[#f3e6c8] placeholder:text-stone-500"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="p-1.5 rounded-md bg-[#b48e4a] hover:bg-[#c8a056] disabled:bg-white/10 disabled:text-stone-500 text-[#0b0d12] transition-colors shrink-0"
              aria-label="Enviar mensaje"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </>
      )}
    </div>
  );
};
