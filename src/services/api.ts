import { 
  User, 
  Post, 
  Roast, 
  Comment, 
  CommentReply, 
  Notification, 
  FriendRequest, 
  ReactionType, 
  PrivacySettings 
} from "../types";

const TOKEN_KEY = "exroast_auth_token";

export interface RelationshipInfo {
  isFollowing: boolean;
  isFriend: boolean;
  friendRequest: FriendRequest | null;
  isBlocked: boolean;
  isSelf: boolean;
}

export interface UserProfileResponse {
  user: User;
  relationship: RelationshipInfo;
}

export interface ConnectionsResponse {
  friends: User[];
  following: User[];
  followers: User[];
  pendingReceived: FriendRequest[];
  pendingSent: FriendRequest[];
}

export interface LeaderboardResponse {
  topUsers: User[];
  topRoasts: (Roast & { postTitle: string })[];
  roastOfTheDay: (Roast & { postTitle: string }) | null;
}

class ApiService {
  private token: string | null = null;
  private eventSource: EventSource | null = null;
  private sseListeners: Set<(event: string, data: any) => void> = new Set();

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem(TOKEN_KEY);
      this.initSSE();
    }
  }

  public setToken(token: string | null) {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private initSSE() {
    if (typeof window === "undefined") return;
    try {
      if (this.eventSource) {
        this.eventSource.close();
      }
      this.eventSource = new EventSource("/api/events");

      const events = [
        "connected",
        "post_created",
        "post_updated",
        "post_deleted",
        "roast_created",
        "roast_voted",
        "roast_deleted",
        "comment_created",
        "reply_created",
        "friend_request",
        "friend_accepted",
        "notification",
        "new_message",
        "user_registered",
        "user_updated",
      ];

      events.forEach((evtName) => {
        this.eventSource?.addEventListener(evtName, (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            this.notifySSE(evtName, data);
          } catch {
            // ignore JSON parse error
          }
        });
      });

      this.eventSource.onerror = () => {
        // SSE reconnects automatically
      };
    } catch (err) {
      console.warn("SSE init failed:", err);
    }
  }

  public subscribeSSE(callback: (event: string, data: any) => void): () => void {
    this.sseListeners.add(callback);
    return () => this.sseListeners.delete(callback);
  }

  private notifySSE(event: string, data: any) {
    this.sseListeners.forEach((cb) => {
      try {
        cb(event, data);
      } catch (err) {
        console.error("Error in SSE listener callback:", err);
      }
    });
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
      headers["x-user-id"] = this.token;
    }

    const res = await fetch(path, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorMsg = `Request failed: ${res.status}`;
      try {
        const errorJson = await res.json();
        if (errorJson.error) errorMsg = errorJson.error;
      } catch {}
      throw new Error(errorMsg);
    }

    return res.json();
  }

  // --- Auth APIs ---
  public async register(payload: {
    username: string;
    email: string;
    password: string;
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
  }): Promise<{ token: string; user: User }> {
    const res = await this.request<{ token: string; user: User }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    this.setToken(res.token);
    return res;
  }

  public async login(identifier: string, password?: string): Promise<{ token: string; user: User }> {
    const res = await this.request<{ token: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
    this.setToken(res.token);
    return res;
  }

  public async getMe(): Promise<{ user: User }> {
    return this.request<{ user: User }>("/api/auth/me");
  }

  public async resetPassword(emailOrUsername: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ emailOrUsername, newPassword }),
    });
  }

  public async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  public async updateProfile(updates: Partial<User>): Promise<{ user: User }> {
    return this.request<{ user: User }>("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  public async updatePrivacy(privacy: Partial<PrivacySettings>): Promise<{ privacy: PrivacySettings }> {
    return this.request<{ privacy: PrivacySettings }>("/api/auth/privacy", {
      method: "PUT",
      body: JSON.stringify(privacy),
    });
  }

  public async deleteAccount(): Promise<{ success: boolean }> {
    const res = await this.request<{ success: boolean }>("/api/auth/account", {
      method: "DELETE",
    });
    this.setToken(null);
    return res;
  }

  // --- Users & Social APIs ---
  public async getUsers(search?: string): Promise<{ users: User[] }> {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    return this.request<{ users: User[] }>(`/api/users${query}`);
  }

  public async getUserProfile(identifier: string): Promise<UserProfileResponse> {
    return this.request<UserProfileResponse>(`/api/users/${encodeURIComponent(identifier)}`);
  }

  public async toggleFollow(userId: string): Promise<{ followed: boolean; followersCount: number }> {
    return this.request<{ followed: boolean; followersCount: number }>(`/api/users/${userId}/follow`, {
      method: "POST",
    });
  }

  public async sendFriendRequest(userId: string): Promise<{ request: FriendRequest }> {
    return this.request<{ request: FriendRequest }>(`/api/users/${userId}/friend-request`, {
      method: "POST",
    });
  }

  public async respondFriendRequest(
    requestId: string,
    action: "accept" | "decline" | "cancel"
  ): Promise<{ status: string; request?: FriendRequest }> {
    return this.request<{ status: string; request?: FriendRequest }>(`/api/friend-requests/${requestId}/respond`, {
      method: "POST",
      body: JSON.stringify({ action }),
    });
  }

  public async unfriend(userId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/users/${userId}/unfriend`, {
      method: "POST",
    });
  }

  public async getUserConnections(userId: string): Promise<ConnectionsResponse> {
    return this.request<ConnectionsResponse>(`/api/users/${userId}/connections`);
  }

  public async toggleBlockUser(userId: string): Promise<{ blocked: boolean }> {
    return this.request<{ blocked: boolean }>(`/api/users/${userId}/block`, {
      method: "POST",
    });
  }

  // --- Posts APIs ---
  public async getPosts(params: {
    feed?: string;
    category?: string;
    tag?: string;
    search?: string;
    authorId?: string;
    savedOnly?: boolean;
  } = {}): Promise<{ posts: Post[] }> {
    const queryParams = new URLSearchParams();
    if (params.feed) queryParams.set("feed", params.feed);
    if (params.category && params.category !== "All") queryParams.set("category", params.category);
    if (params.tag) queryParams.set("tag", params.tag);
    if (params.search) queryParams.set("search", params.search);
    if (params.authorId) queryParams.set("authorId", params.authorId);
    if (params.savedOnly) queryParams.set("savedOnly", "true");

    const qs = queryParams.toString();
    return this.request<{ posts: Post[] }>(`/api/posts${qs ? `?${qs}` : ""}`);
  }

  public async getPost(id: string): Promise<{ post: Post }> {
    return this.request<{ post: Post }>(`/api/posts/${id}`);
  }

  public async createPost(payload: {
    title: string;
    content: string;
    category: string;
    imageUrl?: string;
    hashtags?: string[];
    isAnonymous?: boolean;
    anonymousAlias?: string;
    firstRoastContent?: string;
  }): Promise<{ post: Post }> {
    return this.request<{ post: Post }>("/api/posts", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  public async updatePost(id: string, updates: Partial<Post>): Promise<{ post: Post }> {
    return this.request<{ post: Post }>(`/api/posts/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  public async deletePost(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/posts/${id}`, {
      method: "DELETE",
    });
  }

  public async reactToPost(
    postId: string,
    reaction: ReactionType
  ): Promise<{ reactions: any; userReaction: ReactionType | null; flameScore: number }> {
    return this.request<{ reactions: any; userReaction: ReactionType | null; flameScore: number }>(
      `/api/posts/${postId}/react`,
      {
        method: "POST",
        body: JSON.stringify({ reaction }),
      }
    );
  }

  public async toggleSavePost(postId: string): Promise<{ saved: boolean; savesCount: number }> {
    return this.request<{ saved: boolean; savesCount: number }>(`/api/posts/${postId}/save`, {
      method: "POST",
    });
  }

  // --- Roasts APIs ---
  public async submitRoast(postId: string, content: string): Promise<{ roast: Roast }> {
    return this.request<{ roast: Roast }>(`/api/posts/${postId}/roasts`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  }

  public async voteRoast(
    roastId: string,
    vote: "up" | "down" | null
  ): Promise<{ score: number; upvotes: number; downvotes: number; userVote: "up" | "down" | null }> {
    return this.request<{ score: number; upvotes: number; downvotes: number; userVote: "up" | "down" | null }>(
      `/api/roasts/${roastId}/vote`,
      {
        method: "POST",
        body: JSON.stringify({ vote }),
      }
    );
  }

  public async deleteRoast(roastId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/roasts/${roastId}`, {
      method: "DELETE",
    });
  }

  // --- Comments & Replies APIs ---
  public async addComment(postId: string, content: string): Promise<{ comment: Comment }> {
    return this.request<{ comment: Comment }>(`/api/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  }

  public async addReply(commentId: string, content: string): Promise<{ reply: CommentReply }> {
    return this.request<{ reply: CommentReply }>(`/api/comments/${commentId}/reply`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  }

  public async toggleLikeComment(commentId: string): Promise<{ likes: number; userLiked: boolean }> {
    return this.request<{ likes: number; userLiked: boolean }>(`/api/comments/${commentId}/like`, {
      method: "POST",
    });
  }

  // --- Notifications APIs ---
  public async getNotifications(): Promise<{ notifications: Notification[] }> {
    return this.request<{ notifications: Notification[] }>("/api/notifications");
  }

  public async markNotificationRead(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/notifications/${id}/read`, {
      method: "POST",
    });
  }

  public async markAllNotificationsRead(): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>("/api/notifications/read-all", {
      method: "POST",
    });
  }

  public async deleteNotification(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/notifications/${id}`, {
      method: "DELETE",
    });
  }

  // --- Leaderboard & Hall of Fame ---
  public async getLeaderboard(): Promise<LeaderboardResponse> {
    return this.request<LeaderboardResponse>("/api/leaderboard");
  }

  // --- Conversations & Messaging APIs ---
  public async getConversations(): Promise<{ conversations: any[] }> {
    return this.request<{ conversations: any[] }>("/api/conversations");
  }

  public async getOrCreateConversation(targetUserId: string): Promise<{ conversation: any }> {
    return this.request<{ conversation: any }>("/api/conversations", {
      method: "POST",
      body: JSON.stringify({ targetUserId }),
    });
  }

  public async getMessages(conversationId: string): Promise<{ messages: any[] }> {
    return this.request<{ messages: any[] }>(`/api/conversations/${conversationId}/messages`);
  }

  public async sendMessage(conversationId: string, content: string): Promise<{ message: any }> {
    return this.request<{ message: any }>(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  }

  public async markConversationRead(conversationId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/conversations/${conversationId}/read`, {
      method: "PUT",
    });
  }

  // --- Reports & Moderation ---
  public async submitReport(report: {
    targetType: "post" | "roast" | "comment" | "user";
    targetId: string;
    reason: string;
    details?: string;
  }): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>("/api/reports", {
      method: "POST",
      body: JSON.stringify(report),
    });
  }

  // --- AI Roast Sparks Generator ---
  public async generateRoastSparks(payload: {
    storyTitle?: string;
    storyDescription: string;
    category?: string;
  }): Promise<{ roasts: string[]; source: string }> {
    return this.request<{ roasts: string[]; source: string }>("/api/generate-roast-sparks", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // --- Content Safety Scan ---
  public async scanContentSafety(text: string): Promise<{ safe: boolean; reason?: string; flags: string[] }> {
    return this.request<{ safe: boolean; reason?: string; flags: string[] }>("/api/scan-safety", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  }
}

export const api = new ApiService();
