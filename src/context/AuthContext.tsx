import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User } from "../types";
import { storage } from "../services/storageService";
import { useToast } from "./ToastContext";

interface AuthContextValue {
  currentUser: User | null;
  isAuthenticated: boolean;
  allUsers: User[];
  signIn: (identifier: string) => Promise<boolean>;
  signUp: (username: string, email: string, displayName: string, avatarUrl?: string, bio?: string) => Promise<boolean>;
  signOut: () => void;
  updateProfile: (updates: Partial<User>) => void;
  switchDemoUser: (userId: string) => void;
  toggleFollow: (targetUserId: string) => boolean;
  isFollowing: (targetUserId: string) => boolean;
  blockUser: (targetUserId: string) => void;
  openAuthModal: (initialMode?: "signin" | "signup") => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
  authModalMode: "signin" | "signup";
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(storage.getCurrentUser());
  const [allUsers, setAllUsers] = useState<User[]>(storage.getUsers());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signin");
  const { success, error, roast } = useToast();

  const syncState = useCallback(() => {
    setCurrentUser(storage.getCurrentUser());
    setAllUsers(storage.getUsers());
  }, []);

  useEffect(() => {
    const unsubscribe = storage.subscribe(syncState);
    return () => unsubscribe();
  }, [syncState]);

  const openAuthModal = useCallback((mode: "signin" | "signup" = "signin") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const signIn = async (identifier: string): Promise<boolean> => {
    try {
      const user = storage.signIn(identifier);
      setCurrentUser(user);
      setIsAuthModalOpen(false);
      success("Welcome back!", `Signed in as @${user.username}`);
      return true;
    } catch (err: any) {
      error("Sign In Failed", err.message || "Invalid username or email");
      return false;
    }
  };

  const signUp = async (username: string, email: string, displayName: string, avatarUrl?: string, bio?: string): Promise<boolean> => {
    try {
      const user = storage.signUp(username, email, displayName, avatarUrl, bio);
      setCurrentUser(user);
      setIsAuthModalOpen(false);
      roast("Account Created! 🔥", `Welcome @${user.username}. +100 Roast Points awarded!`);
      return true;
    } catch (err: any) {
      error("Registration Failed", err.message || "Could not create account");
      return false;
    }
  };

  const signOut = () => {
    storage.signOut();
    setCurrentUser(null);
    success("Signed Out", "You have been logged out.");
  };

  const updateProfile = (updates: Partial<User>) => {
    if (!currentUser) return;
    try {
      const updated = storage.updateUser(currentUser.id, updates);
      setCurrentUser(updated);
      success("Profile Updated", "Your changes have been saved.");
    } catch (err: any) {
      error("Update Failed", err.message);
    }
  };

  const switchDemoUser = (userId: string) => {
    storage.setCurrentUser(userId);
    const target = storage.getUsers().find((u) => u.id === userId);
    if (target) {
      roast(`Switched Persona`, `Now testing as @${target.username} (${target.roastPoints} pts)`);
    }
  };

  const toggleFollow = (targetUserId: string): boolean => {
    if (!currentUser) {
      openAuthModal("signin");
      return false;
    }
    const followed = storage.toggleFollow(targetUserId);
    if (followed) {
      success("Followed!", "You will now see their latest stories.");
    } else {
      success("Unfollowed", "You no longer follow this user.");
    }
    return followed;
  };

  const isFollowing = (targetUserId: string): boolean => {
    return storage.isFollowing(targetUserId);
  };

  const blockUser = (targetUserId: string) => {
    storage.blockUser(targetUserId);
    success("User Blocked", "Their stories and roasts are now hidden.");
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
        switchDemoUser,
        toggleFollow,
        isFollowing,
        blockUser,
        openAuthModal,
        closeAuthModal,
        isAuthModalOpen,
        authModalMode,
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
