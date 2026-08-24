import { supabase, isSupabaseConfigured } from "../lib/supabase";
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

export interface CreatePostParams {
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatar: string;
  title: string;
  content: string;
  category: CategoryType;
  isAnonymous?: boolean;
  anonymousAlias?: string;
  imageUrl?: string;
  hashtags?: string[];
  firstRoastContent?: string;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderUsername?: string;
  senderAvatar?: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface ConversationItem {
  id: string;
  otherUser: User;
  lastMessage?: DirectMessage;
  unreadCount: number;
  updatedAt: string;
}

export const supabaseService = {
  isAvailable(): boolean {
    return isSupabaseConfigured;
  },

  // --------------------------------------------------------------------------
  // AUTHENTICATION
  // --------------------------------------------------------------------------
  async signUp(email: string, password: string, username: string, displayName: string, avatarUrl?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: displayName,
          avatar_url: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
        },
      },
    });
    if (error) throw error;
    return data;
  },

  async signIn(emailOrUsername: string, password: string) {
    let email = emailOrUsername;
    if (!email.includes("@")) {
      // Find email for this username from profiles
      const { data } = await supabase
        .from("profiles")
        .select("email")
        .ilike("username", emailOrUsername.trim())
        .maybeSingle();
      if (data?.email) {
        email = data.email;
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return data;
  },

  async deleteAccount(userId: string) {
    const { error } = await supabase.from("profiles").delete().eq("id", userId);
    if (error) throw error;
    await supabase.auth.signOut();
  },

  // --------------------------------------------------------------------------
  // PROFILES
  // --------------------------------------------------------------------------
  async getProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      username: data.username,
      displayName: data.display_name,
      email: data.email || "",
      avatarUrl: data.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${data.username}`,
      bio: data.bio || "",
      relationshipStatus: data.relationship_status || "Single & Unbothered",
      roastPoints: data.roast_points || 100,
      followersCount: data.followers_count || 0,
      followingCount: data.following_count || 0,
      friendsCount: data.friends_count || 0,
      postsCount: data.posts_count || 0,
      roastsCount: data.roasts_count || 0,
      winsCount: data.wins_count || 0,
      badges: [],
      createdAt: data.created_at,
      isVerified: data.is_verified || false,
      privacy: data.privacy || {
        profileVisibility: "public",
        whoCanFriend: "everyone",
        whoCanComment: "everyone",
        savedPostsVisibility: "private",
        searchDiscoverable: true,
      },
    };
  },

  async updateProfile(userId: string, updates: Partial<User>) {
    const payload: any = {};
    if (updates.displayName !== undefined) payload.display_name = updates.displayName;
    if (updates.bio !== undefined) payload.bio = updates.bio;
    if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;
    if (updates.relationshipStatus !== undefined) payload.relationship_status = updates.relationshipStatus;
    if (updates.privacy !== undefined) payload.privacy = updates.privacy;

    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAllProfiles(): Promise<User[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("roast_points", { ascending: false });

    if (error || !data) return [];
    return data.map((p) => ({
      id: p.id,
      username: p.username,
      displayName: p.display_name,
      email: p.email || "",
      avatarUrl: p.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${p.username}`,
      bio: p.bio || "",
      relationshipStatus: p.relationship_status || "Single & Unbothered",
      roastPoints: p.roast_points || 100,
      followersCount: p.followers_count || 0,
      followingCount: p.following_count || 0,
      friendsCount: p.friends_count || 0,
      postsCount: p.posts_count || 0,
      roastsCount: p.roasts_count || 0,
      winsCount: p.wins_count || 0,
      badges: [],
      createdAt: p.created_at,
      isVerified: p.is_verified || false,
      privacy: p.privacy,
    }));
  },

  // --------------------------------------------------------------------------
  // POSTS
  // --------------------------------------------------------------------------
  async fetchPosts(currentUserId?: string): Promise<Post[]> {
    const { data: postsData, error } = await supabase
      .from("posts")
      .select(`
        *,
        roasts:roasts(*),
        comments:comments(*, replies:comment_replies(*))
      `)
      .order("created_at", { ascending: false });

    if (error || !postsData) return [];

    // Fetch user saves and reactions if logged in
    let userSaves = new Set<string>();
    let userReactionsMap = new Map<string, ReactionType>();

    if (currentUserId) {
      const [savesRes, reactionsRes] = await Promise.all([
        supabase.from("saves").select("post_id").eq("user_id", currentUserId),
        supabase.from("reactions").select("post_id, reaction_type").eq("user_id", currentUserId),
      ]);
      savesRes.data?.forEach((s) => userSaves.add(s.post_id));
      reactionsRes.data?.forEach((r) => userReactionsMap.set(r.post_id, r.reaction_type as ReactionType));
    }

    return postsData.map((p) => ({
      id: p.id,
      authorId: p.author_id,
      authorUsername: p.author_username,
      authorDisplayName: p.author_display_name,
      authorAvatar: p.author_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${p.author_username}`,
      isAnonymous: p.is_anonymous || false,
      anonymousAlias: p.anonymous_alias,
      title: p.title,
      content: p.content,
      category: p.category as CategoryType,
      imageUrl: p.image_url,
      hashtags: p.hashtags || [],
      createdAt: p.created_at,
      reactions: {
        savage: p.reactions_savage || 0,
        dead: p.reactions_dead || 0,
        redFlag: p.reactions_red_flag || 0,
        deserved: p.reactions_deserved || 0,
      },
      userReaction: userReactionsMap.get(p.id) || null,
      userSaved: userSaves.has(p.id),
      roastsCount: p.roasts?.length || 0,
      commentsCount: p.comments?.length || 0,
      savesCount: p.saves_count || 0,
      sharesCount: p.shares_count || 0,
      flameScore: p.flame_score || 0,
      roasts: (p.roasts || []).map((r: any) => ({
        id: r.id,
        postId: r.post_id,
        authorId: r.author_id,
        authorUsername: r.author_username,
        authorDisplayName: r.author_display_name,
        authorAvatar: r.author_avatar,
        content: r.content,
        score: r.score || 0,
        upvotes: r.upvotes || 0,
        downvotes: r.downvotes || 0,
        createdAt: r.created_at,
        isTopRoast: r.is_top_roast,
        isRoastOfTheDay: r.is_roast_of_the_day,
      })),
      comments: (p.comments || []).map((c: any) => ({
        id: c.id,
        postId: c.post_id,
        authorId: c.author_id,
        authorUsername: c.author_username,
        authorDisplayName: c.author_display_name,
        authorAvatar: c.author_avatar,
        content: c.content,
        createdAt: c.created_at,
        likes: c.likes || 0,
        replies: (c.replies || []).map((rep: any) => ({
          id: rep.id,
          commentId: rep.comment_id,
          authorId: rep.author_id,
          authorUsername: rep.author_username,
          authorDisplayName: rep.author_display_name,
          authorAvatar: rep.author_avatar,
          content: rep.content,
          createdAt: rep.created_at,
          likes: rep.likes || 0,
        })),
      })),
    }));
  },

  async createPost(params: CreatePostParams): Promise<Post> {
    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        author_id: params.authorId,
        author_username: params.authorUsername,
        author_display_name: params.authorDisplayName,
        author_avatar: params.authorAvatar,
        is_anonymous: params.isAnonymous || false,
        anonymous_alias: params.anonymousAlias,
        title: params.title,
        content: params.content,
        category: params.category,
        image_url: params.imageUrl,
        hashtags: params.hashtags || [],
      })
      .select()
      .single();

    if (error) throw error;

    if (params.firstRoastContent?.trim()) {
      await supabase.from("roasts").insert({
        post_id: post.id,
        author_id: params.authorId,
        author_username: params.authorUsername,
        author_display_name: params.authorDisplayName,
        author_avatar: params.authorAvatar,
        content: params.firstRoastContent.trim(),
        score: 1,
        upvotes: 1,
        downvotes: 0,
      });
    }

    return {
      id: post.id,
      authorId: post.author_id,
      authorUsername: post.author_username,
      authorDisplayName: post.author_display_name,
      authorAvatar: post.author_avatar,
      isAnonymous: post.is_anonymous,
      anonymousAlias: post.anonymous_alias,
      title: post.title,
      content: post.content,
      category: post.category,
      imageUrl: post.image_url,
      hashtags: post.hashtags || [],
      createdAt: post.created_at,
      reactions: { savage: 0, dead: 0, redFlag: 0, deserved: 0 },
      roastsCount: params.firstRoastContent ? 1 : 0,
      commentsCount: 0,
      savesCount: 0,
      sharesCount: 0,
      flameScore: 0,
      roasts: [],
      comments: [],
    };
  },

  async updatePost(postId: string, updates: { title?: string; content?: string; category?: CategoryType }) {
    const { data, error } = await supabase
      .from("posts")
      .update(updates)
      .eq("id", postId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePost(postId: string) {
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) throw error;
  },

  // --------------------------------------------------------------------------
  // ROASTS & COMMENTS
  // --------------------------------------------------------------------------
  async createRoast(postId: string, author: User, content: string): Promise<Roast> {
    const { data, error } = await supabase
      .from("roasts")
      .insert({
        post_id: postId,
        author_id: author.id,
        author_username: author.username,
        author_display_name: author.displayName,
        author_avatar: author.avatarUrl,
        content,
        score: 0,
        upvotes: 0,
        downvotes: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      postId: data.post_id,
      authorId: data.author_id,
      authorUsername: data.author_username,
      authorDisplayName: data.author_display_name,
      authorAvatar: data.author_avatar,
      content: data.content,
      score: data.score,
      upvotes: data.upvotes,
      downvotes: data.downvotes,
      createdAt: data.created_at,
    };
  },

  async createComment(postId: string, author: User, content: string): Promise<Comment> {
    const { data, error } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        author_id: author.id,
        author_username: author.username,
        author_display_name: author.displayName,
        author_avatar: author.avatarUrl,
        content,
        likes: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      postId: data.post_id,
      authorId: data.author_id,
      authorUsername: data.author_username,
      authorDisplayName: data.author_display_name,
      authorAvatar: data.author_avatar,
      content: data.content,
      createdAt: data.created_at,
      likes: 0,
      replies: [],
    };
  },

  async createReply(commentId: string, author: User, content: string): Promise<CommentReply> {
    const { data, error } = await supabase
      .from("comment_replies")
      .insert({
        comment_id: commentId,
        author_id: author.id,
        author_username: author.username,
        author_display_name: author.displayName,
        author_avatar: author.avatarUrl,
        content,
        likes: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      commentId: data.comment_id,
      authorId: data.author_id,
      authorUsername: data.author_username,
      authorDisplayName: data.author_display_name,
      authorAvatar: data.author_avatar,
      content: data.content,
      createdAt: data.created_at,
      likes: 0,
    };
  },

  // --------------------------------------------------------------------------
  // REACTIONS & SAVES
  // --------------------------------------------------------------------------
  async toggleReaction(postId: string, userId: string, reactionType: ReactionType) {
    const { data: existing } = await supabase
      .from("reactions")
      .select("id, reaction_type")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      if (existing.reaction_type === reactionType) {
        await supabase.from("reactions").delete().eq("id", existing.id);
        return null;
      } else {
        await supabase.from("reactions").update({ reaction_type: reactionType }).eq("id", existing.id);
        return reactionType;
      }
    } else {
      await supabase.from("reactions").insert({
        post_id: postId,
        user_id: userId,
        reaction_type: reactionType,
      });
      return reactionType;
    }
  },

  async toggleSave(postId: string, userId: string): Promise<boolean> {
    const { data: existing } = await supabase
      .from("saves")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      await supabase.from("saves").delete().eq("id", existing.id);
      return false;
    } else {
      await supabase.from("saves").insert({ post_id: postId, user_id: userId });
      return true;
    }
  },

  // --------------------------------------------------------------------------
  // MESSAGING & CONVERSATIONS
  // --------------------------------------------------------------------------
  async getOrCreateConversation(userAId: string, userBId: string): Promise<string> {
    // Find if a conversation exists between userA and userB
    const { data: userAConvs } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", userAId);

    if (userAConvs && userAConvs.length > 0) {
      const convIds = userAConvs.map((c) => c.conversation_id);
      const { data: match } = await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", userBId)
        .in("conversation_id", convIds)
        .maybeSingle();

      if (match) return match.conversation_id;
    }

    // Create new conversation
    const { data: conv, error: convErr } = await supabase
      .from("conversations")
      .insert({})
      .select()
      .single();

    if (convErr) throw convErr;

    // Add members
    await supabase.from("conversation_members").insert([
      { conversation_id: conv.id, user_id: userAId },
      { conversation_id: conv.id, user_id: userBId },
    ]);

    return conv.id;
  },

  async fetchMessages(conversationId: string): Promise<DirectMessage[]> {
    const { data, error } = await supabase
      .from("messages")
      .select("*, sender:profiles(username, avatar_url)")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error || !data) return [];
    return data.map((m) => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      senderUsername: m.sender?.username,
      senderAvatar: m.sender?.avatar_url,
      content: m.content,
      read: m.read,
      createdAt: m.created_at,
    }));
  },

  async sendMessage(conversationId: string, senderId: string, content: string): Promise<DirectMessage> {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      conversationId: data.conversation_id,
      senderId: data.sender_id,
      content: data.content,
      read: false,
      createdAt: data.created_at,
    };
  },

  // --------------------------------------------------------------------------
  // NOTIFICATIONS
  // --------------------------------------------------------------------------
  async fetchNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map((n) => ({
      id: n.id,
      userId: n.user_id,
      actorId: n.actor_id,
      actorUsername: n.actor_username,
      actorDisplayName: n.actor_display_name,
      actorAvatar: n.actor_avatar,
      type: n.type,
      title: n.title,
      message: n.message,
      targetPostId: n.target_post_id,
      targetRoastId: n.target_roast_id,
      createdAt: n.created_at,
      read: n.read,
    }));
  },

  async markNotificationRead(notifId: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", notifId);
  },

  async markAllNotificationsRead(userId: string) {
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId);
  },

  // --------------------------------------------------------------------------
  // REALTIME SUBSCRIPTIONS
  // --------------------------------------------------------------------------
  subscribeToFeed(callback: (payload: any) => void) {
    return supabase
      .channel("public-feed-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        (payload) => callback(payload)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments" },
        (payload) => callback(payload)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "roasts" },
        (payload) => callback(payload)
      )
      .subscribe();
  },
};
