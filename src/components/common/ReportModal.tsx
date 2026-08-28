import React, { useState } from "react";
import { storage } from "../../services/storageService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { ShieldAlert, X, CheckCircle } from "lucide-react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: "post" | "roast" | "comment" | "user";
  targetId: string;
  targetAuthorName?: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetAuthorName,
}) => {
  const { currentUser, blockUser } = useAuth();
  const { success } = useToast();
  const [reason, setReason] = useState<"doxxing" | "harassment" | "hate_speech" | "spam" | "inappropriate" | "other">("doxxing");
  const [details, setDetails] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    await storage.createReport({
      reporterId: currentUser.id,
      targetType,
      targetId,
      reason,
      details,
    });

    if (alsoBlock && targetAuthorName) {
      blockUser(targetId);
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
      success("Report Received", "Thank you for keeping the community safe and anonymous.");
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-[#111118] border border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        <button
          id="report-modal-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 flex flex-col items-center text-center">
            <CheckCircle className="w-12 h-12 text-emerald-400 mb-3 animate-bounce" />
            <h3 className="text-lg font-bold text-white">Report Submitted</h3>
            <p className="text-xs text-zinc-400 mt-1">Our moderation team has flagged this item for review.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-500/40 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display">Report Content</h3>
                <p className="text-xs text-zinc-400">Help protect privacy & anonymity on EX ROAST</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Select Violation Reason:
              </label>
              <div className="flex flex-col gap-1.5">
                {[
                  { id: "doxxing", label: "Doxxing / Personal Identifiable Info (Phone, Real Name, Address)" },
                  { id: "harassment", label: "Targeted Harassment or Threats" },
                  { id: "hate_speech", label: "Hate Speech or Bigotry" },
                  { id: "inappropriate", label: "Explicit or Non-Consensual Material" },
                  { id: "spam", label: "Spam / Promotion / Bot activity" },
                  { id: "other", label: "Other Rule Violation" },
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer text-xs transition-all ${
                      reason === item.id
                        ? "bg-red-950/40 border-red-500 text-white"
                        : "bg-[#181822] border-zinc-800 text-zinc-300 hover:border-zinc-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      checked={reason === item.id}
                      onChange={() => setReason(item.id as any)}
                      className="text-red-600 focus:ring-red-500 bg-zinc-900 border-zinc-700"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Additional Context (Optional)
              </label>
              <textarea
                id="report-details-input"
                rows={2}
                placeholder="Provide any details to help moderators review..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full bg-[#181822] border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 resize-none"
              />
            </div>

            {targetAuthorName && (
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alsoBlock}
                  onChange={(e) => setAlsoBlock(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-red-600 focus:ring-red-500"
                />
                <span>Also block @{targetAuthorName} from my feed</span>
              </label>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                id="report-cancel-btn"
                onClick={onClose}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="report-submit-btn"
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-red-950/50 transition-colors"
              >
                Submit Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
