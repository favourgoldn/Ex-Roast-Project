import React from "react";
import { X, ShieldCheck, Flame, Lock, Ban, HeartHandshake } from "lucide-react";
import { Logo } from "./Logo";

interface GuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuidelinesModal: React.FC<GuidelinesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-[#111118] border border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <Logo size="sm" showWordmark={false} />
            <div>
              <h2 className="text-base font-bold text-white font-display">EX ROAST Community & Safety Code</h2>
              <p className="text-xs text-zinc-400">Rules of Engagement for the Roast Arena</p>
            </div>
          </div>
          <button
            id="guidelines-modal-close-btn"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Rules List */}
        <div className="overflow-y-auto py-4 flex flex-col gap-4 text-xs text-zinc-300 pr-1">
          {/* Rule 1 */}
          <div className="flex items-start gap-3.5 p-3.5 bg-[#181824] rounded-xl border border-zinc-800">
            <div className="w-8 h-8 rounded-lg bg-red-950/60 border border-red-500/30 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-0.5">1. Strict Anonymity & Zero Doxxing</h4>
              <p className="text-zinc-400 leading-relaxed">
                Never post real full names, phone numbers, exact residential addresses, workplace identities, social security numbers, or private unconsented photographs. Use aliases or the Anonymous toggle.
              </p>
            </div>
          </div>

          {/* Rule 2 */}
          <div className="flex items-start gap-3.5 p-3.5 bg-[#181824] rounded-xl border border-zinc-800">
            <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-0.5">2. Comedy & Wit Over Malice</h4>
              <p className="text-zinc-400 leading-relaxed">
                Roasts should be clever, humorous, and focused on the absurd situation or relatable behavior. True comedy punches at the absurdity, not at vulnerable identities.
              </p>
            </div>
          </div>

          {/* Rule 3 */}
          <div className="flex items-start gap-3.5 p-3.5 bg-[#181824] rounded-xl border border-zinc-800">
            <div className="w-8 h-8 rounded-lg bg-rose-950/60 border border-rose-500/30 flex items-center justify-center shrink-0">
              <Ban className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-0.5">3. Zero Tolerance for Hate Speech or Violence</h4>
              <p className="text-zinc-400 leading-relaxed">
                Threats of physical harm, harassment, stalking, hate speech, racism, homophobia, and non-consensual sexual content will result in immediate content deletion and permanent account ban.
              </p>
            </div>
          </div>

          {/* Rule 4 */}
          <div className="flex items-start gap-3.5 p-3.5 bg-[#181824] rounded-xl border border-zinc-800">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-0.5">4. Laugh, Vent, & Move On</h4>
              <p className="text-zinc-400 leading-relaxed">
                Ex Roast is about catharsis, solidarity, and finding humor in the heartbreak. Drop the burn, take the points, and walk forward unbothered.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Encrypted & Moderated Storage</span>
          </div>
          <button
            id="guidelines-gotit-btn"
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-950/50 transition-colors"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
