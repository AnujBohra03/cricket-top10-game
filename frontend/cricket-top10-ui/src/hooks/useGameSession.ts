import { useCallback, useEffect, useRef, useState } from "react";
import { getAnswers, getQuestion, getState, makeGuess, resetGame } from "../api/api";
import type { Answer, Question } from "../types/game";

type SessionStatus = "active" | "won" | "lost";

interface UseGameSessionResult {
  question: Question | null;
  lives: number;
  found: number;
  guess: string;
  message: string;
  correctAnswers: Answer[];
  allAnswers: Answer[];
  error: string;
  loading: boolean;
  initialLoading: boolean;
  status: SessionStatus;
  setGuess: (value: string) => void;
  submitGuess: () => Promise<void>;
  reset: () => Promise<void>;
}

export function useGameSession(): UseGameSessionResult {
  const [question, setQuestion] = useState<Question | null>(null);
  const [lives, setLives] = useState(3);
  const [found, setFound] = useState(0);
  const [guess, setGuess] = useState("");
  const [message, setMessage] = useState("");
  const [correctAnswers, setCorrectAnswers] = useState<Answer[]>([]);
  const [allAnswers, setAllAnswers] = useState<Answer[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [status, setStatus] = useState<SessionStatus>("active");
  const isMountedRef = useRef(true);

  const refreshAllAnswers = useCallback(async (questionId: string) => {
    const answers = await getAnswers(questionId);
    if (isMountedRef.current) {
      setAllAnswers(answers);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    let cancelled = false;

    async function load() {
      try {
        setError("");
        setInitialLoading(true);
        const q = await getQuestion();
        const s = await getState();
        if (cancelled || !isMountedRef.current) {
          return;
        }

        setQuestion(q);
        setLives(s.lives);
        setFound(s.found);
        setCorrectAnswers(s.correctGuesses);

        const derivedStatus: SessionStatus = s.found >= 10 ? "won" : s.lives <= 0 ? "lost" : "active";
        setStatus(derivedStatus);

        if (derivedStatus === "active") {
          setAllAnswers([]);
        } else {
          await refreshAllAnswers(q.id);
        }
      } catch (err) {
        if (!cancelled && isMountedRef.current) {
          setError(err instanceof Error ? err.message : "Failed to load game. Please refresh the page.");
        }
      } finally {
        if (!cancelled && isMountedRef.current) {
          setInitialLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
      isMountedRef.current = false;
    };
  }, [refreshAllAnswers]);

  const submitGuess = useCallback(async () => {
    if (!guess || lives === 0 || !question || found === 10) {
      return;
    }

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
      const response = await makeGuess(question.id, trimmedGuess);
      const result = response.result;

      if (result.correct) {
        setMessage(`✅ ${result.player} is Rank #${result.rank}`);
      } else if (result.message === "Already guessed") {
        setMessage("⚠️ Already guessed");
      } else {
        setMessage("❌ Wrong guess");
      }

      setLives(response.state.lives);
      setFound(response.state.found);
      setCorrectAnswers(response.state.correctGuesses);
      setStatus(response.gameStatus);
      setGuess("");

      if (response.gameStatus === "active") {
        setAllAnswers([]);
      } else {
        await refreshAllAnswers(question.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit guess. Please try again.");
      setMessage("");
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [found, guess, lives, question, refreshAllAnswers]);

  const reset = useCallback(async () => {
    try {
      setError("");
      setLoading(true);
      await resetGame();
      const s = await getState();

      setLives(s.lives);
      setFound(s.found);
      setGuess("");
      setMessage("");
      setCorrectAnswers(s.correctGuesses);
      setAllAnswers([]);
      setStatus("active");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset game. Please try again.");
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  return {
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
  };
}
