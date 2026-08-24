import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { 
  X, 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  Search, 
  Check, 
  Clock, 
  Flame, 
  ShieldCheck, 
  Sparkles,
  ArrowRight
} from "lucide-react";
import { User, FriendRequest } from "../../types";

interface ConnectionsModalProps {
  onNavigateToProfile?: (username: string) => void;
}

export const ConnectionsModal: React.FC<ConnectionsModalProps> = ({ onNavigateToProfile }) => {
  const {
    isConnectionsModalOpen,
    closeConnectionsModal,
    connectionsModalTab,
    openConnectionsModal,
    currentUser,
    allUsers,
    getFriends,
    getFriendRequests,
    respondFriendRequest,
    sendFriendRequest,
    unfriend,
    isFriend,
    toggleFollow,
    isFollowing,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "following" | "discover">(
    connectionsModalTab || "friends"
  );
  const [searchQuery, setSearchQuery] = useState("");

  if (!isConnectionsModalOpen || !currentUser) return null;

  const friends = getFriends();
  const { received: receivedRequests, sent: sentRequests } = getFriendRequests();
  const followingUsers = allUsers.filter((u) => isFollowing(u.id));
  const followerUsers = allUsers.filter((u) => u.id !== currentUser.id && Math.random() > 0.3); // active followers

  const filteredDiscoverUsers = allUsers
    .filter((u) => u.id !== currentUser.id)
    .filter((u) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        u.username.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        u.bio.toLowerCase().includes(q)
      );
    });

  const handleProfileClick = (username: string) => {
    closeConnectionsModal();
    if (onNavigateToProfile) {
      onNavigateToProfile(username);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-[#111118] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#14141e]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-600/10 border border-red-500/20 text-red-500">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Social Connections & Friends</h2>
              <p className="text-xs text-zinc-400">Manage friend requests, connections, and discover roasters</p>
            </div>
          </div>
          <button
            id="connections-modal-close-btn"
            onClick={closeConnectionsModal}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 bg-[#13131c] border-b border-zinc-800/80 p-1.5 text-xs font-semibold">
          <button
            id="conn-tab-friends"
            onClick={() => setActiveTab("friends")}
            className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "friends" ? "bg-red-600 text-white shadow" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span>Friends ({friends.length})</span>
          </button>

          <button
            id="conn-tab-requests"
            onClick={() => setActiveTab("requests")}
            className={`relative py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "requests" ? "bg-red-600 text-white shadow" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span>Requests</span>
            {receivedRequests.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[10px] font-extrabold flex items-center justify-center">
                {receivedRequests.length}
              </span>
            )}
          </button>

          <button
            id="conn-tab-following"
            onClick={() => setActiveTab("following")}
            className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "following" ? "bg-red-600 text-white shadow" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span>Following ({followingUsers.length})</span>
          </button>

          <button
            id="conn-tab-discover"
            onClick={() => setActiveTab("discover")}
            className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "discover" ? "bg-red-600 text-white shadow" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Discover</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 p-5 overflow-y-auto bg-[#101017] min-h-[320px]">
          {/* 1. FRIENDS LIST */}
          {activeTab === "friends" && (
            <div className="flex flex-col gap-3">
              {friends.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-white mb-1">No friends added yet</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
                    Send friend requests to connect with your favorite creators and view their friend-exclusive roasts.
                  </p>
                  <button
                    onClick={() => setActiveTab("discover")}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all inline-flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Discover Users to Connect</span>
                  </button>
                </div>
              ) : (
                friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-3.5 bg-[#181824] border border-zinc-800/80 rounded-2xl hover:border-zinc-700 transition-all"
                  >
                    <div
                      onClick={() => handleProfileClick(friend.username)}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <img
                        src={friend.avatarUrl}
                        alt={friend.username}
                        className="w-11 h-11 rounded-xl object-cover border border-zinc-700 group-hover:border-red-500 transition-colors"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-white group-hover:text-red-400 transition-colors">
                            {friend.displayName}
                          </h4>
                          {friend.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-red-500" />}
                        </div>
                        <p className="text-[11px] text-zinc-400">@{friend.username}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-bold bg-amber-950/40 px-1.5 py-0.5 rounded-md border border-amber-500/20">
                            <Flame className="w-3 h-3 fill-amber-400" />
                            {friend.roastPoints} pts
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {friend.relationshipStatus}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleProfileClick(friend.username)}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 rounded-xl transition-colors"
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => unfriend(friend.id)}
                        className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors"
                        title="Unfriend"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 2. FRIEND REQUESTS (Received & Sent) */}
          {activeTab === "requests" && (
            <div className="flex flex-col gap-6">
              {/* Received Requests */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5 flex items-center gap-2">
                  <span>Received Friend Requests</span>
                  <span className="px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 text-[10px]">
                    {receivedRequests.length}
                  </span>
                </h3>

                {receivedRequests.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic p-3 bg-[#181824]/50 border border-zinc-800/60 rounded-xl">
                    No pending friend requests at the moment.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {receivedRequests.map((req) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between p-3.5 bg-[#181824] border border-zinc-800 rounded-2xl"
                      >
                        <div
                          onClick={() => handleProfileClick(req.senderUsername)}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <img
                            src={req.senderAvatar}
                            alt={req.senderUsername}
                            className="w-10 h-10 rounded-xl object-cover border border-zinc-700"
                          />
                          <div>
                            <h4 className="text-xs font-bold text-white hover:text-red-400 transition-colors">
                              {req.senderDisplayName}
                            </h4>
                            <p className="text-[11px] text-zinc-400">@{req.senderUsername}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            id={`accept-friend-req-${req.id}`}
                            onClick={() => respondFriendRequest(req.id, "accept")}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                          <button
                            id={`decline-friend-req-${req.id}`}
                            onClick={() => respondFriendRequest(req.id, "decline")}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs rounded-xl transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sent Requests */}
              {sentRequests.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5 flex items-center gap-2">
                    <span>Sent Requests</span>
                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px]">
                      {sentRequests.length}
                    </span>
                  </h3>
                  <div className="flex flex-col gap-2">
                    {sentRequests.map((req) => {
                      const receiver = allUsers.find((u) => u.id === req.receiverId);
                      return (
                        <div
                          key={req.id}
                          className="flex items-center justify-between p-3 bg-[#181824] border border-zinc-800/80 rounded-xl"
                        >
                          <div className="flex items-center gap-2.5">
                            <Clock className="w-4 h-4 text-amber-500" />
                            <div>
                              <p className="text-xs font-semibold text-zinc-200">
                                Request sent to @{receiver?.username || "User"}
                              </p>
                              <p className="text-[10px] text-zinc-500">Awaiting response</p>
                            </div>
                          </div>
                          <button
                            onClick={() => respondFriendRequest(req.id, "cancel")}
                            className="text-xs text-zinc-400 hover:text-rose-400 transition-colors"
                          >
                            Cancel Request
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. FOLLOWING & FOLLOWERS */}
          {activeTab === "following" && (
            <div className="flex flex-col gap-3">
              {followingUsers.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-xs text-zinc-400 mb-3">You are not following any users yet.</p>
                  <button
                    onClick={() => setActiveTab("discover")}
                    className="px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-xl"
                  >
                    Find Creators to Follow
                  </button>
                </div>
              ) : (
                followingUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-[#181824] border border-zinc-800/80 rounded-2xl"
                  >
                    <div
                      onClick={() => handleProfileClick(user.username)}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <img
                        src={user.avatarUrl}
                        alt={user.username}
                        className="w-10 h-10 rounded-xl object-cover border border-zinc-700"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-white hover:text-red-400 transition-colors">
                          {user.displayName}
                        </h4>
                        <p className="text-[11px] text-zinc-400">@{user.username}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleFollow(user.id)}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 rounded-xl transition-colors"
                      >
                        Following ✓
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 4. DISCOVER USERS */}
          {activeTab === "discover" && (
            <div className="flex flex-col gap-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search creators by username, slogan, bio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#181824] border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Users Grid/List */}
              <div className="flex flex-col gap-3">
                {filteredDiscoverUsers.map((user) => {
                  const friend = isFriend(user.id);
                  const following = isFollowing(user.id);

                  return (
                    <div
                      key={user.id}
                      className="flex items-start justify-between p-3.5 bg-[#181824] border border-zinc-800/80 rounded-2xl hover:border-zinc-700 transition-all gap-3"
                    >
                      <div
                        onClick={() => handleProfileClick(user.username)}
                        className="flex items-start gap-3 cursor-pointer flex-1"
                      >
                        <img
                          src={user.avatarUrl}
                          alt={user.username}
                          className="w-11 h-11 rounded-xl object-cover border border-zinc-700 shrink-0"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-white hover:text-red-400 transition-colors">
                              {user.displayName}
                            </h4>
                            {user.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-red-500" />}
                          </div>
                          <p className="text-[11px] text-zinc-400">@{user.username}</p>
                          <p className="text-xs text-zinc-300 line-clamp-1 mt-1">{user.bio}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-zinc-400">
                            <span className="text-amber-400 font-bold flex items-center gap-1">
                              <Flame className="w-3 h-3 fill-amber-400" /> {user.roastPoints} pts
                            </span>
                            <span>• {user.followersCount} followers</span>
                            <span>• {user.friendsCount || 0} friends</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0">
                        {/* Friend Action */}
                        {friend ? (
                          <span className="px-2.5 py-1.5 bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold rounded-xl flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Friends</span>
                          </span>
                        ) : (
                          <button
                            id={`discover-add-friend-${user.id}`}
                            onClick={() => sendFriendRequest(user.id)}
                            className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold rounded-xl transition-colors flex items-center gap-1"
                          >
                            <UserPlus className="w-3.5 h-3.5 text-red-400" />
                            <span>Add Friend</span>
                          </button>
                        )}

                        {/* Follow Action */}
                        <button
                          id={`discover-toggle-follow-${user.id}`}
                          onClick={() => toggleFollow(user.id)}
                          className={`px-2.5 py-1.5 text-[11px] font-bold rounded-xl transition-all flex items-center gap-1 ${
                            following
                              ? "bg-zinc-800 text-zinc-300 border border-zinc-700"
                              : "bg-red-600 hover:bg-red-500 text-white shadow-sm"
                          }`}
                        >
                          <span>{following ? "Following" : "Follow"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
