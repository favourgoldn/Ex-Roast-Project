import React, { useState, useMemo } from "react";
import { Post, CategoryType, TabType } from "../../types";
import { storage } from "../../services/storageService";
import { PostCard } from "../feed/PostCard";
import { useAuth } from "../../context/AuthContext";
import { 
  Flame, 
  Sparkles, 
  Clock, 
  TrendingUp, 
  Filter, 
  PlusCircle, 
  X, 
  Search, 
  Shuffle 
} from "lucide-react";

interface ExploreViewProps {
  onOpenCreate: () => void;
  onShare: (post: Post) => void;
  onReport: (targetId: string, author: string) => void;
  onTabChange: (tab: TabType) => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  onOpenCreate,
  onShare,
  onReport,
  onTabChange,
}) => {
  const { currentUser, openAuthModal } = useAuth();
  const [activeSort, setActiveSort] = useState<"trending" | "forYou" | "latest" | "mostRoasted">("trending");
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | "All">("All");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const allPosts = storage.getPosts();

  const categories: (CategoryType | "All")[] = [
    "All",
    "Funny Ex",
    "Red Flag",
    "Cheating",
    "Ghosting",
    "Worst Date",
    "Toxic Relationship",
    "Dumb Excuse",
    "Money",
    "Breakup",
  ];

  // Filtering & Sorting logic
  const filteredPosts = useMemo(() => {
    let result = [...allPosts];

    // Filter by Category
    if (selectedCategory !== "All") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Filter by Tag
    if (activeTag) {
      result = result.filter((p) => p.hashtags?.some((t) => t.toLowerCase() === activeTag.toLowerCase()));
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.authorUsername.toLowerCase().includes(q) ||
          p.hashtags?.some((t) => t.toLowerCase().includes(q)) ||
          p.roasts.some((r) => r.content.toLowerCase().includes(q))
      );
    }

    // Sort
    if (activeSort === "trending") {
      result.sort((a, b) => {
        const scoreA = (a.reactions?.savage || 0) * 2 + (a.roasts?.length || 0) * 3;
        const scoreB = (b.reactions?.savage || 0) * 2 + (b.roasts?.length || 0) * 3;
        return scoreB - scoreA;
      });
    } else if (activeSort === "latest") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (activeSort === "mostRoasted") {
      result.sort((a, b) => (b.roasts?.length || 0) - (a.roasts?.length || 0));
    } else if (activeSort === "forYou") {
      // Prioritize followed users or high engagement
      result.sort((a, b) => {
        const isFollowedA = currentUser?.following?.includes(a.authorId) ? 100 : 0;
        const isFollowedB = currentUser?.following?.includes(b.authorId) ? 100 : 0;
        return isFollowedB - isFollowedA;
      });
    }

    return result;
  }, [allPosts, selectedCategory, activeTag, searchQuery, activeSort, currentUser]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-6 pb-24">
      {/* Feed Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-display flex items-center gap-2.5">
            <Flame className="w-6 h-6 text-red-500 fill-red-500" />
            <span>Story Feed</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Fresh stories from the community. Vote, react, and drop your best roasts.
          </p>
        </div>

        {/* Quick Post CTA */}
        <button
          id="explore-create-story-btn"
          onClick={() => {
            if (!currentUser) openAuthModal("signin");
            else onOpenCreate();
          }}
          className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-950/40 flex items-center gap-1.5 transition-all transform active:scale-95 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post Your Ex Story</span>
        </button>
      </div>

      {/* Quick Search & Tag Indicator */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="explore-search-input"
            type="text"
            placeholder="Search keywords, stories, punchlines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#14141e] border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
          />
        </div>

        {activeTag && (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-red-950/60 border border-red-500/40 rounded-xl text-xs font-bold text-red-300">
            <span>#{activeTag}</span>
            <button onClick={() => setActiveTag(null)} className="text-zinc-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Sort Tabs (For You | Trending | Latest | Most Roasted) */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-1 bg-[#12121a] p-1 rounded-xl border border-zinc-800/80 shrink-0">
          <button
            id="sort-trending-btn"
            onClick={() => setActiveSort("trending")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSort === "trending"
                ? "bg-red-600 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Trending</span>
          </button>

          <button
            id="sort-foryou-btn"
            onClick={() => setActiveSort("forYou")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSort === "forYou"
                ? "bg-red-600 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>For You</span>
          </button>

          <button
            id="sort-latest-btn"
            onClick={() => setActiveSort("latest")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSort === "latest"
                ? "bg-red-600 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Latest</span>
          </button>

          <button
            id="sort-mostroasted-btn"
            onClick={() => setActiveSort("mostRoasted")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSort === "mostRoasted"
                ? "bg-red-600 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Most Roasted</span>
          </button>
        </div>

        <span className="text-[11px] text-zinc-500 shrink-0 hidden sm:inline">
          Showing {filteredPosts.length} stories
        </span>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            id={`filter-cat-${cat.replace(/\s+/g, "-")}`}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md border border-red-400/30"
                : "bg-[#14141d] hover:bg-[#1c1c28] text-zinc-400 hover:text-zinc-200 border border-zinc-800"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Stories Feed */}
      <div className="flex flex-col gap-5">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onShare={onShare}
              onReport={onReport}
              onTagClick={(tag) => setActiveTag(tag)}
            />
          ))
        ) : (
          <div className="py-16 text-center bg-[#101018] border border-zinc-800 rounded-2xl flex flex-col items-center gap-3">
            <Flame className="w-10 h-10 text-zinc-600" />
            <h3 className="text-base font-bold text-white">No stories match your filter</h3>
            <p className="text-xs text-zinc-400 max-w-xs">
              Try resetting your category or search query, or be the first to post in this category!
            </p>
            <button
              onClick={() => {
                setSelectedCategory("All");
                setActiveTag(null);
                setSearchQuery("");
              }}
              className="mt-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white rounded-xl transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
