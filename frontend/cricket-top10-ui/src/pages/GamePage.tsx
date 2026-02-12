import { useEffect, useState, type ReactNode } from "react";
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

function renderSuggestionLabel(option: string, query: string): ReactNode {
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
  const [showHelp, setShowHelp] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const {
    questions,
    currentQuestionIndex,
    question,
    lives,
    found,
    guess,
    feedback,
    correctAnswers,
    allAnswers,
    attempts,
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
      const isTypingContext =
        tagName === "input" ||
        tagName === "textarea" ||
        target?.isContentEditable === true;

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
          <div className="game-loading-icon">⏳</div>
          <div>Loading game...</div>
        </div>
      </GameCard>
    );
  }

  const isInputDisabled = lives === 0 || loading || found === 10;
  const orderedCorrectAnswers = [...correctAnswers].sort((a, b) => a.rank - b.rank);
  const progress = Math.round((found / 10) * 100);

  const recentAttempts = attempts.filter((attempt) => attempt.outcome !== "correct").slice(0, 3);

  return (
    <GameCard>
      <section aria-label="How to play">
        <div className="game-help">
          <button onClick={() => setShowHelp(!showHelp)} className="game-help-toggle" aria-expanded={showHelp} aria-controls="how-to-play-panel">
            ? How to Play
          </button>
        </div>

        {showHelp && (
          <div id="how-to-play-panel" className="game-help-panel">
            <ul>
              <li>Guess players based on the question</li>
              <li>Only Top 10 answers are correct</li>
              <li>You have 3 lives</li>
              <li>Wrong guesses lose a life</li>
              <li>Find all 10 to win</li>
            </ul>
          </div>
          )}
      </section>

      <div className="game-question-nav">
        <button
          onClick={() => void goToPreviousQuestion()}
          disabled={!canGoPrevious || loading}
          className="game-nav-button"
          aria-label="Previous question"
        >
          Previous
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
          Next
        </button>
      </div>

      <h2 className="game-question-title">{question?.text}</h2>

      <div className="game-progress-track" aria-hidden="true">
        <div className="game-progress-value" style={{ width: `${progress}%` }} />
      </div>

      <div className="game-stats" role="status" aria-live="polite">
        <span>Lives: {lives}</span>
        <span>Found: {found} / 10</span>
        <span>Remaining: {10 - found}</span>
      </div>

      {status === "won" && (
        <div className="game-status-banner game-status-won">
          <div className="game-status-title">Congratulations!</div>
          <div className="game-status-subtitle">
            Challenge Completed! You found all 10 players! 🏆
          </div>
        </div>
      )}

      {status === "lost" && (
        <div className="game-status-banner game-status-lost">
          🛑 Game Over — Answers Revealed Below
        </div>
      )}

      <label htmlFor="guess-input" className="game-label">
        Enter player name
      </label>
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
          placeholder="Type at least 2 letters to see suggestions"
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
          aria-activedescendant={
            selectedSuggestionIndex >= 0 ? `player-option-${selectedSuggestionIndex}` : undefined
          }
        />
      </div>

      {suggestions.length > 0 && (
        <ul id="player-suggestions-list" className="game-suggestions" role="listbox" aria-label="Player suggestions">
          {suggestions.map((item, index) => (
            <li key={item}>
              <button
                type="button"
                id={`player-option-${index}`}
                className={`game-suggestion-item ${selectedSuggestionIndex === index ? "game-suggestion-item-active" : ""}`}
                onClick={() => applySuggestion(item)}
                role="option"
                aria-selected={selectedSuggestionIndex === index}
              >
                {renderSuggestionLabel(item, guess)}
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => void submitGuess()}
        className="game-primary-button"
        disabled={isInputDisabled || !guess.trim()}
      >
        {loading ? "Processing..." : found === 10 ? "Challenge Completed" : "Guess"}
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

      <section className="game-section">
        <h4 className="game-section-title">Correct Guesses</h4>
        {orderedCorrectAnswers.length > 0 ? (
          <ul className="game-chip-list">
            {orderedCorrectAnswers.map((item) => (
              <li key={item.player} className="game-chip">
                <span>#{item.rank}</span>
                <span>{item.player}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="game-section-empty">No correct guesses yet.</p>
        )}
      </section>

      <section className="game-section">
        <h4 className="game-section-title">Recent Attempts</h4>
        {recentAttempts.length > 0 ? (
          <ul className="game-attempt-list">
            {recentAttempts.map((attempt, index) => (
              <li key={`${attempt.player}-${index}`} className="game-attempt-item">
                <span>{attempt.player}</span>
                <span>
                  {attempt.outcome === "correct" && `Correct${attempt.rank ? ` (#${attempt.rank})` : ""}`}
                  {attempt.outcome === "incorrect" && "Incorrect"}
                  {attempt.outcome === "duplicate" && "Already guessed"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="game-section-empty">No incorrect or duplicate attempts yet.</p>
        )}
      </section>

      {status !== "active" && allAnswers.length > 0 && (
        <div className="game-section">
          <h4 className="game-section-title">
            {status === "won" ? "🏆 All 10 Players Found!" : "📋 Top 10 Answers"}
          </h4>
          <ul className="game-answer-list">
            {allAnswers.map((item) => {
              const isGuessed = correctAnswers.some((a) => a.player === item.player);
              return (
                <li key={item.rank} className={isGuessed || status === "won" ? "game-answer-correct" : "game-answer-missed"}>
                  #{item.rank} — {item.player} {!isGuessed && status === "lost" && "❌"}
                  {isGuessed && status === "won" && " ✅"}
                </li>
              );
            })}
          </ul>
        </div>
      )}

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
    </GameCard>
  );
}

export default GamePage;
