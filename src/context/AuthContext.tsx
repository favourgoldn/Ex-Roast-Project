import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, FriendRequest, PrivacySettings } from "../types";
import { storage } from "../services/storageService";
import { api } from "../services/api";
import { useToast } from "./ToastContext";

interface AuthContextValue {
  currentUser: User | null;
  isAuthenticated: boolean;
  allUsers: User[];
  signIn: (identifier: string, password?: string) => Promise<boolean>;
  signUp: (
    username: string, 
    email: string, 
    displayName: string, 
    avatarUrl?: string, 
    bio?: string, 
    password?: string
  ) => Promise<boolean>;
  signOut: () => void;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  updatePrivacy: (privacyUpdates: Partial<PrivacySettings>) => Promise<boolean>;
  changePassword: (currentPass: string, newPass: string) => Promise<boolean>;
  resetPassword: (identifier: string, newPass: string) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
  switchDemoUser: (userId: string) => void;
  
  // Social relationships
  toggleFollow: (targetUserId: string) => Promise<boolean>;
  isFollowing: (targetUserId: string) => boolean;
  sendFriendRequest: (targetUserId: string) => Promise<boolean>;
  respondFriendRequest: (requestId: string, action: "accept" | "decline" | "cancel") => Promise<void>;
  unfriend: (targetUserId: string) => Promise<void>;
  isFriend: (targetUserId: string) => boolean;
  getFriends: (userId?: string) => User[];
  getFriendRequests: () => { received: FriendRequest[]; sent: FriendRequest[] };
  blockUser: (targetUserId: string) => Promise<void>;
  isBlocked: (targetUserId: string) => boolean;

  // Modal controls
  openAuthModal: (initialMode?: "signin" | "signup" | "reset") => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
  authModalMode: "signin" | "signup" | "reset";

  isSettingsModalOpen: boolean;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;

  isConnectionsModalOpen: boolean;
  openConnectionsModal: (initialTab?: "friends" | "requests" | "following" | "discover") => void;
  closeConnectionsModal: () => void;
  connectionsModalTab: "friends" | "requests" | "following" | "discover";

  isMessagesModalOpen: boolean;
  messagesModalTargetUser: User | null;
  openMessagesModal: () => void;
  openMessagesWithUser: (targetUser: User) => void;
  closeMessagesModal: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(storage.getCurrentUser());
  const [allUsers, setAllUsers] = useState<User[]>(storage.getUsers());
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup" | "reset">("signin");

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isConnectionsModalOpen, setIsConnectionsModalOpen] = useState(false);
  const [connectionsModalTab, setConnectionsModalTab] = useState<"friends" | "requests" | "following" | "discover">("friends");

  const [isMessagesModalOpen, setIsMessagesModalOpen] = useState(false);
  const [messagesModalTargetUser, setMessagesModalTargetUser] = useState<User | null>(null);

  const { success, error, roast } = useToast();

  const syncState = useCallback(() => {
    setCurrentUser(storage.getCurrentUser());
    setAllUsers(storage.getUsers());
  }, []);

  useEffect(() => {
    const unsubscribe = storage.subscribe(syncState);
    return () => unsubscribe();
  }, [syncState]);

  const openAuthModal = useCallback((mode: "signin" | "signup" | "reset" = "signin") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const openSettingsModal = useCallback(() => {
    if (!currentUser) {
      openAuthModal("signin");
      return;
    }
    setIsSettingsModalOpen(true);
  }, [currentUser, openAuthModal]);

  const closeSettingsModal = useCallback(() => {
    setIsSettingsModalOpen(false);
  }, []);

  const openMessagesModal = useCallback(() => {
    if (!currentUser) {
      openAuthModal("signin");
      return;
    }
    setMessagesModalTargetUser(null);
    setIsMessagesModalOpen(true);
  }, [currentUser, openAuthModal]);

  const openMessagesWithUser = useCallback((targetUser: User) => {
    if (!currentUser) {
      openAuthModal("signin");
      return;
    }
    setMessagesModalTargetUser(targetUser);
    setIsMessagesModalOpen(true);
  }, [currentUser, openAuthModal]);

  const closeMessagesModal = useCallback(() => {
    setIsMessagesModalOpen(false);
    setMessagesModalTargetUser(null);
  }, []);

  const openConnectionsModal = useCallback((tab: "friends" | "requests" | "following" | "discover" = "friends") => {
    if (!currentUser) {
      openAuthModal("signin");
      return;
    }
    setConnectionsModalTab(tab);
    setIsConnectionsModalOpen(true);
  }, [currentUser, openAuthModal]);

  const closeConnectionsModal = useCallback(() => {
    setIsConnectionsModalOpen(false);
  }, []);

  const signIn = async (identifier: string, password = "password123"): Promise<boolean> => {
    try {
      const user = await storage.signIn(identifier, password);
      setCurrentUser(user);
      setIsAuthModalOpen(false);
      success("Welcome back!", `Signed in as @${user.username}`);
      return true;
    } catch (err: any) {
      error("Sign In Failed", err.message || "Invalid username or password");
      return false;
    }
  };

  const signUp = async (
    username: string,
    email: string,
    displayName: string,
    avatarUrl?: string,
    bio?: string,
    password = "password123"
  ): Promise<boolean> => {
    try {
      const user = await storage.signUp(username, email, displayName, avatarUrl, bio, password);
      setCurrentUser(user);
      setIsAuthModalOpen(false);
      roast("Account Created! 🔥", `Welcome @${user.username}. +100 Welcome Roast Points awarded!`);
      return true;
    } catch (err: any) {
      error("Registration Failed", err.message || "Could not create account");
      return false;
    }
  };

  const signOut = () => {
    storage.signOut();
    setCurrentUser(null);
    success("Signed Out", "You have been safely logged out.");
  };

  const updateProfile = async (updates: Partial<User>): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const updated = await storage.updateUser(currentUser.id, updates);
      setCurrentUser(updated);
      success("Profile Updated", "Your profile details have been saved.");
      return true;
    } catch (err: any) {
      error("Update Failed", err.message);
      return false;
    }
  };

  const updatePrivacy = async (privacyUpdates: Partial<PrivacySettings>): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      await storage.updatePrivacy(currentUser.id, privacyUpdates);
      success("Privacy Settings Saved", "Your privacy preferences have been updated.");
      return true;
    } catch (err: any) {
      error("Privacy Update Failed", err.message);
      return false;
    }
  };

  const changePassword = async (currentPass: string, newPass: string): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      await api.changePassword(currentPass, newPass);
      success("Password Changed", "Your password has been successfully updated.");
      return true;
    } catch (err: any) {
      error("Password Update Failed", err.message || "Please check your current password.");
      return false;
    }
  };

  const resetPassword = async (identifier: string, newPass: string): Promise<boolean> => {
    try {
      await api.resetPassword(identifier, newPass);
      success("Password Reset Successful", "You can now sign in with your new password.");
      setAuthModalMode("signin");
      return true;
    } catch (err: any) {
      error("Password Reset Failed", err.message || "No account found matching this identifier.");
      return false;
    }
  };

  const deleteAccount = async (): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      await storage.deleteAccount(currentUser.id);
      success("Account Deleted", "Your account and personal data have been removed.");
      return true;
    } catch (err: any) {
      error("Account Deletion Failed", err.message);
      return false;
    }
  };

  const switchDemoUser = (userId: string) => {
    storage.setCurrentUser(userId);
    const target = storage.getUsers().find((u) => u.id === userId);
    if (target) {
      roast(`Switched Persona`, `Now logged in as @${target.username} (${target.roastPoints} pts)`);
    }
  };

  const toggleFollow = async (targetUserId: string): Promise<boolean> => {
    if (!currentUser) {
      openAuthModal("signin");
      return false;
    }
    try {
      const followed = await storage.toggleFollow(targetUserId);
      if (followed) {
        success("Followed!", "You will now see their stories in your Following feed.");
      } else {
        success("Unfollowed", "You have unfollowed this user.");
      }
      return followed;
    } catch (err: any) {
      error("Follow Failed", err.message || "Could not follow user");
      return false;
    }
  };

  const isFollowing = (targetUserId: string): boolean => {
    return storage.isFollowing(targetUserId);
  };

  const sendFriendRequest = async (targetUserId: string): Promise<boolean> => {
    if (!currentUser) {
      openAuthModal("signin");
      return false;
    }
    try {
      await storage.sendFriendRequest(targetUserId);
      success("Friend Request Sent 🤝", "They will receive a notification to connect with you.");
      return true;
    } catch (err: any) {
      error("Request Failed", err.message || "Could not send friend request");
      return false;
    }
  };

  const respondFriendRequest = async (requestId: string, action: "accept" | "decline" | "cancel") => {
    try {
      await storage.respondFriendRequest(requestId, action);
      if (action === "accept") {
        roast("Connected! 🎉", "You are now friends! You can view each other's friend-only posts.");
      } else if (action === "decline") {
        success("Request Declined", "The friend request was declined.");
      } else if (action === "cancel") {
        success("Request Canceled", "Friend request was withdrawn.");
      }
    } catch (err: any) {
      error("Action Failed", err.message || "Could not process request");
    }
  };

  const unfriend = async (targetUserId: string) => {
    try {
      await storage.unfriend(targetUserId);
      success("Friend Removed", "User is no longer in your friends list.");
    } catch (err: any) {
      error("Unfriend Failed", err.message || "Could not remove friend");
    }
  };

  const isFriend = (targetUserId: string): boolean => {
    return storage.isFriend(targetUserId);
  };

  const getFriends = (userId?: string): User[] => {
    const targetId = userId || currentUser?.id;
    if (!targetId) return [];
    return storage.getFriends(targetId);
  };

  const getFriendRequests = () => {
    if (!currentUser) return { received: [], sent: [] };
    return storage.getFriendRequests(currentUser.id);
  };

  const blockUser = async (targetUserId: string) => {
    try {
      await storage.blockUser(targetUserId);
      success("User Blocked", "Their stories, comments, and profile are now hidden from you.");
    } catch (err: any) {
      error("Block Failed", err.message || "Could not block user");
    }
  };

  const isBlocked = (targetUserId: string): boolean => {
    return storage.getBlockedUsers().includes(targetUserId);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        allUsers,
        signIn,
        signUp,
        signOut,
        updateProfile,
        updatePrivacy,
        changePassword,
        resetPassword,
        deleteAccount,
        switchDemoUser,
        toggleFollow,
        isFollowing,
        sendFriendRequest,
        respondFriendRequest,
        unfriend,
        isFriend,
        getFriends,
        getFriendRequests,
        blockUser,
        isBlocked,
        openAuthModal,
        closeAuthModal,
        isAuthModalOpen,
        authModalMode,
        isSettingsModalOpen,
        openSettingsModal,
        closeSettingsModal,
        isConnectionsModalOpen,
        openConnectionsModal,
        closeConnectionsModal,
        connectionsModalTab,
        isMessagesModalOpen,
        messagesModalTargetUser,
        openMessagesModal,
        openMessagesWithUser,
        closeMessagesModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
