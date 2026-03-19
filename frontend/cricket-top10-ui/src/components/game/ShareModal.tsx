import { useCallback, useEffect, useRef, useState } from "react";
import type { SessionStatus, GuessedPlayer } from "../../hooks/useGameSession";
import type { Answer } from "../../types/game";

interface ShareModalProps {
  status: SessionStatus;
  found: number;
  lives: number;
  questionText: string;
  questionId: string;
  allAnswers: Answer[];
  guessedPlayers: GuessedPlayer[];
  onClose: () => void;
}

function buildShareUrl(questionId: string): string {
  const base = window.location.origin + import.meta.env.BASE_URL;
  return `${base.replace(/\/$/, "")}/?q=${encodeURIComponent(questionId)}`;
}

function buildEmojiGrid(guessedPlayers: GuessedPlayer[]): string {
  const guessedRanks = new Set(guessedPlayers.map((p) => p.rank));
  return Array.from({ length: 10 }, (_, i) => (guessedRanks.has(i + 1) ? "🟩" : "⬜")).join("");
}

/** Text shown in the preview and sent via native Share (no URL — shown separately). */
function buildPreviewText(
  status: SessionStatus,
  found: number,
  lives: number,
  questionText: string,
  allAnswers: Answer[],
  guessedPlayers: GuessedPlayer[]
): string {
  const emojiGrid = allAnswers.length > 0 ? buildEmojiGrid(guessedPlayers) : "";

  let resultLine: string;
  if (status === "won") {
    resultLine =
      lives === 3
        ? `Perfect! 10/10 with no wrong guesses 🏆`
        : `Found 10/10 with ${lives}/3 lives left 🏆`;
  } else {
    resultLine = `Got ${found}/10 correct — can you beat me? 🏏`;
  }

  return [`Cricket Top 10 🏏`, `"${questionText}"`, ``, emojiGrid, resultLine].join("\n");
}

export default function ShareModal({
  status,
  found,
  lives,
  questionText,
  questionId,
  allAnswers,
  guessedPlayers,
  onClose,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = Array.from(
        modalRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled)") ?? []
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  const shareUrl = buildShareUrl(questionId);
  const previewText = buildPreviewText(status, found, lives, questionText, allAnswers, guessedPlayers);
  const fullShareText = `${previewText}\n\n${shareUrl}`;
  const canNativeShare = typeof navigator.share === "function";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = shareUrl;
      ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
      document.body.appendChild(ta);
      ta.select();
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    try {
      await navigator.share({ text: fullShareText });
    } catch {
      // User cancelled or share failed — silently ignore
    }
  }

  return (
    <div
      className="share-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="share-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="share-modal-header">
          <h2 id="share-modal-title" className="share-modal-title">
            {status === "won" ? "You won! 🏆" : "Game over! 😅"}
          </h2>
          <button
            ref={closeRef}
            className="share-close-btn"
            onClick={onClose}
            aria-label="Close share dialog"
          >
            ×
          </button>
        </div>

        <div className="share-preview">
          <pre className="share-text-preview">{previewText}</pre>
        </div>

        <div className="share-url-row">
          <span className="share-url-label">Link</span>
          <span className="share-url-value">{shareUrl}</span>
        </div>

        <div className="share-actions">
          {canNativeShare && (
            <button className="btn-primary" onClick={() => void handleShare()}>
              Share
            </button>
          )}
          <button
            className={canNativeShare ? "btn-secondary" : "btn-primary"}
            onClick={() => void handleCopy()}
          >
            {copied ? "✅ Link copied!" : "Copy link"}
          </button>
        </div>
      </div>
    </div>
  );
}
