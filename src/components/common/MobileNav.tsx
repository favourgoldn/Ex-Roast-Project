import React from "react";
import { TabType } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { Home, Flame, Plus, Trophy, Bell, User } from "lucide-react";

interface MobileNavProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenCreate: () => void;
  unreadNotificationsCount: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  onTabChange,
  onOpenCreate,
  unreadNotificationsCount,
}) => {
  const { currentUser, openAuthModal } = useAuth();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#09090c]/90 backdrop-blur-xl border-t border-zinc-800/80 px-2 py-1.5 pb-safe">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Home */}
        <button
          id="mobile-nav-home"
          onClick={() => onTabChange("home")}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
            currentTab === "home" ? "text-red-500 font-bold" : "text-zinc-400"
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        {/* Explore */}
        <button
          id="mobile-nav-explore"
          onClick={() => onTabChange("explore")}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
            currentTab === "explore" ? "text-red-500 font-bold" : "text-zinc-400"
          }`}
        >
          <Flame className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Explore</span>
        </button>

        {/* Create Post (Center Elevated Button) */}
        <button
          id="mobile-nav-create"
          onClick={onOpenCreate}
          className="flex items-center justify-center w-11 h-11 -mt-4 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-full shadow-lg shadow-red-950/60 border-2 border-[#09090c] active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Hall of Fame */}
        <button
          id="mobile-nav-hall-of-fame"
          onClick={() => onTabChange("hall-of-fame")}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
            currentTab === "hall-of-fame" ? "text-amber-400 font-bold" : "text-zinc-400"
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Fame</span>
        </button>

        {/* Notifications or Profile */}
        <button
          id="mobile-nav-profile"
          onClick={() => {
            if (!currentUser) {
              openAuthModal("signin");
            } else {
              onTabChange("profile");
            }
          }}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl relative transition-all ${
            currentTab === "profile" ? "text-red-500 font-bold" : "text-zinc-400"
          }`}
        >
          {currentUser ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.username}
              className={`w-5 h-5 rounded-full object-cover border ${
                currentTab === "profile" ? "border-red-500" : "border-zinc-700"
              }`}
            />
          ) : (
            <User className="w-5 h-5" />
          )}
          <span className="text-[10px] mt-0.5">Profile</span>
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 bg-red-600 rounded-full" />
          )}
        </button>
      </div>
    </nav>
  );
};
