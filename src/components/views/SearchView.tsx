import React, { useState } from "react";
import { Post, User, TabType } from "../../types";
import { storage } from "../../services/storageService";
import { PostCard } from "../feed/PostCard";
import { useAuth } from "../../context/AuthContext";
import { Search, User as UserIcon, Tag, Flame, Sparkles, ArrowRight, UserPlus, UserCheck, ShieldCheck } from "lucide-react";

interface SearchViewProps {
  onTabChange: (tab: TabType) => void;
  onShare: (post: Post) => void;
  onReport: (targetId: string, author: string) => void;
  onSelectUser?: (userId: string) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  onTabChange,
  onShare,
  onReport,
  onSelectUser,
}) => {
  const { allUsers, toggleFollow, isFollowing, currentUser, sendFriendRequest, isFriend } = useAuth();
  const [query, setQuery] = useState("");
  const [searchTab, setSearchTab] = useState<"all" | "stories" | "people">("all");

  const allPosts = storage.getPosts();

  const matchingPosts = allPosts.filter(
    (p) =>
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.content.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase()) ||
      p.hashtags?.some((t) => t.toLowerCase().includes(query.toLowerCase())) ||
      p.roasts.some((r) => r.content.toLowerCase().includes(query.toLowerCase()))
  );

  const matchingUsers = allUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(query.toLowerCase()) ||
      u.displayName.toLowerCase().includes(query.toLowerCase()) ||
      (u.bio && u.bio.toLowerCase().includes(query.toLowerCase()))
  );

  const POPULAR_TAGS = [
    "NASA", "RedFlag", "Cheating", "Money", "Ghosting", "WorstDate", "Excuses", "Wedding", "Tinder"
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6 pb-24">
      {/* Header and Search Bar */}
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-black text-white font-display flex items-center gap-2">
          <Search className="w-5 h-5 text-red-500" />
          <span>Explore Search & Hashtags</span>
        </h1>

        <div className="relative">
          <Search className="w-5 h-5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-view-main-input"
            type="text"
            placeholder="Search stories, roasters (@username), punchlines, tags (#RedFlag)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-[#12121b] border border-zinc-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 shadow-xl"
          />
        </div>

        {/* Popular Tags Fast Select */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-zinc-500 flex items-center gap-1 mr-1">
            <Tag className="w-3 h-3" />
            <span>Popular:</span>
          </span>
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setQuery(tag)}
              className="px-2.5 py-1 bg-[#161622] hover:bg-zinc-800 text-[11px] font-semibold text-zinc-300 rounded-lg border border-zinc-800 hover:border-red-500/40 transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs (All | Stories | People) */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        {[
          { id: "all", label: "All Results" },
          { id: "stories", label: `Stories (${matchingPosts.length})` },
          { id: "people", label: `People (${matchingUsers.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSearchTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              searchTab === tab.id
                ? "bg-red-600 text-white shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Results Content */}
      <div className="flex flex-col gap-6">
        {/* People Results */}
        {(searchTab === "all" || searchTab === "people") && matchingUsers.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Roasters ({matchingUsers.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {matchingUsers.map((u) => {
                const isFriendUser = currentUser ? isFriend(u.id) : false;
                const isFollowingUser = currentUser ? isFollowing(u.id) : false;

                return (
                  <div
                    key={u.id}
                    className="p-3.5 bg-[#12121b] border border-zinc-800 rounded-2xl flex items-center justify-between hover:border-zinc-700 transition-colors"
                  >
                    <div 
                      onClick={() => onSelectUser?.(u.id)}
                      className="flex items-center gap-3 min-w-0 cursor-pointer group"
                    >
                      <img
                        src={u.avatarUrl}
                        alt={u.username}
                        className="w-10 h-10 rounded-xl object-cover border border-zinc-700 shrink-0 group-hover:border-red-500 transition-colors"
                      />
                      <div className="truncate">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-bold text-white group-hover:text-red-400 transition-colors truncate">
                            {u.displayName}
                          </p>
                          {u.isVerified && <ShieldCheck className="w-3 h-3 text-red-500 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate">@{u.username}</p>
                        <p className="text-[10px] text-amber-400 font-bold">{u.roastPoints} pts</p>
                      </div>
                    </div>

                    {currentUser && currentUser.id !== u.id && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!isFriendUser && (
                          <button
                            onClick={() => sendFriendRequest(u.id)}
                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                            title="Add Friend"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => toggleFollow(u.id)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                            isFollowingUser
                              ? "bg-zinc-800 text-zinc-300"
                              : "bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30"
                          }`}
                        >
                          {isFollowingUser ? "Following" : "Follow"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stories Results */}
        {(searchTab === "all" || searchTab === "stories") && (
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Stories ({matchingPosts.length})
            </h3>
            {matchingPosts.length > 0 ? (
              matchingPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onShare={onShare}
                  onReport={onReport}
                />
              ))
            ) : (
              <div className="py-12 text-center bg-[#12121b] border border-zinc-800 rounded-2xl text-xs text-zinc-500">
                No stories match your search query.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
