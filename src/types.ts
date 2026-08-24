export type CategoryType = 
  | "Funny Ex"
  | "Red Flag"
  | "Cheating"
  | "Ghosting"
  | "Worst Date"
  | "Toxic Relationship"
  | "Dumb Excuse"
  | "Money"
  | "Breakup"
  | "Other";

export interface PrivacySettings {
  profileVisibility: "public" | "friends";
  whoCanFriend: "everyone" | "friends_of_friends";
  whoCanComment: "everyone" | "friends_and_followers" | "none";
  savedPostsVisibility: "private" | "friends" | "public";
  searchDiscoverable: boolean;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  bio: string;
  relationshipStatus?: string;
  roastPoints: number;
  followersCount: number;
  followingCount: number;
  friendsCount?: number;
  postsCount: number;
  roastsCount: number;
  winsCount: number;
  badges: Badge[];
  createdAt: string;
  isVerified?: boolean;
  isSeed?: boolean;
  privacy?: PrivacySettings;
  blockedUsers?: string[];
}

export interface FriendRequest {
  id: string;
  senderId: string;
  senderUsername: string;
  senderDisplayName: string;
  senderAvatar: string;
  receiverId: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold" | "crimson";
  unlockedAt: string;
}

export interface ReactionCounts {
  savage: number; // 🔥
  dead: number;   // 💀
  redFlag: number;// 🚩
  deserved: number;// 👏
}

export type ReactionType = "savage" | "dead" | "redFlag" | "deserved";

export interface CommentReply {
  id: string;
  commentId: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
  likes: number;
  userLiked?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
  likes: number;
  userLiked?: boolean;
  replies: CommentReply[];
}

export interface Roast {
  id: string;
  postId: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatar: string;
  content: string;
  score: number; // upvotes - downvotes
  upvotes: number;
  downvotes: number;
  createdAt: string;
  userVote?: "up" | "down" | null;
  isTopRoast?: boolean;
  isRoastOfTheDay?: boolean;
}

export interface Post {
  id: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatar: string;
  isAnonymous: boolean;
  anonymousAlias?: string;
  title: string;
  content: string;
  category: CategoryType;
  imageUrl?: string;
  hashtags: string[];
  createdAt: string;
  reactions: ReactionCounts;
  userReaction?: ReactionType | null;
  roastsCount: number;
  commentsCount: number;
  savesCount: number;
  sharesCount: number;
  userSaved?: boolean;
  roasts: Roast[];
  comments: Comment[];
  flameScore: number; // calculated engagement score
  isSeed?: boolean;
}

export type NotificationType =
  | "roast_submitted"
  | "roast_voted"
  | "post_reaction"
  | "post_comment"
  | "comment_reply"
  | "user_followed"
  | "friend_request_received"
  | "friend_request_accepted"
  | "achievement_unlocked"
  | "top_roast_winner";

export interface Notification {
  id: string;
  userId: string;
  actorId: string;
  actorUsername: string;
  actorDisplayName: string;
  actorAvatar: string;
  type: NotificationType;
  title: string;
  message: string;
  targetPostId?: string;
  targetRoastId?: string;
  createdAt: string;
  read: boolean;
}

export interface Report {
  id: string;
  reporterId: string;
  targetType: "post" | "roast" | "comment" | "user";
  targetId: string;
  reason: "doxxing" | "harassment" | "hate_speech" | "spam" | "inappropriate" | "other";
  details?: string;
  createdAt: string;
  status: "pending" | "reviewed" | "resolved";
}

export type TabType = 
  | "home" 
  | "explore" 
  | "create" 
  | "hall-of-fame" 
  | "notifications" 
  | "profile" 
  | "search" 
  | "connections";

export type FeedSort = "for-you" | "following" | "trending" | "latest" | "most-roasted";

export type TimeFilter = "today" | "week" | "month" | "all";

