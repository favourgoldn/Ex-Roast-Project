import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { 
  X, 
  User as UserIcon, 
  Shield, 
  Lock, 
  Trash2, 
  Eye, 
  EyeOff, 
  Users, 
  Sparkles, 
  Check, 
  Globe, 
  AlertTriangle 
} from "lucide-react";
import { PrivacySettings } from "../../types";

export const SettingsModal: React.FC = () => {
  const { 
    isSettingsModalOpen, 
    closeSettingsModal, 
    currentUser, 
    updateProfile, 
    updatePrivacy, 
    changePassword, 
    deleteAccount 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<"profile" | "privacy" | "password" | "danger">("profile");

  // Profile Form State
  const [displayName, setDisplayName] = useState(currentUser?.displayName || "");
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [relationshipStatus, setRelationshipStatus] = useState(currentUser?.relationshipStatus || "Single & Unbothered");
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Privacy State
  const [privacy, setPrivacy] = useState<PrivacySettings>(
    currentUser?.privacy || {
      profileVisibility: "public",
      whoCanFriend: "everyone",
      whoCanComment: "everyone",
      savedPostsVisibility: "private",
      searchDiscoverable: true,
    }
  );
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);

  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Delete State
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  if (!isSettingsModalOpen || !currentUser) return null;

  const AVATAR_PRESETS = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
  ];

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    await updateProfile({
      displayName,
      bio,
      relationshipStatus,
      avatarUrl,
    });
    setIsSavingProfile(false);
  };

  const handlePrivacySave = async () => {
    setIsSavingPrivacy(true);
    await updatePrivacy(privacy);
    setIsSavingPrivacy(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    setIsChangingPassword(true);
    const ok = await changePassword(currentPassword, newPassword);
    setIsChangingPassword(false);
    if (ok) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== currentUser.username) return;
    await deleteAccount();
    closeSettingsModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-[#111118] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-[#14141e]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-600/10 border border-red-500/20 text-red-500">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Account & Privacy Settings</h2>
              <p className="text-xs text-zinc-400">Manage @{currentUser.username}'s profile, privacy, and security</p>
            </div>
          </div>
          <button
            id="settings-modal-close-btn"
            onClick={closeSettingsModal}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          {/* Tabs Sidebar */}
          <div className="w-full md:w-52 border-b md:border-b-0 md:border-r border-zinc-800/80 p-3 bg-[#13131c] flex md:flex-col gap-1.5 overflow-x-auto">
            <button
              id="settings-tab-profile"
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all w-full text-left shrink-0 ${
                activeTab === "profile" ? "bg-red-600 text-white shadow-md shadow-red-950/50" : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>

            <button
              id="settings-tab-privacy"
              onClick={() => setActiveTab("privacy")}
              className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all w-full text-left shrink-0 ${
                activeTab === "privacy" ? "bg-red-600 text-white shadow-md shadow-red-950/50" : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Privacy & Social</span>
            </button>

            <button
              id="settings-tab-password"
              onClick={() => setActiveTab("password")}
              className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all w-full text-left shrink-0 ${
                activeTab === "password" ? "bg-red-600 text-white shadow-md shadow-red-950/50" : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Password</span>
            </button>

            <button
              id="settings-tab-danger"
              onClick={() => setActiveTab("danger")}
              className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all w-full text-left shrink-0 ${
                activeTab === "danger" ? "bg-rose-950/80 text-red-300 border border-red-500/40" : "text-zinc-500 hover:bg-rose-950/20 hover:text-rose-400"
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Danger Zone</span>
            </button>
          </div>

          {/* Tab Panels */}
          <div className="flex-1 p-6 overflow-y-auto bg-[#101017]">
            {/* PROFILE TAB */}
            {activeTab === "profile" && (
              <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-2">Avatar</label>
                  <div className="flex items-center gap-3">
                    <img src={avatarUrl} alt="Avatar" className="w-14 h-14 rounded-2xl object-cover border-2 border-red-500" />
                    <div className="flex-1">
                      <p className="text-[11px] text-zinc-400 mb-1.5">Pick an anonymous avatar preset:</p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {AVATAR_PRESETS.map((url, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setAvatarUrl(url)}
                            className={`w-8 h-8 rounded-lg overflow-hidden border transition-all ${
                              avatarUrl === url ? "border-red-500 ring-2 ring-red-500/40" : "border-zinc-800 opacity-60 hover:opacity-100"
                            }`}
                          >
                            <img src={url} alt="preset" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">Display Name</label>
                    <input
                      id="settings-displayname-input"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-[#181824] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                      placeholder="Your Public Name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">Relationship Status</label>
                    <select
                      id="settings-relationship-select"
                      value={relationshipStatus}
                      onChange={(e) => setRelationshipStatus(e.target.value)}
                      className="w-full bg-[#181824] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="Single & Unbothered">Single & Unbothered</option>
                      <option value="Healing & Thriving">Healing & Thriving</option>
                      <option value="Dodged a Bullet">Dodged a Bullet</option>
                      <option value="It's Complicated">It's Complicated</option>
                      <option value="Married & Watching Drama">Married & Watching Drama</option>
                      <option value="Swiping for Red Flags">Swiping for Red Flags</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Bio / Slogan</label>
                  <textarea
                    id="settings-bio-textarea"
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-[#181824] border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 resize-none"
                    placeholder="Drop a sharp one-liner or your post-breakup motto..."
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    id="settings-save-profile-btn"
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSavingProfile ? "Saving..." : "Save Profile Changes"}</span>
                  </button>
                </div>
              </form>
            )}

            {/* PRIVACY TAB */}
            {activeTab === "privacy" && (
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Profile & Social Permissions</h3>
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between p-3 bg-[#181824] border border-zinc-800 rounded-xl">
                      <div>
                        <p className="text-xs font-bold text-white">Profile Visibility</p>
                        <p className="text-[11px] text-zinc-400">Control who can view your profile badges and public stories</p>
                      </div>
                      <select
                        id="privacy-profile-visibility-select"
                        value={privacy.profileVisibility}
                        onChange={(e) => setPrivacy({ ...privacy, profileVisibility: e.target.value as any })}
                        className="bg-[#12121a] border border-zinc-700 text-xs text-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-500"
                      >
                        <option value="public">Public (Everyone)</option>
                        <option value="friends_only">Friends Only</option>
                        <option value="private">Private (Only Me)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#181824] border border-zinc-800 rounded-xl">
                      <div>
                        <p className="text-xs font-bold text-white">Who Can Send Friend Requests</p>
                        <p className="text-[11px] text-zinc-400">Allow users to request friend connections</p>
                      </div>
                      <select
                        id="privacy-friend-requests-select"
                        value={privacy.whoCanFriend}
                        onChange={(e) => setPrivacy({ ...privacy, whoCanFriend: e.target.value as any })}
                        className="bg-[#12121a] border border-zinc-700 text-xs text-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-500"
                      >
                        <option value="everyone">Everyone</option>
                        <option value="friends_of_friends">Friends of Friends</option>
                        <option value="nobody">Nobody</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#181824] border border-zinc-800 rounded-xl">
                      <div>
                        <p className="text-xs font-bold text-white">Who Can Comment on Your Stories</p>
                        <p className="text-[11px] text-zinc-400">Manage comment permissions on non-anonymous stories</p>
                      </div>
                      <select
                        id="privacy-comments-select"
                        value={privacy.whoCanComment}
                        onChange={(e) => setPrivacy({ ...privacy, whoCanComment: e.target.value as any })}
                        className="bg-[#12121a] border border-zinc-700 text-xs text-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-500"
                      >
                        <option value="everyone">Everyone</option>
                        <option value="friends_only">Friends Only</option>
                        <option value="nobody">Nobody</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#181824] border border-zinc-800 rounded-xl">
                      <div>
                        <p className="text-xs font-bold text-white">Search Discoverability</p>
                        <p className="text-[11px] text-zinc-400">Allow other users to find your account when searching</p>
                      </div>
                      <button
                        type="button"
                        id="privacy-discoverable-toggle"
                        onClick={() => setPrivacy({ ...privacy, searchDiscoverable: !privacy.searchDiscoverable })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          privacy.searchDiscoverable ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {privacy.searchDiscoverable ? "Discoverable" : "Hidden"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    id="settings-save-privacy-btn"
                    onClick={handlePrivacySave}
                    disabled={isSavingPrivacy}
                    className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSavingPrivacy ? "Saving..." : "Save Privacy Settings"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* PASSWORD TAB */}
            {activeTab === "password" && (
              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3.5">
                {passwordError && (
                  <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-xs text-red-300">
                    {passwordError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Current Password</label>
                  <input
                    id="settings-current-password-input"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-[#181824] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                    placeholder="Enter current password (default: password123)"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">New Password</label>
                    <input
                      id="settings-new-password-input"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#181824] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                      placeholder="Minimum 6 characters"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">Confirm New Password</label>
                    <input
                      id="settings-confirm-new-password-input"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#181824] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                      placeholder="Re-type new password"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    id="settings-update-password-btn"
                    type="submit"
                    disabled={isChangingPassword}
                    className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4 text-red-400" />
                    <span>{isChangingPassword ? "Updating..." : "Update Password"}</span>
                  </button>
                </div>
              </form>
            )}

            {/* DANGER ZONE TAB */}
            {activeTab === "danger" && (
              <div className="flex flex-col gap-4">
                <div className="p-4 bg-rose-950/30 border border-red-500/40 rounded-2xl">
                  <div className="flex items-center gap-2 text-red-400 mb-2">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <h4 className="text-sm font-bold">Delete Account & Clear Stories</h4>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed mb-3">
                    Deleting your account will remove your profile, purge your friends list, and disassociate your roasts. This action is irreversible.
                  </p>
                  
                  <div className="mb-3">
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                      Type your username <span className="text-white font-mono">@{currentUser.username}</span> to confirm:
                    </label>
                    <input
                      id="settings-delete-confirm-input"
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder={currentUser.username}
                      className="w-full bg-[#181824] border border-red-900/50 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <button
                    id="settings-delete-account-btn"
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== currentUser.username}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Permanently Delete Account</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
