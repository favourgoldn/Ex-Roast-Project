import React, { useState, useRef } from "react";
import { CategoryType, TabType } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { storage } from "../../services/storageService";
import { useToast } from "../../context/ToastContext";
import { scanSafetyAndAnonymity, generateRoastSparks } from "../../services/aiService";
import { 
  Flame, 
  Sparkles, 
  Upload, 
  Image as ImageIcon, 
  ShieldCheck, 
  ShieldAlert, 
  X, 
  EyeOff, 
  Tag, 
  Send, 
  ArrowLeft,
  CheckCircle2
} from "lucide-react";
import confetti from "canvas-confetti";

interface CreateViewProps {
  onTabChange: (tab: TabType) => void;
  onStoryCreated: (postId: string) => void;
}

export const CreateView: React.FC<CreateViewProps> = ({ onTabChange, onStoryCreated }) => {
  const { currentUser, openAuthModal } = useAuth();
  const { success, error, roast: toastRoast } = useToast();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<CategoryType>("Funny Ex");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [anonymousAlias, setAnonymousAlias] = useState("Anonymous Burner");
  const [imageUrl, setImageUrl] = useState("");
  const [tagsInput, setTagsInput] = useState("ex, redflag, comedy");
  const [isScanning, setIsScanning] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [firstRoast, setFirstRoast] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories: CategoryType[] = [
    "Funny Ex",
    "Red Flag",
    "Cheating",
    "Ghosting",
    "Worst Date",
    "Toxic Relationship",
    "Dumb Excuse",
    "Money",
    "Breakup",
  ];

  const STOCK_PHOTOS = [
    { label: "Receipt/Chat", url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80" },
    { label: "Empty Seat/Ghosted", url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80" },
    { label: "Burned Letter", url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80" },
    { label: "Red Flags", url: "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=600&auto=format&fit=crop&q=80" },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      error("Invalid File", "Please upload a valid image file (PNG, JPG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      if (typeof loadEvent.target?.result === "string") {
        setImageUrl(loadEvent.target.result);
        success("Image Attached", "Screenshot / photo attached to story.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        if (typeof loadEvent.target?.result === "string") {
          setImageUrl(loadEvent.target.result);
          success("Image Attached", "Image uploaded successfully.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // AI brainstorm for the author's own roast line or suggestions
  const handleAiSparks = async () => {
    if (!content.trim() && !title.trim()) {
      error("Story needed", "Write a few details first so the AI can craft punchlines!");
      return;
    }
    setIsGeneratingAi(true);
    try {
      const res = await generateRoastSparks(title || "Ex story", content || title, category);
      setAiSuggestions(res.roasts);
      toastRoast("AI Roast Ideas Ready! ✨", "Click any idea to set as your opening roast.");
    } catch (err) {
      error("AI Generation Error", "Could not generate suggestions right now.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      openAuthModal("signin");
      return;
    }

    if (!title.trim() || !content.trim()) {
      error("Missing fields", "Please provide a story title and details.");
      return;
    }

    if (content.length < 20) {
      error("Story too short", "Give us at least a couple of sentences of juicy context!");
      return;
    }

    // Safety Scan
    setIsScanning(true);
    const safety = await scanSafetyAndAnonymity(title, content);
    setIsScanning(false);

    if (!safety.isSafe) {
      error("Safety Warning", safety.warningMessage || "Content flagged for personal info or non-compliance.");
      return;
    }

    // Parse tags
    const hashtags = tagsInput
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter((t) => t.length > 0);

    try {
      const newPost = storage.createPost({
        authorId: currentUser.id,
        authorUsername: currentUser.username,
        authorDisplayName: currentUser.displayName,
        authorAvatar: currentUser.avatarUrl,
        title: title.trim(),
        content: content.trim(),
        category,
        isAnonymous,
        anonymousAlias: isAnonymous ? anonymousAlias : undefined,
        imageUrl: imageUrl || undefined,
        hashtags,
        firstRoastContent: firstRoast.trim() || undefined,
      });

      confetti({
        particleCount: 50,
        spread: 80,
        origin: { y: 0.7 },
        colors: ["#ef233c", "#ff9f1c", "#ffffff"],
      });

      toastRoast("STORY PUBLISHED! 🔥", "+100 Roast Points awarded to your account!");
      onStoryCreated(newPost.id);
      onTabChange("explore");
    } catch (err: any) {
      error("Could not create post", err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6 pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
        <button
          onClick={() => onTabChange("explore")}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Feed</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-bold text-red-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>100% Anonymous Enabled</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-black text-white font-display uppercase tracking-tight">
          TELL US WHAT HAPPENED.
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Spill the story. Keep real names and phone numbers out. Let the internet deliver the reality check.
        </p>
      </div>

      {/* Main Creation Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Category Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
            Select Category
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                id={`create-cat-${cat.replace(/\s+/g, "-")}`}
                onClick={() => setCategory(cat)}
                className={`py-2 px-2 rounded-xl text-xs font-semibold truncate border transition-all text-center ${
                  category === cat
                    ? "bg-red-600/30 text-red-200 border-red-500 shadow-md"
                    : "bg-[#14141e] border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Title Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Story Headline *
            </label>
            <span className="text-[11px] text-zinc-500">{title.length}/100</span>
          </div>
          <input
            id="create-story-title-input"
            type="text"
            placeholder="e.g. He told me he was an astronaut, then asked for $20 for bus fare"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            className="w-full bg-[#12121b] border border-zinc-800 rounded-xl p-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 font-semibold"
            required
          />
        </div>

        {/* Story Body */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              The Full Story *
            </label>
            <span className="text-[11px] text-zinc-500">{content.length}/1200</span>
          </div>
          <textarea
            id="create-story-content-input"
            rows={5}
            placeholder="Give the internet the details. What happened? What did they do or say? Keep it anonymous (no real names or addresses)."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={1200}
            className="w-full bg-[#12121b] border border-zinc-800 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 resize-none leading-relaxed"
            required
          />
        </div>

        {/* Anonymous Mode & Alias Selector */}
        <div className="p-4 bg-[#14141e] border border-zinc-800/80 rounded-2xl flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-xs font-bold text-white">Post Anonymously</span>
                <p className="text-[11px] text-zinc-400">Hides your real profile handle and avatar</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="create-anonymous-toggle"
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>

          {isAnonymous && (
            <div className="pt-2 border-t border-zinc-800/60 flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <span className="text-[11px] font-semibold text-zinc-400 shrink-0">
                Anonymous Alias:
              </span>
              <input
                id="create-anonymous-alias-input"
                type="text"
                value={anonymousAlias}
                onChange={(e) => setAnonymousAlias(e.target.value)}
                placeholder="e.g. The Unlucky Romantic"
                className="flex-1 bg-[#1c1c28] border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-amber-300 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
              <div className="flex items-center gap-1">
                {["Space Cadet", "Anon Heartbroken", "Bullet Dodger"].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAnonymousAlias(preset)}
                    className="text-[10px] px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Image Attachment (File upload or stock presets) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
            Attach Screenshot / Receipt Photo (Optional)
          </label>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />

          {imageUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 max-h-60 flex items-center justify-center">
              <img src={imageUrl} alt="Attached story proof" className="max-h-60 object-contain w-full" />
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="absolute top-2 right-2 p-1 bg-black/70 hover:bg-black rounded-lg text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                dragOver
                  ? "border-red-500 bg-red-950/20"
                  : "border-zinc-800 hover:border-zinc-700 bg-[#12121b]"
              }`}
            >
              <Upload className="w-6 h-6 text-zinc-500 mb-2" />
              <p className="text-xs font-semibold text-zinc-300">
                Drag and drop your screenshot here, or <span className="text-red-400 underline">browse</span>
              </p>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                PNG, JPG, WebP up to 5MB (Remember to blur private phone numbers/names!)
              </p>
            </div>
          )}

          {/* Quick Preset Photos */}
          {!imageUrl && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-zinc-500">Or use a stock proof placeholder:</span>
              {STOCK_PHOTOS.map((stock) => (
                <button
                  key={stock.label}
                  type="button"
                  onClick={() => setImageUrl(stock.url)}
                  className="text-[10px] px-2 py-0.5 bg-[#181824] hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-md transition-colors"
                >
                  {stock.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Optional Opening Roast & AI Brainstorm */}
        <div className="p-4 bg-[#14141e] border border-zinc-800 rounded-2xl flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Flame className="w-4 h-4 text-red-500" />
              <span>Your Opening Roast (Optional)</span>
            </div>

            <button
              id="create-ai-spark-btn"
              type="button"
              onClick={handleAiSparks}
              disabled={isGeneratingAi}
              className="flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 bg-amber-950/40 border border-amber-500/40 px-2.5 py-1 rounded-lg transition-colors"
            >
              <Sparkles className={`w-3 h-3 ${isGeneratingAi ? "animate-spin" : ""}`} />
              <span>{isGeneratingAi ? "Cooking..." : "✨ AI Roast Sparks"}</span>
            </button>
          </div>

          {aiSuggestions.length > 0 && (
            <div className="flex flex-col gap-1 p-2 bg-[#1b151e] border border-amber-500/30 rounded-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                AI Suggestions (Click to set):
              </span>
              {aiSuggestions.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setFirstRoast(sug)}
                  className="text-left text-xs text-zinc-200 hover:text-white p-1 hover:bg-zinc-800/80 rounded transition-colors"
                >
                  "{sug}"
                </button>
              ))}
            </div>
          )}

          <input
            id="create-first-roast-input"
            type="text"
            placeholder="Leave your own sharp closing line to start the roast thread..."
            value={firstRoast}
            onChange={(e) => setFirstRoast(e.target.value)}
            className="w-full bg-[#1c1c28] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
          />
        </div>

        {/* Hashtags Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
            Hashtags (Comma separated)
          </label>
          <div className="relative">
            <Tag className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="create-story-tags-input"
              type="text"
              placeholder="e.g. ghosting, excuses, wedding, bills"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full bg-[#12121b] border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Earn +100 Roast Points instantly</span>
          </div>

          <button
            id="create-submit-story-btn"
            type="submit"
            disabled={isScanning}
            className="px-6 py-3 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:opacity-95 text-white font-extrabold text-xs rounded-xl shadow-xl shadow-red-950/60 transition-all flex items-center gap-2 transform active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>{isScanning ? "Scanning Safety..." : "POST STORY & ROAST"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
