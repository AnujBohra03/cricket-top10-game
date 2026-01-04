export interface Question {
  id: string;
  text: string;
}

export interface GuessResult {
  correct: boolean;
  player?: string;
  rank?: number;
  message: string;
}

export interface GameState {
  lives: number;
  found: number;
}

export interface Answer {
  player: string;
  rank: number;
}
