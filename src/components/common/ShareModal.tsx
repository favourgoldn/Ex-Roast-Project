import React, { useState } from "react";
import { Post } from "../../types";
import { useToast } from "../../context/ToastContext";
import { X, Copy, Check, Share2, Flame, Twitter, MessageCircle } from "lucide-react";
import { Logo } from "./Logo";

interface ShareModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ post, isOpen, onClose }) => {
  const { success } = useToast();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !post) return null;

  const shareUrl = `${window.location.origin}/#post-${post.id}`;
  const shareText = `Check out this savage ex story on EX ROAST: "${post.title}" 🔥`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    success("Link Copied!", "Share it with your friends or group chat.");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank");
  };

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
    window.open(url, "_blank");
  };

  const topRoast = post.roasts.find((r) => r.isTopRoast) || post.roasts[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-[#111118] border border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        <button
          id="share-modal-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Share2 className="w-5 h-5 text-red-500" />
          <h3 className="text-base font-bold text-white font-display">Share Story & Roasts</h3>
        </div>

        {/* Story Quote Preview Card */}
        <div className="p-4 bg-gradient-to-br from-[#181216] to-[#12121a] border border-red-900/40 rounded-xl mb-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-red-400">
              EX ROAST #{post.category.toUpperCase()}
            </span>
            <span className="text-[10px] text-zinc-400">
              by @{post.isAnonymous ? (post.anonymousAlias || "Anonymous") : post.authorUsername}
            </span>
          </div>

          <p className="text-xs font-bold text-white mb-2 leading-snug">
            "{post.title}"
          </p>

          {topRoast && (
            <div className="pt-2.5 mt-2 border-t border-zinc-800/80">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-amber-400 mb-1">
                <Flame className="w-3 h-3 fill-amber-400" />
                <span>TOP ROAST (+{topRoast.score} pts)</span>
              </div>
              <p className="text-[11px] text-zinc-300 italic">
                "{topRoast.content}"
              </p>
            </div>
          )}
        </div>

        {/* Copy Link Input */}
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 bg-[#181822] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 select-all focus:outline-none"
          />
          <button
            id="share-modal-copy-btn"
            onClick={handleCopyLink}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shrink-0"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>

        {/* Social Share Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            id="share-twitter-btn"
            onClick={handleTwitterShare}
            className="py-2.5 px-3 bg-[#181824] hover:bg-[#202030] border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-200 flex items-center justify-center gap-2 transition-colors"
          >
            <Twitter className="w-4 h-4 text-sky-400" />
            <span>Share to X / Twitter</span>
          </button>
          <button
            id="share-whatsapp-btn"
            onClick={handleWhatsAppShare}
            className="py-2.5 px-3 bg-[#181824] hover:bg-[#202030] border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-200 flex items-center justify-center gap-2 transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>Send on WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
