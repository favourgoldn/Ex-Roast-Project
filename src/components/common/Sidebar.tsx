import React from "react";
import { TabType } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { 
  Home, 
  Flame, 
  Trophy, 
  PlusCircle, 
  Bell, 
  Search, 
  User, 
  ShieldCheck, 
  Sparkles,
  TrendingUp,
  Users,
  Settings,
  Bookmark,
  MessageSquare
} from "lucide-react";

interface SidebarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenGuidelines: () => void;
  unreadNotificationsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  onOpenGuidelines,
  unreadNotificationsCount,
}) => {
  const { 
    currentUser, 
    openAuthModal, 
    openConnectionsModal, 
    openMessagesModal,
    openSettingsModal,
    getFriendRequests 
  } = useAuth();

  const { received: pendingRequests } = currentUser ? getFriendRequests() : { received: [] };

  const navItems = [
    { id: "home" as TabType, label: "Home Feed", icon: Home },
    { id: "explore" as TabType, label: "Explore Stories", icon: Flame },
    { id: "hall-of-fame" as TabType, label: "Hall of Fame", icon: Trophy, badge: "TOP" },
    { id: "create" as TabType, label: "Post Story", icon: PlusCircle, highlight: true },
    { id: "notifications" as TabType, label: "Notifications", icon: Bell, count: unreadNotificationsCount },
    { id: "search" as TabType, label: "Search & Tags", icon: Search },
    { id: "profile" as TabType, label: "My Profile", icon: User },
  ];

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col justify-between h-[calc(100vh-65px)] sticky top-[65px] border-r border-zinc-800/80 p-4 bg-[#0a0a0d]/60 backdrop-blur-md overflow-y-auto">
      <div className="flex flex-col gap-5">
        {/* Navigation List */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => {
                  if (item.id === "profile" && !currentUser) {
                    openAuthModal("signin");
                    return;
                  }
                  onTabChange(item.id);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all group ${
                  isActive
                    ? "bg-gradient-to-r from-red-600/20 to-red-950/20 text-red-400 border border-red-500/30 shadow-sm"
                    : item.highlight
                    ? "text-zinc-200 hover:bg-zinc-800/40 hover:text-white"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? "text-red-500" : item.highlight ? "text-rose-400" : "text-zinc-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md">
                    {item.badge}
                  </span>
                )}

                {typeof item.count === "number" && item.count > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-black bg-red-600 text-white rounded-full">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Direct Social Links */}
          {currentUser && (
            <>
              <button
                id="sidebar-nav-messages"
                onClick={openMessagesModal}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-zinc-400 group-hover:text-red-400 transition-colors" />
                  <span>Direct Messages</span>
                </div>
                <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 rounded-md">
                  LIVE
                </span>
              </button>

              <button
                id="sidebar-nav-friends"
                onClick={() => openConnectionsModal("friends")}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-zinc-400 group-hover:text-red-400 transition-colors" />
                  <span>Friends & Connections</span>
                </div>
                {pendingRequests.length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-black bg-amber-500 text-black rounded-full">
                    {pendingRequests.length}
                  </span>
                )}
              </button>

              <button
                id="sidebar-nav-settings"
                onClick={openSettingsModal}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4 text-zinc-400 group-hover:text-red-400 transition-colors" />
                  <span>Privacy Settings</span>
                </div>
              </button>
            </>
          )}
        </nav>

        {/* Live Trending Highlights Card */}
        <div className="bg-[#12121a] border border-zinc-800/80 rounded-2xl p-3.5 flex flex-col gap-2.5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
            <TrendingUp className="w-3.5 h-3.5 text-red-500" />
            <span>Trending Roast Categories</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {["🚩 Red Flag", "💀 Ghosting", "💸 Money", "🎭 Dumb Excuse"].map((tag) => (
              <button
                key={tag}
                id={`sidebar-tag-${tag}`}
                onClick={() => onTabChange("explore")}
                className="px-2.5 py-1 bg-[#181824] hover:bg-zinc-800 border border-zinc-700/60 rounded-lg text-[11px] text-zinc-300 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="pt-2 mt-1 border-t border-zinc-800 flex items-center justify-between text-[11px]">
            <span className="text-zinc-400">🔥 Daily Burn Pool</span>
            <span className="font-bold text-red-400">14.2K pts</span>
          </div>
        </div>

        {/* Community Guidelines Safety Card */}
        <div className="bg-gradient-to-br from-[#151214] to-[#121218] border border-red-900/30 rounded-2xl p-3.5 text-xs flex flex-col gap-2">
          <div className="flex items-center gap-2 font-bold text-red-300">
            <ShieldCheck className="w-4 h-4 text-red-400" />
            <span>Anonymous & Safe</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Zero tolerance for doxxing, phone numbers, or real identities. Protect privacy.
          </p>
          <button
            id="sidebar-open-guidelines-btn"
            onClick={onOpenGuidelines}
            className="text-[11px] font-semibold text-red-400 hover:text-red-300 text-left underline"
          >
            Read Community Code →
          </button>
        </div>
      </div>

      {/* Footer Profile Status */}
      {currentUser ? (
        <div className="pt-3 border-t border-zinc-800 flex items-center gap-3">
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.username}
            className="w-10 h-10 rounded-xl object-cover border border-red-500/40"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{currentUser.displayName}</p>
            <p className="text-[11px] text-zinc-400 truncate">@{currentUser.username}</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold">Points</span>
            <span className="text-xs font-bold text-red-400">{currentUser.roastPoints}</span>
          </div>
        </div>
      ) : (
        <div className="pt-3 border-t border-zinc-800">
          <button
            onClick={() => openAuthModal("signin")}
            className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow transition-all"
          >
            Sign In / Register
          </button>
        </div>
      )}
    </aside>
  );
};
