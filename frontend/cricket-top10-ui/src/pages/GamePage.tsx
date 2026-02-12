import { useEffect, useState } from "react";
import {
  getQuestion,
  getState,
  makeGuess,
  resetGame,
  getAnswers,
} from "../api/api";
import GameCard from "../components/GameCard";
import type { Question, Answer, GuessResponse, GameState } from "../types/game";

function GamePage() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [lives, setLives] = useState(3);
  const [found, setFound] = useState(0);
  const [guess, setGuess] = useState("");
  const [message, setMessage] = useState("");

  const [correctAnswers, setCorrectAnswers] = useState<Answer[]>([]);
  const [allAnswers, setAllAnswers] = useState<Answer[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Initial load
  useEffect(() => {
    async function load() {
      try {
        setError("");
        setInitialLoading(true);
        const q = await getQuestion();
        const s: GameState = await getState();
        setQuestion(q);
        setLives(s.lives);
        setFound(s.found);
        setCorrectAnswers(s.correctGuesses);
        // If challenge is already completed, load all answers
        if (s.found === 10 && q) {
          try {
            const answers: Answer[] = await getAnswers(q.id);
            setAllAnswers(answers);
          } catch (err) {
            // Silently fail - not critical
          }
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load game. Please refresh the page."
        );
      } finally {
        setInitialLoading(false);
      }
    }
    load();
  }, []);

  async function handleGuess() {
    if (!guess || lives === 0 || !question || found === 10) return;

    // Validate input
    const trimmedGuess = guess.trim();
    if (!trimmedGuess) {
      setMessage("⚠️ Please enter a player name");
      return;
    }

    if (trimmedGuess.length > 50) {
      setMessage("⚠️ Player name must be 50 characters or less");
      return;
    }

    try {
      setError("");
      setLoading(true);
      const response: GuessResponse = await makeGuess(question.id, trimmedGuess);
      const result = response.result;

      if (result.correct) {
        setMessage(`✅ ${result.player} is Rank #${result.rank}`);
      } else if (result.message === "Already guessed") {
        setMessage("⚠️ Already guessed");
      } else {
        setMessage("❌ Wrong guess");
      }

      const s = response.state;
      setLives(s.lives);
      setFound(s.found);
      setCorrectAnswers(s.correctGuesses);
      setGuess("");

      // Check if challenge is completed (all 10 found)
      if (response.gameStatus === "won" && question) {
        try {
          // Reveal all answers when completed
          const answers: Answer[] = await getAnswers(question.id);
          setAllAnswers(answers);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load answers. Please try again."
          );
        }
      }

      // 🔥 Reveal answers ONLY when game ends (lives = 0)
      if (response.gameStatus === "lost" && question) {
        try {
          const answers: Answer[] = await getAnswers(question.id);
          setAllAnswers(answers);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load answers. Please try again."
          );
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit guess. Please try again."
      );
      setMessage("");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    try {
      setError("");
      setLoading(true);
      await resetGame();
      const s: GameState = await getState();

      setLives(s.lives);
      setFound(s.found);
      setGuess("");
      setMessage("");
      setCorrectAnswers([]);
      setAllAnswers([]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to reset game. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading) {
    return (
      <GameCard>
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "#93c5fd",
          }}
        >
          <div style={{ fontSize: "18px", marginBottom: "10px" }}>⏳</div>
          <div>Loading game...</div>
        </div>
      </GameCard>
    );
  }

  return (
    <GameCard>
      {/* How to Play */}
      <div style={{ marginBottom: "14px" }}>
        <button
          onClick={() => setShowHelp(!showHelp)}
          style={{
            background: "transparent",
            border: "none",
            color: "#93c5fd",
            fontSize: "13px",
            cursor: "pointer",
            padding: 0,
          }}
        >
          ℹ️ How to Play
        </button>

        {showHelp && (
          <div
            style={{
              marginTop: "8px",
              fontSize: "13px",
              lineHeight: 1.5,
              background: "#020617",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #1e293b",
            }}
          >
            <ul style={{ paddingLeft: "16px" }}>
              <li>Guess players based on the question</li>
              <li>Only Top 10 answers are correct</li>
              <li>You have 3 lives</li>
              <li>Wrong guesses lose a life</li>
              <li>Find all 10 to win</li>
            </ul>
          </div>
        )}
      </div>

      {/* Question */}
      <h2
        style={{
          fontSize: "18px",
          fontWeight: 600,
          marginBottom: "16px",
          lineHeight: 1.4,
        }}
      >
        {question?.text}
      </h2>

      {/* Scoreboard */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "16px",
          padding: "8px 12px",
          background: "#020617",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: 600,
        }}
      >
        <span>❤️ LIVES: {lives}</span>
        <span>🏏 FOUND: {found} / 10</span>
      </div>

      {/* Challenge Completed Banner */}
      {found === 10 && (
        <div
          style={{
            marginBottom: "12px",
            padding: "15px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #052e16 0%, #14532d 100%)",
            color: "#4ade80",
            fontWeight: 700,
            textAlign: "center",
            border: "2px solid #22c55e",
            boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
          }}
        >
          <div style={{ fontSize: "24px", marginBottom: "8px" }}>🎉</div>
          <div style={{ fontSize: "18px", marginBottom: "4px" }}>
            Congratulations!
          </div>
          <div style={{ fontSize: "14px", opacity: 0.9 }}>
            Challenge Completed! You found all 10 players! 🏆
          </div>
        </div>
      )}

      {/* Game Over Banner */}
      {lives === 0 && found < 10 && (
        <div
          style={{
            marginBottom: "12px",
            padding: "10px",
            borderRadius: "6px",
            background: "#450a0a",
            color: "#f87171",
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          🛑 Game Over — Answers Revealed Below
        </div>
      )}

      {/* Input */}
      <input
        value={guess}
        onChange={(e) => {
          const value = e.target.value;
          // Limit to 50 characters
          if (value.length <= 50) {
            setGuess(value);
          }
        }}
        onKeyDown={(e) => e.key === "Enter" && !loading && found < 10 && handleGuess()}
        placeholder="Enter player name (max 50 characters)"
        disabled={lives === 0 || loading || found === 10}
        maxLength={50}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "6px",
          border: "1px solid #334155",
          marginBottom: "10px",
          background: "#0f172a",
          color: "#fff",
          opacity: loading ? 0.6 : 1,
        }}
      />

      {/* Guess Button */}
      <button
        onClick={handleGuess}
        disabled={lives === 0 || !guess || loading || found === 10}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "6px",
          border: "none",
          background: found === 10 ? "#6b7280" : "#22c55e",
          color: found === 10 ? "#9ca3af" : "#052e16",
          fontWeight: 600,
          marginBottom: "12px",
          opacity: lives === 0 || !guess || loading || found === 10 ? 0.5 : 1,
          cursor: lives === 0 || !guess || loading || found === 10 ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "⏳ Processing..." : found === 10 ? "✓ Challenge Completed" : "Guess"}
      </button>

      {/* Error Message */}
      {error && (
        <div
          style={{
            marginBottom: "12px",
            padding: "10px",
            borderRadius: "6px",
            fontSize: "14px",
            background: "#450a0a",
            color: "#f87171",
            border: "1px solid #1e293b",
            fontWeight: 500,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Feedback */}
      {message && (
        <div
          style={{
            marginBottom: "12px",
            padding: "8px",
            borderRadius: "6px",
            fontSize: "14px",
            background: message.startsWith("✅")
              ? "#052e16"
              : message.startsWith("❌")
              ? "#450a0a"
              : "#422006",
            color: message.startsWith("✅")
              ? "#4ade80"
              : message.startsWith("❌")
              ? "#f87171"
              : "#facc15",
            border: "1px solid #1e293b",
          }}
        >
          {message}
        </div>
      )}

      {/* Correct Guesses (during game - hide when completed) */}
      {correctAnswers.length > 0 && lives > 0 && found < 10 && (
        <div style={{ marginBottom: "12px" }}>
          <h4 style={{ fontSize: "14px", marginBottom: "6px" }}>
            ✅ Correct Guesses
          </h4>
          <ul style={{ paddingLeft: "16px", fontSize: "13px" }}>
            {[...correctAnswers]
              .sort((a, b) => a.rank - b.rank)
              .map((item) => (
                <li key={item.player}>
                  #{item.rank} — {item.player}
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Reveal All Answers on Challenge Completion or Game Over */}
      {(found === 10 || lives === 0) && allAnswers.length > 0 && (
        <div style={{ marginBottom: "14px" }}>
          <h4 style={{ fontSize: "14px", marginBottom: "6px" }}>
            {found === 10 ? "🏆 All 10 Players Found!" : "📋 Top 10 Answers"}
          </h4>
          <ul style={{ paddingLeft: "16px", fontSize: "13px" }}>
            {allAnswers.map((item) => {
              const isGuessed = correctAnswers.some(
                (a) => a.player === item.player
              );
              return (
                <li
                  key={item.rank}
                  style={{
                    marginBottom: "4px",
                    color: isGuessed ? "#4ade80" : found === 10 ? "#4ade80" : "#f87171",
                    fontWeight: isGuessed ? 600 : 400,
                  }}
                >
                  #{item.rank} — {item.player} {!isGuessed && lives === 0 && "❌"}
                  {isGuessed && found === 10 && " ✅"}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Reset */}
      <button
        onClick={handleReset}
        disabled={loading}
        style={{
          width: "100%",
          padding: "8px",
          borderRadius: "6px",
          border: "1px solid #334155",
          background: "transparent",
          color: "#e5e7eb",
          fontSize: "13px",
          opacity: loading ? 0.5 : 1,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "⏳ Resetting..." : "Reset Game"}
      </button>
    </GameCard>
  );
}

export default GamePage;
