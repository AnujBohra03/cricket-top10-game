import { useEffect, useState } from "react";
import GameCard from "../components/GameCard";
import { useGameSession } from "../hooks/useGameSession";
import "./GamePage.css";

function getFeedbackClassName(tone: "success" | "error" | "warning" | "neutral"): string {
  if (tone === "success") {
    return "game-feedback game-feedback-success";
  }
  if (tone === "error") {
    return "game-feedback game-feedback-error";
  }
  if (tone === "warning") {
    return "game-feedback game-feedback-warning";
  }
  return "game-feedback game-feedback-neutral";
}

function renderSuggestionLabel(option: string, query: string): React.ReactNode {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return option;
  }

  const index = option.toLowerCase().indexOf(trimmedQuery.toLowerCase());
  if (index < 0) {
    return option;
  }

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

function GamePage() {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const {
    questions,
    currentQuestionIndex,
    question,
    lives,
    found,
    guess,
    feedback,
    guessedPlayers,
    suggestions,
    selectedSuggestionIndex,
    error,
    loading,
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
    goToPreviousQuestion,
    goToNextQuestion,
  } = useGameSession();

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isTypingContext = tagName === "input" || tagName === "textarea" || target?.isContentEditable === true;

      if (isTypingContext) {
        return;
      }

      if (event.key === "ArrowLeft" && canGoPrevious && !loading) {
        event.preventDefault();
        void goToPreviousQuestion();
      }

      if (event.key === "ArrowRight" && canGoNext && !loading) {
        event.preventDefault();
        void goToNextQuestion();
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [canGoNext, canGoPrevious, goToNextQuestion, goToPreviousQuestion, loading]);

  useEffect(() => {
    if (feedback.tone !== "success" || !feedback.text) {
      return;
    }
    const timer = window.setTimeout(() => {
      dismissFeedback();
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [dismissFeedback, feedback.text, feedback.tone]);

  if (initialLoading) {
    return (
      <GameCard>
        <div className="game-loading">
          <div className="game-loading-icon">Loading...</div>
          <div>Fetching challenge state</div>
        </div>
      </GameCard>
    );
  }

  const isInputDisabled = lives === 0 || loading || found === 10;
  const progress = Math.round((found / 10) * 100);

  return (
    <GameCard>
      <div className="game-shell">
        <section aria-label="Question navigation" className="game-header-zone game-zone">
          <div className="game-question-nav">
            <button
              onClick={() => void goToPreviousQuestion()}
              disabled={!canGoPrevious || loading}
              className="game-nav-button"
              aria-label="Previous question"
            >
              <span aria-hidden="true">←</span>
            </button>

            <div className="game-question-progress">
              Question {questions.length === 0 ? 0 : currentQuestionIndex + 1} / {questions.length}
            </div>

            <button
              onClick={() => void goToNextQuestion()}
              disabled={!canGoNext || loading}
              className="game-nav-button"
              aria-label="Next question"
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>

        <section aria-label="Top section" className="game-zone">
          <h2 className="game-page-title">{question?.text}</h2>

          <div className="game-progress-head">
            <h3 className="game-section-title">Progress ({found}/10)</h3>
            <span className="game-progress-label">{progress}%</span>
          </div>

          <div className="game-progress-track" aria-hidden="true">
            <div className="game-progress-value" style={{ width: `${progress}%` }} />
          </div>

          <div className="game-stats" role="status" aria-live="polite">
            <span>Lives {lives}</span>
          </div>

          {status === "won" && (
            <div className="game-status-banner game-status-won" role="status" aria-live="polite">
              Challenge completed. You found all 10 players.
            </div>
          )}

          {status === "lost" && (
            <div className="game-status-banner game-status-lost" role="status" aria-live="polite">
              No lives remaining. Try reset to play again.
            </div>
          )}
        </section>

        <section aria-label="Guess input" className="game-zone">
          <div className="game-input-wrap">
            <input
              id="guess-input"
              name="cricket-guess-input"
              className="game-input"
              value={guess}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 50) {
                  setGuess(value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  moveSuggestionSelection(1);
                  return;
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  moveSuggestionSelection(-1);
                  return;
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setGuess(guess.trim());
                  return;
                }
                if (e.key === "Enter") {
                  if (selectedSuggestionIndex >= 0 && suggestions.length > 0) {
                    e.preventDefault();
                    submitSelectedSuggestion();
                    return;
                  }
                  if (!loading && found < 10) {
                    e.preventDefault();
                    void submitGuess();
                  }
                }
              }}
              placeholder="Enter player name"
              disabled={isInputDisabled}
              maxLength={50}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              role="combobox"
              aria-expanded={suggestions.length > 0}
              aria-controls="player-suggestions-list"
              aria-autocomplete="list"
              aria-activedescendant={selectedSuggestionIndex >= 0 ? `player-option-${selectedSuggestionIndex}` : undefined}
            />
          </div>

          {suggestions.length > 0 && (
            <ul id="player-suggestions-list" className="game-suggestions" role="listbox" aria-label="Player suggestions">
              {suggestions.map((item, index) => (
                <li key={`${item.playerId}-${index}`}>
                  <button
                    type="button"
                    id={`player-option-${index}`}
                    className={`game-suggestion-item ${selectedSuggestionIndex === index ? "game-suggestion-item-active" : ""}`}
                    onClick={() => applySuggestion(item.value)}
                    role="option"
                    aria-selected={selectedSuggestionIndex === index}
                    disabled={item.alreadySelected}
                  >
                    <span>{renderSuggestionLabel(item.value, guess)}</span>
                    {item.alreadySelected && <span className="game-suggestion-meta">Already selected</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button onClick={() => void submitGuess()} className="game-primary-button" disabled={isInputDisabled || !guess.trim()}>
            {loading ? "Processing..." : found === 10 ? "Challenge Completed" : "Submit Guess"}
          </button>

          {error && (
            <div aria-live="polite" className="game-error">
              {error}
            </div>
          )}

          {feedback.text && (
            <div aria-live="polite" className={getFeedbackClassName(feedback.tone)}>
              {feedback.text}
            </div>
          )}
        </section>

        <section aria-label="Guessed players" className="game-zone">
          <h3 className="game-section-title">Guessed Players</h3>

          {guessedPlayers.length > 0 ? (
            <ul className="game-guessed-grid">
              {guessedPlayers.map((item) => (
                <li key={item.playerId} className="game-guessed-item">
                  <div className="game-rank">#{item.rank}</div>
                  <div className="game-player-copy">
                    <div className="game-player-name">{item.player}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="game-section-empty">No correct guesses yet.</p>
          )}
        </section>

        {showResetConfirm ? (
          <div className="game-reset-confirm">
            <p>Reset this question progress?</p>
            <div className="game-reset-actions">
              <button className="game-secondary-button" onClick={() => setShowResetConfirm(false)} disabled={loading}>
                Cancel
              </button>
              <button
                className="game-danger-button"
                onClick={() => {
                  setShowResetConfirm(false);
                  void reset();
                }}
                disabled={loading}
              >
                Confirm Reset
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowResetConfirm(true)} disabled={loading} className="game-secondary-button game-reset-button">
            {loading ? "Resetting..." : "Reset Game"}
          </button>
        )}
      </div>
    </GameCard>
  );
}

export default GamePage;
