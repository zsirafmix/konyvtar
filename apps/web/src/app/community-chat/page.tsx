"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  MessageCircle,
  Send,
  Trash2,
  Users,
  Hash,
  Crown,
  Shield,
  Award,
  Sparkles,
  AlertCircle,
  Plus,
} from "lucide-react";

interface ChatRoom {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isDefault?: boolean;
}

interface ChatMsg {
  id: string;
  roomId: string;
  content: string;
  createdAt: string;
  isDeleted: boolean;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
    role: "admin" | "moderator" | "superuser" | "user";
    isSupporter?: boolean;
  };
}

export default function CommunityChatPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [inputText, setInputText] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Load active user & rooms
  useEffect(() => {
    async function init() {
      try {
        const [userRes, roomsRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/chat/rooms"),
        ]);

        if (userRes.ok) {
          const uData = await userRes.json();
          setCurrentUser(uData.user);
        }

        if (roomsRes.ok) {
          const rData = await roomsRes.json();
          const roomList = rData.rooms || [];
          setRooms(roomList);
          if (roomList.length > 0) {
            setActiveRoom(roomList[0]);
          }
        }
      } catch (err) {
        console.error("Chat init error:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // 2. Poll messages for active room
  const loadMessages = async (roomId: string) => {
    try {
      const res = await fetch(`/api/chat/messages?roomId=${roomId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.warn("Messages poll error:", err);
    }
  };

  useEffect(() => {
    if (!activeRoom) return;

    loadMessages(activeRoom.id);
    const interval = setInterval(() => {
      loadMessages(activeRoom.id);
    }, 3000);

    return () => clearInterval(interval);
  }, [activeRoom]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeRoom || sending) return;

    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: activeRoom.id,
          content: inputText.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Nem sikerült elküldeni az üzenetet.");
        return;
      }

      setInputText("");
      setMessages((prev) => [...prev, data.message]);
    } catch (err: any) {
      setError("Hálózati hiba történt.");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    try {
      const res = await fetch(`/api/chat/messages/${msgId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== msgId));
      }
    } catch (err) {
      console.error("Törlési hiba:", err);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const canSend = currentUser?.permissions?.canSendChatMessages ?? true;
  const canModerate = currentUser?.role === "admin" || (currentUser?.permissions?.canModerateChat ?? false);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto h-[calc(100vh-5rem)] flex flex-col pb-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border/70 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
              <span>Közösségi Chat</span>
              {activeRoom && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-secondary text-primary font-bold border border-border">
                  #{activeRoom.name}
                </span>
              )}
            </h1>
            <p className="text-xs text-muted-foreground">
              {activeRoom?.description || "Valós idejű közösségi beszélgetések regisztrált olvasóknak"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Élő csevegés</span>
        </div>
      </div>

      {/* Main Chat Layout: Left Room Selector + Right Messages Area */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 mt-4 min-h-0">
        {/* Rooms Sidebar */}
        <aside className="w-full md:w-60 shrink-0 bg-card border border-border/70 rounded-2xl p-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto hide-scrollbar">
          <div className="hidden md:block px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
            Csevegőszobák
          </div>

          {rooms.map((room) => {
            const isActive = activeRoom?.id === room.id;
            return (
              <button
                key={room.id}
                onClick={() => setActiveRoom(room)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors text-left shrink-0 md:w-full cursor-pointer ${
                  isActive
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                <Hash className="w-4 h-4 shrink-0" />
                <span className="truncate">{room.name}</span>
              </button>
            );
          })}
        </aside>

        {/* Messages and Input Box */}
        <main className="flex-1 flex flex-col bg-card border border-border/70 rounded-2xl overflow-hidden min-h-0 shadow-sm">
          {/* Messages scroll stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {loading ? (
              <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">
                Üzenetek betöltése...
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-2">
                <MessageCircle className="w-8 h-8 opacity-40" />
                <p className="text-sm font-semibold text-foreground">
                  Ebben a szobában még nincsenek üzenetek.
                </p>
                <p className="text-xs">Írd be az első gondolatot vagy köszönj a többieknek!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = currentUser?.id === msg.author.id;
                const canDelete = isMe || canModerate;
                const role = msg.author.role;

                return (
                  <div
                    key={msg.id}
                    className={`group flex items-start gap-3 text-sm ${
                      isMe ? "flex-row-reverse" : ""
                    }`}
                  >
                    {/* Author Avatar */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 shadow-sm ${
                        role === "admin"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : role === "moderator"
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : role === "superuser"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-secondary text-foreground border border-border"
                      }`}
                    >
                      {msg.author.name[0]?.toUpperCase() || "U"}
                    </div>

                    {/* Message Bubble Container */}
                    <div
                      className={`max-w-[80%] sm:max-w-[70%] space-y-1 ${
                        isMe ? "items-end text-right" : "items-start text-left"
                      }`}
                    >
                      {/* Name & Role Badge header */}
                      <div
                        className={`flex items-center gap-1.5 text-[11px] ${
                          isMe ? "justify-end" : "justify-start"
                        }`}
                      >
                        <span className="font-bold text-foreground">{msg.author.name}</span>

                        {role === "admin" && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-500/15 text-amber-400">
                            👑 Admin
                          </span>
                        )}
                        {role === "moderator" && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-blue-500/15 text-blue-400">
                            🛡️ Mod
                          </span>
                        )}
                        {role === "superuser" && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-500/15 text-emerald-400">
                            ⭐ Superuser
                          </span>
                        )}

                        <span className="text-muted-foreground/70 text-[10px]">
                          {formatTime(msg.createdAt)}
                        </span>

                        {canDelete && (
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity"
                            title="Üzenet törlése"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Content Box */}
                      <div
                        className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words ${
                          isMe
                            ? "bg-primary text-primary-foreground rounded-tr-none shadow-sm"
                            : "bg-secondary/70 text-foreground border border-border/60 rounded-tl-none"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 sm:p-4 bg-background/50 border-t border-border/70 shrink-0">
            {error && (
              <div className="mb-2 p-2 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!canSend ? (
              <div className="p-3 rounded-xl bg-secondary text-center text-xs text-muted-foreground font-semibold">
                Az üzenetküldési jogosultságod jelenleg szüneteltetve van ezen a fiókon.
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Üzenet a(z) #${activeRoom?.name || "chat"} szobába...`}
                  maxLength={2000}
                  disabled={sending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-secondary/80 border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background"
                />
                <button
                  type="submit"
                  disabled={sending || !inputText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Küldés</span>
                </button>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
