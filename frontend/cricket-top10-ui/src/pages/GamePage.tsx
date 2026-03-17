import { useEffect, useRef, useState } from "react";
import { useGameSession } from "../hooks/useGameSession";
import QuestionHeader from "../components/game/QuestionHeader";
import GuessInput from "../components/game/GuessInput";
import AnswerGrid from "../components/game/AnswerGrid";
import "./GamePage.css";

const MAX_LIVES = 3;

const HOW_IT_WORKS = [
  { n: "1", text: "Read the question — it's a cricket stat category." },
  { n: "2", text: "Type a player name and pick from the dropdown." },
  { n: "3", text: "Find all 10 players to win. 3 wrong guesses and it's over." },
];

/* ── Skeleton screen ── */

function GameSkeleton() {
  return (
    <div className="page game-page" aria-busy="true" aria-label="Loading game">
      <section className="skeleton-question">
        <div className="skeleton-nav">
          <div className="skeleton skeleton-nav-btn" />
          <div className="skeleton skeleton-line" style={{ width: "48px" }} />
          <div className="skeleton skeleton-nav-btn" />
        </div>
        <div className="skeleton skeleton-heading" style={{ width: "90%" }} />
        <div className="skeleton skeleton-heading" style={{ width: "65%" }} />
      </section>

      <div className="skeleton-status-bar">
        <div className="skeleton-hearts">
          <div className="skeleton skeleton-circle" />
          <div className="skeleton skeleton-circle" />
          <div className="skeleton skeleton-circle" />
        </div>
        <div className="skeleton-progress">
          <div className="skeleton skeleton-line" style={{ width: "80px" }} />
          <div className="skeleton" style={{ height: "5px", borderRadius: "999px", width: "100%" }} />
        </div>
      </div>

      <div className="skeleton-input-section">
        <div className="skeleton skeleton-block" />
        <div className="skeleton skeleton-block" />
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function Lives({ count }: { count: number }) {
  return (
    <div className="lives" aria-label={`${count} of ${MAX_LIVES} lives remaining`}>
      {Array.from({ length: MAX_LIVES }, (_, i) => (
        <span key={i} className={`heart ${i < count ? "heart-on" : "heart-off"}`} aria-hidden="true">
          {i < count ? "♥" : "♡"}
        </span>
      ))}
    </div>
  );
}

function GiveUpButton({ onGiveUp, loading }: { onGiveUp: () => void; loading: boolean }) {
  const [confirm, setConfirm] = useState(false);

  if (confirm) {
    return (
      <div className="reset-confirm">
        <p className="reset-question">Give up and reveal all answers?</p>
        <div className="reset-actions">
          <button
            className="btn-danger"
            onClick={() => { onGiveUp(); setConfirm(false); }}
            disabled={loading}
          >
            Yes, give up
          </button>
          <button className="btn-ghost" onClick={() => setConfirm(false)} disabled={loading}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button className="btn-reset" onClick={() => setConfirm(true)} disabled={loading}>
      Give up
    </button>
  );
}

/* ── Main page ── */

function GamePage() {
  const [gameStarted, setGameStarted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    questions,
    currentQuestionIndex,
    question,
    lives,
    found,
    guess,
    feedback,
    allAnswers,
    guessedPlayers,
    suggestions,
    selectedSuggestionIndex,
    error,
    loading,
    isResetting,
    initialLoading,
    status,
    canGoPrevious,
    canGoNext,
    setGuess,
    applySuggestion,
    moveSuggestionSelection,
    submitSelectedSuggestion,
    dismissFeedback,
    submitGuess,
    reset,
    giveUp,
    goToPreviousQuestion,
    goToNextQuestion,
  } = useGameSession();

  /* Global arrow-key navigation (only when not focused on input) */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.key === "ArrowLeft" && canGoPrevious && !loading) { e.preventDefault(); void goToPreviousQuestion(); }
      if (e.key === "ArrowRight" && canGoNext && !loading) { e.preventDefault(); void goToNextQuestion(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canGoNext, canGoPrevious, goToNextQuestion, goToPreviousQuestion, loading]);

  /* Auto-dismiss success feedback */
  useEffect(() => {
    if (feedback.tone !== "success" || !feedback.text) return;
    const t = window.setTimeout(dismissFeedback, 2500);
    return () => window.clearTimeout(t);
  }, [dismissFeedback, feedback.text, feedback.tone]);

  const isGameOver = status === "won" || status === "lost";
  const isInputDisabled = lives === 0 || loading || found === 10 || isGameOver;

  /* ── Landing view ── */
  if (!gameStarted) {
    return (
      <div className="page landing-page">
        <div className="landing-hero">
          <h1 className="landing-title">Name the Top 10</h1>
          <p className="landing-desc">
            A cricket stats quiz. Each question is a category — guess all 10 players who top the list.
          </p>
          <button
            className="btn-primary btn-lg"
            onClick={() => setGameStarted(true)}
            disabled={initialLoading}
          >
            {initialLoading ? "Loading…" : "🚀 Start Playing"}
          </button>
        </div>

        <div className="how-it-works">
          <p className="section-label">How it works</p>
          <ol className="steps">
            {HOW_IT_WORKS.map((s) => (
              <li key={s.n} className="step">
                <span className="step-n">{s.n}</span>
                <span>{s.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  }

  /* ── Loading ── */
  if (initialLoading) {
    return <GameSkeleton />;
  }

  /* ── Error (no question loaded) ── */
  if (error && !question) {
    return (
      <div className="page">
        <p className="status-text error-text">{error}</p>
        <button className="btn-secondary" onClick={() => void reset()}>Try again</button>
      </div>
    );
  }

  const progress = Math.round((found / 10) * 100);

  return (
    <div className="page game-page">

      <QuestionHeader
        questions={questions}
        currentQuestionIndex={currentQuestionIndex}
        questionText={question?.text ?? "…"}
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
        loading={loading}
        onPrevious={() => void goToPreviousQuestion()}
        onNext={() => void goToNextQuestion()}
      />

      {/* ── Status bar ── */}
      <section className="status-bar" aria-label="Game status" role="status" aria-live="polite">
        <Lives count={lives} />
        <div className="progress-wrap">
          <span className="found-label">🏆 {found} / 10 found</span>
          <div className="progress-track" aria-hidden="true">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </section>

      {/* ── Game-over banner ── */}
      {status === "won" && (
        <div className="banner banner-won" role="status">
          🎉 All 10 found! Champion! 🏆
        </div>
      )}
      {status === "lost" && (
        <div className="banner banner-lost" role="status">
          😅 Out of lives — better luck next time!
        </div>
      )}

      {/* ── Guess input (hidden when game over) ── */}
      {!isGameOver && (
        <GuessInput
          inputRef={inputRef}
          guess={guess}
          suggestions={suggestions}
          selectedSuggestionIndex={selectedSuggestionIndex}
          loading={loading}
          isResetting={isResetting}
          disabled={isInputDisabled}
          found={found}
          onGuessChange={setGuess}
          onMoveSuggestion={moveSuggestionSelection}
          onApplySuggestion={applySuggestion}
          onSubmitSuggestion={submitSelectedSuggestion}
          onSubmitGuess={() => void submitGuess()}
        />
      )}

      {/* ── Feedback ── */}
      {(feedback.text || error) && (
        <div
          className={`feedback feedback-${feedback.text ? feedback.tone : "error"}`}
          role="alert"
          aria-live="polite"
        >
          <span>{feedback.text || error}</span>
          <button
            type="button"
            className="feedback-dismiss"
            onClick={dismissFeedback}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <AnswerGrid
        status={status}
        isGameOver={isGameOver}
        guessedPlayers={guessedPlayers}
        allAnswers={allAnswers}
      />

      {/* ── Give up (active game only) ── */}
      {!isGameOver && (
        <section className="reset-section">
          <GiveUpButton onGiveUp={() => void giveUp()} loading={loading} />
        </section>
      )}

    </div>
  );
}

export default GamePage;
