import React from "react";
import { Roast } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { storage } from "../../services/storageService";
import { useToast } from "../../context/ToastContext";
import { Flame, ChevronUp, ChevronDown, Trash2, ShieldAlert, Crown } from "lucide-react";
import confetti from "canvas-confetti";

interface RoastCardProps {
  roast: Roast;
  postId: string;
  onReport: (roastId: string, authorUsername: string) => void;
}

export const RoastCard: React.FC<RoastCardProps> = ({ roast, postId, onReport }) => {
  const { currentUser, openAuthModal } = useAuth();
  const { roast: toastRoast, success, error } = useToast();

  const handleVote = async (direction: "up" | "down") => {
    if (!currentUser) {
      openAuthModal("signin");
      return;
    }

    try {
      const updated = await storage.voteRoast(postId, roast.id, direction);
      if (direction === "up" && updated.userVote === "up") {
        toastRoast("Flame Point Dropped! 🔥", "+10 Roast Points awarded to author");
        if (updated.score >= 10 && updated.score % 5 === 0) {
          confetti({
            particleCount: 30,
            spread: 60,
            origin: { y: 0.8 },
            colors: ["#ef233c", "#ff9f1c", "#ffffff"],
          });
        }
      }
    } catch (err: any) {
      error("Vote Failed", err.message || "Failed to submit vote");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this roast?")) {
      try {
        await storage.deleteRoast(postId, roast.id);
        success("Roast Deleted", "Your roast has been removed.");
      } catch (err: any) {
        error("Delete Failed", err.message || "Failed to delete roast");
      }
    }
  };

  const isOwnRoast = currentUser?.id === roast.authorId;

  return (
    <div
      id={`roast-card-${roast.id}`}
      className={`p-3.5 rounded-xl transition-all border ${
        roast.isTopRoast
          ? "bg-gradient-to-r from-red-950/40 via-[#181216] to-[#14141e] border-red-500/40 shadow-lg shadow-red-950/20"
          : "bg-[#14141d] border-zinc-800/80 hover:border-zinc-700/80"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Author info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={roast.authorAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80"}
            alt={roast.authorUsername}
            className="w-6 h-6 rounded-full object-cover border border-zinc-700 shrink-0"
          />
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-xs font-bold text-zinc-200 truncate">@{roast.authorUsername}</span>
            {roast.isTopRoast && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-red-600/30 text-red-300 border border-red-500/40 rounded-md shrink-0">
                <Crown className="w-2.5 h-2.5 text-amber-400" />
                <span>TOP ROAST</span>
              </span>
            )}
          </div>
        </div>

        {/* Voting & Actions */}
        <div className="flex items-center gap-2">
          {/* Vote Controls */}
          <div className="flex items-center bg-[#1c1c28] border border-zinc-800 rounded-lg p-0.5">
            <button
              id={`roast-upvote-${roast.id}`}
              onClick={() => handleVote("up")}
              title="Upvote Roast (+1 Flame)"
              className={`p-1 rounded-md transition-colors ${
                roast.userVote === "up"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-red-400 hover:bg-zinc-800"
              }`}
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>

            <span className={`px-1.5 text-xs font-extrabold ${
              roast.score > 0 ? "text-red-400" : roast.score < 0 ? "text-zinc-500" : "text-zinc-300"
            }`}>
              {roast.score > 0 ? `+${roast.score}` : roast.score}
            </span>

            <button
              id={`roast-downvote-${roast.id}`}
              onClick={() => handleVote("down")}
              title="Downvote Roast"
              className={`p-1 rounded-md transition-colors ${
                roast.userVote === "down"
                  ? "bg-zinc-700 text-zinc-200"
                  : "text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Delete (if own) or Report */}
          {isOwnRoast ? (
            <button
              id={`roast-delete-${roast.id}`}
              onClick={handleDelete}
              title="Delete your roast"
              className="text-zinc-500 hover:text-rose-400 p-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              id={`roast-report-${roast.id}`}
              onClick={() => onReport(roast.id, roast.authorUsername)}
              title="Report inappropriate roast"
              className="text-zinc-500 hover:text-red-400 p-1 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Roast Content */}
      <p className="text-xs text-zinc-200 mt-2 leading-relaxed font-medium pl-8">
        "{roast.content}"
      </p>
    </div>
  );
};
