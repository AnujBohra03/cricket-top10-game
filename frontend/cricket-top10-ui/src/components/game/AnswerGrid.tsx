import type { Answer } from "../../types/game";
import type { GuessedPlayer, SessionStatus } from "../../hooks/useGameSession";

interface Props {
  status: SessionStatus;
  isGameOver: boolean;
  guessedPlayers: GuessedPlayer[];
  allAnswers: Answer[];
}

function AnswerGrid({ status, isGameOver, guessedPlayers, allAnswers }: Props) {
  if (isGameOver && allAnswers.length > 0) {
    return (
      <section className="answers-section" aria-label="Full answer list">
        <p className="section-label">
          {status === "won" ? "🏆 All 10 Players" : "📋 The Answers"}
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
    );
  }

  if (!isGameOver && guessedPlayers.length > 0) {
    return (
      <section className="found-section" aria-label="Found players">
        <p className="section-label">✅ Found ({guessedPlayers.length})</p>
        <ul className="found-list">
          {guessedPlayers.map((p) => (
            <li key={p.playerId} className="found-item">
              <span className="rank">#{p.rank}</span>
              <span className="player-name">{p.player}</span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return null;
}

export default AnswerGrid;
