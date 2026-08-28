import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// ----------------------------------------------------
// Persistent Database Layer
// ----------------------------------------------------
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "exroast-db.json");

if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error("Failed to create data dir:", err);
  }
}

// Types
export interface PrivacySettings {
  profileVisibility: "public" | "friends";
  whoCanFriend: "everyone" | "friends_of_friends";
  whoCanComment: "everyone" | "friends_and_followers" | "none";
  savedPostsVisibility: "private" | "friends" | "public";
  searchDiscoverable: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold" | "crimson";
  unlockedAt: string;
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
  friendsCount: number;
  postsCount: number;
  roastsCount: number;
  winsCount: number;
  badges: Badge[];
  createdAt: string;
  isVerified?: boolean;
  isSeed?: boolean;
  privacy: PrivacySettings;
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

export interface ReactionCounts {
  savage: number;
  dead: number;
  redFlag: number;
  deserved: number;
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
  score: number;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  isTopRoast?: boolean;
  isRoastOfTheDay?: boolean;
  userVote?: "up" | "down" | null;
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
  category: string;
  imageUrl?: string;
  hashtags: string[];
  createdAt: string;
  reactions: ReactionCounts;
  roastsCount: number;
  commentsCount: number;
  savesCount: number;
  sharesCount: number;
  roasts: Roast[];
  comments: Comment[];
  flameScore: number;
  isSeed?: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  actorId: string;
  actorUsername: string;
  actorDisplayName: string;
  actorAvatar: string;
  type: string;
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
  reason: string;
  details?: string;
  createdAt: string;
  status: "pending" | "reviewed" | "resolved";
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderUsername?: string;
  senderDisplayName?: string;
  senderAvatar?: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  lastMessage?: DirectMessage;
  unreadCount?: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

interface DatabaseSchema {
  users: User[];
  passwords: Record<string, string>; // userId -> password string
  friends: Record<string, string[]>; // userId -> array of friend userIds
  friendRequests: FriendRequest[];
  follows: Record<string, string[]>; // userId -> array of followed userIds
  posts: Post[];
  saves: Record<string, string[]>; // userId -> array of saved postIds
  postReactions: Record<string, Record<string, ReactionType>>; // postId -> { userId: ReactionType }
  roastVotes: Record<string, Record<string, "up" | "down">>; // roastId -> { userId: "up" | "down" }
  commentLikes: Record<string, string[]>; // commentId -> array of userIds
  replyLikes: Record<string, string[]>; // replyId -> array of userIds
  conversations: Conversation[];
  messages: DirectMessage[];
  notifications: Notification[];
  blockedUsers: Record<string, string[]>; // userId -> array of blocked userIds
  reports: Report[];
}

const DEFAULT_BADGES_LIST: Badge[] = [
  {
    id: "badge-1",
    name: "Professional Roaster",
    description: "Submitted over 25 savagely upvoted roasts",
    icon: "🔥",
    tier: "crimson",
    unlockedAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "badge-2",
    name: "Heartbreak Veteran",
    description: "Survived dramatic exes and turned pain into comedy",
    icon: "💔",
    tier: "gold",
    unlockedAt: "2026-01-20T12:30:00Z",
  },
  {
    id: "badge-3",
    name: "Roast King",
    description: "Won #1 Roast of the Day multiple times",
    icon: "👑",
    tier: "crimson",
    unlockedAt: "2026-02-01T15:00:00Z",
  },
  {
    id: "badge-4",
    name: "Emotionally Unavailable",
    description: "Untouchable immune system to manipulation",
    icon: "🧊",
    tier: "silver",
    unlockedAt: "2026-02-10T18:00:00Z",
  },
  {
    id: "badge-5",
    name: "Red Flag Radar",
    description: "Spotted red flags from 10 miles away",
    icon: "🚩",
    tier: "gold",
    unlockedAt: "2026-02-14T09:00:00Z",
  },
];

const DEFAULT_PRIVACY: PrivacySettings = {
  profileVisibility: "public",
  whoCanFriend: "everyone",
  whoCanComment: "everyone",
  savedPostsVisibility: "private",
  searchDiscoverable: true,
};

const SEED_USERS_INIT: User[] = [
  {
    id: "user-1",
    username: "HeartbreakDealer",
    displayName: "Elena Vance",
    email: "elena@exroast.com",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    bio: "Turning relationship trauma into comedy gold. Unapologetically unfiltered.",
    relationshipStatus: "Happily Single & Thriving",
    roastPoints: 4820,
    followersCount: 1420,
    followingCount: 180,
    friendsCount: 3,
    postsCount: 12,
    roastsCount: 88,
    winsCount: 14,
    badges: [DEFAULT_BADGES_LIST[0], DEFAULT_BADGES_LIST[1], DEFAULT_BADGES_LIST[2]],
    createdAt: "2025-11-10T08:00:00Z",
    isVerified: true,
    isSeed: true,
    privacy: { ...DEFAULT_PRIVACY },
  },
  {
    id: "user-2",
    username: "NoMercy",
    displayName: "Marcus King",
    email: "marcus@exroast.com",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    bio: "Delivering devastating one-liners since 2020. No ex is safe from the truth.",
    relationshipStatus: "Committed to peace of mind",
    roastPoints: 6350,
    followersCount: 2980,
    followingCount: 210,
    friendsCount: 2,
    postsCount: 8,
    roastsCount: 142,
    winsCount: 29,
    badges: [DEFAULT_BADGES_LIST[0], DEFAULT_BADGES_LIST[2], DEFAULT_BADGES_LIST[3]],
    createdAt: "2025-10-01T04:00:00Z",
    isVerified: true,
    isSeed: true,
    privacy: { ...DEFAULT_PRIVACY },
  },
  {
    id: "user-3",
    username: "SavageSam",
    displayName: "Samantha Reed",
    email: "sam@exroast.com",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
    bio: "Exes are like bad tattoos: expensive, painful, and funny in hindsight.",
    relationshipStatus: "Observing from a safe distance",
    roastPoints: 5120,
    followersCount: 1850,
    followingCount: 310,
    friendsCount: 2,
    postsCount: 15,
    roastsCount: 96,
    winsCount: 18,
    badges: [DEFAULT_BADGES_LIST[0], DEFAULT_BADGES_LIST[4]],
    createdAt: "2025-12-05T09:20:00Z",
    isVerified: true,
    isSeed: true,
    privacy: { ...DEFAULT_PRIVACY },
  },
  {
    id: "user-4",
    username: "Cooked",
    displayName: "Leo Romero",
    email: "leo@exroast.com",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    bio: "If you didn't laugh, you'd cry. So we roast.",
    relationshipStatus: "Single & enjoying heated seats alone",
    roastPoints: 3890,
    followersCount: 940,
    followingCount: 140,
    friendsCount: 1,
    postsCount: 6,
    roastsCount: 74,
    winsCount: 11,
    badges: [DEFAULT_BADGES_LIST[1], DEFAULT_BADGES_LIST[3]],
    createdAt: "2026-01-02T11:00:00Z",
    isVerified: false,
    isSeed: true,
    privacy: { ...DEFAULT_PRIVACY },
  },
  {
    id: "user-5",
    username: "RedFlagHunter",
    displayName: "Chloe Bennett",
    email: "chloe@exroast.com",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
    bio: "I see red flags in 8K resolution before they even say hello.",
    relationshipStatus: "Healing and collecting receipts",
    roastPoints: 3410,
    followersCount: 1120,
    followingCount: 420,
    friendsCount: 2,
    postsCount: 19,
    roastsCount: 52,
    winsCount: 9,
    badges: [DEFAULT_BADGES_LIST[4]],
    createdAt: "2026-01-18T14:40:00Z",
    isVerified: false,
    isSeed: true,
    privacy: { ...DEFAULT_PRIVACY },
  },
];

const SEED_POSTS_INIT: Post[] = [
  {
    id: "post-1",
    authorId: "user-1",
    authorUsername: "HeartbreakDealer",
    authorDisplayName: "Elena Vance",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    isAnonymous: false,
    title: "Told me they weren't ready for a relationship...",
    content: "My ex looked me dead in the eyes over dinner and said they 'deeply loved me but had too much personal trauma to be in any relationship right now.' Exactly 48 hours later, they hard-launched their official Facebook and Instagram relationship status with someone they met on LinkedIn.",
    category: "Dumb Excuse",
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80",
    hashtags: ["DumbExcuse", "LinkedInLover", "ClownBehavior", "ExFiles"],
    createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    reactions: { savage: 842, dead: 1205, redFlag: 640, deserved: 195 },
    roastsCount: 3,
    commentsCount: 2,
    savesCount: 341,
    sharesCount: 189,
    flameScore: 3200,
    isSeed: true,
    roasts: [
      {
        id: "roast-101",
        postId: "post-1",
        authorId: "user-2",
        authorUsername: "NoMercy",
        authorDisplayName: "Marcus King",
        authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
        content: "Bro wasn't unready for a relationship. He was unready for YOUR standards and went on LinkedIn to network for a lateral downgrade.",
        score: 642,
        upvotes: 660,
        downvotes: 18,
        createdAt: new Date(Date.now() - 3600 * 1000 * 2.5).toISOString(),
        isTopRoast: true,
        isRoastOfTheDay: true,
      },
      {
        id: "roast-102",
        postId: "post-1",
        authorId: "user-3",
        authorUsername: "SavageSam",
        authorDisplayName: "Samantha Reed",
        authorAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
        content: "Meeting someone on LinkedIn is crazy. Their wedding vows are gonna include 'Key Performance Indicators' and synergy.",
        score: 418,
        upvotes: 430,
        downvotes: 12,
        createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
      },
      {
        id: "roast-103",
        postId: "post-1",
        authorId: "user-4",
        authorUsername: "Cooked",
        authorDisplayName: "Leo Romero",
        authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
        content: "Trauma cured in 48 hours? Drop the therapist's number because that's a medical miracle.",
        score: 289,
        upvotes: 295,
        downvotes: 6,
        createdAt: new Date(Date.now() - 3600 * 1000 * 1.5).toISOString(),
      },
    ],
    comments: [
      {
        id: "comm-1",
        postId: "post-1",
        authorId: "user-5",
        authorUsername: "RedFlagHunter",
        authorDisplayName: "Chloe Bennett",
        authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
        content: "LinkedIn networking turned romantic is the most corporate villain origin story I've ever heard.",
        createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
        likes: 45,
        replies: [
          {
            id: "reply-1",
            commentId: "comm-1",
            authorId: "user-1",
            authorUsername: "HeartbreakDealer",
            authorDisplayName: "Elena Vance",
            authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
            content: "Right?? I hope their relationship has quarterly performance reviews! 😂",
            createdAt: new Date(Date.now() - 3600 * 1000 * 1.8).toISOString(),
            likes: 22,
          },
        ],
      },
    ],
  },
  {
    id: "post-2",
    authorId: "user-3",
    authorUsername: "SavageSam",
    authorDisplayName: "Samantha Reed",
    authorAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
    isAnonymous: true,
    anonymousAlias: "The Space Cadet",
    title: "Apparently she needed 'space'...",
    content: "We dated for two years. She said she felt suffocated and needed 'infinite space and tranquility to find her inner core.' I found out last week she moved in with her co-worker three blocks away from my apartment.",
    category: "Ghosting",
    hashtags: ["NeededSpace", "NASA", "Audacity", "ExTales"],
    createdAt: new Date(Date.now() - 3600 * 1000 * 8).toISOString(),
    reactions: { savage: 1420, dead: 2150, redFlag: 890, deserved: 310 },
    roastsCount: 2,
    commentsCount: 1,
    savesCount: 512,
    sharesCount: 290,
    flameScore: 4900,
    isSeed: true,
    roasts: [
      {
        id: "roast-201",
        postId: "post-2",
        authorId: "user-1",
        authorUsername: "HeartbreakDealer",
        authorDisplayName: "Elena Vance",
        authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
        content: "She said she needed space, but NASA called and found her orbiting someone else 3 blocks away.",
        score: 890,
        upvotes: 910,
        downvotes: 20,
        createdAt: new Date(Date.now() - 3600 * 1000 * 7).toISOString(),
        isTopRoast: true,
      },
    ],
    comments: [],
  },
  {
    id: "post-3",
    authorId: "user-2",
    authorUsername: "NoMercy",
    authorDisplayName: "Marcus King",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    isAnonymous: false,
    title: "Sent me a Venmo request for 50% of the anniversary dinner",
    content: "Took them to a nice rooftop steakhouse for our 1-year anniversary. We broke up 3 weeks later. Yesterday at 11:45 PM, I received a Venmo request for $114.50 titled 'Anniversary Reimbursement (since we're no longer together)'.",
    category: "Money",
    imageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&auto=format&fit=crop&q=80",
    hashtags: ["VenmoAudit", "CheapEx", "PettyLevel100", "Steakhouse"],
    createdAt: new Date(Date.now() - 3600 * 1000 * 14).toISOString(),
    reactions: { savage: 1890, dead: 3410, redFlag: 2100, deserved: 120 },
    roastsCount: 2,
    commentsCount: 1,
    savesCount: 780,
    sharesCount: 420,
    flameScore: 7800,
    isSeed: true,
    roasts: [
      {
        id: "roast-301",
        postId: "post-3",
        authorId: "user-5",
        authorUsername: "RedFlagHunter",
        authorDisplayName: "Chloe Bennett",
        authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
        content: "Send them an invoice for your emotional distress and billing hours wasted listening to their excuses.",
        score: 720,
        upvotes: 735,
        downvotes: 15,
        createdAt: new Date(Date.now() - 3600 * 1000 * 13).toISOString(),
        isTopRoast: true,
      },
    ],
    comments: [],
  },
];

let db: DatabaseSchema = {
  users: SEED_USERS_INIT,
  passwords: {
    "user-1": "password123",
    "user-2": "password123",
    "user-3": "password123",
    "user-4": "password123",
    "user-5": "password123",
  },
  friends: {
    "user-1": ["user-2", "user-3", "user-5"],
    "user-2": ["user-1", "user-3"],
    "user-3": ["user-1", "user-2"],
    "user-4": ["user-5"],
    "user-5": ["user-1", "user-4"],
  },
  friendRequests: [],
  follows: {
    "user-1": ["user-2", "user-3", "user-4", "user-5"],
    "user-2": ["user-1", "user-3", "user-5"],
    "user-3": ["user-1", "user-2"],
    "user-4": ["user-1", "user-5"],
    "user-5": ["user-1", "user-2", "user-3"],
  },
  posts: SEED_POSTS_INIT,
  saves: {},
  postReactions: {},
  roastVotes: {},
  commentLikes: {},
  replyLikes: {},
  conversations: [],
  messages: [],
  notifications: [],
  blockedUsers: {},
  reports: [],
};

// Load persistent data from disk if exists
try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.users)) {
      db = {
        ...db,
        ...parsed,
      };
      if (!Array.isArray(db.posts) || db.posts.length === 0) {
        db.posts = SEED_POSTS_INIT;
      }
      console.log(`[EX ROAST DB] Loaded ${db.users.length} users and ${db.posts.length} posts from disk.`);
    }
  } else {
    // DB doesn't exist yet, save initial seed state to disk
    persistDB();
  }
} catch (err) {
  console.error("[EX ROAST DB] Error reading DB file:", err);
}

// Helper to save DB to disk with error catching
function persistDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("[EX ROAST DB] Failed to save DB to disk:", err);
  }
}

// ----------------------------------------------------
// Real-Time Server-Sent Events (SSE) Bus
// ----------------------------------------------------
const sseClients = new Set<Response>();

function broadcastSSE(event: string, data: any) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

app.get("/api/events", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  sseClients.add(res);

  // Send initial ping
  res.write(`event: connected\ndata: {"status":"connected","timestamp":"${new Date().toISOString()}"}\n\n`);

  req.on("close", () => {
    sseClients.delete(res);
  });
});

// ----------------------------------------------------
// Authentication & User Helper Functions
// ----------------------------------------------------
function getUserIdFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  const customHeader = req.headers["x-user-id"];
  if (typeof customHeader === "string") {
    return customHeader;
  }
  return null;
}

function getUserById(id: string): User | null {
  return db.users.find((u) => u.id === id) || null;
}

function getUserByUsername(username: string): User | null {
  return db.users.find((u) => u.username.toLowerCase() === username.toLowerCase()) || null;
}

function calculateFlameScore(reactions: ReactionCounts, roastsCount: number, commentsCount: number, savesCount: number): number {
  return (
    reactions.savage * 4 +
    reactions.dead * 3 +
    reactions.redFlag * 2 +
    reactions.deserved * 1 +
    roastsCount * 25 +
    commentsCount * 10 +
    savesCount * 15
  );
}

// ----------------------------------------------------
// AI Roast Sparks & Moderation
// ----------------------------------------------------
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } },
  });
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "EX ROAST",
    geminiEnabled: Boolean(process.env.GEMINI_API_KEY),
    userCount: db.users.length,
    postCount: db.posts.length,
    timestamp: new Date().toISOString(),
  });
});

// AI Roast Spark generator
app.post("/api/generate-roast-sparks", async (req, res) => {
  try {
    const { storyTitle, storyDescription, category } = req.body;
    if (!storyTitle && !storyDescription) {
      return res.status(400).json({ error: "Story title or description required" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      const fallbackRoasts = [
        `"Bro didn't just dodge a bullet, you survived a whole nuclear testing zone."`,
        `"They said they needed space, but NASA called and found them orbiting someone else."`,
        `"The clown makeup was invisible during the relationship, but it's 4K HD now."`,
        `"Imagine fumbling someone who stayed through all that nonsense. Peak amateur hour."`,
      ];
      return res.json({ roasts: fallbackRoasts, source: "fallback" });
    }

    const prompt = `You are a comedy club roastmaster on "EX ROAST", the social entertainment platform.
A user shared this story about their ex:
Title: "${storyTitle || 'Untitled Ex Story'}"
Category: "${category || 'Dating Disaster'}"
Story Details: "${storyDescription}"

Generate 3 unique, hilarious, punchy roasts targeting the ex or the absurd situation.
Styles requested:
1. "Deadpan Burn" (short, witty, cold delivery)
2. "Sarcastic Reality Check" (clever observational humor)
3. "Mic Drop Finale" (creative hyperbole)

Rules:
- Never use real personal names, addresses, phone numbers, or doxxing.
- Keep it comedy-focused, avoiding hate speech or physical threats.
- Keep each roast punchy (1 to 2 sentences max).

Output strictly a JSON array of strings containing the 3 roasts.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 1.0,
      },
    });

    const responseText = response.text || "[]";
    try {
      const parsed = JSON.parse(responseText);
      return res.json({ roasts: Array.isArray(parsed) ? parsed : [responseText], source: "gemini" });
    } catch {
      return res.json({ roasts: [responseText.replace(/[\[\]"]/g, '').trim()], source: "gemini" });
    }
  } catch (error) {
    return res.json({
      roasts: [
        "Your ex is living proof that common sense is a rare collectible.",
        "They thought they were the main character, but ended up as the comedy relief.",
      ],
      source: "fallback",
    });
  }
});

// Content Safety & Anonymity check
app.post("/api/scan-safety", (req, res) => {
  const { text } = req.body;
  if (!text) return res.json({ safe: true, flags: [] });

  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  if (phoneRegex.test(text) || emailRegex.test(text)) {
    return res.json({
      safe: false,
      reason: "Contains personal contact information (phone number or email). Keep stories completely anonymous.",
      flags: ["PII_DETECTED"],
    });
  }

  return res.json({ safe: true, flags: [] });
});

// ----------------------------------------------------
// AUTHENTICATION ROUTES
// ----------------------------------------------------

// POST /api/auth/register
app.post("/api/auth/register", (req, res) => {
  try {
    const { username, email, password, displayName, avatarUrl, bio } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email, and password are required" });
    }

    const cleanUsername = username.replace(/[^a-zA-Z0-9_]/g, "");
    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: "Username must be at least 3 alphanumeric characters" });
    }

    const existingUsername = getUserByUsername(cleanUsername);
    if (existingUsername) {
      return res.status(400).json({ error: "Username is already taken" });
    }

    const existingEmail = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existingEmail) {
      return res.status(400).json({ error: "An account with this email already exists" });
    }

    const newUser: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      username: cleanUsername,
      displayName: displayName || cleanUsername,
      email: email.toLowerCase(),
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
      bio: bio || "New to EX ROAST. Here to share stories and drop savage burns.",
      relationshipStatus: "Single & Unbothered",
      roastPoints: 100, // Welcome points!
      followersCount: 0,
      followingCount: 0,
      friendsCount: 0,
      postsCount: 0,
      roastsCount: 0,
      winsCount: 0,
      badges: [DEFAULT_BADGES_LIST[1]],
      createdAt: new Date().toISOString(),
      isVerified: false,
      privacy: { ...DEFAULT_PRIVACY },
    };

    db.users.push(newUser);
    db.passwords[newUser.id] = password;
    db.friends[newUser.id] = [];
    db.follows[newUser.id] = [];
    db.saves[newUser.id] = [];
    db.blockedUsers[newUser.id] = [];

    // Add welcome notification
    const welcomeNotif: Notification = {
      id: `notif-${Date.now()}`,
      userId: newUser.id,
      actorId: "system",
      actorUsername: "exroast",
      actorDisplayName: "EX ROAST",
      actorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
      type: "achievement_unlocked",
      title: "Welcome to EX ROAST 🔥",
      message: "You received +100 Roast Points and your Heartbreak Veteran starter badge!",
      createdAt: new Date().toISOString(),
      read: false,
    };
    db.notifications.unshift(welcomeNotif);

    persistDB();
    broadcastSSE("user_registered", { user: newUser });

    return res.status(201).json({
      token: newUser.id,
      user: newUser,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to register user" });
  }
});

// POST /api/auth/login
app.post("/api/auth/login", (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: "Username or email is required" });
    }

    const user = db.users.find(
      (u) =>
        u.username.toLowerCase() === identifier.toLowerCase() ||
        u.email.toLowerCase() === identifier.toLowerCase() ||
        u.id === identifier
    );

    if (!user) {
      return res.status(404).json({ error: "User not found with this username or email" });
    }

    // If password provided, verify if stored
    if (password && db.passwords[user.id] && db.passwords[user.id] !== password) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    return res.json({
      token: user.id,
      user,
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Login failed" });
  }
});

// GET /api/auth/me
app.get("/api/auth/me", (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const user = getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.json({ user });
});

// POST /api/auth/reset-password
app.post("/api/auth/reset-password", (req, res) => {
  const { emailOrUsername, newPassword } = req.body;
  if (!emailOrUsername || !newPassword) {
    return res.status(400).json({ error: "Identifier and new password are required" });
  }
  const user = db.users.find(
    (u) =>
      u.username.toLowerCase() === emailOrUsername.toLowerCase() ||
      u.email.toLowerCase() === emailOrUsername.toLowerCase()
  );
  if (!user) {
    return res.status(404).json({ error: "No account found with this username/email" });
  }

  db.passwords[user.id] = newPassword;
  persistDB();
  return res.json({ success: true, message: "Password has been successfully reset" });
});

// POST /api/auth/change-password
app.post("/api/auth/change-password", (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Not authenticated" });

  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters" });
  }

  if (db.passwords[userId] && db.passwords[userId] !== currentPassword) {
    return res.status(401).json({ error: "Current password does not match" });
  }

  db.passwords[userId] = newPassword;
  persistDB();
  return res.json({ success: true, message: "Password updated successfully" });
});

// PUT /api/auth/profile
app.put("/api/auth/profile", (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Not authenticated" });

  const user = getUserById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const { displayName, avatarUrl, bio, relationshipStatus } = req.body;

  if (displayName) user.displayName = displayName;
  if (avatarUrl) user.avatarUrl = avatarUrl;
  if (bio !== undefined) user.bio = bio;
  if (relationshipStatus !== undefined) user.relationshipStatus = relationshipStatus;

  persistDB();
  broadcastSSE("user_updated", { user });
  return res.json({ user });
});

// PUT /api/auth/privacy
app.put("/api/auth/privacy", (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Not authenticated" });

  const user = getUserById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  user.privacy = {
    ...user.privacy,
    ...req.body,
  };

  persistDB();
  return res.json({ privacy: user.privacy });
});

// DELETE /api/auth/account
app.delete("/api/auth/account", (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Not authenticated" });

  // Remove user and clean up relationships
  db.users = db.users.filter((u) => u.id !== userId);
  delete db.passwords[userId];
  delete db.friends[userId];
  delete db.follows[userId];
  delete db.saves[userId];
  delete db.blockedUsers[userId];

  // Clean up references in other users
  for (const uid in db.friends) {
    db.friends[uid] = db.friends[uid].filter((id) => id !== userId);
  }
  for (const uid in db.follows) {
    db.follows[uid] = db.follows[uid].filter((id) => id !== userId);
  }

  // Anonymize user posts
  db.posts.forEach((p) => {
    if (p.authorId === userId) {
      p.authorUsername = "deleted_user";
      p.authorDisplayName = "Deleted Account";
      p.isAnonymous = true;
    }
  });

  persistDB();
  return res.json({ success: true, message: "Account permanently deleted" });
});

// ----------------------------------------------------
// USERS & SOCIAL CONNECTIONS ROUTES
// ----------------------------------------------------

// GET /api/users
app.get("/api/users", (req, res) => {
  const requesterId = getUserIdFromRequest(req);
  const search = typeof req.query.search === "string" ? req.query.search.toLowerCase() : "";

  let result = db.users.filter((u) => {
    if (requesterId && db.blockedUsers[requesterId]?.includes(u.id)) return false;
    if (u.privacy && !u.privacy.searchDiscoverable && u.id !== requesterId) return false;
    if (search) {
      return (
        u.username.toLowerCase().includes(search) ||
        u.displayName.toLowerCase().includes(search) ||
        u.bio.toLowerCase().includes(search)
      );
    }
    return true;
  });

  // Calculate live friends, followers count
  result = result.map((u) => ({
    ...u,
    friendsCount: db.friends[u.id]?.length || 0,
    followingCount: db.follows[u.id]?.length || 0,
    followersCount: Object.values(db.follows).filter((list) => list.includes(u.id)).length,
  }));

  return res.json({ users: result });
});

// GET /api/users/:identifier
app.get("/api/users/:identifier", (req, res) => {
  const requesterId = getUserIdFromRequest(req);
  const { identifier } = req.params;

  let user = getUserById(identifier) || getUserByUsername(identifier);
  if (!user) return res.status(404).json({ error: "User not found" });

  const isBlocked = requesterId ? db.blockedUsers[requesterId]?.includes(user.id) : false;
  const isFollowing = requesterId ? (db.follows[requesterId] || []).includes(user.id) : false;
  const isFriend = requesterId ? (db.friends[requesterId] || []).includes(user.id) : false;

  const pendingRequest = requesterId
    ? db.friendRequests.find(
        (fr) =>
          fr.status === "pending" &&
          ((fr.senderId === requesterId && fr.receiverId === user!.id) ||
            (fr.senderId === user!.id && fr.receiverId === requesterId))
      )
    : null;

  const userStats = {
    ...user,
    friendsCount: db.friends[user.id]?.length || 0,
    followingCount: db.follows[user.id]?.length || 0,
    followersCount: Object.values(db.follows).filter((list) => list.includes(user!.id)).length,
    postsCount: db.posts.filter((p) => p.authorId === user!.id).length,
  };

  return res.json({
    user: userStats,
    relationship: {
      isFollowing,
      isFriend,
      friendRequest: pendingRequest || null,
      isBlocked,
      isSelf: requesterId === user.id,
    },
  });
});

// POST /api/users/:id/follow
app.post("/api/users/:id/follow", (req, res) => {
  const requesterId = getUserIdFromRequest(req);
  if (!requesterId) return res.status(401).json({ error: "Must be signed in to follow users" });

  const targetId = req.params.id;
  const requester = getUserById(requesterId);
  const target = getUserById(targetId);

  if (!target) return res.status(404).json({ error: "User not found" });
  if (requesterId === targetId) return res.status(400).json({ error: "Cannot follow yourself" });

  if (!db.follows[requesterId]) db.follows[requesterId] = [];

  const isFollowing = db.follows[requesterId].includes(targetId);
  if (isFollowing) {
    db.follows[requesterId] = db.follows[requesterId].filter((id) => id !== targetId);
  } else {
    db.follows[requesterId].push(targetId);

    // Create notification
    if (requester) {
      const notif: Notification = {
        id: `notif-${Date.now()}`,
        userId: targetId,
        actorId: requesterId,
        actorUsername: requester.username,
        actorDisplayName: requester.displayName,
        actorAvatar: requester.avatarUrl,
        type: "user_followed",
        title: "New Follower",
        message: "started following your stories and roasts.",
        createdAt: new Date().toISOString(),
        read: false,
      };
      db.notifications.unshift(notif);
      broadcastSSE("notification", { userId: targetId, notification: notif });
    }
  }

  persistDB();

  const followersCount = Object.values(db.follows).filter((list) => list.includes(targetId)).length;
  return res.json({
    followed: !isFollowing,
    followersCount,
  });
});

// POST /api/users/:id/friend-request
app.post("/api/users/:id/friend-request", (req, res) => {
  const requesterId = getUserIdFromRequest(req);
  if (!requesterId) return res.status(401).json({ error: "Must be signed in to add friends" });

  const targetId = req.params.id;
  const requester = getUserById(requesterId);
  const target = getUserById(targetId);

  if (!target || !requester) return res.status(404).json({ error: "User not found" });
  if (requesterId === targetId) return res.status(400).json({ error: "Cannot friend yourself" });

  if (db.friends[requesterId]?.includes(targetId)) {
    return res.status(400).json({ error: "You are already friends with this user" });
  }

  // Check existing pending request
  const existing = db.friendRequests.find(
    (fr) =>
      fr.status === "pending" &&
      ((fr.senderId === requesterId && fr.receiverId === targetId) ||
        (fr.senderId === targetId && fr.receiverId === requesterId))
  );

  if (existing) {
    return res.json({ request: existing, message: "Friend request already pending" });
  }

  const newRequest: FriendRequest = {
    id: `fr-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    senderId: requesterId,
    senderUsername: requester.username,
    senderDisplayName: requester.displayName,
    senderAvatar: requester.avatarUrl,
    receiverId: targetId,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  db.friendRequests.push(newRequest);

  // Send notification to receiver
  const notif: Notification = {
    id: `notif-${Date.now()}`,
    userId: targetId,
    actorId: requesterId,
    actorUsername: requester.username,
    actorDisplayName: requester.displayName,
    actorAvatar: requester.avatarUrl,
    type: "friend_request_received",
    title: "Friend Request 🤝",
    message: "sent you a friend request. Connect to share stories!",
    createdAt: new Date().toISOString(),
    read: false,
  };
  db.notifications.unshift(notif);

  persistDB();
  broadcastSSE("friend_request", { request: newRequest });
  broadcastSSE("notification", { userId: targetId, notification: notif });

  return res.status(201).json({ request: newRequest });
});

// POST /api/friend-requests/:id/respond
app.post("/api/friend-requests/:id/respond", (req, res) => {
  const requesterId = getUserIdFromRequest(req);
  if (!requesterId) return res.status(401).json({ error: "Not authenticated" });

  const requestId = req.params.id;
  const { action } = req.body; // "accept" | "decline" | "cancel"

  const request = db.friendRequests.find((fr) => fr.id === requestId);
  if (!request) return res.status(404).json({ error: "Friend request not found" });

  if (action === "cancel" && request.senderId !== requesterId) {
    return res.status(403).json({ error: "Only the sender can cancel a request" });
  }
  if ((action === "accept" || action === "decline") && request.receiverId !== requesterId) {
    return res.status(403).json({ error: "Only the receiver can accept or decline" });
  }

  if (action === "accept") {
    request.status = "accepted";
    if (!db.friends[request.senderId]) db.friends[request.senderId] = [];
    if (!db.friends[request.receiverId]) db.friends[request.receiverId] = [];

    if (!db.friends[request.senderId].includes(request.receiverId)) {
      db.friends[request.senderId].push(request.receiverId);
    }
    if (!db.friends[request.receiverId].includes(request.senderId)) {
      db.friends[request.receiverId].push(request.senderId);
    }

    // Send notification to sender
    const receiver = getUserById(request.receiverId);
    if (receiver) {
      const notif: Notification = {
        id: `notif-${Date.now()}`,
        userId: request.senderId,
        actorId: request.receiverId,
        actorUsername: receiver.username,
        actorDisplayName: receiver.displayName,
        actorAvatar: receiver.avatarUrl,
        type: "friend_request_accepted",
        title: "Friend Request Accepted 🎉",
        message: "accepted your friend request! You can now see each other's friend feeds.",
        createdAt: new Date().toISOString(),
        read: false,
      };
      db.notifications.unshift(notif);
      broadcastSSE("notification", { userId: request.senderId, notification: notif });
    }

    broadcastSSE("friend_accepted", { userA: request.senderId, userB: request.receiverId });
  } else if (action === "decline") {
    request.status = "declined";
  } else if (action === "cancel") {
    db.friendRequests = db.friendRequests.filter((fr) => fr.id !== requestId);
  }

  persistDB();
  return res.json({ status: request.status, request });
});

// POST /api/users/:id/unfriend
app.post("/api/users/:id/unfriend", (req, res) => {
  const requesterId = getUserIdFromRequest(req);
  if (!requesterId) return res.status(401).json({ error: "Not authenticated" });

  const targetId = req.params.id;
  if (db.friends[requesterId]) {
    db.friends[requesterId] = db.friends[requesterId].filter((id) => id !== targetId);
  }
  if (db.friends[targetId]) {
    db.friends[targetId] = db.friends[targetId].filter((id) => id !== requesterId);
  }

  // Remove any accepted request
  db.friendRequests = db.friendRequests.filter(
    (fr) =>
      !(
        (fr.senderId === requesterId && fr.receiverId === targetId) ||
        (fr.senderId === targetId && fr.receiverId === requesterId)
      )
  );

  persistDB();
  return res.json({ success: true, message: "Unfriended successfully" });
});

// GET /api/users/:id/connections
app.get("/api/users/:id/connections", (req, res) => {
  const targetId = req.params.id;
  const user = getUserById(targetId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const friendIds = db.friends[targetId] || [];
  const followingIds = db.follows[targetId] || [];
  const followerIds = Object.keys(db.follows).filter((uid) => (db.follows[uid] || []).includes(targetId));

  const friends = friendIds.map((id) => getUserById(id)).filter(Boolean);
  const following = followingIds.map((id) => getUserById(id)).filter(Boolean);
  const followers = followerIds.map((id) => getUserById(id)).filter(Boolean);

  const pendingReceived = db.friendRequests.filter(
    (fr) => fr.receiverId === targetId && fr.status === "pending"
  );
  const pendingSent = db.friendRequests.filter(
    (fr) => fr.senderId === targetId && fr.status === "pending"
  );

  return res.json({
    friends,
    following,
    followers,
    pendingReceived,
    pendingSent,
  });
});

// POST /api/users/:id/block
app.post("/api/users/:id/block", (req, res) => {
  const requesterId = getUserIdFromRequest(req);
  if (!requesterId) return res.status(401).json({ error: "Not authenticated" });

  const targetId = req.params.id;
  if (!db.blockedUsers[requesterId]) db.blockedUsers[requesterId] = [];

  const isBlocked = db.blockedUsers[requesterId].includes(targetId);
  if (isBlocked) {
    db.blockedUsers[requesterId] = db.blockedUsers[requesterId].filter((id) => id !== targetId);
  } else {
    db.blockedUsers[requesterId].push(targetId);
    // Sever friendship and follows
    if (db.friends[requesterId]) db.friends[requesterId] = db.friends[requesterId].filter((id) => id !== targetId);
    if (db.friends[targetId]) db.friends[targetId] = db.friends[targetId].filter((id) => id !== requesterId);
    if (db.follows[requesterId]) db.follows[requesterId] = db.follows[requesterId].filter((id) => id !== targetId);
  }

  persistDB();
  return res.json({ blocked: !isBlocked });
});

// ----------------------------------------------------
// POSTS & FEEDS ROUTES
// ----------------------------------------------------

// GET /api/posts
app.get("/api/posts", (req, res) => {
  const requesterId = getUserIdFromRequest(req);
  const { feed = "for-you", category, tag, search, authorId, savedOnly } = req.query;

  let posts = [...db.posts];

  // Filter blocked users
  if (requesterId && db.blockedUsers[requesterId]) {
    posts = posts.filter((p) => !db.blockedUsers[requesterId].includes(p.authorId));
  }

  // Filter by Author
  if (authorId) {
    posts = posts.filter((p) => {
      if (p.authorId !== authorId) return false;
      // If viewing another user's profile, hide their anonymous posts
      if (p.isAnonymous && requesterId !== authorId) return false;
      return true;
    });
  }

  // Filter by Saved
  if (savedOnly === "true" && requesterId) {
    const savedIds = db.saves[requesterId] || [];
    posts = posts.filter((p) => savedIds.includes(p.id));
  }

  // Filter by Category
  if (category && category !== "All") {
    posts = posts.filter((p) => p.category.toLowerCase() === String(category).toLowerCase());
  }

  // Filter by Hashtag
  if (tag) {
    const cleanTag = String(tag).replace("#", "").toLowerCase();
    posts = posts.filter((p) => p.hashtags.some((h) => h.toLowerCase() === cleanTag));
  }

  // Filter by Search Query
  if (search) {
    const q = String(search).toLowerCase();
    posts = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.hashtags.some((h) => h.toLowerCase().includes(q))
    );
  }

  // Feed Sorting Algorithms
  if (feed === "following" && requesterId) {
    const followed = db.follows[requesterId] || [];
    const friends = db.friends[requesterId] || [];
    const connectionIds = Array.from(new Set([...followed, ...friends]));
    posts = posts.filter((p) => connectionIds.includes(p.authorId) || p.authorId === requesterId);
  } else if (feed === "trending") {
    posts.sort((a, b) => b.flameScore - a.flameScore);
  } else if (feed === "latest") {
    posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (feed === "most-roasted") {
    posts.sort((a, b) => b.roastsCount - a.roastsCount);
  } else {
    // "for-you": blend recent, trending, and connection posts
    posts.sort((a, b) => {
      const aIsConn = requesterId && (db.friends[requesterId]?.includes(a.authorId) || db.follows[requesterId]?.includes(a.authorId)) ? 1 : 0;
      const bIsConn = requesterId && (db.friends[requesterId]?.includes(b.authorId) || db.follows[requesterId]?.includes(b.authorId)) ? 1 : 0;
      return (b.flameScore + bIsConn * 1500) - (a.flameScore + aIsConn * 1500);
    });
  }

  // Process user-specific fields (userReaction, userSaved, votes, anonymity)
  const processedPosts = posts.map((p) => {
    const userReaction = requesterId && db.postReactions[p.id] ? db.postReactions[p.id][requesterId] || null : null;
    const userSaved = requesterId && db.saves[requesterId] ? db.saves[requesterId].includes(p.id) : false;

    // Handle anonymity protection: if anonymous and requester is NOT the author, hide real author metadata
    const isOwner = requesterId === p.authorId;
    const authorUsername = p.isAnonymous && !isOwner ? "anonymous_roaster" : p.authorUsername;
    const authorDisplayName = p.isAnonymous && !isOwner ? (p.anonymousAlias || "🎭 Anonymous Story") : p.authorDisplayName;
    const authorAvatar = p.isAnonymous && !isOwner ? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80" : p.authorAvatar;

    const roastsWithVotes = p.roasts.map((r) => {
      const userVote = requesterId && db.roastVotes[r.id] ? db.roastVotes[r.id][requesterId] || null : null;
      return {
        ...r,
        userVote,
      };
    });

    const commentsWithLikes = p.comments.map((c) => {
      const userLiked = requesterId && db.commentLikes[c.id] ? db.commentLikes[c.id].includes(requesterId) : false;
      const repliesWithLikes = (c.replies || []).map((rep) => ({
        ...rep,
        userLiked: requesterId && db.replyLikes[rep.id] ? db.replyLikes[rep.id].includes(requesterId) : false,
      }));
      return {
        ...c,
        userLiked,
        replies: repliesWithLikes,
      };
    });

    return {
      ...p,
      authorUsername,
      authorDisplayName,
      authorAvatar,
      userReaction,
      userSaved,
      roasts: roastsWithVotes,
      comments: commentsWithLikes,
    };
  });

  return res.json({ posts: processedPosts });
});

// POST /api/posts
app.post("/api/posts", (req, res) => {
  const requesterId = getUserIdFromRequest(req);
  if (!requesterId) return res.status(401).json({ error: "Must be signed in to post a story" });

  const author = getUserById(requesterId);
  if (!author) return res.status(404).json({ error: "User not found" });

  const { title, content, category, imageUrl, hashtags = [], isAnonymous = false, anonymousAlias, firstRoastContent } = req.body;

  if (!title || !content || !category) {
    return res.status(400).json({ error: "Title, content, and category are required" });
  }

  const newPost: Post = {
    id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    authorId: requesterId,
    authorUsername: author.username,
    authorDisplayName: author.displayName,
    authorAvatar: author.avatarUrl,
    isAnonymous: Boolean(isAnonymous),
    anonymousAlias: anonymousAlias || (isAnonymous ? "The Anonymous Ex" : undefined),
    title: title.trim(),
    content: content.trim(),
    category,
    imageUrl: imageUrl || undefined,
    hashtags: Array.isArray(hashtags) ? hashtags.map((h: string) => h.replace("#", "").trim()).filter(Boolean) : [],
    createdAt: new Date().toISOString(),
    reactions: { savage: 0, dead: 0, redFlag: 0, deserved: 0 },
    roastsCount: 0,
    commentsCount: 0,
    savesCount: 0,
    sharesCount: 0,
    roasts: [],
    comments: [],
    flameScore: 100,
    isSeed: false,
  };

  if (firstRoastContent && typeof firstRoastContent === "string" && firstRoastContent.trim()) {
    const firstRoast: Roast = {
      id: `roast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      postId: newPost.id,
      authorId: requesterId,
      authorUsername: author.username,
      authorDisplayName: author.displayName,
      authorAvatar: author.avatarUrl,
      content: firstRoastContent.trim(),
      score: 1,
      upvotes: 1,
      downvotes: 0,
      createdAt: new Date().toISOString(),
      userVote: "up",
    };
    newPost.roasts = [firstRoast];
    newPost.roastsCount = 1;
    if (!db.roastVotes[firstRoast.id]) db.roastVotes[firstRoast.id] = {};
    db.roastVotes[firstRoast.id][requesterId] = "up";
    author.roastsCount = (author.roastsCount || 0) + 1;
    author.roastPoints = (author.roastPoints || 0) + 20;
  }

  db.posts.unshift(newPost);
  author.postsCount = (author.postsCount || 0) + 1;
  author.roastPoints = (author.roastPoints || 0) + 50; // +50 pts for posting story!

  persistDB();
  broadcastSSE("post_created", { post: newPost });
  if (newPost.roasts.length > 0) {
    broadcastSSE("roast_created", { postId: newPost.id, roast: newPost.roasts[0] });
  }

  return res.status(201).json({ post: newPost });
});

// GET /api/posts/:id
app.get("/api/posts/:id", (req, res) => {
  const requesterId = getUserIdFromRequest(req);
  const post = db.posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  const userReaction = requesterId && db.postReactions[post.id] ? db.postReactions[post.id][requesterId] || null : null;
  const userSaved = requesterId && db.saves[requesterId] ? db.saves[requesterId].includes(post.id) : false;

  return res.json({
    post: {
      ...post,
      userReaction,
      userSaved,
    },
  });
});

// PUT /api/posts/:id
app.put("/api/posts/:id", (req, res) => {
  const requesterId = getUserIdFromRequest(req);
  if (!requesterId) return res.status(401).json({ error: "Not authenticated" });

  const post = db.posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  if (post.authorId !== requesterId) return res.status(403).json({ error: "Unauthorized to edit this post" });

  const { title, content, category, imageUrl, hashtags } = req.body;
  if (title) post.title = title;
  if (content) post.content = content;
  if (category) post.category = category;
  if (imageUrl !== undefined) post.imageUrl = imageUrl;
  if (Array.isArray(hashtags)) post.hashtags = hashtags;

  persistDB();
  broadcastSSE("post_updated", { post });
  return res.json({ post });
});

// DELETE /api/posts/:id
app.delete("/api/posts/:id", (req, res) => {
  const requesterId = getUserIdFromRequest(req);
  if (!requesterId) return res.status(401).json({ error: "Not authenticated" });

  const postIndex = db.posts.findIndex((p) => p.id === req.params.id);
  if (postIndex === -1) return res.status(404).json({ error: "Post not found" });

  const post = db.posts[postIndex];
  if (post.authorId !== requesterId) return res.status(403).json({ error: "Unauthorized to delete this post" });

  db.posts.splice(postIndex, 1);
  persistDB();
  broadcastSSE("post_deleted", { postId: req.params.id });
  return res.json({ success: true, message: "Post deleted" });
});

// POST /api/posts/:id/react
app.post("/api/posts/:id/react", (req, res) => {
  const requesterId = getUserIdFromRequest(req);
  if (!requesterId) return res.status(401).json({ error: "Must be signed in to react" });

  const post = db.posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  const { reaction } = req.body as { reaction: ReactionType };
  if (!db.postReactions[post.id]) db.postReactions[post.id] = {};

  const currentReaction = db.postReactions[post.id][requesterId];

  // If clicking same reaction, toggle off
  if (currentReaction === reaction) {
    delete db.postReactions[post.id][requesterId];
    post.reactions[reaction] = Math.max(0, (post.reactions[reaction] || 0) - 1);
  } else {
    // Remove previous reaction count if existed
    if (currentReaction) {
      post.reactions[currentReaction] = Math.max(0, (post.reactions[currentReaction] || 0) - 1);
    }
    db.postReactions[post.id][requesterId] = reaction;
    post.reactions[reaction] = (post.reactions[reaction] || 0) + 1;

    // Send notification to post author if not self
    if (post.authorId !== requesterId) {
      const requester = getUserById(requesterId);
      if (requester) {
        const notif: Notification = {
          id: `notif-${Date.now()}`,
          userId: post.authorId,
          actorId: requesterId,
          actorUsername: requester.username,
          actorDisplayName: requester.displayName,
          actorAvatar: requester.avatarUrl,
          type: "post_reaction",
          title: "New Reaction",
          message: `reacted ${reaction === 'savage' ? '🔥' : reaction === 'dead' ? '💀' : reaction === 'redFlag' ? '🚩' : '👏'} to your story '${post.title.substring(0, 30)}...'`,
          targetPostId: post.id,
          createdAt: new Date().toISOString(),
          read: false,
        };
        db.notifications.unshift(notif);
        broadcastSSE("notification", { userId: post.authorId, notification: notif });
      }
    }
  }

  post.flameScore = calculateFlameScore(post.reactions, post.roastsCount, post.commentsCount, post.savesCount);
  persistDB();

  return res.json({
    reactions: post.reactions,
    userReaction: db.postReactions[post.id][requesterId] || null,
    flameScore: post.flameScore,
  });
});

// POST /api/posts/:id/save
app.post("/api/posts/:id/save", (req, res) => {
  const requesterId = getUserIdFromRequest(req);
  if (!requesterId) return res.status(401).json({ error: "Must be signed in to save stories" });

  const post = db.posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  if (!db.saves[requesterId]) db.saves[requesterId] = [];

  const isSaved = db.saves[requesterId].includes(post.id);
  if (isSaved) {
    db.saves[requesterId] = db.saves[requesterId].filter((id) => id !== post.id);
    post.savesCount = Math.max(0, (post.savesCount || 0) - 1);
  } else {
    db.saves[requesterId].push(post.id);
    post.savesCount = (post.savesCount || 0) + 1;
  }

  post.flameScore = calculateFlameScore(post.reactions, post.roastsCount, post.commentsCount, post.savesCount);
  persistDB();

  return res.json({
    saved: !isSaved,
    savesCount: post.savesCount,
  });
});

// ----------------------------------------------------
// ROASTS ROUTES
// ----------------------------------------------------

// POST /api/posts/:id/roasts
app.post("/api/posts/:id/roasts", (req, res) => {
  const requesterId = getUserIdFromRequest(req);
  if (!requesterId) return res.status(401).json({ error: "Must be signed in to submit a roast" });

  const author = getUserById(requesterId);
  if (!author) return res.status(404).json({ error: "User not found" });

  const post = db.posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: "Roast content cannot be empty" });
  }

  const newRoast: Roast = {
    id: `roast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    postId: post.id,
    authorId: requesterId,
    authorUsername: author.username,
    authorDisplayName: author.displayName,
    authorAvatar: author.avatarUrl,
    content: content.trim(),
    score: 1,
    upvotes: 1,
    downvotes: 0,
    createdAt: new Date().toISOString(),
  };

  post.roasts.push(newRoast);
  post.roastsCount = post.roasts.length;
  post.flameScore = calculateFlameScore(post.reactions, post.roastsCount, post.commentsCount, post.savesCount);

  author.roastsCount = (author.roastsCount || 0) + 1;
  author.roastPoints = (author.roastPoints || 0) + 20; // +20 points for roasting!

  // Auto-vote up for author
  if (!db.roastVotes[newRoast.id]) db.roastVotes[newRoast.id] = {};
  db.roastVotes[newRoast.id][requesterId] = "up";

  // Notify post author
  if (post.authorId !== requesterId) {
    const notif: Notification = {
      id: `notif-${Date.now()}`,
      userId: post.authorId,
      actorId: requesterId,
      actorUsername: author.username,
      actorDisplayName: author.displayName,
      actorAvatar: author.avatarUrl,
      type: "roast_submitted",
      title: "New Roast Dropped 🔥",
      message: `roasted your ex: "${content.substring(0, 45)}..."`,
      targetPostId: post.id,
      targetRoastId: newRoast.id,
      createdAt: new Date().toISOString(),
      read: false,
    };
    db.notifications.unshift(notif);
    broadcastSSE("notification", { userId: post.authorId, notification: notif });
  }

  persistDB();
  broadcastSSE("roast_created", { postId: post.id, roast: newRoast });

  return res.status(201).json({ roast: { ...newRoast, userVote: "up" } });
});

// POST /api/roasts/:id/vote
app.post("/api/roasts/:id/vote", (req, res) => {
  const requesterId = getUserIdFromRequest(req);
  if (!requesterId) return res.status(401).json({ error: "Must be signed in to vote on roasts" });

  const roastId = req.params.id;
  const { vote } = req.body as { vote: "up" | "down" | null };

  let targetRoast: Roast | null = null;
  let targetPost: Post | null = null;

  for (const post of db.posts) {
    const found = post.roasts.find((r) => r.id === roastId);
    if (found) {
      targetRoast = found;
      targetPost = post;
      break;
    }
  }

  if (!targetRoast || !targetPost) return res.status(404).json({ error: "Roast not found" });

  if (!db.roastVotes[roastId]) db.roastVotes[roastId] = {};
  const previousVote = db.roastVotes[roastId][requesterId] || null;

  const roastAuthor = getUserById(targetRoast.authorId);

  // Undo previous vote
  if (previousVote === "up") {
    targetRoast.upvotes = Math.max(0, targetRoast.upvotes - 1);
    if (roastAuthor) roastAuthor.roastPoints = Math.max(0, roastAuthor.roastPoints - 5);
  } else if (previousVote === "down") {
    targetRoast.downvotes = Math.max(0, targetRoast.downvotes - 1);
  }

  // Apply new vote
  if (vote === "up") {
    targetRoast.upvotes += 1;
    db.roastVotes[roastId][requesterId] = "up";
    if (roastAuthor) roastAuthor.roastPoints = (roastAuthor.roastPoints || 0) + 5;

    // Send notification
    if (targetRoast.authorId !== requesterId) {
      const voter = getUserById(requesterId);
      if (voter) {
        const notif: Notification = {
          id: `notif-${Date.now()}`,
          userId: targetRoast.authorId,
          actorId: requesterId,
          actorUsername: voter.username,
          actorDisplayName: voter.displayName,
          actorAvatar: voter.avatarUrl,
          type: "roast_voted",
          title: "Roast Upvoted! 🔥",
          message: `upvoted your roast on '${targetPost.title.substring(0, 30)}...' (+5 pts)`,
          targetPostId: targetPost.id,
          targetRoastId: targetRoast.id,
          createdAt: new Date().toISOString(),
          read: false,
        };
        db.notifications.unshift(notif);
        broadcastSSE("notification", { userId: targetRoast.authorId, notification: notif });
      }
    }
  } else if (vote === "down") {
    targetRoast.downvotes += 1;
    db.roastVotes[roastId][requesterId] = "down";
  } else {
    delete db.roastVotes[roastId][requesterId];
  }

  targetRoast.score = targetRoast.upvotes - targetRoast.downvotes;
  targetPost.flameScore = calculateFlameScore(targetPost.reactions, targetPost.roastsCount, targetPost.commentsCount, targetPost.savesCount);

  persistDB();
  broadcastSSE("roast_voted", { roastId, score: targetRoast.score, upvotes: targetRoast.upvotes, downvotes: targetRoast.downvotes });

  return res.json({
    score: targetRoast.score,
    upvotes: targetRoast.upvotes,
    downvotes: targetRoast.downvotes,
    userVote: db.roastVotes[roastId][requesterId] || null,
  });
});

// DELETE /api/roasts/:id
app.delete("/api/roasts/:id", (req, res) => {
  const requesterId = getUserIdFromRequest(req);
  if (!requesterId) return res.status(401).json({ error: "Not authenticated" });

  const roastId = req.params.id;
  for (const post of db.posts) {
    const idx = post.roasts.findIndex((r) => r.id === roastId);
    if (idx !== -1) {
      if (post.roasts[idx].authorId !== requesterId) {
        return res.status(403).json({ error: "Unauthorized to delete this roast" });
      }
      post.roasts.splice(idx, 1);
      post.roastsCount = post.roasts.length;
      persistDB();
      broadcastSSE("roast_deleted", { postId: post.id, roastId });
      return res.json({ success: true, message: "Roast deleted" });
    }
  }

  return res.status(404).json({ error: "Roast not found" });
});

// ----------------------------------------------------
// COMMENTS & REPLIES ROUTES
// ----------------------------------------------------

// POST /api/posts/:id/comments
app.post("/api/posts/:id/comments", (req, res) => {
  const requesterId = getUserIdFromRequest(req);
  if (!requesterId) return res.status(401).json({ error: "Must be signed in to comment" });

  const author = getUserById(requesterId);
  if (!author) return res.status(404).json({ error: "User not found" });

  const post = db.posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: "Comment cannot be empty" });

  const newComment: Comment = {
    id: `comm-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    postId: post.id,
    authorId: requesterId,
    authorUsername: author.username,
    authorDisplayName: author.displayName,
    authorAvatar: author.avatarUrl,
    content: content.trim(),
    createdAt: new Date().toISOString(),
    likes: 0,
    replies: [],
  };

  post.comments.push(newComment);
  post.commentsCount = post.comments.length;
  post.flameScore = calculateFlameScore(post.reactions, post.roastsCount, post.commentsCount, post.savesCount);

  // Notify post author
  if (post.authorId !== requesterId) {
    const notif: Notification = {
      id: `notif-${Date.now()}`,
      userId: post.authorId,
      actorId: requesterId,
      actorUsername: author.username,
      actorDisplayName: author.displayName,
      actorAvatar: author.avatarUrl,
      type: "post_comment",
      title: "New Comment",
      message: `commented: "${content.substring(0, 45)}..."`,
      targetPostId: post.id,
      createdAt: new Date().toISOString(),
      read: false,
    };
    db.notifications.unshift(notif);
    broadcastSSE("notification", { userId: post.authorId, notification: notif });
  }

  persistDB();
  broadcastSSE("comment_created", { postId: post.id, comment: newComment });

  return res.status(201).json({ comment: { ...newComment, userLiked: false } });
});

// POST /api/comments/:id/reply
app.post("/api/comments/:id/reply", (req, res) => {
  const requesterId = getUserIdFromRequest(req);
  if (!requesterId) return res.status(401).json({ error: "Must be signed in to reply" });

  const author = getUserById(requesterId);
  if (!author) return res.status(404).json({ error: "User not found" });

  const commentId = req.params.id;
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: "Reply cannot be empty" });

  let targetComment: Comment | null = null;
  let targetPost: Post | null = null;

  for (const post of db.posts) {
    const found = post.comments.find((c) => c.id === commentId);
    if (found) {
      targetComment = found;
      targetPost = post;
      break;
    }
  }

  if (!targetComment || !targetPost) return res.status(404).json({ error: "Comment not found" });

  const newReply: CommentReply = {
    id: `reply-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    commentId: targetComment.id,
    authorId: requesterId,
    authorUsername: author.username,
    authorDisplayName: author.displayName,
    authorAvatar: author.avatarUrl,
    content: content.trim(),
    createdAt: new Date().toISOString(),
    likes: 0,
  };

  if (!targetComment.replies) targetComment.replies = [];
  targetComment.replies.push(newReply);

  // Notify parent comment author
  if (targetComment.authorId !== requesterId) {
    const notif: Notification = {
      id: `notif-${Date.now()}`,
      userId: targetComment.authorId,
      actorId: requesterId,
      actorUsername: author.username,
      actorDisplayName: author.displayName,
      actorAvatar: author.avatarUrl,
      type: "comment_reply",
      title: "New Reply",
      message: `replied to your comment: "${content.substring(0, 45)}..."`,
      targetPostId: targetPost.id,
      createdAt: new Date().toISOString(),
      read: false,
    };
    db.notifications.unshift(notif);
    broadcastSSE("notification", { userId: targetComment.authorId, notification: notif });
  }

  persistDB();
  broadcastSSE("reply_created", { postId: targetPost.id, commentId: targetComment.id, reply: newReply });
  return res.status(201).json({ reply: { ...newReply, userLiked: false } });
});

// POST /api/comments/:id/like
app.post("/api/comments/:id/like", (req, res) => {
  const requesterId = getUserIdFromRequest(req);
  if (!requesterId) return res.status(401).json({ error: "Not authenticated" });

  const commentId = req.params.id;
  if (!db.commentLikes[commentId]) db.commentLikes[commentId] = [];

  let targetComment: Comment | null = null;
  for (const post of db.posts) {
    const c = post.comments.find((comm) => comm.id === commentId);
    if (c) {
      targetComment = c;
      break;
    }
  }

  if (!targetComment) return res.status(404).json({ error: "Comment not found" });

  const isLiked = db.commentLikes[commentId].includes(requesterId);
  if (isLiked) {
    db.commentLikes[commentId] = db.commentLikes[commentId].filter((id) => id !== requesterId);
    targetComment.likes = Math.max(0, targetComment.likes - 1);
  } else {
    db.commentLikes[commentId].push(requesterId);
    targetComment.likes += 1;
  }

  persistDB();
  return res.json({ likes: targetComment.likes, userLiked: !isLiked });
});

// ----------------------------------------------------
// NOTIFICATIONS ROUTES
// ----------------------------------------------------

// GET /api/notifications
app.get("/api/notifications", (req, res) => {
  const requesterId = getUserIdFromRequest(req);
  if (!requesterId) return res.status(401).json({ error: "Not authenticated" });

  const notifs = db.notifications.filter((n) => n.userId === requesterId);
  return res.json({ notifications: notifs });
});

// POST /api/notifications/:id/read
app.post("/api/notifications/:id/read", (req, res) => {
  const requesterId = getUserIdFromRequest(req);
  if (!requesterId) return res.status(401).json({ error: "Not authenticated" });

  const notif = db.notifications.find((n) => n.id === req.params.id && n.userId === requesterId);
  if (notif) {
    notif.read = true;
    persistDB();
  }
  return res.json({ success: true });
});

// POST /api/notifications/read-all
app.post("/api/notifications/read-all", (req, res) => {
  const requesterId = getUserIdFromRequest(req);
  if (!requesterId) return res.status(401).json({ error: "Not authenticated" });

  db.notifications.forEach((n) => {
    if (n.userId === requesterId) n.read = true;
  });
  persistDB();
  return res.json({ success: true });
});

// DELETE /api/notifications/:id
app.delete("/api/notifications/:id", (req, res) => {
  const requesterId = getUserIdFromRequest(req);
  if (!requesterId) return res.status(401).json({ error: "Not authenticated" });

  db.notifications = db.notifications.filter((n) => !(n.id === req.params.id && n.userId === requesterId));
  persistDB();
  return res.json({ success: true });
});

// ----------------------------------------------------
// CONVERSATIONS & DIRECT MESSAGING ROUTES
// ----------------------------------------------------

// GET /api/conversations
app.get("/api/conversations", (req, res) => {
  const requesterId = getUserIdFromRequest(req);
  if (!requesterId) return res.status(401).json({ error: "Not authenticated" });

  if (!Array.isArray(db.conversations)) db.conversations = [];
  if (!Array.isArray(db.messages)) db.messages = [];

  const userConvs = db.conversations.filter((c) => c.participantIds.includes(requesterId));

  const result = userConvs.map((conv) => {
    const otherId = conv.participantIds.find((id) => id !== requesterId) || requesterId;
    const otherUser = getUserById(otherId);
    const convMessages = db.messages.filter((m) => m.conversationId === conv.id);
    const lastMsg = convMessages.length > 0 ? convMessages[convMessages.length - 1] : conv.lastMessage;
    const unread = convMessages.filter((m) => m.senderId !== requesterId && !m.read).length;

    return {
      id: conv.id,
      participantIds: conv.participantIds,
      otherUser: otherUser ? {
        id: otherUser.id,
        username: otherUser.username,
        displayName: otherUser.displayName,
        avatarUrl: otherUser.avatarUrl,
        isVerified: otherUser.isVerified,
      } : null,
      lastMessage: lastMsg,
      unreadCount: unread,
      updatedAt: conv.updatedAt || conv.createdAt,
    };
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return res.json({ conversations: result });
});

// POST /api/conversations
app.post("/api/conversations", (req, res) => {
  const requesterId = getUserIdFromRequest(req);
  if (!requesterId) return res.status(401).json({ error: "Not authenticated" });

  const { targetUserId } = req.body;
  if (!targetUserId) return res.status(400).json({ error: "targetUserId is required" });

  const targetUser = getUserById(targetUserId);
  if (!targetUser) return res.status(404).json({ error: "Target user not found" });

  if (!Array.isArray(db.conversations)) db.conversations = [];

  // Check if conversation already exists
  let conv = db.conversations.find(
    (c) => c.participantIds.includes(requesterId) && c.participantIds.includes(targetUserId)
  );

  if (!conv) {
    conv = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      participantIds: [requesterId, targetUserId],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.conversations.push(conv);
    persistDB();
  }

  return res.json({
    conversation: {
      ...conv,
      otherUser: {
        id: targetUser.id,
        username: targetUser.username,
        displayName: targetUser.displayName,
        avatarUrl: targetUser.avatarUrl,
        isVerified: targetUser.isVerified,
      },
    },
  });
});

// GET /api/conversations/:id/messages
app.get("/api/conversations/:id/messages", (req, res) => {
  const requesterId = getUserIdFromRequest(req);
  if (!requesterId) return res.status(401).json({ error: "Not authenticated" });

  const conv = db.conversations.find((c) => c.id === req.params.id);
  if (!conv || !conv.participantIds.includes(requesterId)) {
    return res.status(403).json({ error: "Not a participant in this conversation" });
  }

  if (!Array.isArray(db.messages)) db.messages = [];
  const messages = db.messages.filter((m) => m.conversationId === req.params.id);

  return res.json({ messages });
});

// POST /api/conversations/:id/messages
app.post("/api/conversations/:id/messages", (req, res) => {
  const requesterId = getUserIdFromRequest(req);
  if (!requesterId) return res.status(401).json({ error: "Not authenticated" });

  const conv = db.conversations.find((c) => c.id === req.params.id);
  if (!conv || !conv.participantIds.includes(requesterId)) {
    return res.status(403).json({ error: "Not a participant in this conversation" });
  }

  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: "Message content cannot be empty" });
  }

  const sender = getUserById(requesterId);
  const recipientId = conv.participantIds.find((id) => id !== requesterId);

  const newMsg: DirectMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    conversationId: conv.id,
    senderId: requesterId,
    senderUsername: sender?.username || "unknown",
    senderDisplayName: sender?.displayName || "Ex Roast User",
    senderAvatar: sender?.avatarUrl || "",
    content: content.trim(),
    read: false,
    createdAt: new Date().toISOString(),
  };

  if (!Array.isArray(db.messages)) db.messages = [];
  db.messages.push(newMsg);

  conv.lastMessage = newMsg;
  conv.updatedAt = newMsg.createdAt;

  // Send notification to recipient
  if (recipientId && sender) {
    const notif: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: recipientId,
      actorId: sender.id,
      actorUsername: sender.username,
      actorDisplayName: sender.displayName,
      actorAvatar: sender.avatarUrl,
      type: "new_message",
      title: `Message from @${sender.username}`,
      message: content.length > 50 ? `${content.substring(0, 47)}...` : content,
      createdAt: newMsg.createdAt,
      read: false,
    };
    db.notifications.unshift(notif);
  }

  persistDB();

  // Broadcast to realtime SSE
  broadcastSSE("new_message", {
    conversationId: conv.id,
    message: newMsg,
    recipientId,
  });

  return res.status(201).json({ message: newMsg });
});

// PUT /api/conversations/:id/read
app.put("/api/conversations/:id/read", (req, res) => {
  const requesterId = getUserIdFromRequest(req);
  if (!requesterId) return res.status(401).json({ error: "Not authenticated" });

  if (Array.isArray(db.messages)) {
    db.messages.forEach((m) => {
      if (m.conversationId === req.params.id && m.senderId !== requesterId) {
        m.read = true;
      }
    });
    persistDB();
  }

  return res.json({ success: true });
});

// ----------------------------------------------------
// LEADERBOARD & HALL OF FAME ROUTES
// ----------------------------------------------------

// GET /api/leaderboard
app.get("/api/leaderboard", (req, res) => {
  // Top Roasters
  const topUsers = [...db.users]
    .map((u) => ({
      ...u,
      friendsCount: db.friends[u.id]?.length || 0,
      followersCount: Object.values(db.follows).filter((list) => list.includes(u.id)).length,
    }))
    .sort((a, b) => b.roastPoints - a.roastPoints)
    .slice(0, 10);

  // Top Roasts of All Time
  const allRoasts: (Roast & { postTitle: string })[] = [];
  for (const post of db.posts) {
    for (const roast of post.roasts) {
      allRoasts.push({
        ...roast,
        postTitle: post.title,
      });
    }
  }
  allRoasts.sort((a, b) => b.score - a.score);

  const topRoasts = allRoasts.slice(0, 10);
  const roastOfTheDay = topRoasts[0] || null;

  return res.json({
    topUsers,
    topRoasts,
    roastOfTheDay,
  });
});

// POST /api/reports
app.post("/api/reports", (req, res) => {
  const requesterId = getUserIdFromRequest(req);
  const { targetType, targetId, reason, details } = req.body;

  const newReport: Report = {
    id: `rep-${Date.now()}`,
    reporterId: requesterId || "anonymous",
    targetType,
    targetId,
    reason,
    details,
    createdAt: new Date().toISOString(),
    status: "pending",
  };

  db.reports.push(newReport);
  persistDB();

  return res.status(201).json({ success: true, message: "Report submitted to moderation" });
});

// ----------------------------------------------------
// Vite Middleware & SPA Static Hosting
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🔥 EX ROAST Server online at http://0.0.0.0:${PORT}`);
  });
}

startServer();
