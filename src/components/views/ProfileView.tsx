import React, { useState } from "react";
import { User, Post, TabType } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { storage } from "../../services/storageService";
import { PostCard } from "../feed/PostCard";
import { useToast } from "../../context/ToastContext";
import { 
  Flame, 
  Award, 
  Bookmark, 
  Edit3, 
  Share2, 
  UserCheck, 
  UserPlus, 
  ShieldCheck, 
  Check, 
  X, 
  Heart,
  Users,
  Settings,
  ShieldAlert,
  UserX,
  Lock
} from "lucide-react";

interface ProfileViewProps {
  userId?: string;
  onTabChange: (tab: TabType) => void;
  onShare: (post: Post) => void;
  onReport: (targetId: string, author: string) => void;
  onOpenCreate: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userId,
  onTabChange,
  onShare,
  onReport,
  onOpenCreate,
}) => {
  const { 
    currentUser, 
    updateProfile, 
    toggleFollow, 
    isFollowing, 
    allUsers, 
    openSettingsModal,
    openConnectionsModal,
    sendFriendRequest,
    isFriend,
    unfriend,
    blockUser,
    isBlocked,
    getFriends,
    getFriendRequests
  } = useAuth();
  
  const { success, roast } = useToast();

  const [activeTab, setActiveTab] = useState<"posts" | "roasts" | "friends" | "saved">("posts");
  const [isEditing, setIsEditing] = useState(false);

  // Target user calculation
  const targetUser: User | null = userId
    ? allUsers.find((u) => u.id === userId || u.username.toLowerCase() === userId.toLowerCase()) || currentUser
    : currentUser;

  // Edit Profile Form State
  const [editDisplayName, setEditDisplayName] = useState(targetUser?.displayName || "");
  const [editBio, setEditBio] = useState(targetUser?.bio || "");
  const [editStatus, setEditStatus] = useState(targetUser?.relationshipStatus || "Single & Unbothered");
  const [editAvatar, setEditAvatar] = useState(targetUser?.avatarUrl || "");

  if (!targetUser) {
    return (
      <div className="py-20 text-center flex flex-col items-center gap-3">
        <p className="text-zinc-400">Please sign in to view your profile.</p>
        <button
          onClick={() => onTabChange("home")}
          className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl"
        >
          Go to Home Feed
        </button>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === targetUser.id;
  const userPosts = storage.getPostsByAuthor(targetUser.id);
  const userSavedPosts = storage.getSavedPosts(targetUser.id);
  const allPosts = storage.getPosts();
  const targetFriends = getFriends(targetUser.id);

  const { sent: pendingSent } = currentUser ? getFriendRequests() : { sent: [] };
  const hasSentFriendReq = pendingSent.some((r) => r.receiverId === targetUser.id);
  const userIsFriend = currentUser ? isFriend(targetUser.id) : false;
  const userIsFollowing = currentUser ? isFollowing(targetUser.id) : false;
  const userIsBlocked = currentUser ? isBlocked(targetUser.id) : false;

  // Find all roasts posted by this user across all posts
  const userRoasts = allPosts.flatMap((post) =>
    post.roasts
      .filter((r) => r.authorId === targetUser.id)
      .map((r) => ({ ...r, postTitle: post.title, postId: post.id }))
  );

  const AVATAR_OPTIONS = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
  ];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      displayName: editDisplayName,
      bio: editBio,
      relationshipStatus: editStatus,
      avatarUrl: editAvatar,
    });
    setIsEditing(false);
  };

  const handleShareProfile = () => {
    navigator.clipboard.writeText(`${window.location.origin}/#profile-${targetUser.username}`);
    success("Profile Link Copied!", `Share @${targetUser.username}'s roast card with friends.`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6 pb-24">
      {/* 1. HERO PROFILE CARD */}
      <div className="relative p-6 sm:p-8 bg-[#111118] border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Avatar & Identifiers */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={targetUser.avatarUrl}
                alt={targetUser.username}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-red-500/50 shadow-xl"
              />
              <div className="absolute -bottom-2 -right-2 p-1.5 bg-red-600 text-white rounded-xl shadow-md">
                <Flame className="w-4 h-4 fill-white" />
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white font-display">
                  {targetUser.displayName}
                </h1>
                {targetUser.isVerified && <ShieldCheck className="w-4 h-4 text-red-500" />}
              </div>

              <p className="text-xs font-bold text-red-400">@{targetUser.username}</p>

              {targetUser.relationshipStatus && (
                <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700 text-[10px] font-semibold text-zinc-300 w-fit">
                  <Heart className="w-3 h-3 text-rose-400" />
                  <span>{targetUser.relationshipStatus}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap">
            {isOwnProfile ? (
              <>
                <button
                  id="profile-edit-btn"
                  onClick={() => {
                    setEditDisplayName(targetUser.displayName);
                    setEditBio(targetUser.bio || "");
                    setEditStatus(targetUser.relationshipStatus || "");
                    setEditAvatar(targetUser.avatarUrl);
                    setIsEditing(true);
                  }}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>

                <button
                  id="profile-settings-btn"
                  onClick={openSettingsModal}
                  className="p-2 bg-[#181824] hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors"
                  title="Privacy & Account Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </>
            ) : (
              currentUser && (
                <>
                  {/* Friend Request Button */}
                  {userIsFriend ? (
                    <button
                      id={`profile-unfriend-btn-${targetUser.id}`}
                      onClick={() => unfriend(targetUser.id)}
                      className="px-3.5 py-2 bg-emerald-950/40 border border-emerald-500/30 hover:border-rose-500/40 text-emerald-400 hover:text-rose-400 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                      title="Click to Unfriend"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Friends ✓</span>
                    </button>
                  ) : hasSentFriendReq ? (
                    <span className="px-3.5 py-2 bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-bold rounded-xl flex items-center gap-1.5">
                      <span>Request Sent ⏳</span>
                    </span>
                  ) : (
                    <button
                      id={`profile-add-friend-btn-${targetUser.id}`}
                      onClick={() => sendFriendRequest(targetUser.id)}
                      className="px-3.5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add Friend</span>
                    </button>
                  )}

                  {/* Follow Button */}
                  <button
                    id={`profile-follow-btn-${targetUser.id}`}
                    onClick={() => toggleFollow(targetUser.id)}
                    className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
                      userIsFollowing
                        ? "bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700"
                        : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
                    }`}
                  >
                    <span>{userIsFollowing ? "Following" : "Follow"}</span>
                  </button>

                  {/* Block / Report User */}
                  <button
                    id={`profile-block-btn-${targetUser.id}`}
                    onClick={() => blockUser(targetUser.id)}
                    className="p-2 bg-[#181824] hover:bg-rose-950/40 border border-zinc-800 text-zinc-500 hover:text-rose-400 rounded-xl transition-colors"
                    title="Block this user"
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                </>
              )
            )}

            <button
              id="profile-share-btn"
              onClick={handleShareProfile}
              className="p-2 bg-[#181824] hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors"
              title="Share profile"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bio */}
        {targetUser.bio && (
          <p className="text-xs sm:text-sm text-zinc-300 mt-4 leading-relaxed max-w-2xl">
            "{targetUser.bio}"
          </p>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-6 mt-6 border-t border-zinc-800/80">
          <div className="p-3 bg-[#161622] rounded-xl border border-zinc-800/60 text-center">
            <span className="text-xl font-black text-red-400 font-display">
              {targetUser.roastPoints.toLocaleString()}
            </span>
            <p className="text-[10px] text-zinc-400 uppercase font-bold mt-0.5">Roast Points</p>
          </div>

          <div className="p-3 bg-[#161622] rounded-xl border border-zinc-800/60 text-center">
            <span className="text-xl font-black text-white font-display">
              {userPosts.length}
            </span>
            <p className="text-[10px] text-zinc-400 uppercase font-bold mt-0.5">Stories</p>
          </div>

          <div className="p-3 bg-[#161622] rounded-xl border border-zinc-800/60 text-center">
            <span className="text-xl font-black text-amber-400 font-display">
              {userRoasts.length}
            </span>
            <p className="text-[10px] text-zinc-400 uppercase font-bold mt-0.5">Roasts</p>
          </div>

          <div 
            onClick={() => isOwnProfile && openConnectionsModal("friends")}
            className={`p-3 bg-[#161622] rounded-xl border border-zinc-800/60 text-center ${isOwnProfile ? "cursor-pointer hover:border-red-500/40" : ""}`}
          >
            <span className="text-xl font-black text-zinc-200 font-display">
              {targetFriends.length}
            </span>
            <p className="text-[10px] text-zinc-400 uppercase font-bold mt-0.5">Friends</p>
          </div>

          <div 
            onClick={() => isOwnProfile && openConnectionsModal("following")}
            className={`p-3 bg-[#161622] rounded-xl border border-zinc-800/60 text-center ${isOwnProfile ? "cursor-pointer hover:border-red-500/40" : ""}`}
          >
            <span className="text-xl font-black text-zinc-200 font-display">
              {targetUser.followersCount || 0}
            </span>
            <p className="text-[10px] text-zinc-400 uppercase font-bold mt-0.5">Followers</p>
          </div>
        </div>
      </div>

      {/* 2. ACHIEVEMENTS & BADGES SECTION */}
      <div className="p-5 bg-[#111118] border border-zinc-800 rounded-2xl flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
          <Award className="w-4 h-4" />
          <span>Earned Badges & Social Accolades</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {(targetUser.badges && targetUser.badges.length > 0 ? targetUser.badges : [
            "👑 Roast King",
            "🛡️ Heartbreak Veteran",
            "🚩 Red Flag Radar",
            "💀 Certified Savage",
          ]).map((badge, idx) => (
            <div
              key={idx}
              className="p-2.5 bg-[#161622] border border-zinc-800 rounded-xl text-center flex flex-col items-center justify-center gap-1"
            >
              <span className="text-xs font-bold text-zinc-200">{badge}</span>
              <span className="text-[9px] text-zinc-500 uppercase">Unlocked</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. PROFILE TABS (Stories | Roasts | Friends | Saved) */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto">
          <button
            id="profile-tab-posts"
            onClick={() => setActiveTab("posts")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "posts"
                ? "bg-red-600 text-white shadow-md"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            }`}
          >
            Stories ({userPosts.length})
          </button>

          <button
            id="profile-tab-roasts"
            onClick={() => setActiveTab("roasts")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "roasts"
                ? "bg-red-600 text-white shadow-md"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            }`}
          >
            Roasts Dropped ({userRoasts.length})
          </button>

          <button
            id="profile-tab-friends"
            onClick={() => setActiveTab("friends")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "friends"
                ? "bg-red-600 text-white shadow-md"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            }`}
          >
            Friends ({targetFriends.length})
          </button>

          {isOwnProfile && (
            <button
              id="profile-tab-saved"
              onClick={() => setActiveTab("saved")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === "saved"
                  ? "bg-red-600 text-white shadow-md"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved ({userSavedPosts.length})</span>
            </button>
          )}
        </div>

        {/* Tab Content: Stories */}
        {activeTab === "posts" && (
          <div className="flex flex-col gap-4">
            {userPosts.length > 0 ? (
              userPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onShare={onShare}
                  onReport={onReport}
                />
              ))
            ) : (
              <div className="py-12 text-center bg-[#111118] border border-zinc-800 rounded-2xl flex flex-col items-center gap-3">
                <p className="text-xs text-zinc-400">No stories shared yet.</p>
                {isOwnProfile && (
                  <button
                    onClick={onOpenCreate}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl"
                  >
                    Post Your First Story
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Roasts Dropped */}
        {activeTab === "roasts" && (
          <div className="flex flex-col gap-3">
            {userRoasts.length > 0 ? (
              userRoasts.map((roast) => (
                <div
                  key={roast.id}
                  className="p-4 bg-[#111118] border border-zinc-800 rounded-2xl flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400">
                      On story: <strong className="text-zinc-200">"{roast.postTitle}"</strong>
                    </span>
                    <span className="px-2 py-0.5 bg-red-950/60 text-red-400 border border-red-500/30 rounded-md text-xs font-bold flex items-center gap-1">
                      <Flame className="w-3 h-3 fill-red-400" />
                      <span>+{roast.score} pts</span>
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-white font-medium italic">
                    "{roast.content}"
                  </p>
                </div>
              ))
            ) : (
              <div className="py-12 text-center bg-[#111118] border border-zinc-800 rounded-2xl text-xs text-zinc-400">
                No roasts submitted yet. Check the Explore feed and drop some heat!
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Friends */}
        {activeTab === "friends" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {targetFriends.length > 0 ? (
              targetFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-3.5 bg-[#181824] border border-zinc-800 rounded-2xl"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={friend.avatarUrl}
                      alt={friend.username}
                      className="w-10 h-10 rounded-xl object-cover border border-zinc-700"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        {friend.displayName}
                      </h4>
                      <p className="text-[11px] text-zinc-400">@{friend.username}</p>
                    </div>
                  </div>

                  <span className="text-[10px] text-amber-400 font-bold bg-amber-950/40 px-2 py-1 rounded-md border border-amber-500/20">
                    {friend.roastPoints} pts
                  </span>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center bg-[#111118] border border-zinc-800 rounded-2xl text-xs text-zinc-400">
                No friends connected yet.
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Saved Stories */}
        {activeTab === "saved" && isOwnProfile && (
          <div className="flex flex-col gap-4">
            {userSavedPosts.length > 0 ? (
              userSavedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onShare={onShare}
                  onReport={onReport}
                />
              ))
            ) : (
              <div className="py-12 text-center bg-[#111118] border border-zinc-800 rounded-2xl text-xs text-zinc-400">
                No saved stories yet. Click the bookmark icon on any story to save it here.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. EDIT PROFILE MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-[#111118] border border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsEditing(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white font-display mb-4">Edit Profile</h3>

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Choose Avatar
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {AVATAR_OPTIONS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setEditAvatar(url)}
                      className={`relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                        editAvatar === url ? "border-red-500 scale-105" : "border-zinc-800 opacity-60"
                      }`}
                    >
                      <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                      {editAvatar === url && (
                        <div className="absolute inset-0 bg-red-600/30 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full bg-[#181822] border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Current Relationship Status Badge
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dodged a Nuclear Missile"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-[#181822] border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Bio / Tagline
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full bg-[#181822] border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-zinc-800 text-xs font-semibold text-zinc-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-red-950/50"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
