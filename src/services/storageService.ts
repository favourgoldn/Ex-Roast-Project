import { 
  User, 
  Post, 
  Roast, 
  Comment, 
  CommentReply, 
  Notification, 
  Report, 
  ReactionType, 
  CategoryType, 
  FriendRequest, 
  PrivacySettings 
} from "../types";
import { SEED_USERS, SEED_POSTS, SEED_NOTIFICATIONS, DEFAULT_BADGES } from "./seedData";
import { api } from "./api";

const STORAGE_KEYS = {
  USERS: "exroast_users_v3",
  CURRENT_USER_ID: "exroast_current_user_id_v3",
  POSTS: "exroast_posts_v3",
  NOTIFICATIONS: "exroast_notifications_v3",
  FOLLOWS: "exroast_follows_v3",
  FRIENDS: "exroast_friends_v3",
  FRIEND_REQUESTS: "exroast_friend_requests_v3",
  SAVED_POST_IDS: "exroast_saved_post_ids_v3",
  BLOCKED_USERS: "exroast_blocked_users_v3",
  REPORTS: "exroast_reports_v3",
};

type ListenerCallback = () => void;

class StorageService {
  private listeners: Set<ListenerCallback> = new Set();
  private sseUnsubscribe: (() => void) | null = null;
  private pollingIntervalId: number | null = null;
  private isSyncing = false;

  constructor() {
    this.init();
    this.initServerSync();
  }

  private init() {
    if (typeof window === "undefined") return;

    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      const initializedUsers: User[] = SEED_USERS.map((u) => ({
        ...u,
        friendsCount: 3,
        privacy: {
          profileVisibility: "public",
          whoCanFriend: "everyone",
          whoCanComment: "everyone",
          savedPostsVisibility: "private",
          searchDiscoverable: true,
        },
      }));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initializedUsers));
    }

    if (!localStorage.getItem(STORAGE_KEYS.POSTS)) {
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(SEED_POSTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.FOLLOWS)) {
      localStorage.setItem(STORAGE_KEYS.FOLLOWS, JSON.stringify({}));
    }
    if (!localStorage.getItem(STORAGE_KEYS.FRIENDS)) {
      localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify({}));
    }
    if (!localStorage.getItem(STORAGE_KEYS.FRIEND_REQUESTS)) {
      localStorage.setItem(STORAGE_KEYS.FRIEND_REQUESTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SAVED_POST_IDS)) {
      localStorage.setItem(STORAGE_KEYS.SAVED_POST_IDS, JSON.stringify({}));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BLOCKED_USERS)) {
      localStorage.setItem(STORAGE_KEYS.BLOCKED_USERS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify([]));
    }
  }

  private initServerSync() {
    if (typeof window === "undefined") return;

    // Set token for API from existing local current user session
    const curId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (curId) api.setToken(curId);

    // 1. Subscribe to real-time events from server via SSE
    this.sseUnsubscribe = api.subscribeSSE((event, data) => {
      this.syncFromServer();
    });

    // 2. Initial fetch from server to align with server truth
    this.syncFromServer();

    // 3. Fallback polling every 5 seconds to guarantee multi-device synchronization
    this.startPolling(5000);

    // 4. Tab visibility change listener: sync immediately when user switches back
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          this.syncFromServer();
        }
      });
    }
  }

  public startPolling(intervalMs = 5000): void {
    if (typeof window === "undefined") return;
    this.stopPolling();
    this.pollingIntervalId = window.setInterval(() => {
      this.syncFromServer();
    }, intervalMs);
  }

  public stopPolling(): void {
    if (this.pollingIntervalId !== null) {
      clearInterval(this.pollingIntervalId);
      this.pollingIntervalId = null;
    }
  }

  public destroy(): void {
    this.stopPolling();
    if (this.sseUnsubscribe) {
      this.sseUnsubscribe();
      this.sseUnsubscribe = null;
    }
  }

  /**
   * Synchronizes data from backend to client cache.
   * Ensures backend is the true canonical source of truth.
   */
  public async syncFromServer(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const cur = this.getCurrentUser();
      if (cur) {
        api.setToken(cur.id);
      }

      const [usersRes, postsRes] = await Promise.all([
        api.getUsers().catch((err) => {
          console.warn("[StorageService] Failed to fetch users from server:", err);
          return null;
        }),
        api.getPosts().catch((err) => {
          console.warn("[StorageService] Failed to fetch posts from server:", err);
          return null;
        }),
      ]);

      let hasChanges = false;

      if (usersRes && Array.isArray(usersRes.users) && usersRes.users.length > 0) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersRes.users));
        hasChanges = true;
      }

      if (postsRes && Array.isArray(postsRes.posts)) {
        localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(postsRes.posts));
        hasChanges = true;
      }

      if (cur) {
        try {
          const [notifsRes, connectionsRes] = await Promise.all([
            api.getNotifications().catch(() => null),
            api.getUserConnections(cur.id).catch(() => null),
          ]);

          if (notifsRes && Array.isArray(notifsRes.notifications)) {
            localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifsRes.notifications));
            hasChanges = true;
          }

          if (connectionsRes) {
            const friendsMap = this.getFriendsMap();
            friendsMap[cur.id] = (connectionsRes.friends || []).map((f) => f.id);
            localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(friendsMap));

            const followsMap = this.getFollowsMap();
            followsMap[cur.id] = (connectionsRes.following || []).map((f) => f.id);
            localStorage.setItem(STORAGE_KEYS.FOLLOWS, JSON.stringify(followsMap));

            const reqs = [
              ...(connectionsRes.pendingReceived || []),
              ...(connectionsRes.pendingSent || []),
            ];
            localStorage.setItem(STORAGE_KEYS.FRIEND_REQUESTS, JSON.stringify(reqs));
            hasChanges = true;
          }
        } catch {
          // ignore authenticated sync failure
        }
      }

      if (hasChanges) {
        this.notify();
      }
    } catch (err) {
      console.warn("[StorageService] Error during syncFromServer:", err);
    } finally {
      this.isSyncing = false;
    }
  }

  public subscribe(callback: ListenerCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach((callback) => callback());
  }

  // --- USER AUTH & PROFILE METHODS (BACKEND-FIRST) ---

  public getUsers(): User[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      const users: User[] = data ? JSON.parse(data) : SEED_USERS;
      const friendsMap = this.getFriendsMap();
      const followsMap = this.getFollowsMap();

      return users.map((u) => ({
        ...u,
        friendsCount: friendsMap[u.id]?.length || u.friendsCount || 0,
        followingCount: followsMap[u.id]?.length || u.followingCount || 0,
        followersCount: Object.values(followsMap).filter((list) => list.includes(u.id)).length || u.followersCount || 0,
      }));
    } catch {
      return SEED_USERS;
    }
  }

  public getCurrentUser(): User | null {
    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (!currentId) return null;
    const users = this.getUsers();
    return users.find((u) => u.id === currentId) || null;
  }

  public setCurrentUser(userId: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
    api.setToken(userId);
    this.notify();
  }

  /**
   * Registers a new user. Backend is the source of truth!
   * Waits for api.register() and uses backend-generated canonical ID.
   * If registration fails, throws error to propagate to UI.
   */
  public async signUp(
    username: string,
    email: string,
    displayName: string,
    avatarUrl?: string,
    bio?: string,
    password = "password123"
  ): Promise<User> {
    const cleanUsername = username.replace(/[^a-zA-Z0-9_]/g, "");
    if (cleanUsername.length < 3) {
      throw new Error("Username must be at least 3 alphanumeric characters");
    }

    // 1. AWAIT the backend registration first
    const res = await api.register({
      username: cleanUsername,
      email: email.toLowerCase().trim(),
      password,
      displayName: displayName || cleanUsername,
      avatarUrl,
      bio,
    });

    const canonicalUser = res.user;
    if (!canonicalUser || !canonicalUser.id) {
      throw new Error("Registration failed: Invalid response from server");
    }

    // 2. Set backend auth token & canonical session
    this.setCurrentUser(canonicalUser.id);

    // 3. Cache the canonical user into local storage
    const users = this.getUsers().filter(
      (u) => u.id !== canonicalUser.id && u.username.toLowerCase() !== canonicalUser.username.toLowerCase()
    );
    users.push(canonicalUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // 4. Immediately trigger a sync to pull full backend state
    await this.syncFromServer();

    this.notify();
    return canonicalUser;
  }

  /**
   * Signs in an existing user. Backend is the source of truth!
   * Awaits api.login() and uses backend canonical user record.
   */
  public async signIn(identifier: string, password = "password123"): Promise<User> {
    const cleanId = identifier.trim();
    if (!cleanId) {
      throw new Error("Username or email is required");
    }

    // 1. AWAIT the backend login first
    const res = await api.login(cleanId, password);

    const canonicalUser = res.user;
    if (!canonicalUser || !canonicalUser.id) {
      throw new Error("Sign in failed: Invalid response from server");
    }

    // 2. Set backend auth token & canonical session
    this.setCurrentUser(canonicalUser.id);

    // 3. Update user in local cache
    const users = this.getUsers().filter(
      (u) => u.id !== canonicalUser.id && u.username.toLowerCase() !== canonicalUser.username.toLowerCase()
    );
    users.push(canonicalUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // 4. Immediately trigger a sync to pull full backend state
    await this.syncFromServer();

    this.notify();
    return canonicalUser;
  }

  public signOut(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    api.setToken(null);
    this.notify();
  }

  public async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const current = this.getCurrentUser();
    if (!current) throw new Error("Must be logged in to update profile");

    api.setToken(current.id);

    // 1. Backend update
    const res = await api.updateProfile(updates);
    const canonicalUser = res.user;

    // 2. Update local users cache
    const users = this.getUsers().map((u) => (u.id === userId ? { ...u, ...canonicalUser } : u));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // 3. Update posts/roasts authored by this user locally
    const posts = this.getPosts();
    let postsUpdated = false;
    posts.forEach((post) => {
      if (post.authorId === userId && !post.isAnonymous) {
        if (canonicalUser.displayName) post.authorDisplayName = canonicalUser.displayName;
        if (canonicalUser.avatarUrl) post.authorAvatar = canonicalUser.avatarUrl;
        postsUpdated = true;
      }
      post.roasts.forEach((roast) => {
        if (roast.authorId === userId) {
          if (canonicalUser.displayName) roast.authorDisplayName = canonicalUser.displayName;
          if (canonicalUser.avatarUrl) roast.authorAvatar = canonicalUser.avatarUrl;
          postsUpdated = true;
        }
      });
    });

    if (postsUpdated) {
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    }

    this.notify();
    return canonicalUser;
  }

  public async updatePrivacy(userId: string, privacyUpdates: Partial<PrivacySettings>): Promise<void> {
    const current = this.getCurrentUser();
    if (!current) throw new Error("Must be logged in to update privacy");

    api.setToken(current.id);

    const user = this.getUsers().find((u) => u.id === userId);
    const nextPrivacy: PrivacySettings = {
      profileVisibility: "public",
      whoCanFriend: "everyone",
      whoCanComment: "everyone",
      savedPostsVisibility: "private",
      searchDiscoverable: true,
      ...(user?.privacy || {}),
      ...privacyUpdates,
    };

    await api.updatePrivacy(nextPrivacy);

    if (user) {
      user.privacy = nextPrivacy;
      const users = this.getUsers().map((u) => (u.id === userId ? user : u));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      this.notify();
    }
  }

  public async deleteAccount(userId: string): Promise<void> {
    api.setToken(userId);
    await api.deleteAccount();

    const users = this.getUsers().filter((u) => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    if (this.getCurrentUser()?.id === userId) {
      this.signOut();
    }
    this.notify();
  }

  public addRoastPoints(userId: string, points: number): void {
    const users = this.getUsers();
    const user = users.find((u) => u.id === userId);
    if (user) {
      user.roastPoints = Math.max(0, (user.roastPoints || 0) + points);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      this.notify();
    }
  }

  // --- POSTS & STORIES CRUD (BACKEND-FIRST) ---

  public getPosts(): Post[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.POSTS);
      const posts: Post[] = data ? JSON.parse(data) : [];
      
      const current = this.getCurrentUser();
      const savedMap = this.getSavedPostIdsMap();
      const savedForUser = current ? (savedMap[current.id] || []) : [];
      const blocked = this.getBlockedUsers();

      return posts
        .filter((p) => !blocked.includes(p.authorId))
        .map((p) => ({
          ...p,
          userSaved: p.userSaved !== undefined ? p.userSaved : savedForUser.includes(p.id),
        }));
    } catch {
      return [];
    }
  }

  public getPostById(postId: string): Post | undefined {
    return this.getPosts().find((p) => p.id === postId);
  }

  /**
   * Creates a post on the backend first!
   * Awaits the backend response and uses the canonical post ID.
   * If backend request fails, the post is not treated as created and throws an error.
   */
  public async createPost(params: {
    title: string;
    content: string;
    category: CategoryType;
    imageUrl?: string;
    hashtags: string[];
    isAnonymous: boolean;
    anonymousAlias?: string;
    authorId?: string;
    authorUsername?: string;
    authorDisplayName?: string;
    authorAvatar?: string;
    firstRoastContent?: string;
  }): Promise<Post> {
    const current = this.getCurrentUser();
    if (!current) throw new Error("Must be logged in to create a story");

    api.setToken(current.id);

    // 1. Backend creates post FIRST and generates canonical ID
    const res = await api.createPost({
      title: params.title.trim(),
      content: params.content.trim(),
      category: params.category,
      imageUrl: params.imageUrl,
      hashtags: params.hashtags,
      isAnonymous: params.isAnonymous,
      anonymousAlias: params.anonymousAlias,
      firstRoastContent: params.firstRoastContent?.trim() || undefined,
    });

    const canonicalPost = res.post;
    if (!canonicalPost || !canonicalPost.id) {
      throw new Error("Failed to create post: Invalid response from server");
    }

    // 2. Save canonical post to local cache using backend ID
    const posts = this.getPosts().filter((p) => p.id !== canonicalPost.id);
    posts.unshift(canonicalPost);
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));

    // 3. Update author's local stats
    this.updateUserLocally(current.id, {
      postsCount: (current.postsCount || 0) + 1,
      roastPoints: (current.roastPoints || 0) + 50 + (params.firstRoastContent ? 20 : 0),
    });

    this.notify();
    return canonicalPost;
  }

  public async deletePost(postId: string): Promise<void> {
    const current = this.getCurrentUser();
    if (!current) throw new Error("Must be logged in to delete story");

    api.setToken(current.id);

    // 1. Delete on backend
    await api.deletePost(postId);

    // 2. Remove from local cache
    const posts = this.getPosts().filter((p) => p.id !== postId);
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));

    this.updateUserLocally(current.id, {
      postsCount: Math.max(0, (current.postsCount || 0) - 1),
    });

    this.notify();
  }

  // --- REACTIONS (BACKEND-FIRST) ---

  public async toggleReaction(postId: string, reactionType: ReactionType): Promise<Post> {
    const current = this.getCurrentUser();
    if (!current) throw new Error("Must be logged in to react");

    api.setToken(current.id);

    // 1. Send reaction to backend
    const res = await api.reactToPost(postId, reactionType);

    // 2. Update post in local cache with canonical numbers
    const posts = this.getPosts();
    const post = posts.find((p) => p.id === postId);
    if (post) {
      post.reactions = res.reactions;
      post.userReaction = res.userReaction;
      post.flameScore = res.flameScore;
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
      this.notify();
      return post;
    }

    throw new Error("Post not found");
  }

  // --- ROASTS CRUD & VOTING (BACKEND-FIRST) ---

  /**
   * Submits a roast to the backend first!
   * Uses the backend-generated canonical roast ID and updates local cache.
   */
  public async addRoast(postId: string, content: string): Promise<Roast> {
    const current = this.getCurrentUser();
    if (!current) throw new Error("Must be logged in to drop a roast");

    api.setToken(current.id);

    // 1. The backend must create the roast first
    const res = await api.submitRoast(postId, content.trim());
    const canonicalRoast = res.roast;
    if (!canonicalRoast || !canonicalRoast.id) {
      throw new Error("Failed to drop roast: Invalid response from server");
    }

    // 2. Save roast to local cache using the canonical roast ID
    const posts = this.getPosts();
    const post = posts.find((p) => p.id === postId);
    if (post) {
      if (!post.roasts) post.roasts = [];
      post.roasts = post.roasts.filter((r) => r.id !== canonicalRoast.id);
      post.roasts.unshift(canonicalRoast);
      post.roastsCount = post.roasts.length;
      post.flameScore = (post.flameScore || 0) + 50;
      this.updateTopRoast(post);
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    }

    // 3. Update author's local stats
    this.updateUserLocally(current.id, {
      roastsCount: (current.roastsCount || 0) + 1,
      roastPoints: (current.roastPoints || 0) + 20,
    });

    this.notify();
    return canonicalRoast;
  }

  /**
   * Votes on a roast on the backend and updates local cache with canonical score.
   */
  public async voteRoast(postId: string, roastId: string, direction: "up" | "down"): Promise<Roast> {
    const current = this.getCurrentUser();
    if (!current) throw new Error("Must be logged in to vote on roasts");

    api.setToken(current.id);

    const posts = this.getPosts();
    const post = posts.find((p) => p.id === postId);
    if (!post) throw new Error("Story not found");

    const roast = (post.roasts || []).find((r) => r.id === roastId);
    if (!roast) throw new Error("Roast not found");

    const nextVote = roast.userVote === direction ? null : direction;

    // 1. Send vote to backend
    const res = await api.voteRoast(roastId, nextVote);

    // 2. Update roast with backend canonical numbers
    roast.score = res.score;
    roast.upvotes = res.upvotes;
    roast.downvotes = res.downvotes;
    roast.userVote = res.userVote;

    this.updateTopRoast(post);
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    this.notify();
    return roast;
  }

  private updateTopRoast(post: Post) {
    if (!post.roasts || post.roasts.length === 0) return;
    let highestScore = -Infinity;
    let topId = "";

    post.roasts.forEach((r) => {
      r.isTopRoast = false;
      if (r.score > highestScore && r.score >= 3) {
        highestScore = r.score;
        topId = r.id;
      }
    });

    if (topId) {
      const topRoast = post.roasts.find((r) => r.id === topId);
      if (topRoast) topRoast.isTopRoast = true;
    }
  }

  public async deleteRoast(postId: string, roastId: string): Promise<void> {
    const current = this.getCurrentUser();
    if (!current) throw new Error("Must be logged in to delete roast");

    api.setToken(current.id);

    // 1. Delete on backend
    await api.deleteRoast(roastId);

    // 2. Remove from local cache
    const posts = this.getPosts();
    const post = posts.find((p) => p.id === postId);
    if (post) {
      post.roasts = (post.roasts || []).filter((r) => r.id !== roastId);
      post.roastsCount = post.roasts.length;
      this.updateTopRoast(post);
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    }

    this.updateUserLocally(current.id, {
      roastsCount: Math.max(0, (current.roastsCount || 0) - 1),
    });

    this.notify();
  }

  // --- COMMENTS & REPLIES (BACKEND-FIRST) ---

  public async addComment(postId: string, content: string): Promise<Comment> {
    const current = this.getCurrentUser();
    if (!current) throw new Error("Must be logged in to comment");

    api.setToken(current.id);

    // 1. Backend creates comment first and returns canonical ID
    const res = await api.addComment(postId, content.trim());
    const canonicalComment = res.comment;
    if (!canonicalComment || !canonicalComment.id) {
      throw new Error("Failed to add comment: Invalid response from server");
    }

    // 2. Save canonical comment to local cache
    const posts = this.getPosts();
    const post = posts.find((p) => p.id === postId);
    if (post) {
      if (!post.comments) post.comments = [];
      post.comments = post.comments.filter((c) => c.id !== canonicalComment.id);
      post.comments.push(canonicalComment);
      post.commentsCount = post.comments.length;
      post.flameScore = (post.flameScore || 0) + 20;
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    }

    this.notify();
    return canonicalComment;
  }

  public async addReply(postId: string, commentId: string, content: string): Promise<CommentReply> {
    const current = this.getCurrentUser();
    if (!current) throw new Error("Must be logged in to reply");

    api.setToken(current.id);

    // 1. Backend creates reply first and returns canonical ID
    const res = await api.addReply(commentId, content.trim());
    const canonicalReply = res.reply;
    if (!canonicalReply || !canonicalReply.id) {
      throw new Error("Failed to add reply: Invalid response from server");
    }

    // 2. Save canonical reply to local cache
    const posts = this.getPosts();
    const post = posts.find((p) => p.id === postId);
    if (post) {
      const comment = (post.comments || []).find((c) => c.id === commentId);
      if (comment) {
        if (!comment.replies) comment.replies = [];
        comment.replies = comment.replies.filter((r) => r.id !== canonicalReply.id);
        comment.replies.push(canonicalReply);
        post.commentsCount = (post.commentsCount || 0) + 1;
        localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
      }
    }

    this.notify();
    return canonicalReply;
  }

  // --- SAVED STORIES (BACKEND-FIRST) ---

  private getSavedPostIdsMap(): Record<string, string[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SAVED_POST_IDS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  public async toggleSavePost(postId: string): Promise<boolean> {
    const current = this.getCurrentUser();
    if (!current) throw new Error("Must be logged in to save stories");

    api.setToken(current.id);

    // 1. Backend toggle
    const res = await api.toggleSavePost(postId);

    // 2. Update local saved IDs map
    const map = this.getSavedPostIdsMap();
    const userSaved = map[current.id] || [];
    let nextSaved: string[];
    if (res.saved) {
      nextSaved = Array.from(new Set([...userSaved, postId]));
    } else {
      nextSaved = userSaved.filter((id) => id !== postId);
    }

    map[current.id] = nextSaved;
    localStorage.setItem(STORAGE_KEYS.SAVED_POST_IDS, JSON.stringify(map));

    // 3. Update post savesCount in local cache
    const posts = this.getPosts();
    const post = posts.find((p) => p.id === postId);
    if (post) {
      post.savesCount = res.savesCount;
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    }

    this.notify();
    return res.saved;
  }

  public getUnreadNotificationCount(userId: string): number {
    return this.getNotifications(userId).filter((n) => !n.read).length;
  }

  public getPostsByAuthor(authorId: string): Post[] {
    const current = this.getCurrentUser();
    return this.getPosts().filter((p) => {
      if (p.authorId !== authorId) return false;
      if (p.isAnonymous && current?.id !== authorId) return false;
      return true;
    });
  }

  public getSavedPosts(userId?: string): Post[] {
    const targetId = userId || this.getCurrentUser()?.id;
    if (!targetId) return [];
    const map = this.getSavedPostIdsMap();
    const savedIds = map[targetId] || [];
    const posts = this.getPosts();
    return posts.filter((p) => savedIds.includes(p.id));
  }

  // --- FOLLOWS (BACKEND-FIRST) ---

  private getFollowsMap(): Record<string, string[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FOLLOWS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  public async toggleFollow(targetUserId: string): Promise<boolean> {
    const current = this.getCurrentUser();
    if (!current) throw new Error("Must be logged in to follow users");
    if (current.id === targetUserId) return false;

    api.setToken(current.id);

    // 1. Backend toggle
    const res = await api.toggleFollow(targetUserId);

    // 2. Update local follows map
    const map = this.getFollowsMap();
    const currentFollowing = map[current.id] || [];
    let nextFollowing: string[];
    if (res.followed) {
      nextFollowing = Array.from(new Set([...currentFollowing, targetUserId]));
    } else {
      nextFollowing = currentFollowing.filter((id) => id !== targetUserId);
    }
    map[current.id] = nextFollowing;
    localStorage.setItem(STORAGE_KEYS.FOLLOWS, JSON.stringify(map));

    this.notify();
    return res.followed;
  }

  public isFollowing(targetUserId: string): boolean {
    const current = this.getCurrentUser();
    if (!current) return false;
    const map = this.getFollowsMap();
    const following = map[current.id] || [];
    return following.includes(targetUserId);
  }

  // --- FRIENDS & FRIEND REQUESTS (BACKEND-FIRST) ---

  private getFriendsMap(): Record<string, string[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FRIENDS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  public getFriends(userId: string): User[] {
    const map = this.getFriendsMap();
    const friendIds = map[userId] || [];
    const users = this.getUsers();
    return friendIds.map((id) => users.find((u) => u.id === id)).filter(Boolean) as User[];
  }

  public isFriend(targetUserId: string): boolean {
    const current = this.getCurrentUser();
    if (!current) return false;
    const map = this.getFriendsMap();
    return (map[current.id] || []).includes(targetUserId);
  }

  public getFriendRequests(userId: string): { received: FriendRequest[]; sent: FriendRequest[] } {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FRIEND_REQUESTS);
      const all: FriendRequest[] = data ? JSON.parse(data) : [];
      return {
        received: all.filter((r) => r.receiverId === userId && r.status === "pending"),
        sent: all.filter((r) => r.senderId === userId && r.status === "pending"),
      };
    } catch {
      return { received: [], sent: [] };
    }
  }

  public async sendFriendRequest(targetUserId: string): Promise<FriendRequest> {
    const current = this.getCurrentUser();
    if (!current) throw new Error("Must be logged in to add friends");
    if (current.id === targetUserId) throw new Error("Cannot friend yourself");

    api.setToken(current.id);

    // 1. Backend call
    const res = await api.sendFriendRequest(targetUserId);

    // 2. Update local requests
    const data = localStorage.getItem(STORAGE_KEYS.FRIEND_REQUESTS);
    const all: FriendRequest[] = data ? JSON.parse(data) : [];
    const filtered = all.filter((r) => r.id !== res.request.id);
    filtered.push(res.request);
    localStorage.setItem(STORAGE_KEYS.FRIEND_REQUESTS, JSON.stringify(filtered));

    this.notify();
    return res.request;
  }

  public async respondFriendRequest(requestId: string, action: "accept" | "decline" | "cancel"): Promise<void> {
    const current = this.getCurrentUser();
    if (!current) return;

    api.setToken(current.id);

    // 1. Backend call
    await api.respondFriendRequest(requestId, action);

    // 2. Sync latest state from backend
    await this.syncFromServer();
  }

  public async unfriend(targetUserId: string): Promise<void> {
    const current = this.getCurrentUser();
    if (!current) return;

    api.setToken(current.id);

    await api.unfriend(targetUserId);
    await this.syncFromServer();
  }

  // --- NOTIFICATIONS ---

  public getNotifications(userId: string): Notification[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      const all: Notification[] = data ? JSON.parse(data) : SEED_NOTIFICATIONS;
      return all
        .filter((n) => n.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return SEED_NOTIFICATIONS;
    }
  }

  public async markNotificationAsRead(notifId: string): Promise<void> {
    const all = this.getAllNotifications();
    const notif = all.find((n) => n.id === notifId);
    if (notif) {
      notif.read = true;
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all));
      api.markNotificationRead(notifId).catch(() => {});
      this.notify();
    }
  }

  public async markAllNotificationsAsRead(userId: string): Promise<void> {
    const all = this.getAllNotifications();
    all.forEach((n) => {
      if (n.userId === userId) n.read = true;
    });
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all));
    api.markAllNotificationsRead().catch(() => {});
    this.notify();
  }

  private getAllNotifications(): Notification[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return data ? JSON.parse(data) : SEED_NOTIFICATIONS;
    } catch {
      return SEED_NOTIFICATIONS;
    }
  }

  // --- REPORTS & BLOCKING ---

  public getBlockedUsers(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BLOCKED_USERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public async blockUser(targetUserId: string): Promise<void> {
    const blocked = this.getBlockedUsers();
    if (!blocked.includes(targetUserId)) {
      blocked.push(targetUserId);
      localStorage.setItem(STORAGE_KEYS.BLOCKED_USERS, JSON.stringify(blocked));
      api.toggleBlockUser(targetUserId).catch(() => {});
      this.notify();
    }
  }

  public async createReport(report: Omit<Report, "id" | "createdAt" | "status">): Promise<Report> {
    const newReport: Report = {
      ...report,
      id: `report-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    try {
      await api.submitReport({
        targetType: report.targetType,
        targetId: report.targetId,
        reason: report.reason,
        details: report.details,
      });
    } catch {
      // ignore
    }

    const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
    const reports: Report[] = data ? JSON.parse(data) : [];
    reports.push(newReport);
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));

    return newReport;
  }

  // --- CONVERSATIONS & DIRECT MESSAGING ---

  public async getConversations(): Promise<any[]> {
    try {
      const res = await api.getConversations();
      return res.conversations || [];
    } catch {
      return [];
    }
  }

  public async getOrCreateConversation(targetUserId: string): Promise<any> {
    const res = await api.getOrCreateConversation(targetUserId);
    return res.conversation;
  }

  public async getMessages(conversationId: string): Promise<any[]> {
    try {
      const res = await api.getMessages(conversationId);
      return res.messages || [];
    } catch {
      return [];
    }
  }

  public async sendMessage(conversationId: string, content: string): Promise<any> {
    const res = await api.sendMessage(conversationId, content);
    this.notify();
    return res.message;
  }

  public async markConversationRead(conversationId: string): Promise<void> {
    try {
      await api.markConversationRead(conversationId);
      this.notify();
    } catch {
      // ignore
    }
  }

  // --- HALL OF FAME / LEADERBOARD COMPUTATIONS ---

  public getRoastOfTheDay(): (Roast & { postTitle: string; postCategory: string }) | null {
    const posts = this.getPosts();
    let bestRoast: Roast | null = null;
    let associatedPost: Post | null = null;
    let highestScore = -Infinity;

    posts.forEach((post) => {
      (post.roasts || []).forEach((roast) => {
        if (roast.score > highestScore) {
          highestScore = roast.score;
          bestRoast = roast;
          associatedPost = post;
        }
      });
    });

    if (!bestRoast || !associatedPost) return null;
    return {
      ...(bestRoast as Roast),
      postTitle: (associatedPost as Post).title,
      postCategory: (associatedPost as Post).category,
    };
  }

  public getTopRoasters(): User[] {
    const users = this.getUsers();
    return [...users].sort((a, b) => (b.roastPoints || 0) - (a.roastPoints || 0));
  }

  public getMostUnhingedStories(): Post[] {
    const posts = this.getPosts();
    return [...posts].sort((a, b) => (b.flameScore || 0) - (a.flameScore || 0));
  }

  public getWeeklyWinners(): Array<Roast & { postTitle: string; rank: number }> {
    const posts = this.getPosts();
    const allRoasts: Array<Roast & { postTitle: string }> = [];

    posts.forEach((post) => {
      (post.roasts || []).forEach((roast) => {
        allRoasts.push({
          ...roast,
          postTitle: post.title,
        });
      });
    });

    return allRoasts
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }

  private updateUserLocally(userId: string, updates: Partial<User>) {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
  }
}

export const storage = new StorageService();
