import React, { useState } from "react";
import { Post, ReactionType } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { storage } from "../../services/storageService";
import { useToast } from "../../context/ToastContext";
import { generateRoastSparks } from "../../services/aiService";
import { RoastCard } from "./RoastCard";
import { CommentSection } from "./CommentSection";
import { 
  Flame, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  MoreHorizontal, 
  Sparkles, 
  Crown, 
  Send, 
  Trash2, 
  ShieldAlert, 
  UserCheck, 
  UserPlus, 
  Clock,
  Tag,
  EyeOff
} from "lucide-react";
import confetti from "canvas-confetti";

interface PostCardProps {
  post: Post;
  onShare: (post: Post) => void;
  onReport: (targetId: string, authorUsername: string) => void;
  onTagClick?: (tag: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onShare,
  onReport,
  onTagClick,
}) => {
  const { currentUser, openAuthModal, toggleFollow, isFollowing } = useAuth();
  const { success, roast: toastRoast, error } = useToast();

  const [showRoasts, setShowRoasts] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [roastInput, setRoastInput] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isOwnPost = currentUser?.id === post.authorId;
  const following = isFollowing(post.authorId);

  // Time formatter
  const formatTime = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Reactions
  const handleReaction = (type: ReactionType) => {
    if (!currentUser) {
      openAuthModal("signin");
      return;
    }
    storage.toggleReaction(post.id, type);
  };

  // Toggle Save
  const handleSave = () => {
    if (!currentUser) {
      openAuthModal("signin");
      return;
    }
    const saved = storage.toggleSavePost(post.id);
    if (saved) {
      success("Saved to Favorites", "You can find this in your Profile > Saved tab.");
    } else {
      success("Removed from Saved", "Story removed from your saved list.");
    }
  };

  // Drop a Roast
  const handleDropRoast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      openAuthModal("signin");
      return;
    }
    if (!roastInput.trim()) return;

    if (roastInput.length < 5) {
      error("Roast too short", "Give it a little more bite!");
      return;
    }

    try {
      storage.addRoast(post.id, roastInput);
      setRoastInput("");
      setAiSuggestions([]);
      setShowRoasts(true);
      toastRoast("ROAST DROPPED! 🔥", "+25 Roast Points awarded! The community can now vote.");
      
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.8 },
        colors: ["#ef233c", "#ff9f1c", "#ffffff"],
      });
    } catch (err: any) {
      error("Failed to drop roast", err.message);
    }
  };

  // AI Roast Spark brainstormer
  const handleGenerateAiRoasts = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await generateRoastSparks(post.title, post.content, post.category);
      setAiSuggestions(res.roasts);
      toastRoast("AI Roast Sparks Ready ✨", "Click any suggestion to fill your roast!");
    } catch (err) {
      error("AI Assistant unavailable", "Try writing your own savage roast!");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Delete own post
  const handleDeletePost = () => {
    if (window.confirm("Are you sure you want to delete this story?")) {
      storage.deletePost(post.id);
      success("Story Deleted", "Your story has been permanently removed.");
    }
  };

  const topRoast = post.roasts.find((r) => r.isTopRoast) || (post.roasts.length > 0 ? post.roasts[0] : null);

  const categoryColorMap: Record<string, string> = {
    "Funny Ex": "bg-amber-500/15 text-amber-300 border-amber-500/30",
    "Red Flag": "bg-red-500/15 text-red-400 border-red-500/30",
    "Cheating": "bg-rose-600/20 text-rose-300 border-rose-500/40",
    "Ghosting": "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    "Worst Date": "bg-orange-500/15 text-orange-300 border-orange-500/30",
    "Toxic Relationship": "bg-purple-500/15 text-purple-300 border-purple-500/30",
    "Dumb Excuse": "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
    "Money": "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    "Breakup": "bg-pink-500/15 text-pink-300 border-pink-500/30",
  };

  return (
    <article
      id={`post-${post.id}`}
      className="bg-[#101017] border border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-xl hover:border-zinc-700/80 transition-all flex flex-col gap-4 relative overflow-hidden"
    >
      {/* Top Meta Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <img
              src={post.authorAvatar}
              alt={post.authorUsername}
              className="w-10 h-10 rounded-xl object-cover border border-zinc-700"
            />
            {post.isAnonymous && (
              <div
                title="Anonymous Story"
                className="absolute -bottom-1 -right-1 w-4 h-4 bg-zinc-900 border border-zinc-600 rounded-full flex items-center justify-center"
              >
                <EyeOff className="w-2.5 h-2.5 text-zinc-400" />
              </div>
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-white truncate">
                {post.isAnonymous ? (post.anonymousAlias || "Anonymous") : post.authorDisplayName}
              </span>
              <span className="text-[11px] text-zinc-400 truncate">
                @{post.isAnonymous ? "anonymous" : post.authorUsername}
              </span>

              {/* Follow Button if not anonymous & not self */}
              {!post.isAnonymous && !isOwnPost && currentUser && (
                <button
                  id={`post-follow-${post.authorId}`}
                  onClick={() => toggleFollow(post.authorId)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors ${
                    following
                      ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      : "bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30"
                  }`}
                >
                  {following ? <UserCheck className="w-2.5 h-2.5" /> : <UserPlus className="w-2.5 h-2.5" />}
                  <span>{following ? "Following" : "Follow"}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-400" />
                {formatTime(post.createdAt)}
              </span>
              <span>•</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                categoryColorMap[post.category] || "bg-zinc-800 text-zinc-300 border-zinc-700"
              }`}>
                {post.category}
              </span>
            </div>
          </div>
        </div>

        {/* Options Dropdown Button */}
        <div className="relative">
          <button
            id={`post-options-${post.id}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-1 w-44 bg-[#14141d] border border-zinc-800 rounded-xl shadow-2xl p-1.5 z-30 animate-in fade-in zoom-in-95">
              <button
                onClick={() => {
                  onShare(post);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/60 rounded-lg transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share Story
              </button>
              {isOwnPost ? (
                <button
                  onClick={() => {
                    handleDeletePost();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Story
                </button>
              ) : (
                <button
                  onClick={() => {
                    onReport(post.id, post.authorUsername);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Report Story
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Story Content */}
      <div className="flex flex-col gap-2.5">
        <h3 className="text-base sm:text-lg font-extrabold text-white leading-snug font-display">
          {post.title}
        </h3>

        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line font-normal">
          {post.content}
        </p>

        {/* Optional Image */}
        {post.imageUrl && (
          <div className="relative mt-1 rounded-xl overflow-hidden border border-zinc-800/80 bg-zinc-950 max-h-80">
            <img
              src={post.imageUrl}
              alt="Story proof"
              className="w-full h-full object-cover max-h-80 hover:scale-[1.01] transition-transform"
            />
          </div>
        )}

        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {post.hashtags.map((tag) => (
              <button
                key={tag}
                id={`post-${post.id}-tag-${tag}`}
                onClick={() => onTagClick?.(tag)}
                className="px-2 py-0.5 bg-[#161622] hover:bg-red-950/40 text-[11px] font-semibold text-red-400/90 hover:text-red-300 border border-zinc-800 hover:border-red-500/40 rounded-lg transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Featured Top Roast Highlight Box (If available) */}
      {topRoast && (
        <div className="bg-gradient-to-r from-red-950/30 via-[#181014] to-[#12121c] border border-red-500/40 rounded-xl p-3 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-400 uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5 fill-amber-400" />
              <span>TOP SAVAGE ROAST (+{topRoast.score} FLAMES)</span>
            </div>
            <span className="text-[10px] font-bold text-zinc-400">@{topRoast.authorUsername}</span>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-red-100 italic leading-snug">
            "{topRoast.content}"
          </p>
        </div>
      )}

      {/* Reactions Bar (🔥 Savage, 💀 Dead, 🚩 Red Flag, 👏 Deserved) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/80">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Savage 🔥 */}
          <button
            id={`post-react-savage-${post.id}`}
            onClick={() => handleReaction("savage")}
            title="Savage! (+15 pts)"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              post.userReaction === "savage"
                ? "bg-red-600 text-white shadow-md shadow-red-950/50"
                : "bg-[#181824] hover:bg-zinc-800 text-zinc-300"
            }`}
          >
            <span className="text-sm">🔥</span>
            <span>{post.reactions?.savage || 0}</span>
          </button>

          {/* Dead 💀 */}
          <button
            id={`post-react-dead-${post.id}`}
            onClick={() => handleReaction("dead")}
            title="I'm Dead 💀"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              post.userReaction === "dead"
                ? "bg-zinc-200 text-zinc-900 shadow-md"
                : "bg-[#181824] hover:bg-zinc-800 text-zinc-300"
            }`}
          >
            <span className="text-sm">💀</span>
            <span>{post.reactions?.dead || 0}</span>
          </button>

          {/* Red Flag 🚩 */}
          <button
            id={`post-react-redflag-${post.id}`}
            onClick={() => handleReaction("redFlag")}
            title="Massive Red Flag 🚩"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              post.userReaction === "redFlag"
                ? "bg-rose-700 text-white shadow-md shadow-rose-950/50"
                : "bg-[#181824] hover:bg-zinc-800 text-zinc-300"
            }`}
          >
            <span className="text-sm">🚩</span>
            <span>{post.reactions?.redFlag || 0}</span>
          </button>

          {/* Deserved 👏 */}
          <button
            id={`post-react-deserved-${post.id}`}
            onClick={() => handleReaction("deserved")}
            title="Well Deserved 👏"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              post.userReaction === "deserved"
                ? "bg-amber-600 text-white shadow-md"
                : "bg-[#181824] hover:bg-zinc-800 text-zinc-300"
            }`}
          >
            <span className="text-sm">👏</span>
            <span>{post.reactions?.deserved || 0}</span>
          </button>
        </div>

        {/* Secondary Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Roasts Toggle Button */}
          <button
            id={`post-toggle-roasts-${post.id}`}
            onClick={() => setShowRoasts(!showRoasts)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              showRoasts ? "bg-red-600/20 text-red-400 border border-red-500/30" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{post.roastsCount || post.roasts?.length || 0} Roasts</span>
          </button>

          {/* Comments Toggle Button */}
          <button
            id={`post-toggle-comments-${post.id}`}
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              showComments ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{post.commentsCount || 0}</span>
          </button>

          {/* Share */}
          <button
            id={`post-share-btn-${post.id}`}
            onClick={() => onShare(post)}
            title="Share Story"
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Save */}
          <button
            id={`post-save-btn-${post.id}`}
            onClick={handleSave}
            title={post.userSaved ? "Saved" : "Save Story"}
            className={`p-1.5 rounded-xl transition-colors ${
              post.userSaved ? "text-amber-400 fill-amber-400" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <Bookmark className={`w-4 h-4 ${post.userSaved ? "fill-amber-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Expandable Roasts Section & Drop a Roast Composer */}
      {showRoasts && (
        <div className="pt-3 border-t border-zinc-800/80 flex flex-col gap-3">
          {/* Drop a Roast Form */}
          <div className="bg-[#14141e] border border-zinc-800 rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Flame className="w-4 h-4 text-red-500" />
                <span>Got a better line? Drop your roast...</span>
              </div>

              {/* AI Roast Spark Generator Button */}
              <button
                id={`post-ai-spark-btn-${post.id}`}
                type="button"
                onClick={handleGenerateAiRoasts}
                disabled={isGeneratingAi}
                className="flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/40 px-2.5 py-1 rounded-lg transition-colors"
              >
                <Sparkles className={`w-3 h-3 ${isGeneratingAi ? "animate-spin" : ""}`} />
                <span>{isGeneratingAi ? "Thinking..." : "AI Roast Spark"}</span>
              </button>
            </div>

            {/* AI Suggestion Chips */}
            {aiSuggestions.length > 0 && (
              <div className="flex flex-col gap-1.5 p-2 bg-[#1b151e] border border-amber-500/30 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  ✨ AI Sparks (Click to use):
                </span>
                {aiSuggestions.map((sug, i) => (
                  <button
                    key={i}
                    id={`ai-suggestion-${post.id}-${i}`}
                    type="button"
                    onClick={() => setRoastInput(sug)}
                    className="text-left text-xs text-zinc-200 hover:text-white p-1.5 hover:bg-zinc-800/80 rounded-md transition-colors border border-transparent hover:border-zinc-700 leading-tight"
                  >
                    "{sug}"
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleDropRoast} className="flex items-center gap-2">
              <input
                id={`post-roast-input-${post.id}`}
                type="text"
                placeholder="Deliver your savage one-liner..."
                value={roastInput}
                onChange={(e) => setRoastInput(e.target.value)}
                maxLength={200}
                className="flex-1 bg-[#1a1a26] border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
              />
              <button
                id={`post-drop-roast-submit-${post.id}`}
                type="submit"
                disabled={!roastInput.trim()}
                className="px-3.5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-40 disabled:hover:from-red-600 text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0 flex items-center gap-1"
              >
                <span>DROP ROAST</span>
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>

          {/* List of Community Roasts */}
          {post.roasts && post.roasts.length > 0 ? (
            <div className="flex flex-col gap-2">
              {post.roasts.map((r) => (
                <RoastCard
                  key={r.id}
                  roast={r}
                  postId={post.id}
                  onReport={(roastId, author) => onReport(roastId, author)}
                />
              ))}
            </div>
          ) : (
            <div className="py-2 text-center text-xs text-zinc-500">
              No roasts yet. Be the first to cook this ex!
            </div>
          )}
        </div>
      )}

      {/* Expandable Comments Section */}
      {showComments && (
        <CommentSection postId={post.id} comments={post.comments || []} />
      )}
    </article>
  );
};
