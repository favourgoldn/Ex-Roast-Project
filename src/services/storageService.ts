import { 
  User, 
  Post, 
  Roast, 
  Comment, 
  CommentReply, 
  Notification, 
  Report, 
  ReactionType, 
  CategoryType 
} from "../types";
import { SEED_USERS, SEED_POSTS, SEED_NOTIFICATIONS, DEFAULT_BADGES } from "./seedData";

const STORAGE_KEYS = {
  USERS: "exroast_users_v2",
  CURRENT_USER_ID: "exroast_current_user_id_v2",
  POSTS: "exroast_posts_v2",
  NOTIFICATIONS: "exroast_notifications_v2",
  FOLLOWS: "exroast_follows_v2",
  SAVED_POST_IDS: "exroast_saved_post_ids_v2",
  BLOCKED_USERS: "exroast_blocked_users_v2",
  REPORTS: "exroast_reports_v2",
};

type ListenerCallback = () => void;

class StorageService {
  private listeners: Set<ListenerCallback> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === "undefined") return;

    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)) {
      // Default to the first seed user (@HeartbreakDealer)
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, SEED_USERS[0].id);
    }
    if (!localStorage.getItem(STORAGE_KEYS.POSTS)) {
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(SEED_POSTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(SEED_NOTIFICATIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.FOLLOWS)) {
      // Seed follow relationships
      localStorage.setItem(STORAGE_KEYS.FOLLOWS, JSON.stringify({
        "user-1": ["user-2", "user-3"],
        "user-2": ["user-1", "user-5"],
      }));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SAVED_POST_IDS)) {
      localStorage.setItem(STORAGE_KEYS.SAVED_POST_IDS, JSON.stringify({
        "user-1": ["post-1", "post-2"],
      }));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BLOCKED_USERS)) {
      localStorage.setItem(STORAGE_KEYS.BLOCKED_USERS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify([]));
    }
  }

  public subscribe(callback: ListenerCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach((callback) => callback());
  }

  // --- USER AUTH & PROFILE METHODS ---

  public getUsers(): User[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : SEED_USERS;
    } catch {
      return SEED_USERS;
    }
  }

  public getCurrentUser(): User | null {
    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (!currentId) return null;
    const users = this.getUsers();
    return users.find((u) => u.id === currentId) || users[0] || null;
  }

  public setCurrentUser(userId: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
    this.notify();
  }

  public signUp(username: string, email: string, displayName: string, avatarUrl?: string, bio?: string): User {
    const users = this.getUsers();
    const existing = users.find((u) => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error("Username or email already exists");
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      username: username.replace(/[^a-zA-Z0-9_]/g, ""),
      displayName: displayName || username,
      email,
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
      bio: bio || "New to EX ROAST. Here to share stories and drop burns.",
      relationshipStatus: "Single & Unbothered",
      roastPoints: 100, // Welcome points
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      roastsCount: 0,
      winsCount: 0,
      badges: [DEFAULT_BADGES[1]], // Heartbreak veteran starter badge
      createdAt: new Date().toISOString(),
      isVerified: false,
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.setCurrentUser(newUser.id);
    
    // Add welcome notification
    this.createNotification({
      userId: newUser.id,
      actorId: "system",
      actorUsername: "exroast",
      actorDisplayName: "EX ROAST",
      actorAvatar: "",
      type: "achievement_unlocked",
      title: "Welcome to EX ROAST 🔥",
      message: "You received 100 bonus Roast Points for joining the community!",
      createdAt: new Date().toISOString(),
      read: false,
    });

    this.notify();
    return newUser;
  }

  public signIn(identifier: string): User {
    const users = this.getUsers();
    const cleanId = identifier.trim().toLowerCase().replace(/^@/, "");
    const user = users.find((u) => u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId);
    if (!user) {
      throw new Error("No account found with this username or email");
    }
    this.setCurrentUser(user.id);
    return user;
  }

  public signOut(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    this.notify();
  }

  public updateUser(userId: string, updates: Partial<User>): User {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) throw new Error("User not found");

    users[index] = { ...users[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Also update author info across their posts and roasts
    const posts = this.getPosts();
    let postsUpdated = false;
    posts.forEach((post) => {
      if (post.authorId === userId && !post.isAnonymous) {
        if (updates.displayName) post.authorDisplayName = updates.displayName;
        if (updates.avatarUrl) post.authorAvatar = updates.avatarUrl;
        postsUpdated = true;
      }
      post.roasts.forEach((roast) => {
        if (roast.authorId === userId) {
          if (updates.displayName) roast.authorDisplayName = updates.displayName;
          if (updates.avatarUrl) roast.authorAvatar = updates.avatarUrl;
          postsUpdated = true;
        }
      });
    });

    if (postsUpdated) {
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    }

    this.notify();
    return users[index];
  }

  public addRoastPoints(userId: string, points: number): void {
    const users = this.getUsers();
    const user = users.find((u) => u.id === userId);
    if (user) {
      user.roastPoints = Math.max(0, user.roastPoints + points);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      this.notify();
    }
  }

  // --- POSTS & STORIES CRUD ---

  public getPosts(): Post[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.POSTS);
      const posts: Post[] = data ? JSON.parse(data) : SEED_POSTS;
      
      const current = this.getCurrentUser();
      const savedMap = this.getSavedPostIdsMap();
      const savedForUser = current ? (savedMap[current.id] || []) : [];
      const blocked = this.getBlockedUsers();

      return posts
        .filter((p) => !blocked.includes(p.authorId))
        .map((p) => ({
          ...p,
          userSaved: savedForUser.includes(p.id),
        }));
    } catch {
      return SEED_POSTS;
    }
  }

  public getPostById(postId: string): Post | undefined {
    return this.getPosts().find((p) => p.id === postId);
  }

  public createPost(params: {
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
  }): Post {
    const current = this.getCurrentUser();
    if (!current) throw new Error("Must be logged in to create a story");

    const authorId = params.authorId || current.id;
    const authorUsername = params.authorUsername || (params.isAnonymous ? "anonymous" : current.username);
    const authorDisplayName = params.authorDisplayName || (params.isAnonymous ? (params.anonymousAlias || "Anonymous") : current.displayName);
    const authorAvatar = params.authorAvatar || (params.isAnonymous 
      ? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80" 
      : current.avatarUrl);

    const posts = this.getPosts();
    const postId = `post-${Date.now()}`;
    const initialRoasts: Roast[] = [];

    if (params.firstRoastContent && params.firstRoastContent.trim()) {
      initialRoasts.push({
        id: `roast-${Date.now()}-0`,
        postId,
        authorId: current.id,
        authorUsername: current.username,
        authorDisplayName: current.displayName,
        authorAvatar: current.avatarUrl,
        content: params.firstRoastContent.trim(),
        score: 5,
        upvotes: 5,
        downvotes: 0,
        createdAt: new Date().toISOString(),
        isTopRoast: true,
      });
    }

    const newPost: Post = {
      id: postId,
      authorId,
      authorUsername,
      authorDisplayName,
      authorAvatar,
      isAnonymous: params.isAnonymous,
      anonymousAlias: params.anonymousAlias,
      title: params.title,
      content: params.content,
      category: params.category,
      imageUrl: params.imageUrl,
      hashtags: params.hashtags.map((t) => t.replace(/^#/, "").trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
      reactions: { savage: 0, dead: 0, redFlag: 0, deserved: 0 },
      roastsCount: initialRoasts.length,
      commentsCount: 0,
      savesCount: 0,
      sharesCount: 0,
      roasts: initialRoasts,
      comments: [],
      flameScore: 100,
    };

    posts.unshift(newPost);
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));

    // Update user stats
    this.updateUser(current.id, { postsCount: current.postsCount + 1 });
    this.addRoastPoints(current.id, 100); // reward 100 points for posting

    this.notify();
    return newPost;
  }

  public deletePost(postId: string): void {
    const current = this.getCurrentUser();
    const posts = this.getPosts();
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    if (current && post.authorId === current.id) {
      const filtered = posts.filter((p) => p.id !== postId);
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(filtered));
      this.updateUser(current.id, { postsCount: Math.max(0, current.postsCount - 1) });
      this.notify();
    }
  }

  // --- REACTIONS ---

  public toggleReaction(postId: string, reactionType: ReactionType): Post {
    const current = this.getCurrentUser();
    if (!current) throw new Error("Must be logged in to react");

    const posts = this.getPosts();
    const post = posts.find((p) => p.id === postId);
    if (!post) throw new Error("Post not found");

    const currentReaction = post.userReaction;

    if (currentReaction === reactionType) {
      // Remove reaction
      post.reactions[reactionType] = Math.max(0, post.reactions[reactionType] - 1);
      post.userReaction = null;
      post.flameScore = Math.max(0, post.flameScore - 10);
    } else {
      // If had previous reaction, decrement it
      if (currentReaction) {
        post.reactions[currentReaction] = Math.max(0, post.reactions[currentReaction] - 1);
      }
      post.reactions[reactionType] = (post.reactions[reactionType] || 0) + 1;
      post.userReaction = reactionType;
      post.flameScore += 15;

      // Send notification to author if not self
      if (post.authorId !== current.id && !post.isAnonymous) {
        const emoji = reactionType === "savage" ? "🔥" : reactionType === "dead" ? "💀" : reactionType === "redFlag" ? "🚩" : "👏";
        this.createNotification({
          userId: post.authorId,
          actorId: current.id,
          actorUsername: current.username,
          actorDisplayName: current.displayName,
          actorAvatar: current.avatarUrl,
          type: "post_reaction",
          title: `New Reaction ${emoji}`,
          message: `@${current.username} reacted with ${emoji} to your story "${post.title.slice(0, 30)}..."`,
          targetPostId: post.id,
          createdAt: new Date().toISOString(),
          read: false,
        });
      }
    }

    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    this.notify();
    return post;
  }

  // --- ROASTS CRUD & VOTING ---

  public addRoast(postId: string, content: string): Roast {
    const current = this.getCurrentUser();
    if (!current) throw new Error("Must be logged in to drop a roast");

    const posts = this.getPosts();
    const post = posts.find((p) => p.id === postId);
    if (!post) throw new Error("Story not found");

    const newRoast: Roast = {
      id: `roast-${Date.now()}`,
      postId,
      authorId: current.id,
      authorUsername: current.username,
      authorDisplayName: current.displayName,
      authorAvatar: current.avatarUrl,
      content: content.trim(),
      score: 1,
      upvotes: 1,
      downvotes: 0,
      createdAt: new Date().toISOString(),
      userVote: "up",
    };

    post.roasts.unshift(newRoast);
    post.roastsCount = post.roasts.length;
    post.flameScore += 50;

    // Recalculate top roast
    this.updateTopRoast(post);

    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));

    // Update user stats
    this.updateUser(current.id, { roastsCount: current.roastsCount + 1 });
    this.addRoastPoints(current.id, 25); // reward 25 points for submitting roast

    // Send notification to post author
    if (post.authorId !== current.id && !post.isAnonymous) {
      this.createNotification({
        userId: post.authorId,
        actorId: current.id,
        actorUsername: current.username,
        actorDisplayName: current.displayName,
        actorAvatar: current.avatarUrl,
        type: "roast_submitted",
        title: "New Roast Dropped 🔥",
        message: `@${current.username} roasted your story: "${content.slice(0, 45)}..."`,
        targetPostId: post.id,
        targetRoastId: newRoast.id,
        createdAt: new Date().toISOString(),
        read: false,
      });
    }

    this.notify();
    return newRoast;
  }

  public voteRoast(postId: string, roastId: string, direction: "up" | "down"): Roast {
    const current = this.getCurrentUser();
    if (!current) throw new Error("Must be logged in to vote on roasts");

    const posts = this.getPosts();
    const post = posts.find((p) => p.id === postId);
    if (!post) throw new Error("Story not found");

    const roast = post.roasts.find((r) => r.id === roastId);
    if (!roast) throw new Error("Roast not found");

    const currentVote = roast.userVote;

    if (currentVote === direction) {
      // Toggle off
      if (direction === "up") {
        roast.upvotes = Math.max(0, roast.upvotes - 1);
      } else {
        roast.downvotes = Math.max(0, roast.downvotes - 1);
      }
      roast.userVote = null;
    } else {
      if (currentVote === "up") {
        roast.upvotes = Math.max(0, roast.upvotes - 1);
      } else if (currentVote === "down") {
        roast.downvotes = Math.max(0, roast.downvotes - 1);
      }

      if (direction === "up") {
        roast.upvotes += 1;
        this.addRoastPoints(roast.authorId, 10);
      } else {
        roast.downvotes += 1;
        this.addRoastPoints(roast.authorId, -5);
      }
      roast.userVote = direction;

      // Send notification if upvoted
      if (direction === "up" && roast.authorId !== current.id) {
        this.createNotification({
          userId: roast.authorId,
          actorId: current.id,
          actorUsername: current.username,
          actorDisplayName: current.displayName,
          actorAvatar: current.avatarUrl,
          type: "roast_voted",
          title: "Roast Upvoted 🚀",
          message: `@${current.username} gave your roast a flame point!`,
          targetPostId: post.id,
          targetRoastId: roast.id,
          createdAt: new Date().toISOString(),
          read: false,
        });
      }
    }

    roast.score = roast.upvotes - roast.downvotes;
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

  public deleteRoast(postId: string, roastId: string): void {
    const current = this.getCurrentUser();
    const posts = this.getPosts();
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const roast = post.roasts.find((r) => r.id === roastId);
    if (!roast) return;

    if (current && roast.authorId === current.id) {
      post.roasts = post.roasts.filter((r) => r.id !== roastId);
      post.roastsCount = post.roasts.length;
      this.updateTopRoast(post);
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
      this.updateUser(current.id, { roastsCount: Math.max(0, current.roastsCount - 1) });
      this.notify();
    }
  }

  // --- COMMENTS & REPLIES ---

  public addComment(postId: string, content: string): Comment {
    const current = this.getCurrentUser();
    if (!current) throw new Error("Must be logged in to comment");

    const posts = this.getPosts();
    const post = posts.find((p) => p.id === postId);
    if (!post) throw new Error("Post not found");

    const newComment: Comment = {
      id: `comm-${Date.now()}`,
      postId,
      authorId: current.id,
      authorUsername: current.username,
      authorDisplayName: current.displayName,
      authorAvatar: current.avatarUrl,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      likes: 0,
      replies: [],
    };

    if (!post.comments) post.comments = [];
    post.comments.push(newComment);
    post.commentsCount = (post.commentsCount || 0) + 1;
    post.flameScore += 20;

    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));

    if (post.authorId !== current.id && !post.isAnonymous) {
      this.createNotification({
        userId: post.authorId,
        actorId: current.id,
        actorUsername: current.username,
        actorDisplayName: current.displayName,
        actorAvatar: current.avatarUrl,
        type: "post_comment",
        title: "New Comment 💬",
        message: `@${current.username} commented on your story: "${content.slice(0, 40)}..."`,
        targetPostId: post.id,
        createdAt: new Date().toISOString(),
        read: false,
      });
    }

    this.notify();
    return newComment;
  }

  public addReply(postId: string, commentId: string, content: string): CommentReply {
    const current = this.getCurrentUser();
    if (!current) throw new Error("Must be logged in to reply");

    const posts = this.getPosts();
    const post = posts.find((p) => p.id === postId);
    if (!post) throw new Error("Post not found");

    const comment = (post.comments || []).find((c) => c.id === commentId);
    if (!comment) throw new Error("Comment not found");

    const newReply: CommentReply = {
      id: `reply-${Date.now()}`,
      commentId,
      authorId: current.id,
      authorUsername: current.username,
      authorDisplayName: current.displayName,
      authorAvatar: current.avatarUrl,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    if (!comment.replies) comment.replies = [];
    comment.replies.push(newReply);
    post.commentsCount = (post.commentsCount || 0) + 1;

    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));

    if (comment.authorId !== current.id) {
      this.createNotification({
        userId: comment.authorId,
        actorId: current.id,
        actorUsername: current.username,
        actorDisplayName: current.displayName,
        actorAvatar: current.avatarUrl,
        type: "comment_reply",
        title: "Reply to your comment",
        message: `@${current.username} replied: "${content.slice(0, 40)}..."`,
        targetPostId: post.id,
        createdAt: new Date().toISOString(),
        read: false,
      });
    }

    this.notify();
    return newReply;
  }

  // --- SAVED STORIES ---

  private getSavedPostIdsMap(): Record<string, string[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SAVED_POST_IDS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  public toggleSavePost(postId: string): boolean {
    const current = this.getCurrentUser();
    if (!current) throw new Error("Must be logged in to save stories");

    const map = this.getSavedPostIdsMap();
    const userSaved = map[current.id] || [];
    const isSaved = userSaved.includes(postId);

    let nextSaved: string[];
    if (isSaved) {
      nextSaved = userSaved.filter((id) => id !== postId);
    } else {
      nextSaved = [...userSaved, postId];
    }

    map[current.id] = nextSaved;
    localStorage.setItem(STORAGE_KEYS.SAVED_POST_IDS, JSON.stringify(map));

    // Update post count
    const posts = this.getPosts();
    const post = posts.find((p) => p.id === postId);
    if (post) {
      post.savesCount = Math.max(0, (post.savesCount || 0) + (isSaved ? -1 : 1));
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    }

    this.notify();
    return !isSaved;
  }

  public getUnreadNotificationCount(userId: string): number {
    return this.getNotifications(userId).filter((n) => !n.read).length;
  }

  public getPostsByAuthor(authorId: string): Post[] {
    return this.getPosts().filter((p) => p.authorId === authorId);
  }

  public getSavedPosts(userId?: string): Post[] {
    const targetId = userId || this.getCurrentUser()?.id;
    if (!targetId) return [];
    const map = this.getSavedPostIdsMap();
    const savedIds = map[targetId] || [];
    const posts = this.getPosts();
    return posts.filter((p) => savedIds.includes(p.id));
  }

  // --- FOLLOWS ---

  private getFollowsMap(): Record<string, string[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FOLLOWS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  public toggleFollow(targetUserId: string): boolean {
    const current = this.getCurrentUser();
    if (!current) throw new Error("Must be logged in to follow users");
    if (current.id === targetUserId) return false;

    const map = this.getFollowsMap();
    const currentFollowing = map[current.id] || [];
    const isFollowing = currentFollowing.includes(targetUserId);

    let nextFollowing: string[];
    if (isFollowing) {
      nextFollowing = currentFollowing.filter((id) => id !== targetUserId);
    } else {
      nextFollowing = [...currentFollowing, targetUserId];
    }
    map[current.id] = nextFollowing;
    localStorage.setItem(STORAGE_KEYS.FOLLOWS, JSON.stringify(map));

    // Update follow counts on user entities
    const users = this.getUsers();
    const curUser = users.find((u) => u.id === current.id);
    const tarUser = users.find((u) => u.id === targetUserId);

    if (curUser) {
      curUser.followingCount = Math.max(0, curUser.followingCount + (isFollowing ? -1 : 1));
    }
    if (tarUser) {
      tarUser.followersCount = Math.max(0, tarUser.followersCount + (isFollowing ? -1 : 1));
    }

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    if (!isFollowing && tarUser) {
      this.createNotification({
        userId: targetUserId,
        actorId: current.id,
        actorUsername: current.username,
        actorDisplayName: current.displayName,
        actorAvatar: current.avatarUrl,
        type: "user_followed",
        title: "New Follower",
        message: `@${current.username} followed you.`,
        createdAt: new Date().toISOString(),
        read: false,
      });
    }

    this.notify();
    return !isFollowing;
  }

  public isFollowing(targetUserId: string): boolean {
    const current = this.getCurrentUser();
    if (!current) return false;
    const map = this.getFollowsMap();
    const following = map[current.id] || [];
    return following.includes(targetUserId);
  }

  // --- NOTIFICATIONS ---

  public getNotifications(userId: string): Notification[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      const all: Notification[] = data ? JSON.parse(data) : SEED_NOTIFICATIONS;
      return all.filter((n) => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return SEED_NOTIFICATIONS;
    }
  }

  public createNotification(notif: Omit<Notification, "id">): void {
    const all = this.getAllNotifications();
    const newNotif: Notification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    };
    all.unshift(newNotif);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all));
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

  public markNotificationAsRead(notifId: string): void {
    const all = this.getAllNotifications();
    const notif = all.find((n) => n.id === notifId);
    if (notif) {
      notif.read = true;
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all));
      this.notify();
    }
  }

  public markAllNotificationsAsRead(userId: string): void {
    const all = this.getAllNotifications();
    all.forEach((n) => {
      if (n.userId === userId) n.read = true;
    });
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all));
    this.notify();
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

  public blockUser(targetUserId: string): void {
    const blocked = this.getBlockedUsers();
    if (!blocked.includes(targetUserId)) {
      blocked.push(targetUserId);
      localStorage.setItem(STORAGE_KEYS.BLOCKED_USERS, JSON.stringify(blocked));
      this.notify();
    }
  }

  public createReport(report: Omit<Report, "id" | "createdAt" | "status">): Report {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
      const reports: Report[] = data ? JSON.parse(data) : [];
      const newReport: Report = {
        ...report,
        id: `report-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: "pending",
      };
      reports.push(newReport);
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
      return newReport;
    } catch {
      return {
        ...report,
        id: `report-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: "pending",
      };
    }
  }

  // --- HALL OF FAME / LEADERBOARD COMPUTATIONS ---

  public getRoastOfTheDay(): Roast & { postTitle: string; postCategory: string } | null {
    const posts = this.getPosts();
    let bestRoast: Roast | null = null;
    let associatedPost: Post | null = null;
    let highestScore = -Infinity;

    posts.forEach((post) => {
      post.roasts.forEach((roast) => {
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
    return [...users].sort((a, b) => b.roastPoints - a.roastPoints);
  }

  public getMostUnhingedStories(): Post[] {
    const posts = this.getPosts();
    return [...posts].sort((a, b) => b.flameScore - a.flameScore);
  }

  public getWeeklyWinners(): Array<Roast & { postTitle: string; rank: number }> {
    const posts = this.getPosts();
    const allRoasts: Array<Roast & { postTitle: string }> = [];

    posts.forEach((post) => {
      post.roasts.forEach((roast) => {
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
}

export const storage = new StorageService();
