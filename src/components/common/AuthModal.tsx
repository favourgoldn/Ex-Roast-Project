import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Logo } from "./Logo";
import { X, Lock, Mail, User, ShieldAlert, Sparkles, Check, ArrowRight } from "lucide-react";

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalMode, signIn, signUp, allUsers, switchDemoUser } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(authModalMode);
  
  // Sign In Form
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up Form
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const AVATAR_PRESETS = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
  ];

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!identifier.trim()) {
      setErrorMsg("Please enter your username or email");
      return;
    }
    setLoading(true);
    const success = await signIn(identifier);
    setLoading(false);
    if (!success) {
      setErrorMsg("Invalid credentials. You can also pick a demo persona below!");
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!username.trim() || !email.trim() || !signupPassword) {
      setErrorMsg("All required fields must be completed.");
      return;
    }
    if (signupPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (!agreeTerms) {
      setErrorMsg("Please agree to the Community Safety Guidelines.");
      return;
    }

    setLoading(true);
    const selectedAvatar = AVATAR_PRESETS[avatarIndex];
    const success = await signUp(username, email, displayName || username, selectedAvatar);
    setLoading(false);
    if (!success) {
      setErrorMsg("Failed to register. Username or email might already be taken.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-[#111118] border border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-red-600/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          id="auth-modal-close-btn"
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <Logo size="lg" />
          <h2 className="text-xl font-extrabold text-white mt-3 font-display">
            {mode === "signin" ? "Welcome Back to the Roast" : mode === "signup" ? "Join the Ex Roast Club" : "Reset Password"}
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs">
            {mode === "signin"
              ? "Sign in to drop savage roasts, upvote burns, and share anonymous stories."
              : mode === "signup"
              ? "Create your burner profile. Get +100 bonus Roast Points instantly."
              : "Enter your email or select one of the instant demo personas below."}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        {mode !== "forgot" && (
          <div className="grid grid-cols-2 gap-1 bg-[#181824] p-1 rounded-xl mb-5 border border-zinc-800">
            <button
              id="auth-tab-signin"
              onClick={() => {
                setMode("signin");
                setErrorMsg("");
              }}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                mode === "signin" ? "bg-red-600 text-white shadow" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Sign In
            </button>
            <button
              id="auth-tab-signup"
              onClick={() => {
                setMode("signup");
                setErrorMsg("");
              }}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                mode === "signup" ? "bg-red-600 text-white shadow" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Register (+100 PTS)
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Sign In Form */}
        {mode === "signin" && (
          <form onSubmit={handleSignInSubmit} className="flex flex-col gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                Username or Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="signin-identifier-input"
                  type="text"
                  placeholder="e.g. HeartbreakDealer or elena@exroast.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-[#181822] border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-zinc-300">Password</label>
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-[11px] text-red-400 hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="signin-password-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#181822] border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="signin-remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-red-600 focus:ring-red-500"
              />
              <label htmlFor="signin-remember-me" className="text-xs text-zinc-400 cursor-pointer">
                Remember my session
              </label>
            </div>

            <button
              id="signin-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-950/60 transition-all flex items-center justify-center gap-2 mt-1"
            >
              {loading ? "Signing in..." : "Enter EX ROAST"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Sign Up Form */}
        {mode === "signup" && (
          <form onSubmit={handleSignUpSubmit} className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
            {/* Avatar Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 mb-1.5">
                Choose Your Anonymous Avatar
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {AVATAR_PRESETS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAvatarIndex(i)}
                    className={`relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                      avatarIndex === i ? "border-red-500 scale-105 shadow-md shadow-red-950/50" : "border-zinc-800 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                    {avatarIndex === i && (
                      <div className="absolute inset-0 bg-red-600/30 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  @Username *
                </label>
                <input
                  id="signup-username-input"
                  type="text"
                  placeholder="e.g. ExSurvivor99"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#181822] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Display Name
                </label>
                <input
                  id="signup-displayname-input"
                  type="text"
                  placeholder="e.g. Elena Vance"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#181822] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                Email Address *
              </label>
              <input
                id="signup-email-input"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#181822] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Password *
                </label>
                <input
                  id="signup-password-input"
                  type="password"
                  placeholder="••••••••"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className="w-full bg-[#181822] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Confirm *
                </label>
                <input
                  id="signup-confirmpassword-input"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#181822] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-start gap-2 mt-1">
              <input
                id="signup-agree-guidelines"
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-zinc-700 bg-zinc-900 text-red-600 focus:ring-red-500"
              />
              <label htmlFor="signup-agree-guidelines" className="text-[11px] text-zinc-400 leading-tight">
                I agree to the Community Guidelines: Zero doxxing, zero real names/phone numbers, strictly comedy and anonymous stories.
              </label>
            </div>

            <button
              id="signup-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-950/60 transition-all flex items-center justify-center gap-2 mt-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? "Creating..." : "Create Account (+100 PTS)"}</span>
            </button>
          </form>
        )}

        {/* Forgot Password */}
        {mode === "forgot" && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-zinc-300">
              For testing in this preview sandbox, you can instantly sign in using any active demo account below without needing to check an external mailbox.
            </p>
            <button
              id="auth-back-to-signin-btn"
              onClick={() => setMode("signin")}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white rounded-xl transition-colors"
            >
              ← Back to Sign In
            </button>
          </div>
        )}

        {/* Demo Fast Account Switcher Bar */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2 text-center">
            Or Click a Demo Persona to Sign In Instantly:
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {allUsers.slice(0, 3).map((u) => (
              <button
                key={u.id}
                id={`auth-quick-${u.username}`}
                onClick={() => {
                  switchDemoUser(u.id);
                  closeAuthModal();
                }}
                className="flex items-center gap-1.5 p-1.5 bg-[#181824] hover:bg-red-950/40 border border-zinc-800 hover:border-red-500/40 rounded-xl text-left transition-all"
              >
                <img src={u.avatarUrl} alt={u.username} className="w-6 h-6 rounded-lg object-cover" />
                <div className="truncate">
                  <p className="text-[10px] font-bold text-zinc-200 truncate leading-none">@{u.username}</p>
                  <p className="text-[8px] text-red-400">{u.roastPoints} pts</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
