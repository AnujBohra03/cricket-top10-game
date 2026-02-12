const SESSION_STORAGE_KEY = "cricket_game_session";
const SESSION_VERSION = 1;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

interface StoredSession {
  id: string;
  createdAt: number;
  version: number;
}

function createStoredSession(): StoredSession {
  return {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    version: SESSION_VERSION,
  };
}

function readStoredSession(): StoredSession | null {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    if (
      typeof parsed.id !== "string" ||
      typeof parsed.createdAt !== "number" ||
      typeof parsed.version !== "number"
    ) {
      return null;
    }
    return parsed as StoredSession;
  } catch {
    return null;
  }
}

export function getSessionId(): string {
  let session = readStoredSession();
  const isExpired =
    !session || Date.now() - session.createdAt > SESSION_TTL_MS || session.version !== SESSION_VERSION;

  if (isExpired) {
    session = createStoredSession();
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }

  return (session ?? createStoredSession()).id;
}

export function updateSessionId(sessionId: string): void {
  const existing = readStoredSession();
  const nextSession: StoredSession = {
    id: sessionId,
    createdAt: existing?.createdAt ?? Date.now(),
    version: SESSION_VERSION,
  };
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
}

export function clearSessionId(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}
