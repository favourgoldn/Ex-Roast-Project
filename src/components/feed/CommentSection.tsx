import React, { useState } from "react";
import { Comment } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { storage } from "../../services/storageService";
import { useToast } from "../../context/ToastContext";
import { MessageSquare, Reply, Send, CornerDownRight } from "lucide-react";

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
}

export const CommentSection: React.FC<CommentSectionProps> = ({ postId, comments }) => {
  const { currentUser, openAuthModal } = useAuth();
  const { success } = useToast();
  const [commentText, setCommentText] = useState("");
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      openAuthModal("signin");
      return;
    }
    if (!commentText.trim()) return;

    storage.addComment(postId, commentText);
    setCommentText("");
    success("Comment Posted", "Your response has been added to the story.");
  };

  const handleAddReply = (commentId: string) => {
    if (!currentUser) {
      openAuthModal("signin");
      return;
    }
    const text = replyTextMap[commentId];
    if (!text || !text.trim()) return;

    storage.addReply(postId, commentId, text);
    setReplyTextMap((prev) => ({ ...prev, [commentId]: "" }));
    setActiveReplyId(null);
    success("Reply Posted", "Your reply was posted.");
  };

  return (
    <div className="pt-3 border-t border-zinc-800/80 flex flex-col gap-3">
      {/* Top Comment Input */}
      <form onSubmit={handleAddComment} className="flex items-center gap-2">
        <img
          src={currentUser?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80"}
          alt="Avatar"
          className="w-7 h-7 rounded-full object-cover border border-zinc-700 shrink-0"
        />
        <input
          id={`post-${postId}-comment-input`}
          type="text"
          placeholder={currentUser ? "Add your reaction or advice..." : "Sign in to join the conversation..."}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="flex-1 bg-[#181824] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
        />
        <button
          id={`post-${postId}-comment-submit`}
          type="submit"
          disabled={!commentText.trim()}
          className="p-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:hover:bg-red-600 text-white rounded-xl transition-colors shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Comment List */}
      {comments && comments.length > 0 ? (
        <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
          {comments.map((comm) => (
            <div key={comm.id} className="flex flex-col gap-1.5 p-2.5 bg-[#12121a] rounded-xl border border-zinc-800/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={comm.authorAvatar}
                    alt={comm.authorUsername}
                    className="w-5 h-5 rounded-full object-cover border border-zinc-700"
                  />
                  <span className="text-xs font-bold text-zinc-300">@{comm.authorUsername}</span>
                </div>
                <button
                  onClick={() => setActiveReplyId(activeReplyId === comm.id ? null : comm.id)}
                  className="text-[11px] text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                  <Reply className="w-3 h-3" />
                  <span>Reply</span>
                </button>
              </div>

              <p className="text-xs text-zinc-200 pl-7 leading-relaxed">{comm.content}</p>

              {/* Nested Replies */}
              {comm.replies && comm.replies.length > 0 && (
                <div className="ml-7 mt-1 pt-1.5 border-t border-zinc-800/50 flex flex-col gap-2">
                  {comm.replies.map((reply) => (
                    <div key={reply.id} className="flex items-start gap-2 bg-[#181824]/50 p-1.5 rounded-lg">
                      <CornerDownRight className="w-3 h-3 text-zinc-500 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-red-400 mr-1.5">@{reply.authorUsername}</span>
                        <span className="text-xs text-zinc-300">{reply.content}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* In-line Reply Box */}
              {activeReplyId === comm.id && (
                <div className="ml-7 mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Reply to @${comm.authorUsername}...`}
                    value={replyTextMap[comm.id] || ""}
                    onChange={(e) => setReplyTextMap({ ...replyTextMap, [comm.id]: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddReply(comm.id);
                    }}
                    className="flex-1 bg-[#181824] border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                  />
                  <button
                    onClick={() => handleAddReply(comm.id)}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-[11px] font-bold text-white rounded-lg transition-colors"
                  >
                    Reply
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-2 text-center text-xs text-zinc-500">
          No comments yet. Be the first to share your thoughts!
        </div>
      )}
    </div>
  );
};
