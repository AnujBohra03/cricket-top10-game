import { getSessionId, updateSessionId } from "./session";
import type { Answer, GameState, GuessResponse, Question } from "../types/game";
import {
  parseAnswers,
  parseGameState,
  parseGuessResponse,
  parseQuestion,
  parseQuestions,
} from "../utils/apiGuards";

function normalizeApiBaseUrl(rawBaseUrl: string): string {
  const trimmed = rawBaseUrl.trim().replace(/\/+$/, "");
  return trimmed.replace(/\/api\/v1$/i, "");
}

const BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_URL || "http://localhost:5150"
);
const API_PREFIX = "/api/v1";

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "X-Session-Id": getSessionId(),
  };
  return headers;
}

function handleSessionResponse(res: Response): void {
  const sessionId = res.headers.get("X-Session-Id");
  if (sessionId) {
    updateSessionId(sessionId);
  }
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const requestUrl = `${BASE_URL}${API_PREFIX}${path}`;
  try {
    const res = await fetch(requestUrl, {
      ...init,
      headers: {
        ...getHeaders(),
        ...(init?.headers || {}),
      },
    });

    handleSessionResponse(res);
    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      let message = `Request failed: ${res.status}`;
      try {
        const parsed = JSON.parse(errorText) as { detail?: string; title?: string };
        if (parsed.detail) {
          message = parsed.detail;
        } else if (parsed.title) {
          message = parsed.title;
        } else if (errorText) {
          message = `${message} ${errorText}`;
        }
      } catch {
        message = `${message} ${errorText}`;
      }
      if (res.status === 404 && path === "/questions/current") {
        const errorTextLower = errorText.toLowerCase();
        if (errorTextLower.includes("no questions available")) {
          message =
            "No questions are configured in the production database yet. Add at least one question from the admin API.";
        } else if (!errorTextLower.includes("no questions") && !errorTextLower.includes("request failed")) {
          message =
            "Question endpoint returned 404. Check that VITE_API_URL is the API host only (for example https://cricket-top10-api.onrender.com) and does not include /api/v1.";
        }
      }
      throw new Error(message.trim());
    }
    return res.json() as Promise<unknown>;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error("Network error: Failed to connect to server");
  }
}

export async function getQuestion(questionId?: string): Promise<Question> {
  const suffix = questionId
    ? `/questions/current?questionId=${encodeURIComponent(questionId)}`
    : "/questions/current";
  const data = await request(suffix);
  return parseQuestion(data);
}

export async function getQuestions(): Promise<Question[]> {
  const data = await request("/questions");
  return parseQuestions(data);
}

export async function getState(): Promise<GameState> {
  const data = await request("/state");
  return parseGameState(data);
}

export async function getAnswers(questionId: string): Promise<Answer[]> {
  const data = await request(`/answers?questionId=${encodeURIComponent(questionId)}`);
  return parseAnswers(data);
}

export async function getPlayerSuggestions(query: string): Promise<string[]> {
  if (query.trim().length < 2) {
    return [];
  }
  const data = await request(`/players/suggest?q=${encodeURIComponent(query)}`);
  if (Array.isArray(data) && data.every((item) => typeof item === "string")) {
    return data;
  }
  throw new Error("Invalid API response: player suggestions format mismatch");
}

export async function makeGuess(questionId: string, guess: string): Promise<GuessResponse> {
  const data = await request("/guess", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      questionId,
      guess,
    }),
  });
  return parseGuessResponse(data);
}

export async function resetGame(): Promise<{ message: string }> {
  const data = await request("/reset", {
    method: "POST",
  });
  if (
    typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof (data as { message: unknown }).message === "string"
  ) {
    return { message: (data as { message: string }).message };
  }
  throw new Error("Invalid API response: reset format mismatch");
}
