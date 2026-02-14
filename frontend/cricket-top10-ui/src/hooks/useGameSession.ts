import { useCallback, useEffect, useRef, useState } from "react";
import { getAnswers, getPlayerSuggestions, getQuestion, getQuestions, getState, makeGuess, resetGame } from "../api/api";
import type { Answer, Question } from "../types/game";

type SessionStatus = "active" | "won" | "lost";
type FeedbackTone = "success" | "error" | "warning" | "neutral";
type AttemptOutcome = "correct" | "incorrect" | "duplicate";
type GuessStatus = "correct";

interface FeedbackState {
  tone: FeedbackTone;
  text: string;
}

interface GuessAttempt {
  player: string;
  outcome: AttemptOutcome;
  rank?: number;
}

interface SuggestionOption {
  value: string;
  playerId: string;
  alreadySelected: boolean;
}

interface GuessedPlayer {
  playerId: string;
  player: string;
  rank?: number;
  status: GuessStatus;
}

interface UseGameSessionResult {
  questions: Question[];
  currentQuestionIndex: number;
  question: Question | null;
  lives: number;
  found: number;
  guess: string;
  feedback: FeedbackState;
  correctAnswers: Answer[];
  allAnswers: Answer[];
  attempts: GuessAttempt[];
  guessedPlayers: GuessedPlayer[];
  suggestions: SuggestionOption[];
  selectedSuggestionIndex: number;
  error: string;
  loading: boolean;
  initialLoading: boolean;
  status: SessionStatus;
  canGoPrevious: boolean;
  canGoNext: boolean;
  setGuess: (value: string) => void;
  applySuggestion: (value: string) => void;
  moveSuggestionSelection: (step: number) => void;
  submitSelectedSuggestion: () => void;
  dismissFeedback: () => void;
  submitGuess: () => Promise<void>;
  reset: () => Promise<void>;
  goToPreviousQuestion: () => Promise<void>;
  goToNextQuestion: () => Promise<void>;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function toPlayerId(name: string): string {
  return normalizeText(name);
}

function sortGuessedPlayers(rows: GuessedPlayer[]): GuessedPlayer[] {
  return [...rows].sort((a, b) => {
    if (typeof a.rank === "number" && typeof b.rank === "number") {
      return a.rank - b.rank;
    }
    if (typeof a.rank === "number") {
      return -1;
    }
    if (typeof b.rank === "number") {
      return 1;
    }
    return a.player.localeCompare(b.player);
  });
}

function toCorrectRows(correctGuesses: Answer[]): GuessedPlayer[] {
  const rows = correctGuesses.map((item) => ({
    playerId: toPlayerId(item.player),
    player: item.player,
    rank: item.rank,
    status: "correct" as const,
  }));
  return sortGuessedPlayers(rows);
}

export function useGameSession(): UseGameSessionResult {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  const [lives, setLives] = useState(3);
  const [found, setFound] = useState(0);
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>({ tone: "neutral", text: "" });
  const [correctAnswers, setCorrectAnswers] = useState<Answer[]>([]);
  const [allAnswers, setAllAnswers] = useState<Answer[]>([]);
  const [attempts, setAttempts] = useState<GuessAttempt[]>([]);
  const [guessedPlayers, setGuessedPlayers] = useState<GuessedPlayer[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionOption[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [status, setStatus] = useState<SessionStatus>("active");
  const isMountedRef = useRef(true);
  const suppressNextSuggestionFetchRef = useRef(false);
  const suggestionsCacheRef = useRef<Map<string, string[]>>(new Map());

  const pushAttempt = useCallback((attempt: GuessAttempt) => {
    setAttempts((previous) => [attempt, ...previous].slice(0, 12));
  }, []);

  const mergeCorrectRows = useCallback((nextCorrectGuesses: Answer[]) => {
    setGuessedPlayers((previous) => {
      const byId = new Map(previous.map((item) => [item.playerId, item]));

      nextCorrectGuesses.forEach((item) => {
        const playerId = toPlayerId(item.player);
        if (!playerId) {
          return;
        }
        byId.set(playerId, {
          playerId,
          player: item.player,
          rank: item.rank,
          status: "correct",
        });
      });

      return sortGuessedPlayers(Array.from(byId.values()));
    });
  }, []);

  const formatSuggestionList = useCallback((query: string, raw: string[]): string[] => {
    const normalizedQuery = normalizeText(query);
    const uniqueMap = new Map<string, string>();

    raw.forEach((item) => {
      const playerId = toPlayerId(item);
      if (!playerId || uniqueMap.has(playerId)) {
        return;
      }
      uniqueMap.set(playerId, item);
    });

    const unique = Array.from(uniqueMap.values());
    return unique.sort((a, b) => {
      const aLower = normalizeText(a);
      const bLower = normalizeText(b);
      const aStarts = aLower.startsWith(normalizedQuery) ? 0 : 1;
      const bStarts = bLower.startsWith(normalizedQuery) ? 0 : 1;
      if (aStarts !== bStarts) {
        return aStarts - bStarts;
      }
      const aIndex = aLower.indexOf(normalizedQuery);
      const bIndex = bLower.indexOf(normalizedQuery);
      if (aIndex !== bIndex) {
        return aIndex - bIndex;
      }
      return a.localeCompare(b);
    });
  }, []);

  const refreshAllAnswers = useCallback(async (questionId: string) => {
    const answers = await getAnswers(questionId);
    if (isMountedRef.current) {
      setAllAnswers(answers);
    }
  }, []);

  const decorateSuggestions = useCallback((values: string[]): SuggestionOption[] => {
    const guessedIds = new Set(guessedPlayers.map((item) => item.playerId));
    return values.map((value) => {
      const playerId = toPlayerId(value);
      return {
        value,
        playerId,
        alreadySelected: guessedIds.has(playerId),
      };
    });
  }, [guessedPlayers]);

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
        setGuessedPlayers(toCorrectRows(s.correctGuesses));

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

    void load();

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
      setSelectedSuggestionIndex(-1);
      return;
    }

    const normalizedQuery = normalizeText(guess);
    const cached = suggestionsCacheRef.current.get(normalizedQuery);
    if (cached) {
      const decorated = decorateSuggestions(cached);
      setSuggestions(decorated);
      setSelectedSuggestionIndex(decorated.length > 0 ? 0 : -1);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const result = await getPlayerSuggestions(guess.trim());
        const sorted = formatSuggestionList(guess, result);
        suggestionsCacheRef.current.set(normalizedQuery, sorted);
        if (isMountedRef.current) {
          const decorated = decorateSuggestions(sorted);
          setSuggestions(decorated);
          setSelectedSuggestionIndex(decorated.length > 0 ? 0 : -1);
        }
      } catch {
        if (isMountedRef.current) {
          setSuggestions([]);
          setSelectedSuggestionIndex(-1);
        }
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [decorateSuggestions, formatSuggestionList, guess]);

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
        setGuessedPlayers(toCorrectRows(s.correctGuesses));
        setGuess("");
        setFeedback({ tone: "neutral", text: "" });
        setAttempts([]);
        setSuggestions([]);
        setSelectedSuggestionIndex(-1);
        suggestionsCacheRef.current.clear();

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

  const setGuessValue = useCallback((value: string) => {
    setGuess(value);
    setFeedback({ tone: "neutral", text: "" });
  }, []);

  const submitGuess = useCallback(async () => {
    if (!guess || lives === 0 || !question || found === 10) {
      return;
    }

    const trimmedGuess = guess.trim();
    if (!trimmedGuess) {
      setFeedback({ tone: "warning", text: "Enter a player name to submit a guess." });
      return;
    }
    if (trimmedGuess.length > 50) {
      setFeedback({ tone: "warning", text: "Player name must be 50 characters or less." });
      return;
    }

    const normalizedGuessId = toPlayerId(trimmedGuess);
    const existingGuess = guessedPlayers.find((item) => item.playerId === normalizedGuessId);
    if (existingGuess) {
      const suffix = typeof existingGuess.rank === "number" ? ` (#${existingGuess.rank})` : "";
      setFeedback({ tone: "warning", text: `Already guessed: ${existingGuess.player}${suffix}` });
      pushAttempt({ player: trimmedGuess, outcome: "duplicate" });
      setGuess("");
      setSuggestions([]);
      setSelectedSuggestionIndex(-1);
      return;
    }

    try {
      setError("");
      setLoading(true);
      const response = await makeGuess(question.id, trimmedGuess);
      const result = response.result;

      if (result.correct) {
        const resolvedPlayer = result.player ?? trimmedGuess;
        const resolvedRank =
          result.rank ?? response.state.correctGuesses.find((item) => toPlayerId(item.player) === toPlayerId(resolvedPlayer))?.rank;

        setFeedback({
          tone: "success",
          text: resolvedRank
            ? `${resolvedPlayer} is correct at Rank #${resolvedRank}.`
            : `${resolvedPlayer} is a correct answer.`,
        });
        pushAttempt({ player: resolvedPlayer, outcome: "correct", rank: resolvedRank });
      } else if (result.message === "Already guessed") {
        const existing = guessedPlayers.find((item) => item.playerId === normalizedGuessId);
        const suffix = existing && typeof existing.rank === "number" ? ` (#${existing.rank})` : "";
        setFeedback({ tone: "warning", text: `Already guessed: ${existing?.player ?? trimmedGuess}${suffix}` });
        pushAttempt({ player: trimmedGuess, outcome: "duplicate" });
      } else {
        setFeedback({ tone: "error", text: `${trimmedGuess} is not in the Top 10 for this question.` });
        pushAttempt({ player: trimmedGuess, outcome: "incorrect" });
      }

      setLives(response.state.lives);
      setFound(response.state.found);
      setCorrectAnswers(response.state.correctGuesses);
      mergeCorrectRows(response.state.correctGuesses);
      setStatus(response.gameStatus);
      setGuess("");
      setSuggestions([]);
      setSelectedSuggestionIndex(-1);

      if (response.gameStatus === "active") {
        setAllAnswers([]);
      } else {
        await refreshAllAnswers(question.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit guess. Please try again.");
      setFeedback({ tone: "neutral", text: "" });
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [found, guess, guessedPlayers, lives, mergeCorrectRows, pushAttempt, question, refreshAllAnswers]);

  const reset = useCallback(async () => {
    try {
      setError("");
      setLoading(true);
      await resetGame();
      const s = await getState();

      setLives(s.lives);
      setFound(s.found);
      setGuess("");
      setFeedback({ tone: "neutral", text: "" });
      setCorrectAnswers(s.correctGuesses);
      setGuessedPlayers(toCorrectRows(s.correctGuesses));
      setAllAnswers([]);
      setAttempts([]);
      setStatus("active");
      setSuggestions([]);
      setSelectedSuggestionIndex(-1);
      suggestionsCacheRef.current.clear();
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
    setSelectedSuggestionIndex(-1);
  }, []);

  const moveSuggestionSelection = useCallback(
    (step: number) => {
      if (suggestions.length === 0) {
        setSelectedSuggestionIndex(-1);
        return;
      }
      setSelectedSuggestionIndex((previous) => {
        const base = previous < 0 ? (step > 0 ? 0 : suggestions.length - 1) : previous;
        return (base + step + suggestions.length) % suggestions.length;
      });
    },
    [suggestions.length]
  );

  const submitSelectedSuggestion = useCallback(() => {
    if (selectedSuggestionIndex < 0 || selectedSuggestionIndex >= suggestions.length) {
      return;
    }

    const selection = suggestions[selectedSuggestionIndex];
    if (selection.alreadySelected) {
      const existing = guessedPlayers.find((item) => item.playerId === selection.playerId);
      const suffix = existing && typeof existing.rank === "number" ? ` (#${existing.rank})` : "";
      setFeedback({ tone: "warning", text: `Already guessed: ${existing?.player ?? selection.value}${suffix}` });
      return;
    }

    applySuggestion(selection.value);
  }, [applySuggestion, guessedPlayers, selectedSuggestionIndex, suggestions]);

  const dismissFeedback = useCallback(() => {
    setFeedback({ tone: "neutral", text: "" });
  }, []);

  return {
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
    guessedPlayers,
    suggestions,
    selectedSuggestionIndex,
    error,
    loading,
    initialLoading,
    status,
    canGoPrevious: currentQuestionIndex > 0,
    canGoNext: currentQuestionIndex < questions.length - 1,
    setGuess: setGuessValue,
    applySuggestion,
    moveSuggestionSelection,
    submitSelectedSuggestion,
    dismissFeedback,
    submitGuess,
    reset,
    goToPreviousQuestion,
    goToNextQuestion,
  };
}
