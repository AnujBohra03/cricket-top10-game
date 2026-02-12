import { useState } from "react";
import GameCard from "../components/GameCard";
import { useGameSession } from "../hooks/useGameSession";

function GamePage() {
  const [showHelp, setShowHelp] = useState(false);
  const {
    question,
    lives,
    found,
    guess,
    message,
    correctAnswers,
    allAnswers,
    error,
    loading,
    initialLoading,
    status,
    setGuess,
    submitGuess,
    reset,
  } = useGameSession();

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
      <section style={{ marginBottom: "14px" }} aria-label="How to play">
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
          aria-expanded={showHelp}
          aria-controls="how-to-play-panel"
        >
          ℹ️ How to Play
        </button>

        {showHelp && (
          <div
            id="how-to-play-panel"
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
      </section>

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

      {status === "won" && (
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
          <div style={{ fontSize: "18px", marginBottom: "4px" }}>Congratulations!</div>
          <div style={{ fontSize: "14px", opacity: 0.9 }}>
            Challenge Completed! You found all 10 players! 🏆
          </div>
        </div>
      )}

      {status === "lost" && (
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

      <label htmlFor="guess-input" style={{ display: "block", marginBottom: "8px", fontSize: "13px" }}>
        Enter player name
      </label>
      <input
        id="guess-input"
        value={guess}
        onChange={(e) => {
          const value = e.target.value;
          if (value.length <= 50) {
            setGuess(value);
          }
        }}
        onKeyDown={(e) => e.key === "Enter" && !loading && found < 10 && void submitGuess()}
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

      <button
        onClick={() => void submitGuess()}
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

      {error && (
        <div
          aria-live="polite"
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

      {message && (
        <div
          aria-live="polite"
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

      {correctAnswers.length > 0 && status === "active" && (
        <div style={{ marginBottom: "12px" }}>
          <h4 style={{ fontSize: "14px", marginBottom: "6px" }}>✅ Correct Guesses</h4>
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

      {status !== "active" && allAnswers.length > 0 && (
        <div style={{ marginBottom: "14px" }}>
          <h4 style={{ fontSize: "14px", marginBottom: "6px" }}>
            {status === "won" ? "🏆 All 10 Players Found!" : "📋 Top 10 Answers"}
          </h4>
          <ul style={{ paddingLeft: "16px", fontSize: "13px" }}>
            {allAnswers.map((item) => {
              const isGuessed = correctAnswers.some((a) => a.player === item.player);
              return (
                <li
                  key={item.rank}
                  style={{
                    marginBottom: "4px",
                    color: isGuessed || status === "won" ? "#4ade80" : "#f87171",
                    fontWeight: isGuessed ? 600 : 400,
                  }}
                >
                  #{item.rank} — {item.player} {!isGuessed && status === "lost" && "❌"}
                  {isGuessed && status === "won" && " ✅"}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <button
        onClick={() => void reset()}
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
