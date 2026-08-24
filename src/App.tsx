import React, { useState, useEffect } from "react";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Header } from "./components/common/Header";
import { Sidebar } from "./components/common/Sidebar";
import { MobileNav } from "./components/common/MobileNav";
import { AuthModal } from "./components/common/AuthModal";
import { ReportModal } from "./components/common/ReportModal";
import { GuidelinesModal } from "./components/common/GuidelinesModal";
import { ShareModal } from "./components/common/ShareModal";
import { HomeView } from "./components/views/HomeView";
import { ExploreView } from "./components/views/ExploreView";
import { CreateView } from "./components/views/CreateView";
import { HallOfFameView } from "./components/views/HallOfFameView";
import { ProfileView } from "./components/views/ProfileView";
import { NotificationsView } from "./components/views/NotificationsView";
import { SearchView } from "./components/views/SearchView";
import { TabType, Post } from "./types";
import { storage } from "./services/storageService";

function MainApp() {
  const { currentUser, openAuthModal } = useAuth();
  const [currentTab, setCurrentTab] = useState<TabType>("home");
  const [viewingUserId, setViewingUserId] = useState<string | undefined>(undefined);

  // Modals state
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const [sharePost, setSharePost] = useState<Post | null>(null);
  const [reportData, setReportData] = useState<{
    isOpen: boolean;
    targetId: string;
    targetAuthorName: string;
  }>({
    isOpen: false,
    targetId: "",
    targetAuthorName: "",
  });

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const updateUnread = () => {
      if (currentUser) {
        setUnreadCount(storage.getUnreadNotificationCount(currentUser.id));
      } else {
        setUnreadCount(0);
      }
    };
    updateUnread();
    const unsub = storage.subscribe(updateUnread);
    return () => unsub();
  }, [currentUser]);

  const handleOpenCreate = () => {
    if (!currentUser) {
      openAuthModal("signin");
      return;
    }
    setCurrentTab("create");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTabChange = (tab: TabType) => {
    setCurrentTab(tab);
    setViewingUserId(undefined);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleShare = (post: Post) => {
    setSharePost(post);
  };

  const handleReport = (targetId: string, authorUsername: string) => {
    setReportData({
      isOpen: true,
      targetId,
      targetAuthorName: authorUsername,
    });
  };

  return (
    <div className="min-h-screen bg-[#08080b] text-zinc-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Top Sticky Header */}
      <Header
        currentTab={currentTab}
        onTabChange={handleTabChange}
        onOpenCreate={handleOpenCreate}
        onOpenGuidelines={() => setIsGuidelinesOpen(true)}
        unreadNotificationsCount={unreadCount}
      />

      {/* Main Responsive Body Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Left Desktop Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={handleTabChange}
          onOpenGuidelines={() => setIsGuidelinesOpen(true)}
          unreadNotificationsCount={unreadCount}
        />

        {/* Dynamic Main View Area */}
        <main className="flex-1 min-w-0 min-h-[calc(100vh-65px)]">
          {currentTab === "home" && (
            <HomeView
              onTabChange={handleTabChange}
              onOpenCreate={handleOpenCreate}
              onShare={handleShare}
              onReport={handleReport}
            />
          )}

          {currentTab === "explore" && (
            <ExploreView
              onOpenCreate={handleOpenCreate}
              onShare={handleShare}
              onReport={handleReport}
              onTabChange={handleTabChange}
            />
          )}

          {currentTab === "create" && (
            <CreateView
              onTabChange={handleTabChange}
              onStoryCreated={(postId) => {
                handleTabChange("explore");
              }}
            />
          )}

          {currentTab === "hall-of-fame" && (
            <HallOfFameView
              onTabChange={handleTabChange}
              onShare={handleShare}
              onReport={handleReport}
            />
          )}

          {currentTab === "profile" && (
            <ProfileView
              userId={viewingUserId}
              onTabChange={handleTabChange}
              onShare={handleShare}
              onReport={handleReport}
              onOpenCreate={handleOpenCreate}
            />
          )}

          {currentTab === "notifications" && (
            <NotificationsView
              onTabChange={handleTabChange}
              onSelectPost={(postId) => {
                handleTabChange("explore");
              }}
            />
          )}

          {currentTab === "search" && (
            <SearchView
              onTabChange={handleTabChange}
              onShare={handleShare}
              onReport={handleReport}
              onSelectUser={(uid) => {
                setViewingUserId(uid);
                setCurrentTab("profile");
              }}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        currentTab={currentTab}
        onTabChange={handleTabChange}
        onOpenCreate={handleOpenCreate}
        unreadNotificationsCount={unreadCount}
      />

      {/* Global Modals */}
      <AuthModal />

      <ReportModal
        isOpen={reportData.isOpen}
        onClose={() => setReportData({ isOpen: false, targetId: "", targetAuthorName: "" })}
        targetType="post"
        targetId={reportData.targetId}
        targetAuthorName={reportData.targetAuthorName}
      />

      <GuidelinesModal
        isOpen={isGuidelinesOpen}
        onClose={() => setIsGuidelinesOpen(false)}
      />

      <ShareModal
        post={sharePost}
        isOpen={!!sharePost}
        onClose={() => setSharePost(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
