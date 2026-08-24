import React from "react";
import { EmberBackground } from "../common/EmberBackground";
import { Post, TabType } from "../../types";
import { PostCard } from "../feed/PostCard";
import { storage } from "../../services/storageService";
import { useAuth } from "../../context/AuthContext";
import { 
  Flame, 
  Sparkles, 
  ArrowRight, 
  Crown, 
  ShieldCheck, 
  MessageSquare, 
  Award, 
  TrendingUp, 
  Zap, 
  Smile, 
  CheckCircle2 
} from "lucide-react";

interface HomeViewProps {
  onTabChange: (tab: TabType) => void;
  onOpenCreate: () => void;
  onShare: (post: Post) => void;
  onReport: (targetId: string, author: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onTabChange,
  onOpenCreate,
  onShare,
  onReport,
}) => {
  const { currentUser, openAuthModal } = useAuth();
  const posts = storage.getPosts();
  const topRoasters = storage.getTopRoasters().slice(0, 5);
  const roastOfTheDay = storage.getRoastOfTheDay();
  const trendingPosts = posts.slice(0, 2);

  return (
    <div className="flex flex-col gap-12 sm:gap-16 pb-20 overflow-hidden">
      {/* 1. CINEMATIC HERO SECTION */}
      <section className="relative min-h-[580px] lg:min-h-[640px] flex flex-col items-center justify-center text-center px-4 pt-12 pb-16 bg-gradient-to-b from-[#140b0f] via-[#0e0a10] to-[#09090b] border-b border-zinc-800/80">
        {/* Animated subtle ember particles */}
        <EmberBackground density="medium" />

        {/* Ambient Crimson Glow Sphere */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-red-600/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center gap-6">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-bold shadow-lg shadow-red-950/40 backdrop-blur-md">
            <Flame className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
            <span>THE INTERNET'S PREMIER ANONYMOUS EX ROAST CLUB</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white font-display leading-[1.08] uppercase">
            YOUR EX DID YOU <span className="bg-gradient-to-r from-red-500 via-rose-500 to-amber-400 bg-clip-text text-transparent">DIRTY.</span>
            <br />
            NOW LET THEM GET <span className="bg-gradient-to-r from-amber-400 via-rose-500 to-red-500 bg-clip-text text-transparent">ROASTED.</span>
          </h1>

          {/* Supporting Copy */}
          <p className="text-base sm:text-lg text-zinc-300 max-w-xl leading-relaxed font-medium">
            Tell the story. Drop the roast. Laugh about it. Move on.
          </p>

          {/* Primary CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto mt-2">
            <button
              id="hero-roast-ex-cta-btn"
              onClick={onOpenCreate}
              className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-sm rounded-xl shadow-xl shadow-red-950/60 hover:shadow-red-600/30 transition-all flex items-center justify-center gap-2 transform active:scale-95"
            >
              <Flame className="w-4 h-4" />
              <span>Roast Your Ex</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="hero-explore-cta-btn"
              onClick={() => onTabChange("explore")}
              className="w-full sm:w-auto px-7 py-3.5 bg-[#14141d]/90 hover:bg-[#1f1f2c] border border-zinc-700 text-zinc-200 hover:text-white font-bold text-sm rounded-xl backdrop-blur-md transition-all flex items-center justify-center gap-2"
            >
              <span>Explore Roasts</span>
            </button>
          </div>

          {/* Live Platform Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-8 mt-4 border-t border-zinc-800/80 w-full max-w-md">
            <div>
              <p className="text-xl sm:text-2xl font-black text-white font-display">12.4K+</p>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Stories Shared</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-red-400 font-display">84.9K+</p>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Savage Roasts</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-amber-400 font-display">100%</p>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Anonymous</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ROAST OF THE DAY BANNER */}
      {roastOfTheDay && (
        <section className="max-w-5xl mx-auto px-4 w-full">
          <div className="relative p-6 sm:p-8 bg-gradient-to-r from-red-950/40 via-[#181115] to-[#14141e] border-2 border-amber-500/40 rounded-3xl shadow-2xl shadow-red-950/30 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
                  <Crown className="w-5 h-5 fill-amber-400" />
                </div>
                <div>
                  <span className="text-[11px] uppercase font-black tracking-widest text-amber-400">
                    🏆 OFFICIAL ROAST OF THE DAY
                  </span>
                  <p className="text-xs text-zinc-400">Voted #1 by the community</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-red-600/30 border border-red-500/40 rounded-full text-xs font-black text-red-300 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-red-400" />
                  <span>+{roastOfTheDay.score} FLAME SCORE</span>
                </span>
              </div>
            </div>

            <p className="text-base sm:text-xl font-bold text-white mb-3 italic leading-relaxed">
              "{roastOfTheDay.content}"
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-800 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <img
                  src={roastOfTheDay.authorAvatar}
                  alt={roastOfTheDay.authorUsername}
                  className="w-6 h-6 rounded-full object-cover border border-zinc-700"
                />
                <span>Roasted by <strong className="text-zinc-200">@{roastOfTheDay.authorUsername}</strong></span>
              </div>
              <span className="text-[11px] text-zinc-500">Story: "{roastOfTheDay.postTitle}"</span>
            </div>
          </div>
        </section>
      )}

      {/* 3. TRENDING ROASTS SECTION */}
      <section className="max-w-5xl mx-auto px-4 w-full flex flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-red-500 uppercase tracking-wider mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>Trending Right Now</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
              Latest Hot Ex Stories
            </h2>
          </div>

          <button
            id="home-view-all-stories-btn"
            onClick={() => onTabChange("explore")}
            className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
          >
            <span>View All Stories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Stories Feed Preview */}
        <div className="flex flex-col gap-4">
          {trendingPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onShare={onShare}
              onReport={onReport}
              onTagClick={() => onTabChange("explore")}
            />
          ))}
        </div>
      </section>

      {/* 4. HOW EX ROAST WORKS (4-STEP GUIDE) */}
      <section className="max-w-5xl mx-auto px-4 w-full">
        <div className="p-8 sm:p-10 bg-[#101017] border border-zinc-800/80 rounded-3xl shadow-xl flex flex-col items-center text-center">
          <span className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">
            SIMPLE & CATHARTIC
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-display mb-3">
            How Ex Roast Works
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mb-8">
            Turning awkward breakups, ghosting incidents, and red flags into community comedy.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {/* Step 1 */}
            <div className="p-5 bg-[#161622] border border-zinc-800/80 rounded-2xl flex flex-col items-center text-center relative">
              <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-500/30 flex items-center justify-center text-red-400 font-black text-lg mb-3">
                1
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Tell Your Story</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Post anonymously or with your handle. Set the category and spill the tea.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-5 bg-[#161622] border border-zinc-800/80 rounded-2xl flex flex-col items-center text-center relative">
              <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-lg mb-3">
                2
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Let The Crowd Roast</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                The community delivers creative, savage burns and hilarious reality checks.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-5 bg-[#161622] border border-zinc-800/80 rounded-2xl flex flex-col items-center text-center relative">
              <div className="w-12 h-12 rounded-xl bg-rose-950/60 border border-rose-500/30 flex items-center justify-center text-rose-400 font-black text-lg mb-3">
                3
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Vote The Funniest</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Upvote the sharpest burns into the prestigious Roast Hall of Fame.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-5 bg-[#161622] border border-zinc-800/80 rounded-2xl flex flex-col items-center text-center relative">
              <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-lg mb-3">
                4
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Laugh & Move On</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Reclaim your peace of mind with a smile. Unbothered and thriving.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TOP ROASTERS HALL OF FAME PREVIEW */}
      <section className="max-w-5xl mx-auto px-4 w-full flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
              <Award className="w-4 h-4" />
              <span>Leaderboard</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
              Top Roasters
            </h2>
          </div>

          <button
            id="home-view-hall-of-fame-btn"
            onClick={() => onTabChange("hall-of-fame")}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
          >
            <span>Full Hall of Fame</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {topRoasters.slice(0, 3).map((user, index) => (
            <div
              key={user.id}
              className="p-4 bg-[#12121c] border border-zinc-800/80 rounded-2xl flex items-center justify-between hover:border-amber-500/40 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                  index === 0 ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" : "bg-zinc-800 text-zinc-300"
                }`}>
                  #{index + 1}
                </div>
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="w-10 h-10 rounded-xl object-cover border border-zinc-700 shrink-0"
                />
                <div className="truncate">
                  <p className="text-xs font-bold text-white truncate">@{user.username}</p>
                  <p className="text-[11px] text-zinc-400 truncate">{user.winsCount} Top Roast Wins</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-black text-red-400">{user.roastPoints.toLocaleString()}</span>
                <span className="text-[9px] block text-zinc-500 uppercase font-bold">PTS</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. FINAL CALL TO ACTION */}
      <section className="max-w-5xl mx-auto px-4 w-full">
        <div className="relative p-8 sm:p-12 bg-gradient-to-b from-[#1c0e14] to-[#120f16] border border-red-500/30 rounded-3xl text-center flex flex-col items-center gap-5 overflow-hidden shadow-2xl shadow-red-950/40">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />

          <Flame className="w-10 h-10 text-red-500 animate-bounce" />

          <h2 className="text-3xl sm:text-5xl font-black text-white font-display max-w-lg">
            Got an ex with a story?
          </h2>

          <p className="text-xs sm:text-sm text-zinc-300 max-w-md leading-relaxed">
            Give the internet the details. Watch the roasts roll in and claim your peace of mind.
          </p>

          <button
            id="home-final-cta-btn"
            onClick={() => {
              if (!currentUser) {
                openAuthModal("signup");
              } else {
                onOpenCreate();
              }
            }}
            className="px-8 py-4 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:opacity-95 text-white font-black text-sm rounded-2xl shadow-xl shadow-red-950/60 transition-all transform active:scale-95 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Enter Ex Roast</span>
          </button>
        </div>
      </section>
    </div>
  );
};
