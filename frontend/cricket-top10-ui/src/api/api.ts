const BASE_URL = "http://localhost:5150";

export async function getQuestion() {
  const res = await fetch(`${BASE_URL}/question`);
  if (!res.ok) throw new Error("Failed to fetch question");
  return res.json();
}

export async function getState() {
  const res = await fetch(`${BASE_URL}/state`);
  if (!res.ok) throw new Error("Failed to fetch state");
  return res.json();
}

export async function getAnswers() {
  const res = await fetch(`${BASE_URL}/answers`);
  if (!res.ok) throw new Error("Failed to fetch answers");
  return res.json();
}


export async function makeGuess(playerName: string) {
  const res = await fetch(
    `${BASE_URL}/guess?playerName=${encodeURIComponent(playerName)}`,
    {
      method: "POST",
    }
  );
  return res.json();
}

export async function resetGame() {
  const res = await fetch(`${BASE_URL}/reset`, {
    method: "POST",
  });
  return res.json();
}
