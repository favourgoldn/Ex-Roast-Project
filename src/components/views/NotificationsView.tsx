import React, { useState } from "react";
import { Notification, TabType } from "../../types";
import { storage } from "../../services/storageService";
import { useAuth } from "../../context/AuthContext";
import { 
  Bell, 
  Flame, 
  MessageSquare, 
  Award, 
  UserPlus, 
  CheckCheck, 
  Clock,
  Trash2
} from "lucide-react";

interface NotificationsViewProps {
  onTabChange: (tab: TabType) => void;
  onSelectPost?: (postId: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onTabChange, onSelectPost }) => {
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  if (!currentUser) {
    return (
      <div className="py-20 text-center flex flex-col items-center gap-3">
        <Bell className="w-8 h-8 text-zinc-600" />
        <p className="text-xs text-zinc-400">Sign in to see your notifications and roast activity.</p>
        <button
          onClick={() => onTabChange("home")}
          className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl"
        >
          Return Home
        </button>
      </div>
    );
  }

  const notifications = storage.getNotifications(currentUser.id);
  const displayed = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const handleMarkAllRead = () => {
    storage.markAllNotificationsAsRead(currentUser.id);
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "roast_voted":
      case "post_reaction":
      case "top_roast_winner":
        return <Flame className="w-4 h-4 text-red-500 fill-red-500" />;
      case "roast_submitted":
      case "post_comment":
      case "comment_reply":
        return <MessageSquare className="w-4 h-4 text-amber-400" />;
      case "achievement_unlocked":
        return <Award className="w-4 h-4 text-amber-400" />;
      case "user_followed":
        return <UserPlus className="w-4 h-4 text-emerald-400" />;
      default:
        return <Bell className="w-4 h-4 text-zinc-400" />;
    }
  };

  const formatTime = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-black text-white font-display flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-500" />
            <span>Activity Notifications</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Roast votes, reactions, new comments, and flame points
          </p>
        </div>

        {notifications.some((n) => !n.read) && (
          <button
            id="notif-mark-all-read-btn"
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === "all" ? "bg-red-600 text-white" : "bg-[#14141e] text-zinc-400 hover:text-white"
          }`}
        >
          All Activity ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === "unread" ? "bg-red-600 text-white" : "bg-[#14141e] text-zinc-400 hover:text-white"
          }`}
        >
          Unread ({notifications.filter((n) => !n.read).length})
        </button>
      </div>

      {/* Notifications List */}
      <div className="flex flex-col gap-2.5">
        {displayed.length > 0 ? (
          displayed.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                storage.markNotificationAsRead(n.id);
                if (n.targetPostId) {
                  onTabChange("explore");
                  onSelectPost?.(n.targetPostId);
                }
              }}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                !n.read
                  ? "bg-[#181216] border-red-500/40 shadow-sm"
                  : "bg-[#111118] border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <div className="p-2 rounded-xl bg-[#1e141c] border border-zinc-800 shrink-0">
                {getIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white truncate">{n.title}</span>
                  <span className="text-[10px] text-zinc-500 shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(n.createdAt)}
                  </span>
                </div>

                <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">{n.message}</p>
              </div>

              {!n.read && (
                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1" />
              )}
            </div>
          ))
        ) : (
          <div className="py-16 text-center bg-[#111118] border border-zinc-800 rounded-2xl flex flex-col items-center gap-2">
            <Bell className="w-8 h-8 text-zinc-600" />
            <p className="text-xs text-zinc-400">You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
};
