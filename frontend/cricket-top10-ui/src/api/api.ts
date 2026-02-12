import { getSessionId, updateSessionId } from "./session";
import type { Answer, GameState, GuessResponse, Question } from "../types/game";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5150";
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${BASE_URL}${API_PREFIX}${path}`, {
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
      throw new Error(message.trim());
    }
    return res.json() as Promise<T>;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error("Network error: Failed to connect to server");
  }
}

export async function getQuestion(): Promise<Question> {
  return request<Question>("/questions/current");
}

export async function getState(): Promise<GameState> {
  return request<GameState>("/state");
}

export async function getAnswers(questionId: string): Promise<Answer[]> {
  return request<Answer[]>(`/answers?questionId=${encodeURIComponent(questionId)}`);
}

export async function makeGuess(questionId: string, guess: string): Promise<GuessResponse> {
  return request<GuessResponse>("/guess", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      questionId,
      guess,
    }),
  });
}

export async function resetGame(): Promise<{ message: string }> {
  return request<{ message: string }>("/reset", {
    method: "POST",
  });
}
