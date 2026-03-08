import { useEffect, useRef, useState } from "react";
import { useGameSession } from "../hooks/useGameSession";
import "./GamePage.css";

const MAX_LIVES = 3;

const HOW_IT_WORKS = [
  { n: "1", text: "Read the question — it's a cricket stat category." },
  { n: "2", text: "Type a player name and pick from the dropdown." },
  { n: "3", text: "Find all 10 players to win. 3 wrong guesses and it's over." },
];

function renderSuggestionLabel(option: string, query: string): React.ReactNode {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return option;

  const index = option.toLowerCase().indexOf(trimmedQuery.toLowerCase());
  if (index < 0) return option;

  const before = option.slice(0, index);
  const match = option.slice(index, index + trimmedQuery.length);
  const after = option.slice(index + trimmedQuery.length);

  return (
    <>
      {before}
      <mark>{match}</mark>
      {after}
    </>
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
            {initialLoading ? "Loading…" : "Start Playing"}
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
    return (
      <div className="page">
        <p className="status-text">Loading game…</p>
      </div>
    );
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

      {/* ── Question navigation ── */}
      <section className="question-section" aria-label="Question navigation">
        {questions.length > 1 && (
          <div className="question-nav">
            <button
              className="nav-btn"
              onClick={() => void goToPreviousQuestion()}
              disabled={!canGoPrevious || loading}
              aria-label="Previous question"
            >
              ←
            </button>
            <span className="question-count">
              {currentQuestionIndex + 1} / {questions.length}
            </span>
            <button
              className="nav-btn"
              onClick={() => void goToNextQuestion()}
              disabled={!canGoNext || loading}
              aria-label="Next question"
            >
              →
            </button>
          </div>
        )}
        <h2 className="question-text">{question?.text ?? "…"}</h2>
      </section>

      {/* ── Status bar ── */}
      <section className="status-bar" aria-label="Game status" role="status" aria-live="polite">
        <Lives count={lives} />
        <div className="progress-wrap">
          <span className="found-label">{found} / 10 found</span>
          <div className="progress-track" aria-hidden="true">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </section>

      {/* ── Game-over banner ── */}
      {status === "won" && (
        <div className="banner banner-won" role="status">
          All 10 found. Well played!
        </div>
      )}
      {status === "lost" && (
        <div className="banner banner-lost" role="status">
          Out of lives. See the answers below.
        </div>
      )}

      {/* ── Guess input (hidden when game over) ── */}
      {!isGameOver && (
        <section className="input-section" aria-label="Guess input">
          <div className={`search-wrap${suggestions.length > 0 ? " search-open" : ""}`}>
            <input
              ref={inputRef}
              id="guess-input"
              name="cricket-guess-input"
              className="search-input"
              type="text"
              value={guess}
              onChange={(e) => { if (e.target.value.length <= 50) setGuess(e.target.value); }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") { e.preventDefault(); moveSuggestionSelection(1); return; }
                if (e.key === "ArrowUp") { e.preventDefault(); moveSuggestionSelection(-1); return; }
                if (e.key === "Escape") { e.preventDefault(); setGuess(guess.trim()); return; }
                if (e.key === "Enter") {
                  if (selectedSuggestionIndex >= 0 && suggestions.length > 0) {
                    e.preventDefault(); submitSelectedSuggestion(); return;
                  }
                  if (!loading && found < 10) { e.preventDefault(); void submitGuess(); }
                }
              }}
              placeholder="Type a player name…"
              disabled={isInputDisabled}
              maxLength={50}
              autoComplete="cricket-player-search"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              data-form-type="other"
              role="combobox"
              aria-expanded={suggestions.length > 0}
              aria-controls="suggestions-list"
              aria-autocomplete="list"
              aria-activedescendant={selectedSuggestionIndex >= 0 ? `suggestion-${selectedSuggestionIndex}` : undefined}
            />

            {suggestions.length > 0 && (
              <ul id="suggestions-list" className="suggestions" role="listbox" aria-label="Player suggestions">
                {suggestions.map((item, i) => (
                  <li key={`${item.playerId}-${i}`}>
                    <button
                      type="button"
                      id={`suggestion-${i}`}
                      className={`suggestion-item${selectedSuggestionIndex === i ? " suggestion-active" : ""}${item.alreadySelected ? " suggestion-found" : ""}`}
                      onClick={() => applySuggestion(item.value)}
                      role="option"
                      aria-selected={selectedSuggestionIndex === i}
                      disabled={item.alreadySelected}
                    >
                      <span>{renderSuggestionLabel(item.value, guess)}</span>
                      {item.alreadySelected && <span className="found-badge">Found</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            className="btn-primary"
            onClick={() => void submitGuess()}
            disabled={isInputDisabled || !guess.trim()}
          >
            {loading && !isResetting ? "Checking…" : "Guess"}
          </button>
        </section>
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

      {/* ── Found players (active game) ── */}
      {guessedPlayers.length > 0 && !isGameOver && (
        <section className="found-section" aria-label="Found players">
          <p className="section-label">Found ({guessedPlayers.length})</p>
          <ul className="found-list">
            {guessedPlayers.map((p) => (
              <li key={p.playerId} className="found-item">
                <span className="rank">#{p.rank}</span>
                <span className="player-name">{p.player}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── All answers (game over) ── */}
      {isGameOver && allAnswers.length > 0 && (
        <section className="answers-section" aria-label="Full answer list">
          <p className="section-label">
            {status === "won" ? "All 10 Players" : "The Answers"}
          </p>
          <ul className="answers-list">
            {allAnswers.map((a) => {
              const found = guessedPlayers.some((g) => g.rank === a.rank);
              return (
                <li key={a.rank} className={`answer-item ${found ? "answer-found" : "answer-missed"}`}>
                  <span className="rank">#{a.rank}</span>
                  <span className="player-name">{a.player}</span>
                  <span className="answer-badge">{found ? "Found" : "Missed"}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

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
