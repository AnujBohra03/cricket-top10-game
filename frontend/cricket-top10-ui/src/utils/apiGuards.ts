import type { Answer, GameState, GuessResponse, Question } from "../types/game";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAnswer(value: unknown): value is Answer {
  return (
    isObject(value) &&
    typeof value.player === "string" &&
    typeof value.rank === "number"
  );
}

export function parseQuestion(value: unknown): Question {
  if (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.text === "string"
  ) {
    return { id: value.id, text: value.text };
  }
  throw new Error("Invalid API response: question format mismatch");
}

export function parseQuestions(value: unknown): Question[] {
  if (Array.isArray(value)) {
    return value.map(parseQuestion);
  }
  throw new Error("Invalid API response: questions list format mismatch");
}

export function parseAnswers(value: unknown): Answer[] {
  if (Array.isArray(value) && value.every(isAnswer)) {
    return value;
  }
  throw new Error("Invalid API response: answers format mismatch");
}

export function parseGameState(value: unknown): GameState {
  if (
    isObject(value) &&
    typeof value.lives === "number" &&
    typeof value.found === "number" &&
    Array.isArray(value.correctGuesses) &&
    value.correctGuesses.every(isAnswer)
  ) {
    return {
      lives: value.lives,
      found: value.found,
      correctGuesses: value.correctGuesses,
    };
  }
  throw new Error("Invalid API response: game state format mismatch");
}

export function parseGuessResponse(value: unknown): GuessResponse {
  if (!isObject(value)) {
    throw new Error("Invalid API response: guess response format mismatch");
  }

  const status = value.gameStatus;
  const result = value.result;
  const state = value.state;

  const isValidStatus =
    status === "active" || status === "won" || status === "lost";

  if (
    isValidStatus &&
    isObject(result) &&
    typeof result.correct === "boolean" &&
    typeof result.message === "string"
  ) {
    return {
      result: {
        correct: result.correct,
        message: result.message,
        player: typeof result.player === "string" ? result.player : undefined,
        rank: typeof result.rank === "number" ? result.rank : undefined,
      },
      state: parseGameState(state),
      gameStatus: status,
    };
  }

  throw new Error("Invalid API response: guess response format mismatch");
}
