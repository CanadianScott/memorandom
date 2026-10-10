"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquarePlus, Mic, Trash2, AlertCircle, HeartHandshake, Tag, Plus, Check, CheckCheck, ChevronDown, ChevronUp } from "lucide-react";
import { SuggestedPrompt } from "@/types/database";
import { getSuggestedPrompts, createSuggestedPrompt, updateSuggestedPrompt, deleteSuggestedPrompt } from "@/lib/supabase/client";

const BLAIR_CATEGORIES = [
  "Adventures & Flying",
  "Waterton & Outdoors",
  "Childhood in Idaho",
  "Family & Marriage",
  "Career & Accounting",
  "Life Wisdom",
];

const SCOTT_CATEGORIES = [
  "Childhood in Lethbridge",
  "BYU & Mission Years",
  "PhD at Washington State",
  "Career & Public Health",
  "Family & Marriage",
  "Life Wisdom",
];

const BLAIR_FAMILY = ["Melissa", "Jessica", "Scott", "Robin"];
const SCOTT_FAMILY = ["Andrea", "Elaine", "Joyce", "James", "Eloise"];

export interface PromptSuggestionsProps {
  initialPrompts?: SuggestedPrompt[];
  userId?: string;
}

export function PromptSuggestions({ initialPrompts = [], userId = "blair" }: PromptSuggestionsProps) {
  const targetName = userId === "scott" ? "Scott" : "Blair";
  const suggestionCategories = userId === "scott" ? SCOTT_CATEGORIES : BLAIR_CATEGORIES;
  const familyMembers = userId === "scott" ? SCOTT_FAMILY : BLAIR_FAMILY;

  const [prompts, setPrompts] = useState<SuggestedPrompt[]>(initialPrompts);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [promptText, setPromptText] = useState("");
  const [suggestedBy, setSuggestedBy] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Sync when initialPrompts prop updates (e.g. user toggle)
  useEffect(() => {
    setPrompts(initialPrompts);
  }, [initialPrompts]);

  // Sync client-side with localStorage or Supabase on mount
  useEffect(() => {
    let isMounted = true;
    async function fetchPrompts() {
      try {
        const fresh = await getSuggestedPrompts(userId);
        if (isMounted && Array.isArray(fresh)) {
          setPrompts(fresh);
        }
      } catch (err) {
        console.warn("Failed to refresh prompt suggestions:", err);
      }
    }
    fetchPrompts();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPrompt = promptText.trim();
    if (!trimmedPrompt || trimmedPrompt.length < 3 || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const newPrompt = await createSuggestedPrompt({
        prompt: trimmedPrompt,
        suggested_by: suggestedBy.trim() || "Family Member",
        category: selectedCategory || null,
        status: "pending",
      }, userId);

      setPrompts((prev) => [newPrompt, ...prev.filter((p) => p.id !== newPrompt.id)]);
      setPromptText("");
      setSelectedCategory("");
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
      setIsFormOpen(false);
    } catch (err) {
      console.error("Failed to suggest prompt:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteSuggestedPrompt(id, userId);
      setPrompts((prev) => prev.filter((p) => p.id !== id));
      setConfirmDeleteId(null);
    } catch (err) {
      console.error("Failed to delete prompt:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: "pending" | "used") => {
    try {
      const nextStatus = currentStatus === "pending" ? "used" : "pending";
      await updateSuggestedPrompt(id, { status: nextStatus }, userId);
      setPrompts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: nextStatus } : p))
      );
    } catch (err) {
      console.error("Failed to update prompt status:", err);
    }
  };

  return (
    <section aria-labelledby="suggested-prompts-heading" className="w-full mb-16">
      {/* Header Container */}
      <div className="bg-aged-paper/50 border border-warm-brown/20 rounded-3xl p-6 md:p-8 backdrop-blur-xs shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-warm-brown/10 text-warm-brown flex items-center justify-center shrink-0 mt-0.5">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2
                  id="suggested-prompts-heading"
                  className="text-2xl md:text-3xl font-serif font-bold text-warm-brown tracking-tight"
                >
                  Prompts for {targetName}
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-warm-brown/15 text-warm-brown">
                  {prompts.length} {prompts.length === 1 ? "suggestion" : "suggestions"}
                </span>
              </div>
              <p className="text-sm text-ink/75 font-sans mt-1">
                {userId === "scott"
                  ? "Have a memory you want Scott to share? Andrea, Elaine, Joyce, James, Eloise, or anyone with the link can suggest a story for his next recording."
                  : "Have a story you want Blair to tell? Melissa, Jessica, Scott, Robin, or anyone with the link can suggest a memory or question for his next recording."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsFormOpen((prev) => !prev)}
            className="px-4 py-2.5 rounded-2xl text-xs font-semibold bg-warm-brown text-white hover:bg-warm-brown/90 transition-all shadow-xs flex items-center gap-2 self-start md:self-auto cursor-pointer"
            aria-expanded={isFormOpen}
          >
            {isFormOpen ? (
              <>
                Close Form <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" /> Suggest a Prompt
              </>
            )}
          </button>
        </div>

        {/* Suggestion Form */}
        {isFormOpen && (
          <form
            onSubmit={handleSubmit}
            className="mb-8 p-5 md:p-6 rounded-2xl bg-white/80 border border-warm-brown/20 shadow-2xs animate-fadeIn space-y-4"
          >
            <h3 className="font-serif font-bold text-lg text-ink">
              Leave a Story Prompt for {targetName}
            </h3>

            <div>
              <label htmlFor="prompt-input" className="block text-xs font-semibold text-ink/70 uppercase tracking-wider mb-1.5">
                The Question or Memory Prompt <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="prompt-input"
                rows={3}
                required
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder={
                  userId === "scott"
                    ? "e.g., Scott, tell us about what it was like living in France on your mission..."
                    : "e.g., Blair, tell us about the day you flew your plane through the mountains to Waterton..."
                }
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-warm-brown/25 bg-cream/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-warm-brown/40 text-ink placeholder:text-ink/40"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="suggested-by-input" className="block text-xs font-semibold text-ink/70 uppercase tracking-wider mb-1.5">
                  Your Name (optional)
                </label>
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <span className="text-[11px] text-ink/60 font-medium">Quick pick:</span>
                  {familyMembers.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setSuggestedBy(suggestedBy === name ? "" : name)}
                      className={`text-xs px-2.5 py-0.5 rounded-lg border transition-all cursor-pointer ${
                        suggestedBy === name
                          ? "bg-warm-brown text-white border-warm-brown font-semibold shadow-2xs"
                          : "bg-white/80 text-ink/70 border-warm-brown/20 hover:bg-white hover:text-ink"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <input
                  id="suggested-by-input"
                  type="text"
                  value={suggestedBy}
                  onChange={(e) => setSuggestedBy(e.target.value)}
                  placeholder={
                    userId === "scott"
                      ? "e.g., Andrea, Elaine, Joyce, James, Eloise..."
                      : "e.g., Melissa, Jessica, Scott, Robin..."
                  }
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-warm-brown/25 bg-cream/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-warm-brown/40 text-ink placeholder:text-ink/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/70 uppercase tracking-wider mb-1.5">
                  Category Tag (optional)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {suggestionCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(selectedCategory === cat ? "" : cat)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? "bg-warm-brown text-white border-warm-brown font-medium shadow-2xs"
                          : "bg-white/60 text-ink/70 border-warm-brown/20 hover:bg-white hover:text-ink"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 text-xs font-medium text-ink/60 hover:text-ink cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || promptText.trim().length < 3}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-warm-brown text-white hover:bg-warm-brown/90 transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {isSubmitting ? "Saving..." : `Add Prompt for ${targetName}`}
              </button>
            </div>
          </form>
        )}

        {/* Feedback Banner */}
        {submitSuccess && (
          <div className="mb-6 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Prompt added! {targetName} or anyone interviewing him can now record this memory.</span>
          </div>
        )}

        {/* Prompts Feed Grid */}
        {prompts.length === 0 ? (
          <div className="text-center p-8 rounded-2xl bg-white/40 border border-warm-brown/15 border-dashed">
            <p className="text-sm font-serif italic text-ink/60 mb-2">
              No family prompts added yet.
            </p>
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="text-xs font-semibold text-warm-brown hover:underline cursor-pointer"
            >
              Be the first to suggest a memory for {targetName}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prompts.map((p) => {
              const isConfirming = confirmDeleteId === p.id;
              const isDeletingThis = deletingId === p.id;
              const formattedDate = new Date(p.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={p.id}
                  className="p-5 rounded-2xl bg-white/80 border border-warm-brown/15 shadow-2xs hover:border-warm-brown/30 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Prompt Header & Tags */}
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-warm-brown/10 text-warm-brown">
                          from {p.suggested_by}
                        </span>
                        {p.category && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/80">
                            {p.category}
                          </span>
                        )}
                        {p.status === "used" && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600" /> Recorded
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs text-ink/40">{formattedDate}</span>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(p.id)}
                          aria-label={`Remove prompt from ${p.suggested_by}`}
                          title="Remove prompt"
                          className="p-1 rounded-md text-ink/30 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Delete Confirmation Inline */}
                    {isConfirming && (
                      <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-center justify-between gap-2">
                        <span className="font-medium">Remove this prompt?</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            disabled={isDeletingThis}
                            className="px-2 py-0.5 rounded bg-white border border-gray-200 text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id)}
                            disabled={isDeletingThis}
                            className="px-2 py-0.5 rounded bg-red-600 text-white font-semibold text-xs cursor-pointer disabled:opacity-50"
                          >
                            {isDeletingThis ? "..." : "Remove"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Prompt Text */}
                    <p className="font-serif text-base text-ink leading-relaxed italic mb-4">
                      "{p.prompt}"
                    </p>
                  </div>

                  {/* Action: Interview target user with this Prompt */}
                  <div className="pt-3 border-t border-warm-brown/10 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(p.id, p.status)}
                      className={`text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer hover:underline ${
                        p.status === "used"
                          ? "text-emerald-700 hover:text-emerald-800 font-semibold"
                          : "text-ink/60 hover:text-ink"
                      }`}
                      title={p.status === "used" ? "Click to mark as pending" : "Click to mark as recorded"}
                    >
                      {p.status === "used" ? (
                        <>
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Recorded for {targetName}</span>
                        </>
                      ) : (
                        <span>Ready for {targetName}</span>
                      )}
                    </button>
                    <Link
                      href={`/interview?prompt=${encodeURIComponent(p.prompt)}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-warm-brown text-white text-xs font-semibold hover:bg-warm-brown/90 shadow-2xs transition-all cursor-pointer shrink-0"
                      title={`Start interview with ${targetName} using this prompt`}
                    >
                      <Mic className="w-3.5 h-3.5" />
                      Ask {targetName} This
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
