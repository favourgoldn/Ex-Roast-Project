import React, { useState, useRef, useEffect } from "react";
import { Logo } from "./Logo";
import { useAuth } from "../../context/AuthContext";
import { TabType } from "../../types";
import { 
  Flame, 
  Bell, 
  Search, 
  Plus, 
  User as UserIcon, 
  LogOut, 
  Bookmark, 
  Shield, 
  Users, 
  Check, 
  ChevronDown 
} from "lucide-react";
import { storage } from "../../services/storageService";

interface HeaderProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenCreate: () => void;
  onOpenGuidelines: () => void;
  unreadNotificationsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  onOpenCreate,
  onOpenGuidelines,
  unreadNotificationsCount,
}) => {
  const { currentUser, allUsers, switchDemoUser, signOut, openAuthModal } = useAuth();
  const [isPersonaOpen, setIsPersonaOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const personaRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (personaRef.current && !personaRef.current.contains(e.target as Node)) {
        setIsPersonaOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onTabChange("search");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#09090b]/85 backdrop-blur-xl border-b border-zinc-800/80 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Mobile Trigger */}
        <div className="flex items-center gap-6">
          <button
            id="header-brand-logo-btn"
            onClick={() => onTabChange("home")}
            className="flex items-center text-left transition-transform hover:scale-[1.02]"
          >
            <Logo size="md" />
          </button>

          {/* Quick Tab Switcher for Desktop */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-[#121218] p-1 rounded-xl border border-zinc-800/60">
            <button
              id="header-nav-home"
              onClick={() => onTabChange("home")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                currentTab === "home"
                  ? "bg-red-600/20 text-red-400 border border-red-500/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
              }`}
            >
              Home
            </button>
            <button
              id="header-nav-explore"
              onClick={() => onTabChange("explore")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                currentTab === "explore"
                  ? "bg-red-600/20 text-red-400 border border-red-500/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
              }`}
            >
              Explore Feed
            </button>
            <button
              id="header-nav-hall-of-fame"
              onClick={() => onTabChange("hall-of-fame")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide flex items-center gap-1.5 transition-all ${
                currentTab === "hall-of-fame"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
              }`}
            >
              <span>👑</span>
              <span>Hall of Fame</span>
            </button>
          </nav>
        </div>

        {/* Center: Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <form onSubmit={handleSearchSubmit} className="w-full relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="global-search-input"
              type="text"
              placeholder="Search stories, ex roasts, hashtags (#NASA, #Money)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (currentTab !== "search") onTabChange("search");
              }}
              className="w-full bg-[#121218] border border-zinc-800/80 rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all"
            />
          </form>
        </div>

        {/* Right Actions: Persona Switcher, Roast Points, Create CTA, Profile */}
        <div className="flex items-center gap-3">
          {/* Quick Persona Switcher (Allows live testing with multiple real personas!) */}
          <div className="relative" ref={personaRef}>
            <button
              id="persona-switcher-btn"
              onClick={() => setIsPersonaOpen(!isPersonaOpen)}
              title="Switch demo persona to test social interaction"
              className="flex items-center gap-2 px-2.5 py-1.5 bg-[#14141c] hover:bg-[#1c1c27] border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs text-zinc-300 transition-all"
            >
              <Users className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline font-medium">
                {currentUser ? `@${currentUser.username}` : "Select Persona"}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {isPersonaOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#14141d] border border-zinc-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-zinc-800/60 mb-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Switch Test Account
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    Test posting, voting, and replies from different users
                  </p>
                </div>
                <div className="max-h-60 overflow-y-auto flex flex-col gap-1">
                  {allUsers.map((u) => {
                    const isSelected = currentUser?.id === u.id;
                    return (
                      <button
                        key={u.id}
                        id={`switch-user-${u.username}`}
                        onClick={() => {
                          switchDemoUser(u.id);
                          setIsPersonaOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                          isSelected ? "bg-red-950/40 text-red-300 border border-red-500/30" : "hover:bg-zinc-800/50 text-zinc-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={u.avatarUrl}
                            alt={u.username}
                            className="w-7 h-7 rounded-full object-cover border border-zinc-700 shrink-0"
                          />
                          <div className="truncate">
                            <p className="text-xs font-semibold truncate leading-tight">
                              @{u.username}
                            </p>
                            <p className="text-[10px] text-zinc-400 truncate">
                              {u.roastPoints} pts · {u.relationshipStatus || "Active"}
                            </p>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-red-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                <div className="pt-2 mt-1 border-t border-zinc-800 flex justify-between gap-1">
                  <button
                    onClick={() => {
                      setIsPersonaOpen(false);
                      openAuthModal("signup");
                    }}
                    className="w-full text-center py-1.5 text-[11px] font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition-colors"
                  >
                    + Create New User
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Roast Points Pill */}
          {currentUser && (
            <div
              id="header-roast-points-pill"
              title="Your Total Roast Points from story roasts & upvotes"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-950/40 via-red-900/30 to-amber-950/30 border border-red-500/30 rounded-full text-xs font-bold text-red-200"
            >
              <Flame className="w-3.5 h-3.5 text-red-400 fill-red-400 animate-pulse" />
              <span>{currentUser.roastPoints.toLocaleString()}</span>
              <span className="text-[10px] text-red-400 font-normal uppercase">PTS</span>
            </div>
          )}

          {/* Notifications Button */}
          <button
            id="header-notifications-btn"
            onClick={() => onTabChange("notifications")}
            className={`relative p-2 rounded-xl border transition-all ${
              currentTab === "notifications"
                ? "bg-red-600/20 text-red-400 border-red-500/40"
                : "bg-[#121218] text-zinc-400 hover:text-zinc-200 border-zinc-800 hover:border-zinc-700"
            }`}
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white font-bold text-[9px] rounded-full flex items-center justify-center animate-bounce shadow-md">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Create Roast Story Primary CTA */}
          <button
            id="header-create-roast-btn"
            onClick={onOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-950/50 hover:shadow-red-600/30 transition-all transform active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden sm:inline">Roast Your Ex</span>
            <span className="sm:hidden">Roast</span>
          </button>

          {/* User Profile Avatar / Menu */}
          {currentUser ? (
            <div className="relative" ref={userMenuRef}>
              <button
                id="header-user-avatar-btn"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1.5 focus:outline-none"
              >
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.username}
                  className="w-8 h-8 rounded-xl object-cover border-2 border-red-500/40 hover:border-red-400 transition-colors"
                />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#14141d] border border-zinc-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2.5 border-b border-zinc-800 mb-1">
                    <p className="text-sm font-bold text-white truncate">{currentUser.displayName}</p>
                    <p className="text-xs text-red-400 truncate">@{currentUser.username}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      id="menu-profile-btn"
                      onClick={() => {
                        onTabChange("profile");
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800/60 rounded-lg transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-zinc-400" />
                      View Profile
                    </button>
                    <button
                      id="menu-saved-btn"
                      onClick={() => {
                        onTabChange("profile");
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800/60 rounded-lg transition-colors"
                    >
                      <Bookmark className="w-4 h-4 text-zinc-400" />
                      Saved Stories
                    </button>
                    <button
                      id="menu-guidelines-btn"
                      onClick={() => {
                        onOpenGuidelines();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800/60 rounded-lg transition-colors"
                    >
                      <Shield className="w-4 h-4 text-zinc-400" />
                      Privacy & Guidelines
                    </button>
                    <div className="my-1 border-t border-zinc-800" />
                    <button
                      id="menu-signout-btn"
                      onClick={() => {
                        signOut();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              id="header-signin-btn"
              onClick={() => openAuthModal("signin")}
              className="px-3.5 py-1.5 bg-[#14141c] hover:bg-[#1f1f2a] border border-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
