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
  correctGuesses?: Answer[];
}

export interface Answer {
  player: string;
  rank: number;
}
