import React, { useState } from "react";
import { storage } from "../../services/storageService";
import { useAuth } from "../../context/AuthContext";
import { Post, TabType } from "../../types";
import { 
  Trophy, 
  Crown, 
  Flame, 
  Sparkles, 
  Medal, 
  UserPlus, 
  UserCheck, 
  ArrowRight,
  TrendingUp,
  Skull
} from "lucide-react";

interface HallOfFameViewProps {
  onTabChange: (tab: TabType) => void;
  onShare: (post: Post) => void;
  onReport: (targetId: string, author: string) => void;
}

export const HallOfFameView: React.FC<HallOfFameViewProps> = ({
  onTabChange,
  onShare,
  onReport,
}) => {
  const { currentUser, toggleFollow, isFollowing } = useAuth();
  const [timeFilter, setTimeFilter] = useState<"today" | "week" | "month" | "all">("all");

  const topRoasters = storage.getTopRoasters();
  const roastOfTheDay = storage.getRoastOfTheDay();
  const posts = storage.getPosts();

  // Top legendary posts
  const legendaryPosts = [...posts]
    .sort((a, b) => (b.reactions?.savage || 0) - (a.reactions?.savage || 0))
    .slice(0, 4);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8 pb-24">
      {/* Header Banner */}
      <div className="text-center flex flex-col items-center gap-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-black shadow-lg shadow-amber-950/40">
          <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>OFFICIAL LEADERBOARDS & IMMORTAL BURNS</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white font-display uppercase tracking-tight">
          THE ROAST <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-red-500 bg-clip-text text-transparent">HALL OF FAME</span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md">
          The sharpest punchlines, most unbelievable stories, and top-ranked roasters in the community.
        </p>

        {/* Time Filter Tabs */}
        <div className="flex items-center gap-1 bg-[#12121a] p-1 rounded-xl border border-zinc-800 mt-2">
          {[
            { id: "today", label: "Today" },
            { id: "week", label: "This Week" },
            { id: "month", label: "This Month" },
            { id: "all", label: "All Time" },
          ].map((tab) => (
            <button
              key={tab.id}
              id={`hof-filter-${tab.id}`}
              onClick={() => setTimeFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeFilter === tab.id
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. ROAST OF THE DAY CROWNED SPOTLIGHT */}
      {roastOfTheDay && (
        <section className="relative p-6 sm:p-8 bg-gradient-to-br from-[#1f1510] via-[#14101a] to-[#101018] border-2 border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500 text-black font-black text-xs uppercase tracking-wider flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 fill-black" />
                <span>Roast of the Day</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-black text-red-400 bg-red-950/60 border border-red-500/40 px-3 py-1 rounded-full">
              <Flame className="w-4 h-4 fill-red-400 animate-pulse" />
              <span>+{roastOfTheDay.score} Community Flames</span>
            </div>
          </div>

          <p className="text-lg sm:text-2xl font-black text-white italic leading-relaxed mb-4">
            "{roastOfTheDay.content}"
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-zinc-800/80 text-xs">
            <div className="flex items-center gap-2.5">
              <img
                src={roastOfTheDay.authorAvatar}
                alt={roastOfTheDay.authorUsername}
                className="w-8 h-8 rounded-full object-cover border border-amber-500/50"
              />
              <div>
                <p className="font-bold text-white">@{roastOfTheDay.authorUsername}</p>
                <p className="text-[10px] text-zinc-400">Master Roaster Badge</p>
              </div>
            </div>

            <div className="text-zinc-400 text-right">
              <span className="text-[11px] block">Context: "{roastOfTheDay.postTitle}"</span>
            </div>
          </div>
        </section>
      )}

      {/* 2. TOP ROASTERS PODIUM & LEADERBOARD */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white font-display flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Top Roasters Leaderboard</span>
          </h2>
          <span className="text-xs text-zinc-400">Ranked by Total Roast Points</span>
        </div>

        {/* Top 3 Podium Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
          {topRoasters.slice(0, 3).map((user, idx) => {
            const isFirst = idx === 0;
            const isSecond = idx === 1;
            const isThird = idx === 2;
            const rankTitle = isFirst ? "👑 GRAND ROAST CHAMPION" : isSecond ? "🥈 SAVAGE RUNNER-UP" : "🥉 THIRD FLAME";

            return (
              <div
                key={user.id}
                className={`p-5 rounded-2xl flex flex-col items-center text-center relative border transition-all ${
                  isFirst
                    ? "bg-gradient-to-b from-[#241a10] to-[#12121c] border-amber-500/60 shadow-xl shadow-amber-950/30 -translate-y-1"
                    : "bg-[#12121a] border-zinc-800"
                }`}
              >
                {/* Rank Badge */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs mb-3 ${
                  isFirst ? "bg-amber-500 text-black shadow-md" : isSecond ? "bg-zinc-300 text-zinc-900" : "bg-amber-800 text-amber-100"
                }`}>
                  #{idx + 1}
                </div>

                <div className="relative mb-2">
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className={`w-16 h-16 rounded-2xl object-cover border-2 ${
                      isFirst ? "border-amber-400" : "border-zinc-700"
                    }`}
                  />
                  {isFirst && (
                    <Crown className="w-5 h-5 text-amber-400 fill-amber-400 absolute -top-3 left-1/2 -translate-x-1/2" />
                  )}
                </div>

                <h3 className="text-sm font-extrabold text-white truncate max-w-full">
                  @{user.username}
                </h3>
                <p className="text-[10px] text-zinc-400 truncate mb-3">{user.displayName}</p>

                <div className="w-full bg-[#181826] py-2 px-3 rounded-xl border border-zinc-800/80 mb-3 flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Roast Points</span>
                  <span className="font-extrabold text-red-400">{user.roastPoints.toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-zinc-400 mb-3">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>{user.winsCount} Top Wins</span>
                </div>

                {currentUser && currentUser.id !== user.id && (
                  <button
                    id={`hof-follow-${user.id}`}
                    onClick={() => toggleFollow(user.id)}
                    className={`w-full py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      isFollowing(user.id)
                        ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                        : "bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30"
                    }`}
                  >
                    {isFollowing(user.id) ? "Following" : "+ Follow"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Ranks 4+ List */}
        <div className="bg-[#12121a] border border-zinc-800 rounded-2xl p-2 flex flex-col gap-1 mt-2">
          {topRoasters.slice(3).map((user, idx) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800/40 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 text-center font-bold text-xs text-zinc-500">
                  #{idx + 4}
                </span>
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="w-9 h-9 rounded-xl object-cover border border-zinc-700"
                />
                <div className="truncate">
                  <p className="text-xs font-bold text-white truncate">@{user.username}</p>
                  <p className="text-[10px] text-zinc-400 truncate">{user.relationshipStatus || "Active Roaster"}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs font-extrabold text-red-400">{user.roastPoints.toLocaleString()} PTS</p>
                  <p className="text-[10px] text-zinc-500">{user.winsCount} Wins</p>
                </div>

                {currentUser && currentUser.id !== user.id && (
                  <button
                    onClick={() => toggleFollow(user.id)}
                    className="p-1.5 rounded-lg bg-[#1a1a26] hover:bg-zinc-700 text-zinc-300"
                  >
                    {isFollowing(user.id) ? <UserCheck className="w-4 h-4 text-emerald-400" /> : <UserPlus className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. MOST SAVAGE STORIES OF ALL TIME */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white font-display flex items-center gap-2">
            <Skull className="w-5 h-5 text-rose-500" />
            <span>Most Unhinged Stories</span>
          </h2>
          <button
            onClick={() => onTabChange("explore")}
            className="text-xs font-bold text-red-400 hover:underline flex items-center gap-1"
          >
            <span>Explore All</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {legendaryPosts.map((p) => {
            const top = p.roasts.find((r) => r.isTopRoast) || p.roasts[0];
            return (
              <div
                key={p.id}
                className="p-4 bg-[#12121b] border border-zinc-800 rounded-2xl flex flex-col justify-between gap-3 hover:border-red-500/40 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase font-bold text-red-400 bg-red-950/40 px-2 py-0.5 rounded-md border border-red-500/30">
                      {p.category}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      🔥 {p.reactions?.savage || 0} Savages
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-1 leading-snug">
                    "{p.title}"
                  </h4>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {p.content}
                  </p>
                </div>

                {top && (
                  <div className="pt-2.5 border-t border-zinc-800/80 bg-[#161624]/60 p-2.5 rounded-xl">
                    <span className="text-[10px] font-black uppercase text-amber-400 flex items-center gap-1 mb-0.5">
                      <Flame className="w-3 h-3 fill-amber-400" />
                      Winning Roast (+{top.score} pts):
                    </span>
                    <p className="text-xs text-zinc-200 italic font-medium leading-snug">
                      "{top.content}"
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
