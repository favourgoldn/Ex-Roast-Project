import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { storage } from "../../services/storageService";
import { api } from "../../services/api";
import { DirectMessage, User } from "../../types";
import { 
  MessageSquare, 
  Send, 
  X, 
  User as UserIcon, 
  Search, 
  Check, 
  CheckCheck, 
  Sparkles,
  Flame,
  ArrowLeft
} from "lucide-react";

interface MessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTargetUser?: User | null;
  onNavigateToProfile?: (username: string) => void;
}

export const MessagesModal: React.FC<MessagesModalProps> = ({
  isOpen,
  onClose,
  initialTargetUser,
  onNavigateToProfile,
}) => {
  const { currentUser, openAuthModal } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activeOtherUser, setActiveOtherUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  const loadConversations = async () => {
    if (!currentUser) return;
    try {
      const list = await storage.getConversations();
      setConversations(list);
    } catch {
      // ignore
    }
  };

  // Load messages for active conversation
  const loadMessages = async (convId: string) => {
    try {
      const msgs = await storage.getMessages(convId);
      setMessages(msgs);
      await storage.markConversationRead(convId);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch {
      // ignore
    }
  };

  // On open or target change
  useEffect(() => {
    if (!isOpen || !currentUser) return;
    loadConversations();
    setAvailableUsers(storage.getUsers().filter((u) => u.id !== currentUser.id));

    if (initialTargetUser) {
      handleStartConversationWithUser(initialTargetUser);
    }

    // Subscribe to SSE for incoming messages
    const unsub = api.subscribeSSE((event, data) => {
      if (event === "new_message") {
        loadConversations();
        if (activeConvId && data.conversationId === activeConvId) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      }
    });

    return () => unsub();
  }, [isOpen, currentUser, initialTargetUser]);

  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
      const interval = setInterval(() => loadMessages(activeConvId), 4000);
      return () => clearInterval(interval);
    }
  }, [activeConvId]);

  if (!isOpen) return null;

  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-[#12121a] border border-zinc-800 rounded-2xl p-6 max-w-md w-full text-center flex flex-col items-center gap-4">
          <MessageSquare className="w-10 h-10 text-red-500" />
          <h2 className="text-xl font-bold text-white">Direct Messages</h2>
          <p className="text-sm text-zinc-400">
            Sign in to chat directly with other roasters, friends, and community members.
          </p>
          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onClose();
                openAuthModal("signin");
              }}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-red-900/30"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleStartConversationWithUser = async (targetUser: User) => {
    setLoading(true);
    try {
      const conv = await storage.getOrCreateConversation(targetUser.id);
      setActiveConvId(conv.id);
      setActiveOtherUser(targetUser);
      await loadMessages(conv.id);
      await loadConversations();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConvId) return;

    const text = messageInput.trim();
    setMessageInput("");

    try {
      const sent = await storage.sendMessage(activeConvId, text);
      setMessages((prev) => [...prev, sent]);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      loadConversations();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = availableUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0f0f17] border border-zinc-800 rounded-2xl w-full max-w-4xl h-[85vh] max-h-[700px] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#14141f]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2 font-display">
                Ex Roast Direct Messages
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-400 font-sans font-bold">
                  Real-time
                </span>
              </h2>
              <p className="text-xs text-zinc-400">Chat with friends and fellow storytellers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Conversations List & Search */}
          <div
            className={`w-full md:w-80 border-r border-zinc-800 flex flex-col bg-[#11111a] ${
              activeConvId ? "hidden md:flex" : "flex"
            }`}
          >
            {/* Search or Start New Chat */}
            <div className="p-3 border-b border-zinc-800">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search roasters to message..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#181824] border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition"
                />
              </div>
            </div>

            {/* If searching, display matching users */}
            {searchQuery.trim() ? (
              <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
                <p className="text-[11px] font-bold text-zinc-500 px-3 py-1 uppercase tracking-wider">
                  People ({filteredUsers.length})
                </p>
                {filteredUsers.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-6">No users found</p>
                ) : (
                  filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        handleStartConversationWithUser(u);
                        setSearchQuery("");
                      }}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#1b1b2a] transition text-left"
                    >
                      <img
                        src={u.avatarUrl}
                        alt={u.username}
                        className="w-9 h-9 rounded-full object-cover border border-zinc-700 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{u.displayName}</p>
                        <p className="text-[11px] text-zinc-400 truncate">@{u.username}</p>
                      </div>
                      <span className="text-[10px] text-red-400 font-bold px-2 py-1 rounded-lg bg-red-500/10">
                        Message
                      </span>
                    </button>
                  ))
                )}
              </div>
            ) : (
              /* Conversation list */
              <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
                {conversations.length === 0 ? (
                  <div className="py-12 px-4 text-center flex flex-col items-center gap-2">
                    <MessageSquare className="w-8 h-8 text-zinc-600" />
                    <p className="text-xs font-bold text-zinc-400">No conversations yet</p>
                    <p className="text-[11px] text-zinc-500">
                      Search for users above or message someone directly from their profile.
                    </p>
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const isSelected = activeConvId === conv.id;
                    const other = conv.otherUser || {
                      displayName: "Ex Roast User",
                      username: "user",
                      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=user",
                    };
                    return (
                      <button
                        key={conv.id}
                        onClick={() => {
                          setActiveConvId(conv.id);
                          setActiveOtherUser(conv.otherUser);
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl transition text-left relative ${
                          isSelected
                            ? "bg-red-500/10 border border-red-500/30"
                            : "hover:bg-[#181826] border border-transparent"
                        }`}
                      >
                        <img
                          src={other.avatarUrl}
                          alt={other.username}
                          className="w-10 h-10 rounded-full object-cover border border-zinc-700 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-white truncate">{other.displayName}</p>
                            {conv.updatedAt && (
                              <span className="text-[10px] text-zinc-500">
                                {new Date(conv.updatedAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                            {conv.lastMessage?.content || "Started a conversation"}
                          </p>
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm">
                            {conv.unreadCount}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Right Column: Chat Box */}
          <div
            className={`flex-1 flex flex-col bg-[#0d0d14] ${
              !activeConvId ? "hidden md:flex items-center justify-center" : "flex"
            }`}
          >
            {activeConvId && activeOtherUser ? (
              <>
                {/* Active Chat Header */}
                <div className="px-4 py-3 border-b border-zinc-800 bg-[#12121c] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveConvId(null)}
                      className="md:hidden p-1.5 text-zinc-400 hover:text-white rounded-lg"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <img
                      src={activeOtherUser.avatarUrl}
                      alt={activeOtherUser.username}
                      className="w-8 h-8 rounded-full object-cover border border-zinc-700"
                    />
                    <div>
                      <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                        {activeOtherUser.displayName}
                        {activeOtherUser.isVerified && (
                          <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
                        )}
                      </h3>
                      <p className="text-[10px] text-zinc-400">@{activeOtherUser.username}</p>
                    </div>
                  </div>
                  {onNavigateToProfile && (
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToProfile(activeOtherUser.username);
                      }}
                      className="text-xs text-red-400 hover:text-red-300 font-semibold px-2.5 py-1 rounded-lg bg-red-500/10 transition"
                    >
                      View Profile
                    </button>
                  )}
                </div>

                {/* Messages Stream */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                  {messages.length === 0 ? (
                    <div className="my-auto text-center flex flex-col items-center gap-2 text-zinc-500">
                      <Flame className="w-8 h-8 text-zinc-700" />
                      <p className="text-xs">No messages yet. Send a greeting or spark a roast debate!</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderId === currentUser.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col max-w-[75%] ${
                            isMe ? "self-end items-end" : "self-start items-start"
                          }`}
                        >
                          <div
                            className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                              isMe
                                ? "bg-red-600 text-white rounded-br-none shadow-md shadow-red-950/20"
                                : "bg-[#1e1e2d] text-zinc-100 border border-zinc-800 rounded-bl-none"
                            }`}
                          >
                            {msg.content}
                          </div>
                          <div className="flex items-center gap-1 mt-1 px-1">
                            <span className="text-[9px] text-zinc-500">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {isMe && (
                              <CheckCheck className="w-3 h-3 text-zinc-500" />
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Box */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-zinc-800 bg-[#12121c] flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder={`Message @${activeOtherUser.username}...`}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="flex-1 bg-[#181824] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim()}
                    className="p-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:hover:bg-red-600 text-white rounded-xl transition shadow-lg shadow-red-900/30 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center p-8 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-zinc-800/40 border border-zinc-700 flex items-center justify-center text-zinc-500">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-zinc-300">Select a conversation</h3>
                <p className="text-xs text-zinc-500 max-w-xs">
                  Choose a contact on the left or search for any user on EX ROAST to start messaging.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
