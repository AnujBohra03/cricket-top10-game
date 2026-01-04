import { getSessionId, updateSessionId } from "./session";

const BASE_URL = import.meta.env.VITE_API_URL || "https://cricket-top10-api.onrender.com";
//const BASE_URL = "http://localhost:5150";

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

export async function getQuestion() {
  try {
    const res = await fetch(`${BASE_URL}/question`, {
      headers: getHeaders(),
    });
    handleSessionResponse(res);
    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      throw new Error(`Failed to fetch question: ${res.status} ${errorText}`);
    }
    return res.json();
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error("Network error: Failed to connect to server");
  }
}

export async function getState() {
  try {
    const res = await fetch(`${BASE_URL}/state`, {
      headers: getHeaders(),
    });
    handleSessionResponse(res);
    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      throw new Error(`Failed to fetch game state: ${res.status} ${errorText}`);
    }
    return res.json();
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error("Network error: Failed to connect to server");
  }
}

export async function getAnswers(questionId: string) {
  try {
    const res = await fetch(`${BASE_URL}/answers?questionId=${questionId}`, {
      headers: getHeaders(),
    });
    handleSessionResponse(res);
    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      throw new Error(`Failed to fetch answers: ${res.status} ${errorText}`);
    }
    return res.json();
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error("Network error: Failed to connect to server");
  }
}

export async function makeGuess(questionId: string, guess: string) {
  try {
    const res = await fetch(`${BASE_URL}/guess`, {
      method: "POST",
      headers: {
        ...getHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        questionId,
        guess,
      }),
    });
    handleSessionResponse(res);
    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      throw new Error(`Guess failed: ${res.status} ${errorText}`);
    }

    return res.json();
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error("Network error: Failed to connect to server");
  }
}

export async function resetGame() {
  try {
    const res = await fetch(`${BASE_URL}/reset`, {
      method: "POST",
      headers: getHeaders(),
    });
    handleSessionResponse(res);
    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      throw new Error(`Failed to reset game: ${res.status} ${errorText}`);
    }
    return res.json();
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error("Network error: Failed to connect to server");
  }
}
