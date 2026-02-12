import { useCallback, useEffect, useRef, useState } from "react";
import { getAnswers, getPlayerSuggestions, getQuestion, getQuestions, getState, makeGuess, resetGame } from "../api/api";
import type { Answer, Question } from "../types/game";

type SessionStatus = "active" | "won" | "lost";

interface UseGameSessionResult {
  questions: Question[];
  currentQuestionIndex: number;
  question: Question | null;
  lives: number;
  found: number;
  guess: string;
  message: string;
  correctAnswers: Answer[];
  allAnswers: Answer[];
  suggestions: string[];
  error: string;
  loading: boolean;
  initialLoading: boolean;
  status: SessionStatus;
  canGoPrevious: boolean;
  canGoNext: boolean;
  setGuess: (value: string) => void;
  applySuggestion: (value: string) => void;
  submitGuess: () => Promise<void>;
  reset: () => Promise<void>;
  goToPreviousQuestion: () => Promise<void>;
  goToNextQuestion: () => Promise<void>;
}

export function useGameSession(): UseGameSessionResult {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  const [lives, setLives] = useState(3);
  const [found, setFound] = useState(0);
  const [guess, setGuess] = useState("");
  const [message, setMessage] = useState("");
  const [correctAnswers, setCorrectAnswers] = useState<Answer[]>([]);
  const [allAnswers, setAllAnswers] = useState<Answer[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [status, setStatus] = useState<SessionStatus>("active");
  const isMountedRef = useRef(true);
  const suppressNextSuggestionFetchRef = useRef(false);

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
        const questionList = await getQuestions();
        const q = await getQuestion();
        const s = await getState();
        if (cancelled || !isMountedRef.current) {
          return;
        }

        setQuestions(questionList);
        setQuestion(q);
        const resolvedIndex = questionList.findIndex((item) => item.id === q.id);
        setCurrentQuestionIndex(resolvedIndex >= 0 ? resolvedIndex : 0);
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

  useEffect(() => {
    if (suppressNextSuggestionFetchRef.current) {
      suppressNextSuggestionFetchRef.current = false;
      return;
    }

    if (guess.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const result = await getPlayerSuggestions(guess.trim());
        if (isMountedRef.current) {
          setSuggestions(result);
        }
      } catch {
        if (isMountedRef.current) {
          setSuggestions([]);
        }
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [guess]);

  const loadQuestionByIndex = useCallback(
    async (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= questions.length) {
        return;
      }

      const nextQuestion = questions[nextIndex];
      try {
        setError("");
        setLoading(true);
        const q = await getQuestion(nextQuestion.id);
        const s = await getState();
        setQuestion(q);
        setCurrentQuestionIndex(nextIndex);
        setLives(s.lives);
        setFound(s.found);
        setCorrectAnswers(s.correctGuesses);
        setGuess("");
        setMessage("");
        setSuggestions([]);

        const derivedStatus: SessionStatus = s.found >= 10 ? "won" : s.lives <= 0 ? "lost" : "active";
        setStatus(derivedStatus);

        if (derivedStatus === "active") {
          setAllAnswers([]);
        } else {
          await refreshAllAnswers(q.id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to switch question.");
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [questions, refreshAllAnswers]
  );

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
      setSuggestions([]);

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
      setSuggestions([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset game. Please try again.");
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const goToPreviousQuestion = useCallback(async () => {
    await loadQuestionByIndex(currentQuestionIndex - 1);
  }, [currentQuestionIndex, loadQuestionByIndex]);

  const goToNextQuestion = useCallback(async () => {
    await loadQuestionByIndex(currentQuestionIndex + 1);
  }, [currentQuestionIndex, loadQuestionByIndex]);

  const applySuggestion = useCallback((value: string) => {
    suppressNextSuggestionFetchRef.current = true;
    setGuess(value);
    setSuggestions([]);
  }, []);

  return {
    questions,
    currentQuestionIndex,
    question,
    lives,
    found,
    guess,
    message,
    correctAnswers,
    allAnswers,
    suggestions,
    error,
    loading,
    initialLoading,
    status,
    canGoPrevious: currentQuestionIndex > 0,
    canGoNext: currentQuestionIndex < questions.length - 1,
    setGuess,
    applySuggestion,
    submitGuess,
    reset,
    goToPreviousQuestion,
    goToNextQuestion,
  };
}
